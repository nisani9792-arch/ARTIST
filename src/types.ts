import type { ArtistRecord, SignatureStatus } from './data/types'

export type CrmArtist = ArtistRecord & {
  updatedAt?: string
  updatedBy?: string
}

export type ViewMode = 'cards' | 'table' | 'kanban'
export type StatusFilter = SignatureStatus | 'all'
export type OwnerFilter = string | 'all'
export type SortOption = 'smart' | 'name' | 'status' | 'tags'
export type SaveStatus = 'idle' | 'loading' | 'saving' | 'error'
