import type { SignatureStatus } from '../../data/types'
import type { CrmArtist } from '../../types'
import { priorityForStatus } from '../../lib/constants'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistsTableProps = {
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

export const ArtistsTable = ({
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
}: ArtistsTableProps) => {
  return (
    <div className="table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th className="col-check">
              <input
                type="checkbox"
                checked={pageAllSelected}
                onChange={onTogglePageSelection}
                aria-label="בחר עמוד"
              />
            </th>
            <th className="col-status">סטטוס</th>
            <th className="col-name">שם</th>
            <th className="col-en">אנגלית</th>
            <th className="col-tags">ז׳אנר / תגיות</th>
            <th className="col-album">אלבום</th>
            <th className="col-owner">מטפל</th>
            <th className="col-status-select">עדכון</th>
            <th className="col-notes">הערות</th>
          </tr>
        </thead>
        <tbody>
          {artists.length === 0 ? (
            <tr>
              <td colSpan={9}>
                <div className="empty-state">{isLoading ? 'טוען נתונים...' : 'לא נמצאו אומנים'}</div>
              </td>
            </tr>
          ) : (
            artists.map((artist) => {
              const meta = statusMeta[artist.status]
              const tagText = [...artist.genres, ...artist.tags].slice(0, 4).join(' · ')

              return (
                <tr
                  key={artist.id}
                  className={selectedIds.has(artist.id) ? 'selected' : undefined}
                  onClick={() => onOpen(artist)}
                >
                  <td className="col-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(artist.id)}
                      onChange={() => onToggleSelect(artist.id)}
                    />
                  </td>
                  <td className="col-status">
                    <span className={`badge ${meta.tone}`}>{meta.label}</span>
                  </td>
                  <td className="col-name">
                    <span className="name-cell">{artist.nameHe || artist.nameEn}</span>
                  </td>
                  <td className="col-en">
                    <span className="tag-line">{artist.nameEn}</span>
                  </td>
                  <td className="col-tags">
                    <span className="tag-line">{tagText || '—'}</span>
                  </td>
                  <td className="col-album">
                    <span className="tag-line">{artist.latestAlbum || '—'}</span>
                  </td>
                  <td className="col-owner" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="cell-select"
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
                  <td className="col-status-select" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="cell-select"
                      value={artist.status}
                      onChange={(e) => {
                        const status = e.target.value as SignatureStatus
                        onUpdate(artist.id, {
                          status,
                          priority: priorityForStatus(status),
                        })
                      }}
                    >
                      <option value="signed">חתום</option>
                      <option value="unsigned">לא חתום</option>
                      <option value="stuck">תקוע</option>
                    </select>
                  </td>
                  <td className="col-notes" onClick={(e) => e.stopPropagation()}>
                    <input
                      className="cell-notes"
                      value={artist.notes}
                      onChange={(e) => onNotesDraft(artist.id, e.target.value)}
                      onBlur={(e) => onUpdate(artist.id, { notes: e.target.value })}
                      placeholder="הערה"
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
}
