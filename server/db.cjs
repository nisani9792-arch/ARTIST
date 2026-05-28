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
const { BUCKETS, classifyArtistBuckets } = require('./artistBuckets.cjs')

const allowedStatuses = new Set(['signed', 'unsigned', 'stuck'])
const allowedBuckets = new Set(BUCKETS)
const UNASSIGNED_OWNER = 'לא שויך'
const DEFAULT_POPULAR_LIMIT = 20

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
  bucket: artist.bucket ?? 'main',
  popularityScore: Number(artist.popularity_score ?? 0),
  audienceType: artist.audience_type ?? 'mixed',
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
      bucket TEXT NOT NULL DEFAULT 'main',
      popularity_score INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by TEXT NOT NULL DEFAULT ''
    )
  `

  await sql`ALTER TABLE artists ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE artists ADD COLUMN IF NOT EXISTS bucket TEXT NOT NULL DEFAULT 'main'`
  await sql`ALTER TABLE artists ADD COLUMN IF NOT EXISTS popularity_score INT NOT NULL DEFAULT 0`
  await sql`ALTER TABLE artists ADD COLUMN IF NOT EXISTS audience_type TEXT NOT NULL DEFAULT 'mixed'`
  await sql`CREATE INDEX IF NOT EXISTS artists_bucket_idx ON artists (bucket)`
  await sql`CREATE INDEX IF NOT EXISTS artists_audience_idx ON artists (audience_type)`

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

  await sql`
    CREATE TABLE IF NOT EXISTS artist_versions (
      id SERIAL PRIMARY KEY,
      artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
      snapshot JSONB NOT NULL,
      changed_by TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS artist_versions_artist_idx ON artist_versions (artist_id, created_at DESC)`
}

const MAX_VERSIONS_PER_ARTIST = 40

const artistNameKey = (nameHe, nameEn) =>
  `${String(nameHe ?? '').trim().toLowerCase()}::${String(nameEn ?? '').trim().toLowerCase()}`

const saveArtistVersion = async (artistId, operator) => {
  const current = await getArtistById(artistId)
  if (!current) return

  await sql`
    INSERT INTO artist_versions (artist_id, snapshot, changed_by)
    VALUES (${artistId}, ${JSON.stringify(current)}::jsonb, ${operator ?? ''})
  `

  await sql`
    DELETE FROM artist_versions
    WHERE id IN (
      SELECT id
      FROM artist_versions
      WHERE artist_id = ${artistId}
      ORDER BY created_at DESC
      OFFSET ${MAX_VERSIONS_PER_ARTIST}
    )
  `
}

const getArtistVersions = async (artistId, limit = 20) => {
  const rows = await sql`
    SELECT id, artist_id, snapshot, changed_by, created_at
    FROM artist_versions
    WHERE artist_id = ${artistId}
    ORDER BY created_at DESC
    LIMIT ${Math.min(Math.max(1, limit), 40)}
  `

  return rows.map((row) => ({
    id: row.id,
    artistId: row.artist_id,
    snapshot: row.snapshot,
    changedBy: row.changed_by ?? '',
    createdAt: row.created_at,
  }))
}

const revertArtistToVersion = async (artistId, versionId, operator) => {
  const [version] = await sql`
    SELECT id, artist_id, snapshot
    FROM artist_versions
    WHERE id = ${versionId} AND artist_id = ${artistId}
    LIMIT 1
  `

  if (!version) {
    return null
  }

  await saveArtistVersion(artistId, operator)

  const snap = version.snapshot
  const artist = await updateArtist(
    artistId,
    {
      nameHe: snap.nameHe,
      nameEn: snap.nameEn,
      genres: snap.genres,
      tags: snap.tags,
      latestAlbum: snap.latestAlbum,
      status: snap.status,
      owner: snap.owner,
      source: snap.source,
      notes: snap.notes,
      priority: snap.priority,
      bucket: snap.bucket,
      popularityScore: snap.popularityScore,
    },
    operator,
    { skipVersion: true },
  )

  return artist
}

const undoLastArtistChange = async (artistId, operator) => {
  const versions = await getArtistVersions(artistId, 1)
  if (versions.length === 0) {
    return null
  }

  return revertArtistToVersion(artistId, versions[0].id, operator)
}

const findDuplicateGroups = async () => {
  const rows = await sql`
    SELECT ${artistSelectFields}
    FROM artists
    ORDER BY name_he COLLATE "C"
  `

  const groups = new Map()

  for (const row of rows) {
    const artist = normalizeArtist(row)
    const key = artistNameKey(artist.nameHe, artist.nameEn)
    if (!key || key === '::') continue
    const list = groups.get(key) ?? []
    list.push(artist)
    groups.set(key, list)
  }

  return [...groups.values()]
    .filter((artists) => artists.length > 1)
    .map((artists) => ({
      key: artistNameKey(artists[0].nameHe, artists[0].nameEn),
      nameHe: artists[0].nameHe,
      nameEn: artists[0].nameEn,
      artists: artists.sort(
        (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
      ),
    }))
    .sort((a, b) => b.artists.length - a.artists.length)
}

const uniqueStrings = (lists) => [...new Set(lists.flat().map((s) => String(s).trim()).filter(Boolean))]

const mergeArtists = async (keepId, removeIds, operator) => {
  if (!Array.isArray(removeIds) || removeIds.length === 0) {
    throw new Error('No artists selected to merge')
  }

  const keep = await getArtistById(keepId)
  if (!keep) {
    throw new Error('Keep artist not found')
  }

  const toRemove = removeIds.filter((id) => id !== keepId)
  if (toRemove.length === 0) {
    return keep
  }

  const duplicates = await Promise.all(toRemove.map((id) => getArtistById(id)))
  const valid = duplicates.filter(Boolean)

  if (valid.length === 0) {
    throw new Error('No duplicate artists found')
  }

  await saveArtistVersion(keepId, operator)

  let mergedGenres = [...keep.genres]
  let mergedTags = [...keep.tags]
  let mergedNotes = keep.notes
  let mergedStatus = keep.status
  let mergedSource = keep.source
  let mergedAlbum = keep.latestAlbum

  for (const dup of valid) {
    mergedGenres = uniqueStrings([mergedGenres, dup.genres])
    mergedTags = uniqueStrings([mergedTags, dup.tags])
    if (dup.notes && !mergedNotes.includes(dup.notes)) {
      mergedNotes = mergedNotes ? `${mergedNotes}\n---\n${dup.notes}` : dup.notes
    }
    if (dup.status === 'signed') mergedStatus = 'signed'
    if (dup.source && !mergedSource.includes(dup.source)) {
      mergedSource = mergedSource ? `${mergedSource}, ${dup.source}` : dup.source
    }
    mergedAlbum = mergedAlbum || dup.latestAlbum
  }

  const updated = await updateArtist(
    keepId,
    {
      genres: mergedGenres,
      tags: mergedTags,
      notes: mergedNotes,
      status: mergedStatus,
      source: mergedSource,
      latestAlbum: mergedAlbum,
    },
    operator,
    { skipVersion: true },
  )

  await bulkDeleteArtists(toRemove)
  return updated
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
  bucket,
  popularity_score,
  audience_type,
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
      COUNT(*) FILTER (WHERE owner = ${UNASSIGNED_OWNER})::INT AS unassigned,
      COUNT(*) FILTER (WHERE bucket = 'popular')::INT AS popular,
      COUNT(*) FILTER (WHERE bucket = 'main')::INT AS main_bucket,
      COUNT(*) FILTER (WHERE bucket = 'outside_genre')::INT AS outside_genre
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

const clampLimit = (limit) => Math.min(Math.max(1, Number(limit) || 48), 500)

const buildSearchFilters = ({
  q,
  status,
  owner,
  tag,
  genre,
  bucket,
  audience,
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
  const bucketValue = bucket === 'all' ? null : bucket
  const audienceValue =
    audience === 'religious' || audience === 'secular' || audience === 'mixed' ? audience : null
  const needsActionFlag = Boolean(needsAction)
  const myQueueFlag = Boolean(myQueue)
  const queueOwner = operatorName ?? ''

  return {
    likeQuery,
    statusValue,
    ownerValue,
    tagValue,
    genreValue,
    bucketValue,
    audienceValue,
    needsActionFlag,
    myQueueFlag,
    queueOwner,
  }
}

const whereClause = (filters) => sql`
  (${filters.statusValue}::text IS NULL OR status = ${filters.statusValue})
  AND (${filters.ownerValue}::text IS NULL OR owner = ${filters.ownerValue})
  AND (${filters.tagValue}::text IS NULL OR ${filters.tagValue} = ANY(tags))
  AND (${filters.genreValue}::text IS NULL OR ${filters.genreValue} = ANY(genres))
  AND (${filters.bucketValue}::text IS NULL OR bucket = ${filters.bucketValue})
  AND (${filters.audienceValue}::text IS NULL OR audience_type = ${filters.audienceValue})
  AND (
    ${!filters.needsActionFlag}::boolean
    OR status <> 'signed'
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

const orderClause = (sort) => {
  if (sort === 'name') {
    return sql`ORDER BY name_he COLLATE "C"`
  }
  if (sort === 'status') {
    return sql`ORDER BY status, name_he COLLATE "C"`
  }
  if (sort === 'tags') {
    return sql`ORDER BY COALESCE(array_length(tags, 1), 0) DESC, name_he COLLATE "C"`
  }
  if (sort === 'bucket') {
    return sql`ORDER BY
      CASE bucket
        WHEN 'popular' THEN 1
        WHEN 'main' THEN 2
        ELSE 3
      END,
      popularity_score DESC,
      name_he COLLATE "C"`
  }
  return sql`ORDER BY
    (CASE WHEN status = 'stuck' THEN 70 WHEN status = 'unsigned' THEN 45 ELSE 0 END)
    + (CASE WHEN owner = ${UNASSIGNED_OWNER} THEN 25 ELSE 0 END)
    + LEAST(COALESCE(array_length(tags, 1), 0), 10) * 2 DESC,
    popularity_score DESC,
    name_he COLLATE "C"`
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
    WHERE ${whereClause(filters)}
  `

  const total = countRow?.total ?? 0

  const rows = await sql`
    SELECT ${artistSelectFields}
    FROM artists
    WHERE ${whereClause(filters)}
    ${orderClause(sort)}
    LIMIT ${limit}
    OFFSET ${offset}
  `

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

const updateArtist = async (id, patch, operator, { skipVersion = false } = {}) => {
  if (!skipVersion) {
    await saveArtistVersion(id, operator)
  }

  const effectivePatch = withOperatorOwner(patch, operator)
  const nextStatus = effectivePatch.status

  if (nextStatus !== undefined && !allowedStatuses.has(nextStatus)) {
    throw new Error('Invalid status')
  }

  if (effectivePatch.bucket !== undefined && !allowedBuckets.has(effectivePatch.bucket)) {
    throw new Error('Invalid bucket')
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
      bucket = COALESCE(${effectivePatch.bucket ?? null}, bucket),
      popularity_score = COALESCE(${effectivePatch.popularityScore ?? null}, popularity_score),
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
      bucket,
      popularity_score,
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
      ${allowedBuckets.has(effectivePayload.bucket) ? effectivePayload.bucket : 'main'},
      ${Number(effectivePayload.popularityScore ?? 0)},
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

const bulkUpdateArtists = async ({ ids, status, owner, priority, bucket }, operator) => {
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

  if (bucket !== undefined && !allowedBuckets.has(bucket)) {
    throw new Error('Invalid bucket')
  }

  const rows = await sql`
    UPDATE artists
    SET
      status = ${status},
      owner = ${effectiveOwner},
      priority = ${priority},
      bucket = COALESCE(${bucket ?? null}, bucket),
      updated_at = NOW(),
      updated_by = COALESCE(${operator ?? null}, updated_by)
    WHERE id = ANY(${ids})
    RETURNING *
  `

  return rows.map(normalizeArtist)
}

const replaceAllArtists = async (artists) => {
  await setupDatabase()
  await sql`DELETE FROM artist_versions`
  await sql`DELETE FROM artists`

  const chunkSize = 40
  let inserted = 0

  for (let index = 0; index < artists.length; index += chunkSize) {
    const chunk = artists.slice(index, index + chunkSize)
    await Promise.all(
      chunk.map((artist) => {
        const genres = parseTagList(artist.genres)
        const tags = parseTagList(artist.tags)
        const audienceType = artist.audienceType ?? artist.audience_type ?? 'mixed'
        const bucket = allowedBuckets.has(artist.bucket) ? artist.bucket : 'main'

        return sql`
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
            bucket,
            popularity_score,
            audience_type,
            updated_by
          )
          VALUES (
            ${artist.id},
            ${String(artist.nameHe ?? '').trim()},
            ${String(artist.nameEn ?? '').trim()},
            ${genres},
            ${tags},
            ${String(artist.latestAlbum ?? '').trim()},
            ${artist.status},
            ${artist.owner ?? UNASSIGNED_OWNER},
            ${String(artist.source ?? '').trim()},
            ${String(artist.notes ?? '').trim()},
            ${artist.priority ?? ''},
            ${bucket},
            ${Number(artist.popularityScore ?? 0)},
            ${audienceType},
            ${'ייבוא מחדש'}
          )
        `
      }),
    )
    inserted += chunk.length
  }

  return { inserted }
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

const needsBucketClassification = async () => {
  const [row] = await sql`
    SELECT COALESCE(MAX(popularity_score), 0)::INT AS max_score
    FROM artists
  `
  return (row?.max_score ?? 0) === 0
}

const classifyArtistBucketsInDb = async (popularLimit = DEFAULT_POPULAR_LIMIT) => {
  await setupDatabase()

  const rows = await sql`
    SELECT id, name_he, name_en, genres, tags, latest_album, status
    FROM artists
  `

  if (rows.length === 0) {
    return { updated: 0, popularLimit: popularLimit }
  }

  const { assignments, scores, limit } = classifyArtistBuckets(rows, popularLimit)
  const chunkSize = 120

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    await Promise.all(
      chunk.map((artist) =>
        sql`
          UPDATE artists
          SET
            bucket = ${assignments.get(artist.id) ?? 'main'},
            popularity_score = ${scores.get(artist.id) ?? 0}
          WHERE id = ${artist.id}
        `,
      ),
    )
  }

  return { updated: rows.length, popularLimit: limit }
}

const ensureBucketsClassified = async () => {
  if (await needsBucketClassification()) {
    await classifyArtistBucketsInDb(DEFAULT_POPULAR_LIMIT)
  }
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
  classifyArtistBucketsInDb,
  createArtist,
  deleteArtist,
  ensureBucketsClassified,
  findDuplicateGroups,
  getAccessByIp,
  getArtistById,
  getArtistVersions,
  getFilterOptions,
  getOperatorNameByIp,
  getArtists,
  getBackupPayload,
  getStats,
  mergeArtists,
  registerOperatorForIp,
  replaceAllArtists,
  revertArtistToVersion,
  searchArtists,
  setupDatabase,
  undoLastArtistChange,
  unlockGateForIp,
  updateArtist,
  upsertArtists,
  verifyGateUnlock,
}
