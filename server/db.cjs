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

  await sql`
    CREATE TABLE IF NOT EXISTS ip_access (
      ip TEXT PRIMARY KEY,
      display_name TEXT,
      gate_unlocked_at TIMESTAMPTZ,
      registered_at TIMESTAMPTZ,
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

const normalizeAccess = (row) => ({
  gateUnlocked: Boolean(row?.gate_unlocked_at),
  displayName: row?.display_name ?? null,
})

const getAccessByIp = async (ip) => {
  const [touched] = await sql`
    UPDATE ip_access
    SET last_seen_at = NOW()
    WHERE ip = ${ip}
    RETURNING ip, display_name, gate_unlocked_at
  `

  if (touched) {
    return normalizeAccess(touched)
  }

  return { gateUnlocked: false, displayName: null }
}

const getOperatorNameByIp = async (ip) => {
  const rows = await sql`
    SELECT display_name
    FROM ip_access
    WHERE ip = ${ip} AND gate_unlocked_at IS NOT NULL
    LIMIT 1
  `

  return rows[0]?.display_name ?? null
}

const unlockGateForIp = async (ip) => {
  const [row] = await sql`
    INSERT INTO ip_access (ip, gate_unlocked_at, last_seen_at)
    VALUES (${ip}, NOW(), NOW())
    ON CONFLICT (ip) DO UPDATE SET
      gate_unlocked_at = COALESCE(ip_access.gate_unlocked_at, EXCLUDED.gate_unlocked_at),
      last_seen_at = NOW()
    RETURNING ip, display_name, gate_unlocked_at, registered_at, last_seen_at
  `

  return normalizeAccess(row)
}

const registerOperatorForIp = async (ip, displayName) => {
  const name = String(displayName ?? '').trim()
  if (name.length < 2 || name.length > 40) {
    throw new Error('Invalid display name')
  }

  const [row] = await sql`
    UPDATE ip_access
    SET
      display_name = ${name},
      registered_at = COALESCE(registered_at, NOW()),
      last_seen_at = NOW()
    WHERE ip = ${ip} AND gate_unlocked_at IS NOT NULL
    RETURNING ip, display_name, gate_unlocked_at, registered_at, last_seen_at
  `

  if (!row) {
    throw new Error('Gate is locked')
  }

  return normalizeAccess(row)
}

const withOperatorOwner = (patch, operator) => {
  if (!operator || patch.owner !== undefined) {
    return patch
  }

  return { ...patch, owner: operator }
}

const getArtists = async () => {
  const rows = await sql`
    SELECT
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
      priority,
      updated_at
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

const updateArtist = async (id, patch, operator) => {
  const effectivePatch = withOperatorOwner(patch, operator)
  const currentRows = await sql`
    SELECT
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
      priority,
      updated_at
    FROM artists
    WHERE id = ${id}
    LIMIT 1
  `

  if (currentRows.length === 0) {
    return null
  }

  const current = currentRows[0]
  const nextStatus = effectivePatch.status ?? current.status

  if (!allowedStatuses.has(nextStatus)) {
    throw new Error('Invalid status')
  }

  const nameHe = effectivePatch.nameHe ?? current.name_he
  const nameEn = effectivePatch.nameEn ?? current.name_en
  const genres =
    effectivePatch.genres !== undefined ? parseTagList(effectivePatch.genres) : current.genres
  const tags = effectivePatch.tags !== undefined ? parseTagList(effectivePatch.tags) : current.tags

  const [updated] = await sql`
    UPDATE artists
    SET
      name_he = ${nameHe},
      name_en = ${nameEn},
      genres = ${genres},
      tags = ${tags},
      latest_album = ${effectivePatch.latestAlbum ?? current.latest_album},
      status = ${nextStatus},
      owner = ${effectivePatch.owner ?? current.owner},
      source = ${effectivePatch.source ?? current.source},
      notes = ${effectivePatch.notes ?? current.notes},
      priority = ${effectivePatch.priority ?? current.priority},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `

  return normalizeArtist(updated)
}

const createArtist = async (payload, operator) => {
  const effectivePayload = withOperatorOwner(payload, operator)
  const nameHe = String(effectivePayload.nameHe ?? '').trim()
  if (!nameHe) {
    throw new Error('Artist name is required')
  }

  const status = effectivePayload.status ?? 'unsigned'
  if (!allowedStatuses.has(status)) {
    throw new Error('Invalid status')
  }

  const id =
    String(effectivePayload.id ?? '').trim() ||
    `${nameHe
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)}-${Date.now()}`

  const genres = parseTagList(effectivePayload.genres)
  const tags = parseTagList(effectivePayload.tags)

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
      ${String(effectivePayload.nameEn ?? '').trim()},
      ${genres},
      ${tags},
      ${String(effectivePayload.latestAlbum ?? '').trim()},
      ${status},
      ${effectivePayload.owner ?? 'לא שויך'},
      ${String(effectivePayload.source ?? '').trim()},
      ${String(effectivePayload.notes ?? '').trim()},
      ${effectivePayload.priority ?? (status === 'signed' ? 'שימור קשר' : status === 'stuck' ? 'פתיחת חסם' : 'ליצירת קשר')}
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

const bulkUpdateArtists = async ({ ids, status, owner, priority }, operator) => {
  const effectiveOwner = owner ?? operator
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
      owner = ${effectiveOwner},
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
  getAccessByIp,
  getOperatorNameByIp,
  getArtists,
  getBackupPayload,
  getStats,
  registerOperatorForIp,
  setupDatabase,
  unlockGateForIp,
  updateArtist,
  upsertArtists,
}
