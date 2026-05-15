import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { SignatureStatus } from '../data/artists'
import type { CrmArtist } from '../types'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistDetailPanelProps = {
  artist: CrmArtist
  handlers: string[]
  statusMeta: StatusMeta
  onClose: () => void
  onUpdate: (id: string, patch: Partial<CrmArtist>) => void
}

const priorityForStatus = (status: SignatureStatus) => {
  if (status === 'signed') return 'שימור קשר'
  if (status === 'stuck') return 'פתיחת חסם'
  return 'ליצירת קשר'
}

export const ArtistDetailPanel = ({
  artist,
  handlers,
  statusMeta,
  onClose,
  onUpdate,
}: ArtistDetailPanelProps) => {
  const meta = statusMeta[artist.status]
  const displayName = artist.nameHe || artist.nameEn || 'ללא שם'
  const tagText = [...artist.genres, ...artist.tags].join(' · ')
  const [notes, setNotes] = useState(artist.notes)

  useEffect(() => {
    setNotes(artist.notes)
  }, [artist.id, artist.notes])

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
          <label className="detail-field">
            <span>סטטוס חתימה</span>
            <select
              value={artist.status}
              onChange={(e) => {
                const status = e.target.value as SignatureStatus
                onUpdate(artist.id, { status, priority: priorityForStatus(status) })
              }}
            >
              <option value="signed">חתום</option>
              <option value="unsigned">לא חתום</option>
              <option value="stuck">תקוע</option>
            </select>
          </label>

          <label className="detail-field">
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

          {artist.latestAlbum && (
            <div className="detail-field">
              <span>אלבום אחרון</span>
              <p>{artist.latestAlbum}</p>
            </div>
          )}

          {tagText && (
            <div className="detail-field">
              <span>ז׳אנר / תגיות</span>
              <p className="detail-tags">{tagText}</p>
            </div>
          )}

          <label className="detail-field">
            <span>הערות</span>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== artist.notes) onUpdate(artist.id, { notes })
              }}
              placeholder="הערת טיפול..."
            />
          </label>
        </div>
      </aside>
    </>
  )
}
