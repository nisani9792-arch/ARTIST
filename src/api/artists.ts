import type { ArtistRecord, SignatureStatus } from '../data/artists'

export type CrmArtist = ArtistRecord

type ArtistsResponse = {
  artists: CrmArtist[]
}

type ArtistResponse = {
  artist: CrmArtist
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const fetchArtists = async () => {
  const response = await request<ArtistsResponse>('/api/artists')
  return response.artists
}

export const patchArtist = async (id: string, patch: Partial<CrmArtist>) => {
  const response = await request<ArtistResponse>(`/api/artists/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })

  return response.artist
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
