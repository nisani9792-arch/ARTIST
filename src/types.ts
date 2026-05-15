import type { ArtistRecord, SignatureStatus } from './data/artists'

export type CrmArtist = ArtistRecord & {
  updatedAt?: string
}

export type ViewMode = 'cards' | 'table'
export type StatusFilter = SignatureStatus | 'all'
export type OwnerFilter = string | 'all'
export type SortOption = 'smart' | 'name' | 'status' | 'tags'
export type SaveStatus = 'idle' | 'loading' | 'saving' | 'error'
