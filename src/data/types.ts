export type SignatureStatus = 'signed' | 'unsigned' | 'stuck'

export type ArtistBucket = 'popular' | 'main' | 'outside_genre'

export type ArtistRecord = {
  id: string
  nameHe: string
  nameEn: string
  genres: string[]
  tags: string[]
  latestAlbum: string
  status: SignatureStatus
  owner: string
  source: string
  notes: string
  priority: string
  bucket: ArtistBucket
  popularityScore?: number
  updatedAt?: string
  updatedBy?: string
}
