import { memo } from 'react'
import type { SignatureStatus } from '../data/types'
import type { CrmArtist } from '../types'
import { priorityForStatus } from '../lib/constants'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistCardGridProps = {
  artists: CrmArtist[]
  handlers: string[]
  statusMeta: StatusMeta
  selectedIds: Set<string>
  isLoading: boolean
  onToggleSelect: (id: string) => void
  onUpdate: (id: string, patch: Partial<CrmArtist>) => void
  onOpen: (artist: CrmArtist) => void
}

export const ArtistCardGrid = memo(function ArtistCardGrid({
  artists,
  handlers,
  statusMeta,
  selectedIds,
  isLoading,
  onToggleSelect,
  onUpdate,
  onOpen,
}: ArtistCardGridProps) {
  if (artists.length === 0) {
    return (
      <div className="empty-state">
        {isLoading ? 'טוען נתונים...' : 'לא נמצאו אומנים לפי הסינון'}
      </div>
    )
  }

  return (
    <div className="cards-grid">
      {artists.map((artist) => {
        const meta = statusMeta[artist.status]
        const displayName = artist.nameHe || artist.nameEn || 'ללא שם'

        return (
          <article
            key={artist.id}
            className={`mini-card ${meta.tone} ${selectedIds.has(artist.id) ? 'selected' : ''}`}
          >
            <div className="mini-card-top">
              <label className="mini-card-check">
                <input
                  type="checkbox"
                  checked={selectedIds.has(artist.id)}
                  onChange={() => onToggleSelect(artist.id)}
                  aria-label={`בחר ${displayName}`}
                />
              </label>
              <label className="mini-card-status">
                <select
                  className={`badge-select ${meta.tone}`}
                  value={artist.status}
                  aria-label={`סטטוס ${displayName}`}
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
              </label>
            </div>

            <button type="button" className="mini-card-open" onClick={() => onOpen(artist)}>
              <h3 className="mini-card-name" title={displayName}>
                {displayName}
              </h3>
            </button>

            <label className="mini-card-field">
              <span>גורם מטפל</span>
              <select
                value={artist.owner}
                onChange={(e) => onUpdate(artist.id, { owner: e.target.value })}
              >
                {handlers.map((handler) => (
                  <option key={handler} value={handler}>
                    {handler}
                  </option>
                ))}
              </select>
            </label>
          </article>
        )
      })}
    </div>
  )
})
