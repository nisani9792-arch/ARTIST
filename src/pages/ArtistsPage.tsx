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
import { ArtistDetailPanel } from '../components/ArtistDetailPanel'
import { ArtistVersionHistory } from '../components/ArtistVersionHistory'
import { ArtistStatusFunnel } from '../features/artists/funnel/ArtistStatusFunnel'
import { ArtistSegmentBoard } from '../features/artists/ArtistSegmentBoard'
import { WorkspaceSettingsPanel } from '../components/WorkspaceSettingsPanel'
import { ArtistsSkeleton } from '../features/artists/ArtistsSkeleton'
import { ArtistsTable } from '../features/artists/ArtistsTable'
import { ArtistsToolbar } from '../features/artists/ArtistsToolbar'
import { ArtistsViewSwitcher } from '../features/artists/ArtistsViewSwitcher'
import { BulkActionsBar } from '../features/artists/BulkActionsBar'
import { useArtistFilters } from '../features/artists/useArtistFilters'
import { useArtistMutations } from '../features/artists/useArtistMutations'
import { useArtistVersions, useArtistsPage } from '../features/artists/useArtistsQuery'
import { ArtistsMultiView } from '../features/artists/ArtistsMultiView'
import { HANDLERS, SIGNED_DEFAULT_HANDLER, STATUS_META, priorityForStatus } from '../lib/constants'
import type { ArtistBucket, SignatureStatus } from '../data/types'
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
    bucketFilter,
    audienceFilter,
    needsActionOnly,
    myQueue,
    sortBy,
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
  } = filters

  const queryFilters = useMemo(
    () =>
      viewMode === 'kanban' || viewMode === 'segments' || viewMode === 'multi'
        ? {
            ...apiFilters,
            page: 1,
            limit: Math.max(
              limit,
              viewMode === 'segments' ? 500 : viewMode === 'multi' ? 300 : 200,
            ),
            sort: viewMode === 'segments' ? ('bucket' as const) : apiFilters.sort,
            bucket: viewMode === 'segments' ? 'all' : apiFilters.bucket,
          }
        : apiFilters,
    [apiFilters, limit, viewMode],
  )

  const { data, isLoading, isFetching, error, refetch } = useArtistsPage(queryFilters)
  const {
    patchMutation,
    createMutation,
    deleteMutation,
    bulkPatchMutation,
    bulkDeleteMutation,
    undoMutation,
    revertMutation,
  } = useArtistMutations(operatorName)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<SignatureStatus>('unsigned')
  const [bulkOwner, setBulkOwner] = useState(operatorName ?? 'שימון')
  const [bulkBucket, setBulkBucket] = useState<ArtistBucket | ''>('')
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingArtist, setEditingArtist] = useState<CrmArtist | null>(null)
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({})
  const [detailArtist, setDetailArtist] = useState<CrmArtist | null>(null)
  const [multiActiveId, setMultiActiveId] = useState<string | null>(null)
  const detailId = viewMode === 'multi' ? multiActiveId : detailArtist?.id
  const { data: detailVersions = [], refetch: refetchDetailVersions } = useArtistVersions(
    detailId ?? undefined,
    Boolean(detailId),
  )

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
    if (!detailArtist) return
    const fresh = artists.find((a) => a.id === detailArtist.id)
    if (fresh) setDetailArtist(fresh)
  }, [artists, detailArtist?.id])

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

  const exportByFilters = useCallback(
    async (exportTotal = total) => {
      const exportLimit = Math.min(exportTotal || 5000, 5000)
      if (exportLimit === 0) return
      const payload = await fetchArtistsPage({ ...apiFilters, page: 1, limit: exportLimit })
      exportArtistsCsv(payload.artists, `artists-filtered-${exportLimit}.csv`)
    },
    [apiFilters, total],
  )

  const runExport = useCallback(async () => {
    await exportByFilters()
  }, [exportByFilters])

  const exportSelected = useCallback(() => {
    const selected = artists.filter((a) => selectedIds.has(a.id))
    if (selected.length === 0) return
    exportArtistsCsv(selected, `artists-selected-${selected.length}.csv`)
  }, [artists, selectedIds])

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
  const openArtist = (artist: CrmArtist) => {
    if (viewMode === 'kanban') setDetailArtist(artist)
    else if (viewMode === 'multi') setMultiActiveId(artist.id)
    else navigate(`/artists/${artist.id}`)
  }

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
        <WorkspaceSettingsPanel
          operatorName={operatorName}
          onSettingsChange={() => void refetch()}
          onViewModeChange={setViewMode}
        />
      </div>

      <ArtistsViewSwitcher viewMode={viewMode} onChange={setViewMode} />

      <ArtistsToolbar
        query={query}
        statusFilter={statusFilter}
        ownerFilter={ownerFilter}
        tagFilter={tagFilter}
        genreFilter={genreFilter}
        bucketFilter={bucketFilter}
        audienceFilter={audienceFilter}
        filteredTotal={total}
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
        onBucketFilterChange={setBucketFilter}
        onAudienceFilterChange={setAudienceFilter}
        onExportFiltered={() => void exportByFilters()}
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
          bulkBucket={bulkBucket}
          handlers={handlerList}
          onBulkStatusChange={setBulkStatus}
          onBulkOwnerChange={setBulkOwner}
          onBulkBucketChange={setBulkBucket}
          onApplyBulk={() =>
            bulkPatchMutation.mutate(
              {
                ids: [...selectedIds],
                status: bulkStatus,
                owner: bulkOwner,
                bucket: bulkBucket || undefined,
              },
              { onSuccess: () => setSelectedIds(new Set()) },
            )
          }
          onBulkDelete={() => {
            if (!window.confirm(`למחוק ${selectedIds.size} אומנים שנבחרו?`)) return
            bulkDeleteMutation.mutate([...selectedIds], {
              onSuccess: () => setSelectedIds(new Set()),
            })
          }}
          onExportSelected={exportSelected}
          onAssignSignedHandler={() => {
            bulkPatchMutation.mutate(
              {
                ids: [...selectedIds],
                status: 'signed',
                owner: SIGNED_DEFAULT_HANDLER,
              },
              { onSuccess: () => setSelectedIds(new Set()) },
            )
          }}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      <div className="app-body">
        <div className="content-wrap">
          {isLoading ? (
            <ArtistsSkeleton />
          ) : viewMode === 'segments' ? (
            <ArtistSegmentBoard
              artists={artists}
              handlers={handlerList}
              statusMeta={STATUS_META}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelected}
              onUpdate={updateArtist}
              onOpen={openArtist}
            />
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
          ) : viewMode === 'multi' ? (
            <ArtistsMultiView
              artists={artists}
              activeId={multiActiveId}
              onActiveChange={setMultiActiveId}
              statusMeta={STATUS_META}
              selectedIds={selectedIds}
              detailVersions={detailVersions}
              versionsLoading={false}
              undoPending={undoMutation.isPending}
              revertPending={revertMutation.isPending}
              onToggleSelect={toggleSelected}
              onUpdate={updateArtist}
              onUndoLast={(id) => {
                undoMutation.mutate(id, {
                  onSuccess: () => void refetchDetailVersions(),
                })
              }}
              onRevert={(id, versionId) => {
                revertMutation.mutate(
                  { id, versionId },
                  { onSuccess: () => void refetchDetailVersions() },
                )
              }}
              onEdit={(artist) => {
                setEditingArtist(artist)
                setFormMode('edit')
              }}
              onDelete={(artist) => {
                if (!window.confirm(`למחוק את "${artist.nameHe || artist.nameEn}"?`)) return
                deleteMutation.mutate(artist.id)
              }}
            />
          ) : viewMode === 'kanban' ? (
            <ArtistStatusFunnel
              artists={artists}
              statusMeta={STATUS_META}
              stats={data?.stats}
              onUpdate={updateArtist}
              onOpenDetail={openArtist}
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

      {viewMode !== 'kanban' && viewMode !== 'segments' && viewMode !== 'multi' && (
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
        {detailArtist && viewMode === 'kanban' && (
          <ArtistDetailPanel
            artist={detailArtist}
            statusMeta={STATUS_META}
            onClose={() => setDetailArtist(null)}
            onEdit={(artist) => {
              setDetailArtist(null)
              setEditingArtist(artist)
              setFormMode('edit')
            }}
            onDelete={() => {
              if (
                !window.confirm(
                  `למחוק את "${detailArtist.nameHe || detailArtist.nameEn}"?`,
                )
              ) {
                return
              }
              deleteMutation.mutate(detailArtist.id, {
                onSuccess: () => setDetailArtist(null),
              })
            }}
            onUpdate={(artistId, patch) => {
              updateArtist(artistId, patch)
              void refetchDetailVersions()
            }}
            versionHistory={
              <ArtistVersionHistory
                versions={detailVersions}
                undoPending={undoMutation.isPending}
                revertPending={revertMutation.isPending}
                onUndoLast={() => {
                  if (!detailArtist) return
                  undoMutation.mutate(detailArtist.id, {
                    onSuccess: (updated) => {
                      setDetailArtist(updated)
                      void refetchDetailVersions()
                    },
                  })
                }}
                onRevert={(versionId) => {
                  if (!detailArtist) return
                  revertMutation.mutate(
                    { id: detailArtist.id, versionId },
                    {
                      onSuccess: (updated) => {
                        setDetailArtist(updated)
                        void refetchDetailVersions()
                      },
                    },
                  )
                }}
              />
            }
          />
        )}
      </AnimatePresence>

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
