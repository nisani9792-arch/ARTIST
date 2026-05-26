import { History, Undo2 } from 'lucide-react'
import { useState } from 'react'
import type { ArtistVersion } from '../api/artists'
import { STATUS_META } from '../lib/constants'

type ArtistVersionHistoryProps = {
  versions: ArtistVersion[]
  loading?: boolean
  undoPending?: boolean
  revertPending?: boolean
  onUndoLast: () => void
  onRevert: (versionId: number) => void
}

export const ArtistVersionHistory = ({
  versions,
  loading,
  undoPending,
  revertPending,
  onUndoLast,
  onRevert,
}: ArtistVersionHistoryProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="artist-versions">
      <div className="artist-versions-actions">
        <button
          type="button"
          className="btn btn-sm"
          disabled={undoPending || versions.length === 0}
          onClick={onUndoLast}
          title="בטל את השינוי האחרון (כמו Ctrl+Z)"
        >
          <Undo2 size={14} />
          בטל שינוי אחרון
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <History size={14} />
          היסטוריית גרסאות ({versions.length})
        </button>
      </div>

      {open && (
        <div className="artist-versions-list">
          {loading ? (
            <p className="detail-muted">טוען גרסאות...</p>
          ) : versions.length === 0 ? (
            <p className="detail-muted">אין גרסאות שמורות עדיין — יישמרו אחרי העריכה הבאה</p>
          ) : (
            <ul>
              {versions.map((version) => {
                const snap = version.snapshot
                const label = snap.nameHe || snap.nameEn || 'ללא שם'
                const status = STATUS_META[snap.status]?.label ?? snap.status
                return (
                  <li key={version.id}>
                    <div>
                      <strong>{label}</strong>
                      <span className="detail-muted">
                        {new Date(version.createdAt).toLocaleString('he-IL')}
                        {version.changedBy ? ` · ${version.changedBy}` : ''}
                      </span>
                      <span className="detail-muted">
                        {status} · {snap.owner}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={revertPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `לשחזר את הגרסה מ-${new Date(version.createdAt).toLocaleString('he-IL')}?`,
                          )
                        ) {
                          return
                        }
                        onRevert(version.id)
                      }}
                    >
                      שחזר
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
