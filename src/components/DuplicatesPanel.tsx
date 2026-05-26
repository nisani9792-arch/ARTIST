import { Copy } from 'lucide-react'
import { useState } from 'react'
import type { DuplicateGroup } from '../api/artists'
import { STATUS_META } from '../lib/constants'

type DuplicatesPanelProps = {
  groups: DuplicateGroup[]
  loading?: boolean
  mergePending?: boolean
  onRefresh: () => void
  onMerge: (keepId: string, removeIds: string[]) => void
}

export const DuplicatesPanel = ({
  groups,
  loading,
  mergePending,
  onRefresh,
  onMerge,
}: DuplicatesPanelProps) => {
  const [open, setOpen] = useState(false)

  const totalDupes = groups.reduce((sum, g) => sum + g.artists.length - 1, 0)

  return (
    <div className="duplicates-panel">
      <button
        type="button"
        className={`btn btn-ghost btn-sm ${open ? 'active' : ''}`}
        onClick={() => {
          if (!open) onRefresh()
          setOpen(!open)
        }}
      >
        <Copy size={14} />
        כפילויות ({totalDupes || groups.length})
      </button>

      {open && (
        <div className="duplicates-panel-body">
          {loading ? (
            <p className="workspace-settings-msg">סורק כפילויות...</p>
          ) : groups.length === 0 ? (
            <p className="workspace-settings-msg">לא נמצאו כפילויות לפי שם עברי/אנגלי</p>
          ) : (
            <ul className="duplicates-groups">
              {groups.map((group) => {
                const keep = group.artists[0]
                const removeIds = group.artists.slice(1).map((a) => a.id)
                return (
                  <li key={group.key} className="duplicates-group">
                    <div className="duplicates-group-header">
                      <strong>{group.nameHe || group.nameEn}</strong>
                      {group.nameEn && group.nameHe && (
                        <span className="detail-muted">{group.nameEn}</span>
                      )}
                      <span className="detail-muted">{group.artists.length} רשומות</span>
                    </div>
                    <ul className="duplicates-artists">
                      {group.artists.map((artist, index) => (
                        <li key={artist.id}>
                          <span>
                            {index === 0 ? '★ ' : ''}
                            {artist.nameHe || artist.nameEn}
                          </span>
                          <span className={`badge ${STATUS_META[artist.status].tone}`}>
                            {STATUS_META[artist.status].label}
                          </span>
                          <span className="detail-muted">{artist.owner}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={mergePending || removeIds.length === 0}
                      onClick={() => {
                        const name = keep.nameHe || keep.nameEn
                        if (
                          !window.confirm(
                            `לאחד ${removeIds.length} כפילויות לתוך "${name}"? הכפילויות יימחקו.`,
                          )
                        ) {
                          return
                        }
                        onMerge(keep.id, removeIds)
                      }}
                    >
                      אחד לרשומה אחת
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
