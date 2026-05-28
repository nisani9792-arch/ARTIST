import type { ArtistRecord, SignatureStatus } from './data/types'

export type CrmArtist = ArtistRecord & {
  updatedAt?: string
  updatedBy?: string
}

export type ViewMode = 'segments' | 'cards' | 'table' | 'kanban' | 'multi'
export type AudienceFilter = 'all' | 'religious' | 'secular' | 'mixed'
export type { ArtistBucket } from './data/types'
export type { BucketFilter } from './lib/artistBuckets'
export type StatusFilter = SignatureStatus | 'all'
export type OwnerFilter = string | 'all'
export type SortOption = 'smart' | 'name' | 'status' | 'tags' | 'bucket'
export type SaveStatus = 'idle' | 'loading' | 'saving' | 'error'
