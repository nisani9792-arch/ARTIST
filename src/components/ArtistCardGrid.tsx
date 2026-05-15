import type { SignatureStatus } from '../data/artists'
import type { CrmArtist } from '../types'

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

export const ArtistCardGrid = ({
  artists,
  handlers,
  statusMeta,
  selectedIds,
  isLoading,
  onToggleSelect,
  onUpdate,
  onOpen,
}: ArtistCardGridProps) => {
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
            onClick={() => onOpen(artist)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen(artist)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="mini-card-top">
              <label
                className="mini-card-check"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(artist.id)}
                  onChange={() => onToggleSelect(artist.id)}
                  aria-label={`בחר ${displayName}`}
                />
              </label>
              <span className={`badge ${meta.tone}`}>{meta.label}</span>
            </div>

            <h3 className="mini-card-name" title={displayName}>
              {displayName}
            </h3>

            <label
              className="mini-card-field"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
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
}
