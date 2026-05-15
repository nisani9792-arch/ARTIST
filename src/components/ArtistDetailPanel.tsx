import { Pencil, Trash2, X } from 'lucide-react'
import { useEffect } from 'react'
import type { SignatureStatus } from '../data/artists'
import type { CrmArtist } from '../types'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistDetailPanelProps = {
  artist: CrmArtist
  statusMeta: StatusMeta
  onClose: () => void
  onEdit: (artist: CrmArtist) => void
  onDelete: (artist: CrmArtist) => void
}

export const ArtistDetailPanel = ({
  artist,
  statusMeta,
  onClose,
  onEdit,
  onDelete,
}: ArtistDetailPanelProps) => {
  const meta = statusMeta[artist.status]
  const displayName = artist.nameHe || artist.nameEn || 'ללא שם'
  const tagText = [...artist.genres, ...artist.tags].join(' · ')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <button className="panel-backdrop" type="button" aria-label="סגור" onClick={onClose} />
      <aside className="detail-panel" aria-label={`פרטי ${displayName}`}>
        <header className="detail-header">
          <div>
            <span className={`badge ${meta.tone}`}>{meta.label}</span>
            <h2>{displayName}</h2>
            {artist.nameEn && <p className="detail-en">{artist.nameEn}</p>}
          </div>
          <button className="btn btn-icon" type="button" onClick={onClose} aria-label="סגור">
            <X size={16} />
          </button>
        </header>

        <div className="detail-body">
          <div className="detail-field">
            <span>גורם מטפל</span>
            <p>{artist.owner}</p>
          </div>

          {artist.latestAlbum && (
            <div className="detail-field">
              <span>אלבום אחרון</span>
              <p>{artist.latestAlbum}</p>
            </div>
          )}

          {artist.source && (
            <div className="detail-field">
              <span>מקור</span>
              <p>{artist.source}</p>
            </div>
          )}

          {tagText && (
            <div className="detail-field">
              <span>ז׳אנר / תגיות</span>
              <p className="detail-tags">{tagText}</p>
            </div>
          )}

          {artist.notes && (
            <div className="detail-field">
              <span>הערות</span>
              <p>{artist.notes}</p>
            </div>
          )}

          {artist.updatedAt && (
            <div className="detail-field">
              <span>עודכן לאחרונה</span>
              <p className="detail-muted">
                {new Date(artist.updatedAt).toLocaleString('he-IL')}
              </p>
            </div>
          )}
        </div>

        <footer className="detail-footer">
          <button className="btn" type="button" onClick={() => onEdit(artist)}>
            <Pencil size={14} />
            ערוך
          </button>
          <button
            className="btn btn-danger"
            type="button"
            onClick={() => onDelete(artist)}
          >
            <Trash2 size={14} />
            מחק
          </button>
        </footer>
      </aside>
    </>
  )
}
