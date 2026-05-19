export type SignatureStatus = 'signed' | 'unsigned' | 'stuck'

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
  updatedAt?: string
  updatedBy?: string
}
