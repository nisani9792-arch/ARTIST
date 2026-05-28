import { AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { ArtistBucketSelect } from '../features/artists/ArtistBucketSelect'
import type { SignatureStatus } from '../data/types'
import type { CrmArtist } from '../types'
import { BUCKET_META } from '../lib/artistBuckets'
import { MotionBackdrop } from './motion/MotionBackdrop'
import { MotionPanel } from './motion/MotionPanel'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistDetailPanelProps = {
  artist: CrmArtist
  statusMeta: StatusMeta
  onClose: () => void
  onEdit: (artist: CrmArtist) => void
  onDelete: (artist: CrmArtist) => void
  onUpdate?: (id: string, patch: Partial<CrmArtist>) => void
  versionHistory?: ReactNode
  variant?: 'modal' | 'inline'
}

export const ArtistDetailPanel = ({
  artist,
  statusMeta,
  onClose,
  onEdit,
  onDelete,
  onUpdate,
  versionHistory,
  variant = 'modal',
}: ArtistDetailPanelProps) => {
  const meta = statusMeta[artist.status]
  const displayName = artist.nameHe || artist.nameEn || 'ללא שם'
  const tagText = [...artist.genres, ...artist.tags].join(' · ')

  useEffect(() => {
    if (variant !== 'modal') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, variant])

  const panelContent = (
    <>
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
          {onUpdate ? (
            <ArtistBucketSelect
              value={artist.bucket ?? 'main'}
              onChange={(bucket) => onUpdate(artist.id, { bucket })}
            />
          ) : (
            <div className="detail-field">
              <span>קטגוריה</span>
              <p>{BUCKET_META[artist.bucket ?? 'main'].label}</p>
            </div>
          )}

          <div className="detail-field">
            <span>גורם מטפל</span>
            <p>{artist.owner}</p>
          </div>

          {artist.audienceType && (
            <div className="detail-field">
              <span>קהל / סיווג AI</span>
              <p>
                {artist.audienceType === 'secular'
                  ? 'חילוני / מיינסטרים'
                  : artist.audienceType === 'religious'
                    ? 'דתי / חסידי'
                    : 'מעורב'}
              </p>
            </div>
          )}

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
                {artist.updatedBy ? ` · ${artist.updatedBy}` : ''}
              </p>
            </div>
          )}

          {versionHistory}
        </div>

        <footer className="detail-footer">
          <button className="btn" type="button" onClick={() => onEdit(artist)}>
            <Pencil size={14} />
            ערוך
          </button>
          <button className="btn btn-danger" type="button" onClick={() => onDelete(artist)}>
            <Trash2 size={14} />
            מחק
          </button>
        </footer>
    </>
  )

  if (variant === 'inline') {
    return (
      <section className="detail-inline-panel" aria-label={`פרטי ${displayName}`}>
        {panelContent}
      </section>
    )
  }

  return (
    <AnimatePresence>
      <MotionBackdrop key="detail-backdrop" onClick={onClose} />
      <MotionPanel key="detail-panel" aria-label={`פרטי ${displayName}`}>
        {panelContent}
      </MotionPanel>
    </AnimatePresence>
  )
}
