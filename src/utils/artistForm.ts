import type { CrmArtist } from '../types'
import type { SignatureStatus } from '../data/artists'

export type ArtistFormValues = {
  nameHe: string
  nameEn: string
  status: SignatureStatus
  owner: string
  latestAlbum: string
  source: string
  notes: string
  genresText: string
  tagsText: string
}

export const emptyArtistForm = (): ArtistFormValues => ({
  nameHe: '',
  nameEn: '',
  status: 'unsigned',
  owner: 'לא שויך',
  latestAlbum: '',
  source: '',
  notes: '',
  genresText: '',
  tagsText: '',
})

export const artistToForm = (artist: CrmArtist): ArtistFormValues => ({
  nameHe: artist.nameHe,
  nameEn: artist.nameEn,
  status: artist.status,
  owner: artist.owner,
  latestAlbum: artist.latestAlbum,
  source: artist.source,
  notes: artist.notes,
  genresText: artist.genres.join(', '),
  tagsText: artist.tags.join(', '),
})

export const formToPayload = (form: ArtistFormValues): Partial<CrmArtist> => ({
  nameHe: form.nameHe.trim(),
  nameEn: form.nameEn.trim(),
  status: form.status,
  owner: form.owner,
  latestAlbum: form.latestAlbum.trim(),
  source: form.source.trim(),
  notes: form.notes.trim(),
  genres: form.genresText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  tags: form.tagsText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
})
