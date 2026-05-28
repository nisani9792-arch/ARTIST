import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { MY_QUEUE_KEY } from '../../lib/constants'
import {
  loadWorkspaceSettings,
  saveWorkspaceSettings,
} from '../../lib/artistBuckets'
import type { AudienceFilter, BucketFilter, SortOption, StatusFilter, ViewMode } from '../../types'
import type { ArtistFilters } from '../../api/artists'

const parseBool = (value: string | null) => value === 'true' || value === '1'

const parseViewMode = (value: string | null): ViewMode | null => {
  if (
    value === 'segments' ||
    value === 'cards' ||
    value === 'table' ||
    value === 'kanban' ||
    value === 'multi'
  ) {
    return value
  }
  return null
}

export const useArtistFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const fromUrl = parseViewMode(searchParams.get('view'))
    if (fromUrl) return fromUrl
    return loadWorkspaceSettings().defaultViewMode
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const query = searchParams.get('q') ?? ''
  const debouncedQuery = useDebouncedValue(query, 280)
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter
  const ownerFilter = searchParams.get('owner') ?? 'all'
  const tagFilter = searchParams.get('tag') ?? 'all'
  const genreFilter = searchParams.get('genre') ?? 'all'
  const bucketFilter = (searchParams.get('bucket') ?? 'all') as BucketFilter
  const audienceFilter = (searchParams.get('audience') ?? 'all') as AudienceFilter
  const needsActionOnly = parseBool(searchParams.get('needsAction'))
  const myQueue = parseBool(searchParams.get('myQueue'))
  const sortBy = (searchParams.get('sort') ?? 'smart') as SortOption
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const limit = Math.max(1, Number(searchParams.get('limit') ?? '48') || 48)

  const patchParams = (patch: Record<string, string | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === '' || value === 'all') next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  const setQuery = (value: string) => patchParams({ q: value || null, page: '1' })
  const setStatusFilter = (value: StatusFilter) => patchParams({ status: value, page: '1' })
  const setOwnerFilter = (value: string) => patchParams({ owner: value, page: '1' })
  const setTagFilter = (value: string) => patchParams({ tag: value, page: '1' })
  const setGenreFilter = (value: string) => patchParams({ genre: value, page: '1' })
  const setBucketFilter = (value: BucketFilter) => patchParams({ bucket: value, page: '1' })
  const setAudienceFilter = (value: AudienceFilter) => patchParams({ audience: value, page: '1' })
  const setNeedsActionOnly = (value: boolean) =>
    patchParams({ needsAction: value ? 'true' : null, page: '1' })
  const setMyQueue = (value: boolean) => {
    localStorage.setItem(MY_QUEUE_KEY, value ? '1' : '0')
    patchParams({ myQueue: value ? 'true' : null, page: '1' })
  }
  const setSortBy = (value: SortOption) => patchParams({ sort: value, page: '1' })
  const setPage = (value: number) => patchParams({ page: String(value) })
  const setLimit = (value: number) => patchParams({ limit: String(value), page: '1' })

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    patchParams({ view: mode })
    saveWorkspaceSettings({ ...loadWorkspaceSettings(), defaultViewMode: mode })
  }

  useEffect(() => {
    const fromUrl = parseViewMode(searchParams.get('view'))
    if (fromUrl) {
      setViewModeState(fromUrl)
      return
    }
    setViewModeState('kanban')
    patchParams({ view: 'kanban' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync URL once when view param missing
  }, [searchParams.get('view')])

  const apiFilters: ArtistFilters = useMemo(
    () => ({
      q: debouncedQuery,
      status: statusFilter,
      owner: ownerFilter,
      tag: tagFilter,
      genre: genreFilter,
      bucket: bucketFilter,
      audience: audienceFilter,
      needsAction: needsActionOnly,
      myQueue,
      sort: sortBy,
      page,
      limit,
    }),
    [
      debouncedQuery,
      statusFilter,
      ownerFilter,
      tagFilter,
      genreFilter,
      bucketFilter,
      audienceFilter,
      needsActionOnly,
      myQueue,
      sortBy,
      page,
      limit,
    ],
  )

  return {
    viewMode,
    setViewMode,
    filtersOpen,
    setFiltersOpen,
    searchOpen,
    setSearchOpen,
    query,
    debouncedQuery,
    statusFilter,
    ownerFilter,
    tagFilter,
    genreFilter,
    bucketFilter,
    audienceFilter,
    needsActionOnly,
    myQueue,
    sortBy,
    page,
    limit,
    apiFilters,
    setQuery,
    setStatusFilter,
    setOwnerFilter,
    setTagFilter,
    setGenreFilter,
    setBucketFilter,
    setAudienceFilter,
    setNeedsActionOnly,
    setMyQueue,
    setSortBy,
    setPage,
    setLimit,
    patchParams,
  }
}
