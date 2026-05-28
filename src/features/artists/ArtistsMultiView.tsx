import { useEffect } from 'react'
import { ArtistDetailPanel } from '../../components/ArtistDetailPanel'
import { ArtistVersionHistory } from '../../components/ArtistVersionHistory'
import type { ArtistVersion } from '../../api/artists'
import { BUCKET_META } from '../../lib/artistBuckets'
import type { SignatureStatus } from '../../data/types'
import type { CrmArtist } from '../../types'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistsMultiViewProps = {
  artists: CrmArtist[]
  activeId: string | null
  onActiveChange: (id: string) => void
  statusMeta: StatusMeta
  selectedIds: Set<string>
  detailVersions: ArtistVersion[]
  versionsLoading?: boolean
  undoPending?: boolean
  revertPending?: boolean
  onToggleSelect: (id: string) => void
  onUpdate: (id: string, patch: Partial<CrmArtist>) => void
  onUndoLast: (id: string) => void
  onRevert: (id: string, versionId: number) => void
  onEdit: (artist: CrmArtist) => void
  onDelete: (artist: CrmArtist) => void
}

export const ArtistsMultiView = ({
  artists,
  activeId,
  onActiveChange,
  statusMeta,
  selectedIds,
  detailVersions,
  versionsLoading,
  undoPending,
  revertPending,
  onToggleSelect,
  onUpdate,
  onUndoLast,
  onRevert,
  onEdit,
  onDelete,
}: ArtistsMultiViewProps) => {
  useEffect(() => {
    if (!activeId && artists[0]) onActiveChange(artists[0].id)
    if (activeId && !artists.some((a) => a.id === activeId) && artists[0]) {
      onActiveChange(artists[0].id)
    }
  }, [artists, activeId, onActiveChange])

  const active = artists.find((a) => a.id === activeId) ?? null

  return (
    <div className="artists-multi-view">
      <div className="artists-multi-list" role="list">
        <div className="artists-multi-list-header">
          <span>רשימה ({artists.length.toLocaleString('he-IL')})</span>
          <span className="detail-muted">לחץ לצפייה מקבילה</span>
        </div>
        <ul>
          {artists.map((artist) => {
            const meta = statusMeta[artist.status]
            const name = artist.nameHe || artist.nameEn || 'ללא שם'
            const isActive = artist.id === activeId
            return (
              <li key={artist.id} className={isActive ? 'active' : ''}>
                <label className="artists-multi-row">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(artist.id)}
                    onChange={() => onToggleSelect(artist.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    className="artists-multi-row-main"
                    onClick={() => onActiveChange(artist.id)}
                  >
                    <span className={`badge ${meta.tone}`}>{meta.label}</span>
                    <strong>{name}</strong>
                    <span className="detail-muted">
                      {BUCKET_META[artist.bucket ?? 'main'].shortLabel} · {artist.owner}
                    </span>
                  </button>
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="artists-multi-detail">
        {active ? (
          <ArtistDetailPanel
            variant="inline"
            artist={active}
            statusMeta={statusMeta}
            onClose={() => onActiveChange('')}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdate={onUpdate}
            versionHistory={
              <ArtistVersionHistory
                versions={detailVersions}
                loading={versionsLoading}
                undoPending={undoPending}
                revertPending={revertPending}
                onUndoLast={() => onUndoLast(active.id)}
                onRevert={(versionId) => onRevert(active.id, versionId)}
              />
            }
          />
        ) : (
          <div className="empty-state">בחר אומן מהרשימה</div>
        )}
      </div>
    </div>
  )
}
