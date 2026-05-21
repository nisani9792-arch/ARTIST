import { describe, expect, it } from 'vitest'
import { buildArtistSearchRows, filterArtistRows } from './filterArtists'
import type { CrmArtist } from '../types'

const sampleArtists: CrmArtist[] = [
  {
    id: '1',
    nameHe: 'אומן א',
    nameEn: 'Artist A',
    genres: ['פופ'],
    tags: ['חדש'],
    latestAlbum: '',
    status: 'unsigned',
    owner: 'לא שויך',
    source: '',
    notes: '',
    priority: 'ליצירת קשר',
    bucket: 'main',
  },
  {
    id: '2',
    nameHe: 'אומן ב',
    nameEn: 'Artist B',
    genres: ['רock'],
    tags: [],
    latestAlbum: 'Album',
    status: 'signed',
    owner: 'שימון',
    source: '',
    notes: 'VIP',
    priority: 'שימור קשר',
    bucket: 'popular',
  },
]

describe('filterArtists', () => {
  it('filters by status and search query', () => {
    const rows = buildArtistSearchRows(sampleArtists)
    const result = filterArtistRows(rows, {
      query: 'vip',
      statusFilter: 'all',
      ownerFilter: 'all',
      tagFilter: 'all',
      genreFilter: 'all',
      needsActionOnly: false,
      sortBy: 'name',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('2')
  })

  it('prioritizes stuck artists in smart sort', () => {
    const rows = buildArtistSearchRows([
      {
        id: '3',
        nameHe: 'תקוע',
        nameEn: '',
        genres: [],
        tags: ['דחוף', 'עוד'],
        latestAlbum: '',
        status: 'stuck',
        owner: 'שימון',
        source: '',
        notes: '',
        priority: 'פתיחת חסם',
        bucket: 'main',
      },
      sampleArtists[1]!,
    ])

    const result = filterArtistRows(rows, {
      query: '',
      statusFilter: 'all',
      ownerFilter: 'all',
      tagFilter: 'all',
      genreFilter: 'all',
      needsActionOnly: false,
      sortBy: 'smart',
    })

    expect(result[0]?.status).toBe('stuck')
  })
})
