import { Download, LayoutGrid, PanelRight, Plus, Search, Table2 } from 'lucide-react'
import type { FilterOptions } from '../../../api/artists'
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

const VIEW_BTNS: { mode: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { mode: 'kanban', label: 'משפך', Icon: LayoutGrid },
  { mode: 'table', label: 'גיליון', Icon: Table2 },
  { mode: 'multi', label: 'מקביל', Icon: PanelRight },
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
  <header className="m3-workspace-header flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-3 py-2">
    <label className="m3-workspace-search flex min-w-[140px] max-w-[220px] flex-1 items-center gap-1.5 rounded-lg border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-lowest)] px-2 py-1">
      <Search size={14} className="shrink-0 text-[var(--m3-on-surface-variant)]" />
      <input
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] outline-none"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="חיפוש..."
      />
    </label>

    <div className="m3-chip-row flex flex-wrap items-center gap-1">
      {(
        [
          ['all', 'הכל'],
          ['unsigned', 'לא חתום'],
          ['stuck', 'תקוע'],
          ['signed', 'חתום'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={`m3-chip ${statusFilter === value ? 'm3-chip--active' : ''}`}
          onClick={() => onStatusFilterChange(value)}
        >
          {label}
        </button>
      ))}
    </div>

    <select
      className="m3-select-compact"
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
      className="m3-select-compact"
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
      className="m3-select-compact"
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
        className="m3-select-compact m3-select-compact--narrow"
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
        className="m3-select-compact m3-select-compact--narrow"
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
      className={`m3-chip ${needsActionOnly ? 'm3-chip--active' : ''}`}
      onClick={() => onNeedsActionChange(!needsActionOnly)}
    >
      דורש טיפול
    </button>
    <button
      type="button"
      className={`m3-chip ${myQueue ? 'm3-chip--active' : ''}`}
      onClick={() => onMyQueueChange(!myQueue)}
    >
      התור שלי
    </button>

    <select
      className="m3-select-compact"
      value={sortBy}
      onChange={(e) => onSortChange(e.target.value as SortOption)}
      aria-label="מיון"
    >
      <option value="smart">מיון חכם</option>
      <option value="name">שם</option>
      <option value="status">סטטוס</option>
      <option value="bucket">קטגוריה</option>
    </select>

    <div className="m3-view-toggle flex items-center gap-0.5 rounded-lg border border-[var(--m3-outline-variant)] p-0.5">
      {VIEW_BTNS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          className={`m3-view-btn ${viewMode === mode ? 'm3-view-btn--active' : ''}`}
          onClick={() => onViewModeChange(mode)}
          title={label}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>

    <span className="m3-workspace-count text-[11px] font-semibold tabular-nums text-[var(--m3-on-surface-variant)]">
      {total.toLocaleString('he-IL')}
      {selectedCount > 0 ? ` · ${selectedCount} נבחרו` : ''}
    </span>

    <div className="mr-auto flex items-center gap-1">
      <button type="button" className="m3-btn-ghost" onClick={onSelectAllFiltered}>
        בחר הכל
      </button>
      <button type="button" className="m3-btn-ghost" onClick={onExportFiltered}>
        <Download size={14} />
      </button>
      {onNewArtist && (
        <button type="button" className="m3-btn-primary" onClick={onNewArtist}>
          <Plus size={14} />
        </button>
      )}
    </div>
  </header>
)
