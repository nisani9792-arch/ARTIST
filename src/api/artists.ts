import type { AccessState } from './access'
import { request } from './client'
import type { ArtistBucket, ArtistRecord, SignatureStatus } from '../data/types'

export type CrmArtist = ArtistRecord & {
  updatedAt?: string
  updatedBy?: string
}

export type HeaderStats = {
  total: number
  signed: number
  unsigned: number
  in_process: number
  unassigned: number
  popular: number
  main_bucket: number
  outside_genre: number
}

export type ArtistFilters = {
  q?: string
  status?: SignatureStatus | 'all'
  owner?: string
  tag?: string
  genre?: string
  bucket?: ArtistBucket | 'all'
  audience?: 'all' | 'religious' | 'secular' | 'mixed'
  needsAction?: boolean
  myQueue?: boolean
  sort?: 'smart' | 'name' | 'status' | 'tags' | 'bucket'
  page?: number
  limit?: number
}

export type FilterOptions = {
  owners: string[]
  tags: [string, number][]
  genres: string[]
}

type ArtistsResponse = {
  artists: CrmArtist[]
  total: number
  page: number
  limit: number
  stats: HeaderStats
  filters?: FilterOptions
}

type ArtistResponse = {
  artist: CrmArtist
}

type DeleteIdsResponse = {
  ids: string[]
}

type BootstrapResponse = {
  access: AccessState
  artists: CrmArtist[]
  total: number
  page: number
  limit: number
  stats: HeaderStats
  filters: FilterOptions
}

const buildSearchParams = (filters: ArtistFilters = {}) => {
  const params = new URLSearchParams()

  if (filters.q) params.set('q', filters.q)
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters.owner && filters.owner !== 'all') params.set('owner', filters.owner)
  if (filters.tag && filters.tag !== 'all') params.set('tag', filters.tag)
  if (filters.genre && filters.genre !== 'all') params.set('genre', filters.genre)
  if (filters.bucket && filters.bucket !== 'all') params.set('bucket', filters.bucket)
  if (filters.audience && filters.audience !== 'all') params.set('audience', filters.audience)
  if (filters.needsAction) params.set('needsAction', 'true')
  if (filters.myQueue) params.set('myQueue', 'true')
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))

  return params
}

export const fetchBootstrap = async (filters: ArtistFilters = {}) => {
  const params = buildSearchParams(filters)
  const query = params.toString()
  return request<BootstrapResponse>(`/api/bootstrap${query ? `?${query}` : ''}`)
}

export const fetchArtistsPage = async (filters: ArtistFilters = {}) => {
  const params = buildSearchParams(filters)
  const query = params.toString()
  return request<ArtistsResponse>(`/api/artists${query ? `?${query}` : ''}`)
}

export const fetchFilterOptions = async () => request<FilterOptions>('/api/artists/filters')

export const fetchArtistById = async (id: string) => {
  const response = await request<ArtistResponse>(`/api/artists/${encodeURIComponent(id)}`)
  return response.artist
}

export const fetchStats = async () => {
  const response = await request<{ stats: HeaderStats }>('/api/stats')
  return response.stats
}

export const createArtist = async (payload: Partial<CrmArtist>) => {
  const response = await request<ArtistResponse>('/api/artists', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.artist
}

export const patchArtist = async (id: string, patch: Partial<CrmArtist>) => {
  const response = await request<ArtistResponse>(`/api/artists/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return response.artist
}

export const deleteArtist = async (id: string) => {
  await request<{ ok: boolean }>(`/api/artists/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export const bulkPatchArtists = async ({
  ids,
  owner,
  priority,
  status,
  bucket,
}: {
  ids: string[]
  owner: string
  priority: string
  status: SignatureStatus
  bucket?: ArtistBucket
}) => {
  const response = await request<{ artists: CrmArtist[] }>('/api/artists/bulk', {
    method: 'POST',
    body: JSON.stringify({ ids, owner, priority, status, bucket }),
  })
  return response.artists
}

export const classifyArtistBuckets = async (popularLimit: number) => {
  return request<{ updated: number; popularLimit: number; stats: HeaderStats }>(
    '/api/artists/classify-buckets',
    {
      method: 'POST',
      body: JSON.stringify({ popularLimit }),
    },
  )
}

export const bulkDeleteArtists = async (ids: string[]) => {
  const response = await request<DeleteIdsResponse>('/api/artists/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
  return response.ids
}

export type ArtistVersion = {
  id: number
  artistId: string
  snapshot: CrmArtist
  changedBy: string
  createdAt: string
}

export type DuplicateGroup = {
  key: string
  nameHe: string
  nameEn: string
  artists: CrmArtist[]
}

export const fetchArtistVersions = async (id: string) => {
  const response = await request<{ versions: ArtistVersion[] }>(
    `/api/artists/${encodeURIComponent(id)}/versions`,
  )
  return response.versions
}

export const undoArtistChange = async (id: string) => {
  const response = await request<ArtistResponse>(`/api/artists/${encodeURIComponent(id)}/undo`, {
    method: 'POST',
  })
  return response.artist
}

export const revertArtistVersion = async (id: string, versionId: number) => {
  const response = await request<ArtistResponse>(
    `/api/artists/${encodeURIComponent(id)}/revert/${versionId}`,
    { method: 'POST' },
  )
  return response.artist
}

export const fetchDuplicateGroups = async () => {
  const response = await request<{ groups: DuplicateGroup[]; count: number }>(
    '/api/artists/duplicates',
  )
  return response
}

export const mergeArtists = async (keepId: string, removeIds: string[]) => {
  const response = await request<ArtistResponse>('/api/artists/merge', {
    method: 'POST',
    body: JSON.stringify({ keepId, removeIds }),
  })
  return response.artist
}

export type BackupPayload = {
  version: number
  exportedAt: string
  service: string
  stats: HeaderStats
  count: number
  artists: CrmArtist[]
}

export const downloadBackup = async () => {
  const response = await fetch('/api/backup')
  if (!response.ok) {
    throw new Error('יצירת גיבוי נכשלה')
  }

  const backup = (await response.json()) as BackupPayload
  const stamp = backup.exportedAt.slice(0, 19).replace(/[:T]/g, '-')
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `artist-backup-${stamp}.json`
  link.click()
  URL.revokeObjectURL(url)

  localStorage.setItem('artist-last-backup', backup.exportedAt)
  return backup
}

export const exportArtistsCsv = (artists: CrmArtist[], filename = 'artist-crm-export.csv') => {
  const formatCsvValue = (value: string | string[]) => {
    const text = Array.isArray(value) ? value.join(', ') : value
    return `"${text.replace(/"/g, '""')}"`
  }

  const headers = [
    'שם',
    'שם באנגלית',
    'סטטוס',
    'קטגוריה',
    'קהל AI',
    'גורם מטפל',
    'זאנרים',
    'תגיות',
    'אלבום',
    'הערות',
  ]
  const audienceLabels = {
    religious: 'דתי',
    secular: 'חילוני',
    mixed: 'מעורב',
  }
  const bucketLabels = {
    popular: 'פופולרי',
    main: 'שאר',
    outside_genre: 'מחוץ לז׳אנר',
  }
  const statusLabels = { signed: 'חתום', unsigned: 'לא חתום', in_process: 'בעבודה' }
  const rows = artists.map((artist) => [
    artist.nameHe,
    artist.nameEn,
    statusLabels[artist.status],
    bucketLabels[artist.bucket ?? 'main'],
    artist.audienceType ? audienceLabels[artist.audienceType] : '',
    artist.owner,
    artist.genres,
    artist.tags,
    artist.latestAlbum,
    artist.notes,
  ])
  const csv = [headers, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [] })) {
    const file = new File([blob], filename, { type: 'text/csv' })
    if (navigator.canShare({ files: [file] })) {
      void navigator.share({ files: [file], title: filename })
      URL.revokeObjectURL(url)
      return
    }
  }

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
