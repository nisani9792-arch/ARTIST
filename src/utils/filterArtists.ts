import type { CrmArtist, SortOption, StatusFilter } from '../types'

export type ArtistSearchRow = CrmArtist & { searchText: string }

export const buildArtistSearchRows = (artists: CrmArtist[]): ArtistSearchRow[] =>
  artists.map((artist) => ({
    ...artist,
    searchText: [
      artist.nameHe,
      artist.nameEn,
      artist.latestAlbum,
      artist.owner,
      artist.source,
      artist.priority,
      artist.notes,
      ...artist.genres,
      ...artist.tags,
    ]
      .join(' ')
      .toLocaleLowerCase('he-IL'),
  }))

const scoreArtist = (artist: CrmArtist) =>
  (artist.status === 'stuck' ? 80 : 0) +
  (artist.status === 'unsigned' ? 50 : 0) +
  (artist.owner === 'לא שויך' ? 30 : 0) +
  (!artist.notes.trim() ? 12 : 0) +
  Math.min(artist.tags.length, 10) * 2

export const filterArtistRows = (
  rows: ArtistSearchRow[],
  {
    query,
    statusFilter,
    ownerFilter,
    tagFilter,
    genreFilter,
    needsActionOnly,
    sortBy,
  }: {
    query: string
    statusFilter: StatusFilter
    ownerFilter: string
    tagFilter: string
    genreFilter: string
    needsActionOnly: boolean
    sortBy: SortOption
  },
): CrmArtist[] => {
  const normalizedQuery = query.toLocaleLowerCase('he-IL').trim()

  const filtered = rows.filter((artist) => {
    const matchesSearch = !normalizedQuery || artist.searchText.includes(normalizedQuery)
    const matchesStatus = statusFilter === 'all' || artist.status === statusFilter
    const matchesOwner = ownerFilter === 'all' || artist.owner === ownerFilter
    const matchesTag = tagFilter === 'all' || artist.tags.includes(tagFilter)
    const matchesGenre = genreFilter === 'all' || artist.genres.includes(genreFilter)
    const matchesAction =
      !needsActionOnly ||
      artist.status === 'stuck' ||
      artist.status === 'unsigned' ||
      artist.owner === 'לא שויך'

    return (
      matchesSearch &&
      matchesStatus &&
      matchesOwner &&
      matchesTag &&
      matchesGenre &&
      matchesAction
    )
  })

  if (sortBy === 'name') {
    filtered.sort((a, b) => a.nameHe.localeCompare(b.nameHe, 'he'))
    return filtered
  }

  if (sortBy === 'status') {
    filtered.sort((a, b) => a.status.localeCompare(b.status))
    return filtered
  }

  if (sortBy === 'tags') {
    filtered.sort((a, b) => b.tags.length - a.tags.length)
    return filtered
  }

  if (sortBy === 'updated') {
    filtered.sort((a, b) => {
      const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0
      const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0
      return tb - ta
    })
    return filtered
  }

  filtered.sort((a, b) => scoreArtist(b) - scoreArtist(a))
  return filtered
}

export type HeaderStats = {
  total: number
  signed: number
  unsigned: number
  stuck: number
  unassigned: number
}

export const emptyHeaderStats = (): HeaderStats => ({
  total: 0,
  signed: 0,
  unsigned: 0,
  stuck: 0,
  unassigned: 0,
})

export const computeHeaderStats = (artists: CrmArtist[]): HeaderStats => {
  let signed = 0
  let unsigned = 0
  let stuck = 0
  let unassigned = 0

  for (const artist of artists) {
    if (artist.status === 'signed') signed += 1
    else if (artist.status === 'unsigned') unsigned += 1
    else if (artist.status === 'stuck') stuck += 1
    if (artist.owner === 'לא שויך') unassigned += 1
  }

  return {
    total: artists.length,
    signed,
    unsigned,
    stuck,
    unassigned,
  }
}
