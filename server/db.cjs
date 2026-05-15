require('dotenv').config()

const { neon } = require('@neondatabase/serverless')

/** Handles .env lines or quoted values pasted into DATABASE_URL (e.g. on Render). */
const normalizeDatabaseUrl = (raw) => {
  if (raw == null || typeof raw !== 'string') {
    return raw
  }

  let s = raw.trim()
  s = s.replace(/^DATABASE_URL\s*=\s*/i, '').trim()

  while (
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith('"') && s.endsWith('"'))
  ) {
    s = s.slice(1, -1).trim()
  }

  return s
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing. Create a .env file based on .env.example.')
}

const sql = neon(databaseUrl)

const allowedStatuses = new Set(['signed', 'unsigned', 'stuck'])

const normalizeArtist = (artist) => ({
  id: artist.id,
  nameHe: artist.name_he,
  nameEn: artist.name_en ?? '',
  genres: artist.genres ?? [],
  tags: artist.tags ?? [],
  latestAlbum: artist.latest_album ?? '',
  status: artist.status,
  owner: artist.owner ?? 'לא שויך',
  source: artist.source ?? '',
  notes: artist.notes ?? '',
  priority: artist.priority ?? '',
  updatedAt: artist.updated_at,
})

const setupDatabase = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS artists (
      id TEXT PRIMARY KEY,
      name_he TEXT NOT NULL,
      name_en TEXT NOT NULL DEFAULT '',
      genres TEXT[] NOT NULL DEFAULT '{}',
      tags TEXT[] NOT NULL DEFAULT '{}',
      latest_album TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('signed', 'unsigned', 'stuck')),
      owner TEXT NOT NULL DEFAULT 'לא שויך',
      source TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS artists_status_idx ON artists (status)`
  await sql`CREATE INDEX IF NOT EXISTS artists_owner_idx ON artists (owner)`
  await sql`CREATE INDEX IF NOT EXISTS artists_updated_at_idx ON artists (updated_at DESC)`
}

const getArtists = async () => {
  const rows = await sql`
    SELECT *
    FROM artists
    ORDER BY name_he COLLATE "C"
  `

  return rows.map(normalizeArtist)
}

const getStats = async () => {
  const [stats] = await sql`
    SELECT
      COUNT(*)::INT AS total,
      COUNT(*) FILTER (WHERE status = 'signed')::INT AS signed,
      COUNT(*) FILTER (WHERE status = 'unsigned')::INT AS unsigned,
      COUNT(*) FILTER (WHERE status = 'stuck')::INT AS stuck,
      COUNT(*) FILTER (WHERE owner = 'לא שויך')::INT AS unassigned
    FROM artists
  `

  return stats
}

const parseTagList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value !== 'string') return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const updateArtist = async (id, patch) => {
  const currentRows = await sql`SELECT * FROM artists WHERE id = ${id} LIMIT 1`

  if (currentRows.length === 0) {
    return null
  }

  const current = currentRows[0]
  const nextStatus = patch.status ?? current.status

  if (!allowedStatuses.has(nextStatus)) {
    throw new Error('Invalid status')
  }

  const nameHe = patch.nameHe ?? current.name_he
  const nameEn = patch.nameEn ?? current.name_en
  const genres = patch.genres !== undefined ? parseTagList(patch.genres) : current.genres
  const tags = patch.tags !== undefined ? parseTagList(patch.tags) : current.tags

  const [updated] = await sql`
    UPDATE artists
    SET
      name_he = ${nameHe},
      name_en = ${nameEn},
      genres = ${genres},
      tags = ${tags},
      latest_album = ${patch.latestAlbum ?? current.latest_album},
      status = ${nextStatus},
      owner = ${patch.owner ?? current.owner},
      source = ${patch.source ?? current.source},
      notes = ${patch.notes ?? current.notes},
      priority = ${patch.priority ?? current.priority},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `

  return normalizeArtist(updated)
}

const createArtist = async (payload) => {
  const nameHe = String(payload.nameHe ?? '').trim()
  if (!nameHe) {
    throw new Error('Artist name is required')
  }

  const status = payload.status ?? 'unsigned'
  if (!allowedStatuses.has(status)) {
    throw new Error('Invalid status')
  }

  const id =
    String(payload.id ?? '').trim() ||
    `${nameHe
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)}-${Date.now()}`

  const genres = parseTagList(payload.genres)
  const tags = parseTagList(payload.tags)

  const [created] = await sql`
    INSERT INTO artists (
      id,
      name_he,
      name_en,
      genres,
      tags,
      latest_album,
      status,
      owner,
      source,
      notes,
      priority
    )
    VALUES (
      ${id},
      ${nameHe},
      ${String(payload.nameEn ?? '').trim()},
      ${genres},
      ${tags},
      ${String(payload.latestAlbum ?? '').trim()},
      ${status},
      ${payload.owner ?? 'לא שויך'},
      ${String(payload.source ?? '').trim()},
      ${String(payload.notes ?? '').trim()},
      ${payload.priority ?? (status === 'signed' ? 'שימור קשר' : status === 'stuck' ? 'פתיחת חסם' : 'ליצירת קשר')}
    )
    RETURNING *
  `

  return normalizeArtist(created)
}

const deleteArtist = async (id) => {
  const rows = await sql`DELETE FROM artists WHERE id = ${id} RETURNING id`
  return rows.length > 0
}

const bulkDeleteArtists = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return []
  }

  const rows = await sql`DELETE FROM artists WHERE id = ANY(${ids}) RETURNING id`
  return rows.map((row) => row.id)
}

const bulkUpdateArtists = async ({ ids, status, owner, priority }) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return []
  }

  if (!allowedStatuses.has(status)) {
    throw new Error('Invalid status')
  }

  const rows = await sql`
    UPDATE artists
    SET
      status = ${status},
      owner = ${owner},
      priority = ${priority},
      updated_at = NOW()
    WHERE id = ANY(${ids})
    RETURNING *
  `

  return rows.map(normalizeArtist)
}

const upsertArtists = async (artists) => {
  await setupDatabase()

  const payload = JSON.stringify(artists)

  await sql`
    WITH incoming AS (
      SELECT *
      FROM jsonb_to_recordset(${payload}::jsonb) AS artist (
        id TEXT,
        "nameHe" TEXT,
        "nameEn" TEXT,
        genres JSONB,
        tags JSONB,
        "latestAlbum" TEXT,
        status TEXT,
        owner TEXT,
        source TEXT,
        notes TEXT,
        priority TEXT
      )
    )
    INSERT INTO artists (
      id,
      name_he,
      name_en,
      genres,
      tags,
      latest_album,
      status,
      owner,
      source,
      notes,
      priority
    )
    SELECT
      id,
      "nameHe",
      COALESCE("nameEn", ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(genres)), '{}'),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(tags)), '{}'),
      COALESCE("latestAlbum", ''),
      status,
      COALESCE(owner, 'לא שויך'),
      COALESCE(source, ''),
      COALESCE(notes, ''),
      COALESCE(priority, '')
    FROM incoming
    ON CONFLICT (id) DO UPDATE SET
      name_he = EXCLUDED.name_he,
      name_en = EXCLUDED.name_en,
      genres = EXCLUDED.genres,
      tags = EXCLUDED.tags,
      latest_album = EXCLUDED.latest_album,
      source = EXCLUDED.source
  `
}

const getBackupPayload = async () => {
  const artists = await getArtists()
  const stats = await getStats()

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    service: 'ARTIST CRM',
    stats,
    count: artists.length,
    artists,
  }
}

module.exports = {
  bulkDeleteArtists,
  bulkUpdateArtists,
  createArtist,
  deleteArtist,
  getArtists,
  getBackupPayload,
  getStats,
  setupDatabase,
  updateArtist,
  upsertArtists,
}
