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
const UNASSIGNED_OWNER = 'לא שויך'

const normalizeArtist = (artist) => ({
  id: artist.id,
  nameHe: artist.name_he,
  nameEn: artist.name_en ?? '',
  genres: artist.genres ?? [],
  tags: artist.tags ?? [],
  latestAlbum: artist.latest_album ?? '',
  status: artist.status,
  owner: artist.owner ?? UNASSIGNED_OWNER,
  source: artist.source ?? '',
  notes: artist.notes ?? '',
  priority: artist.priority ?? '',
  updatedAt: artist.updated_at,
  updatedBy: artist.updated_by ?? '',
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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by TEXT NOT NULL DEFAULT ''
    )
  `

  await sql`ALTER TABLE artists ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT ''`

  await sql`CREATE INDEX IF NOT EXISTS artists_status_idx ON artists (status)`
  await sql`CREATE INDEX IF NOT EXISTS artists_owner_idx ON artists (owner)`
  await sql`CREATE INDEX IF NOT EXISTS artists_updated_at_idx ON artists (updated_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS artists_tags_gin_idx ON artists USING GIN (tags)`
  await sql`CREATE INDEX IF NOT EXISTS artists_genres_gin_idx ON artists USING GIN (genres)`

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

const artistSelectFields = sql`
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
  updated_at,
  updated_by
`

const getArtistById = async (id) => {
  const rows = await sql`
    SELECT ${artistSelectFields}
    FROM artists
    WHERE id = ${id}
    LIMIT 1
  `

  return rows[0] ? normalizeArtist(rows[0]) : null
}

const getArtists = async () => {
  const rows = await sql`
    SELECT ${artistSelectFields}
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
      COUNT(*) FILTER (WHERE owner = ${UNASSIGNED_OWNER})::INT AS unassigned
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

const clampLimit = (limit) => Math.min(Math.max(1, Number(limit) || 48), 200)

const buildSearchFilters = ({
  q,
  status,
  owner,
  tag,
  genre,
  needsAction,
  myQueue,
  operatorName,
}) => {
  const query = String(q ?? '').trim()
  const likeQuery = query ? `%${query}%` : null
  const statusValue = status === 'all' ? null : status
  const ownerValue = owner === 'all' ? null : owner
  const tagValue = tag === 'all' ? null : tag
  const genreValue = genre === 'all' ? null : genre
  const needsActionFlag = Boolean(needsAction)
  const myQueueFlag = Boolean(myQueue)
  const queueOwner = operatorName ?? ''

  return {
    likeQuery,
    statusValue,
    ownerValue,
    tagValue,
    genreValue,
    needsActionFlag,
    myQueueFlag,
    queueOwner,
  }
}

const searchArtists = async (params = {}) => {
  const sort = params.sort ?? 'smart'
  const page = Math.max(1, Number(params.page) || 1)
  const limit = clampLimit(params.limit)
  const offset = (page - 1) * limit
  const filters = buildSearchFilters(params)

  const [countRow] = await sql`
    SELECT COUNT(*)::INT AS total
    FROM artists
    WHERE
      (${filters.statusValue}::text IS NULL OR status = ${filters.statusValue})
      AND (${filters.ownerValue}::text IS NULL OR owner = ${filters.ownerValue})
      AND (${filters.tagValue}::text IS NULL OR ${filters.tagValue} = ANY(tags))
      AND (${filters.genreValue}::text IS NULL OR ${filters.genreValue} = ANY(genres))
      AND (
        ${!filters.needsActionFlag}::boolean
        OR status <> 'signed'
        OR owner = ${UNASSIGNED_OWNER}
      )
      AND (
        ${!filters.myQueueFlag}::boolean
        OR (
          owner = ${filters.queueOwner}
          AND status <> 'signed'
        )
      )
      AND (
        ${filters.likeQuery}::text IS NULL
        OR name_he ILIKE ${filters.likeQuery}
        OR name_en ILIKE ${filters.likeQuery}
        OR latest_album ILIKE ${filters.likeQuery}
        OR owner ILIKE ${filters.likeQuery}
        OR source ILIKE ${filters.likeQuery}
        OR notes ILIKE ${filters.likeQuery}
        OR priority ILIKE ${filters.likeQuery}
        OR EXISTS (SELECT 1 FROM unnest(tags) AS tag_item WHERE tag_item ILIKE ${filters.likeQuery})
        OR EXISTS (SELECT 1 FROM unnest(genres) AS genre_item WHERE genre_item ILIKE ${filters.likeQuery})
      )
  `

  const total = countRow?.total ?? 0

  let rows
  if (sort === 'name') {
    rows = await sql`
      SELECT ${artistSelectFields}
      FROM artists
      WHERE
        (${filters.statusValue}::text IS NULL OR status = ${filters.statusValue})
        AND (${filters.ownerValue}::text IS NULL OR owner = ${filters.ownerValue})
        AND (${filters.tagValue}::text IS NULL OR ${filters.tagValue} = ANY(tags))
        AND (${filters.genreValue}::text IS NULL OR ${filters.genreValue} = ANY(genres))
        AND (
          ${!filters.needsActionFlag}::boolean
          OR status <> 'signed'
          OR owner = ${UNASSIGNED_OWNER}
        )
        AND (
          ${!filters.myQueueFlag}::boolean
          OR (
            owner = ${filters.queueOwner}
            AND status <> 'signed'
          )
        )
        AND (
          ${filters.likeQuery}::text IS NULL
          OR name_he ILIKE ${filters.likeQuery}
          OR name_en ILIKE ${filters.likeQuery}
          OR latest_album ILIKE ${filters.likeQuery}
          OR owner ILIKE ${filters.likeQuery}
          OR source ILIKE ${filters.likeQuery}
          OR notes ILIKE ${filters.likeQuery}
          OR priority ILIKE ${filters.likeQuery}
          OR EXISTS (SELECT 1 FROM unnest(tags) AS tag_item WHERE tag_item ILIKE ${filters.likeQuery})
          OR EXISTS (SELECT 1 FROM unnest(genres) AS genre_item WHERE genre_item ILIKE ${filters.likeQuery})
        )
      ORDER BY name_he COLLATE "C"
      LIMIT ${limit}
      OFFSET ${offset}
    `
  } else if (sort === 'status') {
    rows = await sql`
      SELECT ${artistSelectFields}
      FROM artists
      WHERE
        (${filters.statusValue}::text IS NULL OR status = ${filters.statusValue})
        AND (${filters.ownerValue}::text IS NULL OR owner = ${filters.ownerValue})
        AND (${filters.tagValue}::text IS NULL OR ${filters.tagValue} = ANY(tags))
        AND (${filters.genreValue}::text IS NULL OR ${filters.genreValue} = ANY(genres))
        AND (
          ${!filters.needsActionFlag}::boolean
          OR status <> 'signed'
          OR owner = ${UNASSIGNED_OWNER}
        )
        AND (
          ${!filters.myQueueFlag}::boolean
          OR (
            owner = ${filters.queueOwner}
            AND status <> 'signed'
          )
        )
        AND (
          ${filters.likeQuery}::text IS NULL
          OR name_he ILIKE ${filters.likeQuery}
          OR name_en ILIKE ${filters.likeQuery}
          OR latest_album ILIKE ${filters.likeQuery}
          OR owner ILIKE ${filters.likeQuery}
          OR source ILIKE ${filters.likeQuery}
          OR notes ILIKE ${filters.likeQuery}
          OR priority ILIKE ${filters.likeQuery}
          OR EXISTS (SELECT 1 FROM unnest(tags) AS tag_item WHERE tag_item ILIKE ${filters.likeQuery})
          OR EXISTS (SELECT 1 FROM unnest(genres) AS genre_item WHERE genre_item ILIKE ${filters.likeQuery})
        )
      ORDER BY status, name_he COLLATE "C"
      LIMIT ${limit}
      OFFSET ${offset}
    `
  } else if (sort === 'tags') {
    rows = await sql`
      SELECT ${artistSelectFields}
      FROM artists
      WHERE
        (${filters.statusValue}::text IS NULL OR status = ${filters.statusValue})
        AND (${filters.ownerValue}::text IS NULL OR owner = ${filters.ownerValue})
        AND (${filters.tagValue}::text IS NULL OR ${filters.tagValue} = ANY(tags))
        AND (${filters.genreValue}::text IS NULL OR ${filters.genreValue} = ANY(genres))
        AND (
          ${!filters.needsActionFlag}::boolean
          OR status <> 'signed'
          OR owner = ${UNASSIGNED_OWNER}
        )
        AND (
          ${!filters.myQueueFlag}::boolean
          OR (
            owner = ${filters.queueOwner}
            AND status <> 'signed'
          )
        )
        AND (
          ${filters.likeQuery}::text IS NULL
          OR name_he ILIKE ${filters.likeQuery}
          OR name_en ILIKE ${filters.likeQuery}
          OR latest_album ILIKE ${filters.likeQuery}
          OR owner ILIKE ${filters.likeQuery}
          OR source ILIKE ${filters.likeQuery}
          OR notes ILIKE ${filters.likeQuery}
          OR priority ILIKE ${filters.likeQuery}
          OR EXISTS (SELECT 1 FROM unnest(tags) AS tag_item WHERE tag_item ILIKE ${filters.likeQuery})
          OR EXISTS (SELECT 1 FROM unnest(genres) AS genre_item WHERE genre_item ILIKE ${filters.likeQuery})
        )
      ORDER BY COALESCE(array_length(tags, 1), 0) DESC, name_he COLLATE "C"
      LIMIT ${limit}
      OFFSET ${offset}
    `
  } else {
    rows = await sql`
      SELECT ${artistSelectFields}
      FROM artists
      WHERE
        (${filters.statusValue}::text IS NULL OR status = ${filters.statusValue})
        AND (${filters.ownerValue}::text IS NULL OR owner = ${filters.ownerValue})
        AND (${filters.tagValue}::text IS NULL OR ${filters.tagValue} = ANY(tags))
        AND (${filters.genreValue}::text IS NULL OR ${filters.genreValue} = ANY(genres))
        AND (
          ${!filters.needsActionFlag}::boolean
          OR status <> 'signed'
          OR owner = ${UNASSIGNED_OWNER}
        )
        AND (
          ${!filters.myQueueFlag}::boolean
          OR (
            owner = ${filters.queueOwner}
            AND status <> 'signed'
          )
        )
        AND (
          ${filters.likeQuery}::text IS NULL
          OR name_he ILIKE ${filters.likeQuery}
          OR name_en ILIKE ${filters.likeQuery}
          OR latest_album ILIKE ${filters.likeQuery}
          OR owner ILIKE ${filters.likeQuery}
          OR source ILIKE ${filters.likeQuery}
          OR notes ILIKE ${filters.likeQuery}
          OR priority ILIKE ${filters.likeQuery}
          OR EXISTS (SELECT 1 FROM unnest(tags) AS tag_item WHERE tag_item ILIKE ${filters.likeQuery})
          OR EXISTS (SELECT 1 FROM unnest(genres) AS genre_item WHERE genre_item ILIKE ${filters.likeQuery})
        )
      ORDER BY
        (CASE WHEN status = 'stuck' THEN 70 WHEN status = 'unsigned' THEN 45 ELSE 0 END)
        + (CASE WHEN owner = ${UNASSIGNED_OWNER} THEN 25 ELSE 0 END)
        + LEAST(COALESCE(array_length(tags, 1), 0), 10) * 2 DESC,
        name_he COLLATE "C"
      LIMIT ${limit}
      OFFSET ${offset}
    `
  }

  return {
    artists: rows.map(normalizeArtist),
    total,
    page,
    limit,
  }
}

const getFilterOptions = async () => {
  const [ownersRows, tagsRows, genresRows] = await Promise.all([
    sql`SELECT DISTINCT owner FROM artists ORDER BY owner`,
    sql`
      SELECT tag, COUNT(*)::INT AS count
      FROM artists, unnest(tags) AS tag
      GROUP BY tag
      ORDER BY count DESC, tag
      LIMIT 80
    `,
    sql`
      SELECT DISTINCT genre
      FROM artists, unnest(genres) AS genre
      ORDER BY genre
    `,
  ])

  return {
    owners: ownersRows.map((row) => row.owner),
    tags: tagsRows.map((row) => [row.tag, row.count]),
    genres: genresRows.map((row) => row.genre),
  }
}

const updateArtist = async (id, patch, operator) => {
  const effectivePatch = withOperatorOwner(patch, operator)
  const nextStatus = effectivePatch.status

  if (nextStatus !== undefined && !allowedStatuses.has(nextStatus)) {
    throw new Error('Invalid status')
  }

  const genres =
    effectivePatch.genres !== undefined ? parseTagList(effectivePatch.genres) : undefined
  const tags = effectivePatch.tags !== undefined ? parseTagList(effectivePatch.tags) : undefined

  const [updated] = await sql`
    UPDATE artists
    SET
      name_he = COALESCE(${effectivePatch.nameHe ?? null}, name_he),
      name_en = COALESCE(${effectivePatch.nameEn ?? null}, name_en),
      genres = COALESCE(${genres ?? null}, genres),
      tags = COALESCE(${tags ?? null}, tags),
      latest_album = COALESCE(${effectivePatch.latestAlbum ?? null}, latest_album),
      status = COALESCE(${nextStatus ?? null}, status),
      owner = COALESCE(${effectivePatch.owner ?? null}, owner),
      source = COALESCE(${effectivePatch.source ?? null}, source),
      notes = COALESCE(${effectivePatch.notes ?? null}, notes),
      priority = COALESCE(${effectivePatch.priority ?? null}, priority),
      updated_at = NOW(),
      updated_by = COALESCE(${operator ?? null}, updated_by)
    WHERE id = ${id}
    RETURNING *
  `

  if (!updated) {
    return null
  }

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
      priority,
      updated_by
    )
    VALUES (
      ${id},
      ${nameHe},
      ${String(effectivePayload.nameEn ?? '').trim()},
      ${genres},
      ${tags},
      ${String(effectivePayload.latestAlbum ?? '').trim()},
      ${status},
      ${effectivePayload.owner ?? UNASSIGNED_OWNER},
      ${String(effectivePayload.source ?? '').trim()},
      ${String(effectivePayload.notes ?? '').trim()},
      ${effectivePayload.priority ?? (status === 'signed' ? 'שימור קשר' : status === 'stuck' ? 'פתיחת חסם' : 'ליצירת קשר')},
      ${operator ?? ''}
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

  if (ids.length > 1000) {
    throw new Error('Too many artists selected for bulk delete')
  }

  const rows = await sql`DELETE FROM artists WHERE id = ANY(${ids}) RETURNING id`
  return rows.map((row) => row.id)
}

const bulkUpdateArtists = async ({ ids, status, owner, priority }, operator) => {
  const effectiveOwner = owner ?? operator
  if (!Array.isArray(ids) || ids.length === 0) {
    return []
  }

  if (ids.length > 1000) {
    throw new Error('Too many artists selected for bulk update')
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
      updated_at = NOW(),
      updated_by = COALESCE(${operator ?? null}, updated_by)
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
    service: 'JUSIC ARTIST CRM',
    stats,
    count: artists.length,
    artists,
  }
}

const { verifyGateUnlock } = require('./gate.cjs')

module.exports = {
  bulkDeleteArtists,
  bulkUpdateArtists,
  createArtist,
  deleteArtist,
  getAccessByIp,
  getArtistById,
  getFilterOptions,
  getOperatorNameByIp,
  getArtists,
  getBackupPayload,
  getStats,
  registerOperatorForIp,
  searchArtists,
  setupDatabase,
  unlockGateForIp,
  updateArtist,
  upsertArtists,
  verifyGateUnlock,
}
