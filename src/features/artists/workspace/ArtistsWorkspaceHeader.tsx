import { Download, LayoutGrid, PanelRight, Plus, Table2 } from 'lucide-react'
import type { FilterOptions } from '../../../api/artists'
import { M3ExpressiveToolbar } from '../../../components/m3'
import { BUCKET_META } from '../../../lib/artistBuckets'
import type { AudienceFilter, BucketFilter, SortOption, StatusFilter, ViewMode } from '../../../types'

type ArtistsWorkspaceHeaderProps = {
  query: string
  statusFilter: StatusFilter
  ownerFilter: string
  tagFilter: string
  genreFilter: string
  bucketFilter: BucketFilter
  audienceFilter: AudienceFilter
  needsActionOnly: boolean
  myQueue: boolean
  sortBy: SortOption
  viewMode: ViewMode
  total: number
  selectedCount: number
  isFetching?: boolean
  filterOptions?: FilterOptions
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onOwnerFilterChange: (value: string) => void
  onTagFilterChange: (value: string) => void
  onGenreFilterChange: (value: string) => void
  onBucketFilterChange: (value: BucketFilter) => void
  onAudienceFilterChange: (value: AudienceFilter) => void
  onNeedsActionChange: (value: boolean) => void
  onMyQueueChange: (value: boolean) => void
  onSortChange: (value: SortOption) => void
  onViewModeChange: (mode: ViewMode) => void
  onExportFiltered: () => void
  onSelectAllFiltered: () => void
  onNewArtist?: () => void
}

const STATUS_MORPH = [
  { id: 'all', label: 'הכל' },
  { id: 'unsigned', label: 'לא חתום' },
  { id: 'stuck', label: 'תקוע' },
  { id: 'signed', label: 'חתום' },
] as const

const VIEW_MORPH = [
  { mode: 'kanban' as ViewMode, label: 'משפך', Icon: LayoutGrid },
  { mode: 'table' as ViewMode, label: 'גיליון', Icon: Table2 },
  { mode: 'multi' as ViewMode, label: 'מקביל', Icon: PanelRight },
]

export const ArtistsWorkspaceHeader = ({
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
  viewMode,
  total,
  selectedCount,
  isFetching = false,
  filterOptions,
  onQueryChange,
  onStatusFilterChange,
  onOwnerFilterChange,
  onTagFilterChange,
  onGenreFilterChange,
  onBucketFilterChange,
  onAudienceFilterChange,
  onNeedsActionChange,
  onMyQueueChange,
  onSortChange,
  onViewModeChange,
  onExportFiltered,
  onSelectAllFiltered,
  onNewArtist,
}: ArtistsWorkspaceHeaderProps) => (
  <M3ExpressiveToolbar
    searchValue={query}
    onSearchChange={onQueryChange}
    morphItems={STATUS_MORPH.map(({ id, label }) => ({ id, label }))}
    morphValue={statusFilter}
    onMorphChange={(id) => onStatusFilterChange(id as StatusFilter)}
    morphAriaLabel="סטטוס חתימה"
    viewItems={VIEW_MORPH.map(({ mode, label, Icon }) => ({
      id: mode,
      label,
      icon: <Icon size={14} />,
      title: label,
    }))}
    viewValue={viewMode}
    onViewChange={(id) => onViewModeChange(id as ViewMode)}
    count={total}
    selectedCount={selectedCount}
    syncState={isFetching ? 'active' : 'idle'}
    primaryAction={
      onNewArtist
        ? {
            label: 'חדש',
            icon: <Plus size={14} />,
            onClick: onNewArtist,
            menu: [
              { id: 'select-all', label: 'בחר הכל', onSelect: onSelectAllFiltered },
              { id: 'export', label: 'ייצוא מסונן', icon: <Download size={14} />, onSelect: onExportFiltered },
            ],
          }
        : undefined
    }
    trailing={
      !onNewArtist ? (
        <>
          <button type="button" className="m3-ex-btn-ghost" onClick={onSelectAllFiltered}>
            בחר הכל
          </button>
          <button type="button" className="m3-ex-btn-ghost" onClick={onExportFiltered} aria-label="ייצוא">
            <Download size={14} />
          </button>
        </>
      ) : undefined
    }
  >
    <select
      className="m3-ex-select"
      value={ownerFilter}
      onChange={(e) => onOwnerFilterChange(e.target.value)}
      aria-label="מטפל"
    >
      <option value="all">כל המטפלים</option>
      {(filterOptions?.owners ?? []).map((owner) => (
        <option key={owner} value={owner}>
          {owner}
        </option>
      ))}
    </select>

    <select
      className="m3-ex-select"
      value={bucketFilter}
      onChange={(e) => onBucketFilterChange(e.target.value as BucketFilter)}
      aria-label="קטגוריה"
    >
      <option value="all">כל הקטגוריות</option>
      <option value="popular">{BUCKET_META.popular.shortLabel}</option>
      <option value="main">{BUCKET_META.main.shortLabel}</option>
      <option value="outside_genre">{BUCKET_META.outside_genre.shortLabel}</option>
    </select>

    <select
      className="m3-ex-select"
      value={audienceFilter}
      onChange={(e) => onAudienceFilterChange(e.target.value as AudienceFilter)}
      aria-label="קהל"
    >
      <option value="all">קהל</option>
      <option value="religious">דתי</option>
      <option value="secular">חילוני</option>
      <option value="mixed">מעורב</option>
    </select>

    {(filterOptions?.tags?.length ?? 0) > 0 && (
      <select
        className="m3-ex-select m3-ex-select--narrow"
        value={tagFilter}
        onChange={(e) => onTagFilterChange(e.target.value)}
        aria-label="תגית"
      >
        <option value="all">תגית</option>
        {filterOptions!.tags.map(([tag]) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
    )}

    {(filterOptions?.genres?.length ?? 0) > 0 && (
      <select
        className="m3-ex-select m3-ex-select--narrow"
        value={genreFilter}
        onChange={(e) => onGenreFilterChange(e.target.value)}
        aria-label="ז'אנר"
      >
        <option value="all">ז&apos;אנר</option>
        {filterOptions!.genres.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>
    )}

    <button
      type="button"
      className={`m3-ex-btn-ghost ${needsActionOnly ? 'ring-1 ring-[var(--jusic-color-primary)]' : ''}`}
      onClick={() => onNeedsActionChange(!needsActionOnly)}
    >
      דורש טיפול
    </button>
    <button
      type="button"
      className={`m3-ex-btn-ghost ${myQueue ? 'ring-1 ring-[var(--jusic-color-primary)]' : ''}`}
      onClick={() => onMyQueueChange(!myQueue)}
    >
      התור שלי
    </button>

    <select
      className="m3-ex-select"
      value={sortBy}
      onChange={(e) => onSortChange(e.target.value as SortOption)}
      aria-label="מיון"
    >
      <option value="smart">מיון חכם</option>
      <option value="name">שם</option>
      <option value="status">סטטוס</option>
      <option value="bucket">קטגוריה</option>
    </select>
  </M3ExpressiveToolbar>
)
