import { Search } from 'lucide-react'
import type { FilterOptions } from '../../api/artists'
import { BUCKET_META } from '../../lib/artistBuckets'
import { Download } from 'lucide-react'
import type { AudienceFilter, BucketFilter, SortOption, StatusFilter } from '../../types'

type ArtistsToolbarProps = {
  query: string
  statusFilter: StatusFilter
  ownerFilter: string
  tagFilter: string
  genreFilter: string
  bucketFilter: BucketFilter
  audienceFilter: AudienceFilter
  needsActionOnly: boolean
  filteredTotal: number
  myQueue: boolean
  sortBy: SortOption
  filterOptions?: FilterOptions
  filtersOpen: boolean
  searchOpen: boolean
  selectedCount: number
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onOwnerFilterChange: (value: string) => void
  onTagFilterChange: (value: string) => void
  onGenreFilterChange: (value: string) => void
  onBucketFilterChange: (value: BucketFilter) => void
  onAudienceFilterChange: (value: AudienceFilter) => void
  onExportFiltered: () => void
  onNeedsActionChange: (value: boolean) => void
  onMyQueueChange: (value: boolean) => void
  onSortChange: (value: SortOption) => void
  onSelectAllFiltered: () => void
}

export const ArtistsToolbar = ({
  query,
  statusFilter,
  ownerFilter,
  tagFilter,
  genreFilter,
  bucketFilter,
  audienceFilter,
  needsActionOnly,
  filteredTotal,
  myQueue,
  sortBy,
  filterOptions,
  filtersOpen,
  searchOpen,
  selectedCount,
  onQueryChange,
  onStatusFilterChange,
  onOwnerFilterChange,
  onTagFilterChange,
  onGenreFilterChange,
  onBucketFilterChange,
  onAudienceFilterChange,
  onExportFiltered,
  onNeedsActionChange,
  onMyQueueChange,
  onSortChange,
  onSelectAllFiltered,
}: ArtistsToolbarProps) => {
  const showSearch = searchOpen || query.length > 0

  return (
    <div className={`toolbar ${filtersOpen ? 'toolbar--open' : ''}`}>
      <label className={`search-field ${showSearch ? 'search-field--visible' : 'search-field--mobile-hidden'}`}>
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="חיפוש שם, תגית, ז׳אנר..."
        />
      </label>

      <div className="toolbar-panel">
        <div className="quick-filters bucket-filters" role="group" aria-label="קטגוריות">
          {(
            [
              ['all', 'כל הקטגוריות'],
              ['popular', BUCKET_META.popular.shortLabel],
              ['main', BUCKET_META.main.shortLabel],
              ['outside_genre', BUCKET_META.outside_genre.shortLabel],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip-filter bucket-chip ${bucketFilter === value ? 'active' : ''}`}
              onClick={() => onBucketFilterChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="quick-filters" role="group" aria-label="קהל (AI)">
          {(
            [
              ['all', 'כל הקהל'],
              ['religious', 'דתי'],
              ['secular', 'חילוני'],
              ['mixed', 'מעורב'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip-filter audience-chip ${audienceFilter === value ? 'active' : ''}`}
              onClick={() => onAudienceFilterChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="quick-filters" role="group" aria-label="סינון מהיר">
          {(
            [
              ['all', 'הכל'],
              ['signed', 'חתום'],
              ['unsigned', 'לא חתום'],
              ['stuck', 'תקוע'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip-filter ${statusFilter === value ? 'active' : ''}`}
              onClick={() => onStatusFilterChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <select value={ownerFilter} onChange={(e) => onOwnerFilterChange(e.target.value)}>
          <option value="all">כל המטפלים</option>
          {(filterOptions?.owners ?? []).map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>

        <select value={tagFilter} onChange={(e) => onTagFilterChange(e.target.value)}>
          <option value="all">כל התגיות</option>
          {(filterOptions?.tags ?? []).map(([tag, count]) => (
            <option key={tag} value={tag}>
              {tag} ({count})
            </option>
          ))}
        </select>

        <select value={genreFilter} onChange={(e) => onGenreFilterChange(e.target.value)}>
          <option value="all">כל הז׳אנרים</option>
          {(filterOptions?.genres ?? []).map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortOption)}>
          <option value="smart">מיון חכם</option>
          <option value="name">שם</option>
          <option value="status">סטטוס</option>
          <option value="tags">תגיות</option>
          <option value="bucket">קטגוריה</option>
        </select>

        <label className="toolbar-check">
          <input
            type="checkbox"
            checked={needsActionOnly}
            onChange={(e) => onNeedsActionChange(e.target.checked)}
          />
          דורש פעולה
        </label>

        <label className="toolbar-check">
          <input type="checkbox" checked={myQueue} onChange={(e) => onMyQueueChange(e.target.checked)} />
          העבודה שלי
        </label>

        <button className="btn btn-ghost" type="button" onClick={onSelectAllFiltered}>
          בחר את כל התוצאות ({filteredTotal.toLocaleString('he-IL')})
        </button>

        <button className="btn btn-ghost" type="button" onClick={onExportFiltered}>
          <Download size={14} />
          הורד רשימה מסוננת
        </button>
      </div>

      {selectedCount > 0 && <span className="toolbar-divider" />}
    </div>
  )
}
