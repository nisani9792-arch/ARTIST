require('dotenv').config()

const express = require('express')
const path = require('node:path')
const zlib = require('node:zlib')
const {
  bulkDeleteArtists,
  bulkUpdateArtists,
  createArtist,
  deleteArtist,
  getAccessByIp,
  getArtists,
  getBackupPayload,
  getOperatorNameByIp,
  getStats,
  registerOperatorForIp,
  setupDatabase,
  unlockGateForIp,
  updateArtist,
} = require('./db.cjs')

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

const resolveOperator = (req) => getOperatorNameByIp(getClientIp(req))

app.get('/api/access/me', async (req, res, next) => {
  try {
    const access = await getAccessByIp(getClientIp(req))
    res.json({ access })
  } catch (error) {
    next(error)
  }
})

app.post('/api/access/unlock', async (req, res, next) => {
  try {
    const access = await unlockGateForIp(getClientIp(req))
    res.json({ access })
  } catch (error) {
    next(error)
  }
})

app.post('/api/access/register', async (req, res, next) => {
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
    res.json({ ok: true, service: 'ARTIST CRM', database: 'neon' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/artists', async (_req, res, next) => {
  try {
    const artists = await getArtists()
    res.setHeader('Cache-Control', 'private, no-cache')
    res.json({ artists })
  } catch (error) {
    next(error)
  }
})

app.get('/api/bootstrap', async (req, res, next) => {
  try {
    const ip = getClientIp(req)
    const access = await getAccessByIp(ip)

    if (!access.gateUnlocked) {
      res.status(403).json({ error: 'Gate is locked' })
      return
    }

    if (!access.displayName) {
      res.status(403).json({ error: 'Operator registration required' })
      return
    }

    const [artists, stats] = await Promise.all([getArtists(), getStats()])
    res.setHeader('Cache-Control', 'private, no-cache')
    res.json({ access, artists, stats })
  } catch (error) {
    next(error)
  }
})

app.get('/api/backup', async (_req, res, next) => {
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

app.get('/api/stats', async (_req, res, next) => {
  try {
    const stats = await getStats()
    res.json({ stats })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists', async (req, res, next) => {
  try {
    const operator = await resolveOperator(req)
    const artist = await createArtist(req.body ?? {}, operator)
    res.status(201).json({ artist })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/artists/:id', async (req, res, next) => {
  try {
    const operator = await resolveOperator(req)
    const artist = await updateArtist(req.params.id, req.body ?? {}, operator)

    if (!artist) {
      res.status(404).json({ error: 'Artist not found' })
      return
    }

    res.json({ artist })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists/bulk', async (req, res, next) => {
  try {
    const operator = await resolveOperator(req)
    const artists = await bulkUpdateArtists(req.body ?? {}, operator)
    res.json({ artists })
  } catch (error) {
    next(error)
  }
})

app.post('/api/artists/bulk-delete', async (req, res, next) => {
  try {
    const ids = await bulkDeleteArtists(req.body?.ids ?? [])
    res.json({ ids })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/artists/:id', async (req, res, next) => {
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
  res.status(500).json({ error: error.message || 'Server error' })
})

setupDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`ARTIST CRM server running at http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start ARTIST CRM server', error)
    process.exit(1)
  })
