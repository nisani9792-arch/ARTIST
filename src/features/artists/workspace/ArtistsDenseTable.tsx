import type { SignatureStatus, ArtistBucket } from '../../../data/types'
import type { CrmArtist } from '../../../types'
import { ARTIST_BUCKETS, BUCKET_META } from '../../../lib/artistBuckets'
import { priorityForStatus } from '../../../lib/constants'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistsDenseTableProps = {
  artists: CrmArtist[]
  handlers: string[]
  statusMeta: StatusMeta
  selectedIds: Set<string>
  isLoading: boolean
  pageAllSelected: boolean
  onToggleSelect: (id: string) => void
  onTogglePageSelection: () => void
  onUpdate: (id: string, patch: Partial<CrmArtist>) => void
  onOpen: (artist: CrmArtist) => void
  onNotesDraft: (id: string, notes: string) => void
}

export const ArtistsDenseTable = ({
  artists,
  handlers,
  statusMeta,
  selectedIds,
  isLoading,
  pageAllSelected,
  onToggleSelect,
  onTogglePageSelection,
  onUpdate,
  onOpen,
  onNotesDraft,
}: ArtistsDenseTableProps) => (
  <div className="m3-dense-table-wrap min-h-0 flex-1 overflow-auto">
    <table className="m3-dense-table w-full border-collapse text-[12px]">
      <thead className="sticky top-0 z-10 bg-[var(--m3-surface-container)]">
        <tr>
          <th className="m3-dense-th w-8">
            <input
              type="checkbox"
              checked={pageAllSelected}
              onChange={onTogglePageSelection}
              aria-label="בחר עמוד"
            />
          </th>
          <th className="m3-dense-th w-[72px]">סטטוס</th>
          <th className="m3-dense-th min-w-[120px]">שם</th>
          <th className="m3-dense-th w-[88px]">קטגוריה</th>
          <th className="m3-dense-th w-[100px]">מטפל</th>
          <th className="m3-dense-th">תגיות</th>
          <th className="m3-dense-th min-w-[140px]">הערות</th>
        </tr>
      </thead>
      <tbody>
        {artists.length === 0 ? (
          <tr>
            <td colSpan={7} className="m3-dense-empty">
              {isLoading ? 'טוען...' : 'אין תוצאות'}
            </td>
          </tr>
        ) : (
          artists.map((artist) => {
            const tags = [...artist.genres, ...artist.tags].slice(0, 3).join(' · ')
            const selected = selectedIds.has(artist.id)

            return (
              <tr
                key={artist.id}
                className={`m3-dense-row ${selected ? 'm3-dense-row--selected' : ''}`}
                onDoubleClick={() => onOpen(artist)}
              >
                <td className="m3-dense-td" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(artist.id)}
                  />
                </td>
                <td className="m3-dense-td" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="m3-dense-select"
                    value={artist.status}
                    onChange={(e) => {
                      const status = e.target.value as SignatureStatus
                      onUpdate(artist.id, {
                        status,
                        priority: priorityForStatus(status),
                      })
                    }}
                  >
                    <option value="unsigned">{statusMeta.unsigned.label}</option>
                    <option value="in_process">{statusMeta.in_process.label}</option>
                    <option value="signed">{statusMeta.signed.label}</option>
                  </select>
                </td>
                <td className="m3-dense-td m3-dense-name" title={artist.nameHe || artist.nameEn}>
                  {artist.nameHe || artist.nameEn}
                </td>
                <td className="m3-dense-td" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="m3-dense-select"
                    value={artist.bucket ?? 'main'}
                    onChange={(e) =>
                      onUpdate(artist.id, { bucket: e.target.value as ArtistBucket })
                    }
                  >
                    {ARTIST_BUCKETS.map((bucket) => (
                      <option key={bucket} value={bucket}>
                        {BUCKET_META[bucket].shortLabel}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="m3-dense-td" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="m3-dense-select"
                    value={artist.owner}
                    onChange={(e) => onUpdate(artist.id, { owner: e.target.value })}
                  >
                    {handlers.map((handler) => (
                      <option key={handler} value={handler}>
                        {handler}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="m3-dense-td m3-dense-muted truncate max-w-[200px]" title={tags}>
                  {tags || '—'}
                </td>
                <td className="m3-dense-td" onClick={(e) => e.stopPropagation()}>
                  <input
                    className="m3-dense-input"
                    value={artist.notes}
                    onChange={(e) => onNotesDraft(artist.id, e.target.value)}
                    onBlur={(e) => onUpdate(artist.id, { notes: e.target.value })}
                    placeholder="—"
                  />
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  </div>
)
