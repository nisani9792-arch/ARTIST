import type { AccessState } from './access'
import type { ArtistRecord, SignatureStatus } from '../data/types'

export type CrmArtist = ArtistRecord & {
  updatedAt?: string
}

export type HeaderStats = {
  total: number
  signed: number
  unsigned: number
  stuck: number
  unassigned: number
}

type ArtistsResponse = {
  artists: CrmArtist[]
}

type ArtistResponse = {
  artist: CrmArtist
}

type DeleteIdsResponse = {
  ids: string[]
}

type StatsResponse = {
  stats: HeaderStats
}

type BootstrapResponse = {
  access: AccessState
  artists: CrmArtist[]
  stats: HeaderStats
}

let currentOperator: string | null = null

export const setApiOperator = (name: string | null) => {
  currentOperator = name
}

const parseError = async (response: Response) => {
  const text = await response.text()
  try {
    const json = JSON.parse(text) as { error?: string }
    if (json.error) return json.error
  } catch {
    // ignore
  }
  return text || `Request failed with status ${response.status}`
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(currentOperator ? { 'X-Operator': currentOperator } : {}),
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json() as Promise<T>
}

export const fetchBootstrap = async () => request<BootstrapResponse>('/api/bootstrap')

export const fetchArtists = async () => {
  const response = await request<ArtistsResponse>('/api/artists')
  return response.artists
}

export const fetchStats = async () => {
  const response = await request<StatsResponse>('/api/stats')
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
}: {
  ids: string[]
  owner: string
  priority: string
  status: SignatureStatus
}) => {
  const response = await request<ArtistsResponse>('/api/artists/bulk', {
    method: 'POST',
    body: JSON.stringify({ ids, owner, priority, status }),
  })
  return response.artists
}

export const bulkDeleteArtists = async (ids: string[]) => {
  const response = await request<DeleteIdsResponse>('/api/artists/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
  return response.ids
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
