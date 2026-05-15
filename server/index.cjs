require('dotenv').config()

const express = require('express')
const path = require('node:path')
const {
  bulkDeleteArtists,
  bulkUpdateArtists,
  createArtist,
  deleteArtist,
  getArtists,
  getBackupPayload,
  getStats,
  setupDatabase,
  updateArtist,
} = require('./db.cjs')

const app = express()
const port = Number(process.env.PORT ?? 3000)
const root = path.resolve(__dirname, '..')
const distPath = path.join(root, 'dist')

app.use(express.json({ limit: '1mb' }))

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
    res.json({ artists })
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
    const artist = await createArtist(req.body ?? {})
    res.status(201).json({ artist })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/artists/:id', async (req, res, next) => {
  try {
    const artist = await updateArtist(req.params.id, req.body ?? {})

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
    const artists = await bulkUpdateArtists(req.body ?? {})
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
