import { AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  downloadBackup,
  exportArtistsCsv,
  fetchArtistsPage,
  type CrmArtist,
} from '../api/artists'
import { ArtistCardGrid } from '../components/ArtistCardGrid'
import { ArtistFormModal } from '../components/ArtistFormModal'
import { ArtistKanban } from '../features/artists/ArtistKanban'
import { ArtistsSkeleton } from '../features/artists/ArtistsSkeleton'
import { ArtistsTable } from '../features/artists/ArtistsTable'
import { ArtistsToolbar } from '../features/artists/ArtistsToolbar'
import { BulkActionsBar } from '../features/artists/BulkActionsBar'
import { useArtistFilters } from '../features/artists/useArtistFilters'
import { useArtistMutations } from '../features/artists/useArtistMutations'
import { useArtistsPage } from '../features/artists/useArtistsQuery'
import { HANDLERS, STATUS_META, priorityForStatus } from '../lib/constants'
import type { SignatureStatus } from '../data/types'
import type { CrmOutletContext } from './CrmLayout'

export const ArtistsPage = () => {
  const { operatorName, setArtistsUi, setSaveStatus, setStats, setBackupHandler, setExportHandler } =
    useOutletContext<CrmOutletContext>()
  const navigate = useNavigate()

  const filters = useArtistFilters()
  const {
    viewMode,
    setViewMode,
    filtersOpen,
    setFiltersOpen,
    searchOpen,
    setSearchOpen,
    apiFilters,
    page,
    limit,
    setPage,
    setLimit,
    query,
    statusFilter,
    ownerFilter,
    tagFilter,
    genreFilter,
    needsActionOnly,
    myQueue,
    sortBy,
    setQuery,
    setStatusFilter,
    setOwnerFilter,
    setTagFilter,
    setGenreFilter,
    setNeedsActionOnly,
    setMyQueue,
    setSortBy,
  } = filters

  const queryFilters = useMemo(
    () =>
      viewMode === 'kanban'
        ? { ...apiFilters, page: 1, limit: Math.max(limit, 200) }
        : apiFilters,
    [apiFilters, limit, viewMode],
  )

  const { data, isLoading, isFetching, error, refetch } = useArtistsPage(queryFilters)
  const {
    patchMutation,
    createMutation,
    bulkPatchMutation,
    bulkDeleteMutation,
  } = useArtistMutations(operatorName)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<SignatureStatus>('unsigned')
  const [bulkOwner, setBulkOwner] = useState(operatorName ?? 'שימון')
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingArtist, setEditingArtist] = useState<CrmArtist | null>(null)
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({})

  const handlerList = useMemo(() => {
    const set = new Set<string>(HANDLERS)
    if (operatorName) set.add(operatorName)
    for (const owner of data?.filters?.owners ?? []) set.add(owner)
    return [...set]
  }, [operatorName, data?.filters?.owners])

  const artists = useMemo(
    () =>
      (data?.artists ?? []).map((artist) =>
        notesDrafts[artist.id] !== undefined ? { ...artist, notes: notesDrafts[artist.id] } : artist,
      ),
    [data?.artists, notesDrafts],
  )

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (operatorName) setBulkOwner(operatorName)
  }, [operatorName])

  useEffect(() => {
    setStats(data?.stats)
  }, [data?.stats, setStats])

  useEffect(() => {
    if (isLoading || isFetching || patchMutation.isPending || createMutation.isPending) {
      setSaveStatus('saving')
    } else if (error) {
      setSaveStatus('error')
    } else {
      setSaveStatus('idle')
    }
  }, [
    isLoading,
    isFetching,
    error,
    patchMutation.isPending,
    createMutation.isPending,
    setSaveStatus,
  ])

  const openCreateModal = useCallback(() => {
    setEditingArtist(null)
    setFormMode('create')
  }, [])

  const runExport = useCallback(async () => {
    const exportLimit = Math.min(total || 5000, 5000)
    if (exportLimit === 0) return
    const payload = await fetchArtistsPage({ ...apiFilters, page: 1, limit: exportLimit })
    exportArtistsCsv(payload.artists)
  }, [apiFilters, total])

  const runBackup = useCallback(async () => {
    await downloadBackup()
  }, [])

  useEffect(() => {
    setArtistsUi({
      viewMode,
      setViewMode,
      filtersOpen,
      setFiltersOpen,
      searchOpen,
      setSearchOpen,
      openCreateModal,
    })
    setBackupHandler(runBackup)
    setExportHandler(runExport)
  }, [
    viewMode,
    filtersOpen,
    searchOpen,
    setArtistsUi,
    setBackupHandler,
    setExportHandler,
    openCreateModal,
    runBackup,
    runExport,
    setViewMode,
    setFiltersOpen,
    setSearchOpen,
  ])

  const updateArtist = (artistId: string, patch: Partial<CrmArtist>) => {
    patchMutation.mutate({ id: artistId, patch })
  }

  const toggleSelected = (artistId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(artistId)) next.delete(artistId)
      else next.add(artistId)
      return next
    })
  }

  const togglePageSelection = () => {
    const pageIds = artists.map((artist) => artist.id)
    const allSelected = pageIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  }

  const selectAllFiltered = async () => {
    if (total === 0) return
    if (total > 500) {
      const ok = window.confirm(
        `לבחור ${total.toLocaleString('he-IL')} אומנים? פעולה זו עלולה להיות כבדה.`,
      )
      if (!ok) return
    }
    const payload = await fetchArtistsPage({ ...apiFilters, page: 1, limit: total })
    setSelectedIds(new Set(payload.artists.map((artist) => artist.id)))
  }

  const pageAllSelected = artists.length > 0 && artists.every((artist) => selectedIds.has(artist.id))
  const openArtist = (artist: CrmArtist) => navigate(`/artists/${artist.id}`)

  return (
    <>
      {error && <div className="app-alert">{error.message}</div>}

      <div className="artists-toolbar-row">
        <button
          type="button"
          className={`btn btn-ghost mobile-filter-toggle ${filtersOpen ? 'active' : ''}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={16} />
          סינון
        </button>
      </div>

      <ArtistsToolbar
        query={query}
        statusFilter={statusFilter}
        ownerFilter={ownerFilter}
        tagFilter={tagFilter}
        genreFilter={genreFilter}
        needsActionOnly={needsActionOnly}
        myQueue={myQueue}
        sortBy={sortBy}
        filtersOpen={filtersOpen}
        searchOpen={searchOpen}
        filterOptions={data?.filters}
        selectedCount={selectedIds.size}
        onQueryChange={setQuery}
        onStatusFilterChange={setStatusFilter}
        onOwnerFilterChange={setOwnerFilter}
        onTagFilterChange={setTagFilter}
        onGenreFilterChange={setGenreFilter}
        onNeedsActionChange={setNeedsActionOnly}
        onMyQueueChange={setMyQueue}
        onSortChange={setSortBy}
        onSelectAllFiltered={() => void selectAllFiltered()}
      />

      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          bulkStatus={bulkStatus}
          bulkOwner={bulkOwner}
          handlers={handlerList}
          onBulkStatusChange={setBulkStatus}
          onBulkOwnerChange={setBulkOwner}
          onApplyBulk={() =>
            bulkPatchMutation.mutate(
              { ids: [...selectedIds], status: bulkStatus, owner: bulkOwner },
              { onSuccess: () => setSelectedIds(new Set()) },
            )
          }
          onBulkDelete={() => {
            if (!window.confirm(`למחוק ${selectedIds.size} אומנים שנבחרו?`)) return
            bulkDeleteMutation.mutate([...selectedIds], {
              onSuccess: () => setSelectedIds(new Set()),
            })
          }}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      <div className="app-body">
        <div className="content-wrap">
          {isLoading ? (
            <ArtistsSkeleton />
          ) : viewMode === 'cards' ? (
            <ArtistCardGrid
              artists={artists}
              handlers={handlerList}
              statusMeta={STATUS_META}
              selectedIds={selectedIds}
              isLoading={isLoading}
              onToggleSelect={toggleSelected}
              onUpdate={updateArtist}
              onOpen={openArtist}
            />
          ) : viewMode === 'kanban' ? (
            <ArtistKanban
              artists={artists}
              statusMeta={STATUS_META}
              onUpdate={updateArtist}
              onOpen={openArtist}
            />
          ) : (
            <ArtistsTable
              artists={artists}
              handlers={handlerList}
              statusMeta={STATUS_META}
              selectedIds={selectedIds}
              isLoading={isLoading}
              pageAllSelected={pageAllSelected}
              onToggleSelect={toggleSelected}
              onTogglePageSelection={togglePageSelection}
              onUpdate={updateArtist}
              onOpen={openArtist}
              onNotesDraft={(id, notes) => setNotesDrafts((current) => ({ ...current, [id]: notes }))}
            />
          )}
        </div>
      </div>

      {viewMode !== 'kanban' && (
        <footer className="table-footer">
          <span>
            {total.toLocaleString('he-IL')} תוצאות
            {total > 0 && ` · עמוד ${safePage} מתוך ${totalPages}`}
          </span>

          <div className="pagination">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              aria-label="פריטים בעמוד"
            >
              {(viewMode === 'cards' ? [48, 96, 144] : [50, 100, 200]).map((size) => (
                <option key={size} value={size}>
                  {size} בעמוד
                </option>
              ))}
            </select>
            <button
              className="btn btn-icon"
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(Math.max(1, safePage - 1))}
              aria-label="עמוד קודם"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="btn btn-icon"
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              aria-label="עמוד הבא"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </footer>
      )}

      <AnimatePresence>
      {formMode && (
        <ArtistFormModal
          mode={formMode}
          artist={formMode === 'edit' ? (editingArtist ?? undefined) : undefined}
          handlers={handlerList}
          onClose={() => {
            setFormMode(null)
            setEditingArtist(null)
          }}
          onSave={async (payload) => {
            if (formMode === 'create') {
              await createMutation.mutateAsync(payload)
            } else if (editingArtist) {
              await patchMutation.mutateAsync({
                id: editingArtist.id,
                patch: {
                  ...payload,
                  priority: priorityForStatus(payload.status ?? editingArtist.status),
                },
              })
            }
          }}
        />
      )}
      </AnimatePresence>

      <button type="button" className="sr-only" onClick={() => void refetch()} aria-hidden />
    </>
  )
}
