require('dotenv').config()

const express = require('express')
const path = require('node:path')
const zlib = require('node:zlib')
const rateLimit = require('express-rate-limit')
const {
  bulkDeleteArtists,
  bulkUpdateArtists,
  classifyArtistBucketsInDb,
  createArtist,
  deleteArtist,
  ensureBucketsClassified,
  findDuplicateGroups,
  getAccessByIp,
  getArtistById,
  getArtistVersions,
  getArtists,
  getBackupPayload,
  getFilterOptions,
  getStats,
  mergeArtists,
  registerOperatorForIp,
  revertArtistToVersion,
  searchArtists,
  setupDatabase,
  undoLastArtistChange,
  unlockGateForIp,
  updateArtist,
  verifyGateUnlock,
} = require('./db.cjs')
const { createRequireAccess } = require('./middleware/requireAccess.cjs')

const app = express()
app.set('trust proxy', true)
const port = Number(process.env.PORT ?? 3000)
const root = path.resolve(__dirname, '..')
const distPath = path.join(root, 'dist')

app.use(express.json({ limit: '1mb' }))

const gzipJson = (req, res, next) => {
  const sendJson = res.json.bind(res)
  res.json = (payload) => {
    const body = JSON.stringify(payload)
    const accept = String(req.headers['accept-encoding'] ?? '')

    if (body.length < 1400 || !accept.includes('gzip')) {
      return sendJson(payload)
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Vary', 'Accept-Encoding')

    return zlib.gzip(body, (error, compressed) => {
      if (error) {
        res.removeHeader('Content-Encoding')
        return sendJson(payload)
      }
      res.send(compressed)
    })
  }
  next()
}

app.use('/api', gzipJson)

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim()
    if (first) return first
  }

  return req.socket?.remoteAddress || req.ip || 'unknown'
}

const { requireAccess, requireGateUnlocked } = createRequireAccess(getClientIp)

const unlockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many unlock attempts' },
})

const parseSearchQuery = (req) => ({
  q: req.query.q ?? '',
  status: req.query.status ?? 'all',
  owner: req.query.owner ?? 'all',
  tag: req.query.tag ?? 'all',
  genre: req.query.genre ?? 'all',
  bucket: req.query.bucket ?? 'all',
  needsAction: req.query.needsAction === 'true' || req.query.needsAction === '1',
  myQueue: req.query.myQueue === 'true' || req.query.myQueue === '1',
  sort: req.query.sort ?? 'smart',
  page: req.query.page ?? 1,
  limit: req.query.limit ?? 48,
})

app.get('/api/access/me', async (req, res, next) => {
  try {
    const access = await getAccessByIp(getClientIp(req))
    res.json({ access })
  } catch (error) {
    next(error)
  }
})

app.post('/api/access/unlock', unlockLimiter, async (req, res, next) => {
  try {
    verifyGateUnlock(req.body ?? {})
    const access = await unlockGateForIp(getClientIp(req))
    res.json({ access })
  } catch (error) {
    if (error.message === 'Invalid gate secret') {
      res.status(401).json({ error: 'Invalid gate secret' })
      return
    }
    next(error)
  }
})

app.post('/api/access/register', requireGateUnlocked, async (req, res, next) => {
  try {
    const access = await registerOperatorForIp(getClientIp(req), req.body?.displayName)
    res.json({ access })
  } catch (error) {
    next(error)
  }
})

app.get('/api/health', async (_req, res, next) => {
  try {
    await setupDatabase()
    res.json({ ok: true, service: 'JUSIC ARTIST CRM', database: 'neon' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/artists', requireAccess, async (req, res, next) => {
  try {
    const params = parseSearchQuery(req)
    if (params.myQueue) {
      params.operatorName = req.operatorName
    }

    const [result, stats, filters] = await Promise.all([
      searchArtists(params),
      getStats(),
      getFilterOptions(),
    ])
    res.setHeader('Cache-Control', 'private, no-cache')
    res.json({ ...result, stats, filters })
  } catch (error) {
    next(error)
  }
})

app.get('/api/artists/filters', requireAccess, async (_req, res, next) => {
  try {
    const filters = await getFilterOptions()
    res.setHeader('Cache-Control', 'private, no-cache')
    res.json(filters)
  } catch (error) {
    next(error)
  }
})

app.get('/api/artists/duplicates', requireAccess, async (_req, res, next) => {
  try {
    const groups = await findDuplicateGroups()
    res.setHeader('Cache-Control', 'private, no-cache')
    res.json({ groups, count: groups.length })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists/merge', requireAccess, async (req, res, next) => {
  try {
    const keepId = String(req.body?.keepId ?? '').trim()
    const removeIds = Array.isArray(req.body?.removeIds) ? req.body.removeIds : []

    if (!keepId || removeIds.length === 0) {
      res.status(400).json({ error: 'keepId and removeIds are required' })
      return
    }

    const artist = await mergeArtists(keepId, removeIds, req.operatorName)
    res.json({ artist })
  } catch (error) {
    if (error.message === 'Keep artist not found' || error.message === 'No duplicate artists found') {
      res.status(404).json({ error: error.message })
      return
    }
    next(error)
  }
})

app.post('/api/artists/classify-buckets', requireAccess, async (req, res, next) => {
  try {
    const popularLimit = Number(req.body?.popularLimit ?? req.query?.popularLimit ?? 20)
    const result = await classifyArtistBucketsInDb(popularLimit)
    const stats = await getStats()
    res.json({ ...result, stats })
  } catch (error) {
    next(error)
  }
})

app.get('/api/artists/:id/versions', requireAccess, async (req, res, next) => {
  try {
    const artist = await getArtistById(req.params.id)
    if (!artist) {
      res.status(404).json({ error: 'Artist not found' })
      return
    }

    const versions = await getArtistVersions(req.params.id)
    res.json({ versions })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists/:id/undo', requireAccess, async (req, res, next) => {
  try {
    const artist = await undoLastArtistChange(req.params.id, req.operatorName)
    if (!artist) {
      res.status(404).json({ error: 'No previous version to restore' })
      return
    }
    res.json({ artist })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists/:id/revert/:versionId', requireAccess, async (req, res, next) => {
  try {
    const versionId = Number(req.params.versionId)
    const artist = await revertArtistToVersion(req.params.id, versionId, req.operatorName)
    if (!artist) {
      res.status(404).json({ error: 'Version not found' })
      return
    }
    res.json({ artist })
  } catch (error) {
    next(error)
  }
})

app.get('/api/artists/:id', requireAccess, async (req, res, next) => {
  try {
    const artist = await getArtistById(req.params.id)

    if (!artist) {
      res.status(404).json({ error: 'Artist not found' })
      return
    }

    res.json({ artist })
  } catch (error) {
    next(error)
  }
})

app.get('/api/bootstrap', requireAccess, async (req, res, next) => {
  try {
    const params = parseSearchQuery(req)
    params.operatorName = req.operatorName
    params.page = req.query.page ?? 1
    params.limit = req.query.limit ?? 48

    const [result, stats, filters] = await Promise.all([
      searchArtists(params),
      getStats(),
      getFilterOptions(),
    ])

    res.setHeader('Cache-Control', 'private, no-cache')
    res.json({
      access: req.access,
      artists: result.artists,
      total: result.total,
      page: result.page,
      limit: result.limit,
      stats,
      filters,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/backup', requireAccess, async (_req, res, next) => {
  try {
    const backup = await getBackupPayload()
    const stamp = backup.exportedAt.slice(0, 19).replace(/[:T]/g, '-')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="artist-backup-${stamp}.json"`)
    res.json(backup)
  } catch (error) {
    next(error)
  }
})

app.get('/api/stats', requireAccess, async (_req, res, next) => {
  try {
    const stats = await getStats()
    res.json({ stats })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists', requireAccess, async (req, res, next) => {
  try {
    const artist = await createArtist(req.body ?? {}, req.operatorName)
    res.status(201).json({ artist })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/artists/:id', requireAccess, async (req, res, next) => {
  try {
    const artist = await updateArtist(req.params.id, req.body ?? {}, req.operatorName)

    if (!artist) {
      res.status(404).json({ error: 'Artist not found' })
      return
    }

    res.json({ artist })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists/bulk', requireAccess, async (req, res, next) => {
  try {
    const artists = await bulkUpdateArtists(req.body ?? {}, req.operatorName)
    res.json({ artists })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists/bulk-delete', requireAccess, async (req, res, next) => {
  try {
    const ids = await bulkDeleteArtists(req.body?.ids ?? [])
    res.json({ ids })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/artists/:id', requireAccess, async (req, res, next) => {
  try {
    const deleted = await deleteArtist(req.params.id)

    if (!deleted) {
      res.status(404).json({ error: 'Artist not found' })
      return
    }

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.use(express.static(distPath))

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((error, _req, res, _next) => {
  console.error(error)
  const message =
    process.env.NODE_ENV === 'production' ? 'Server error' : error.message || 'Server error'
  res.status(500).json({ error: message })
})

setupDatabase()
  .then(() => ensureBucketsClassified())
  .then(() => {
    app.listen(port, () => {
      console.log(`JUSIC ARTIST CRM server running at http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start JUSIC ARTIST CRM server', error)
    process.exit(1)
  })
