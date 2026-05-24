import { Mail, FileSignature, Phone } from 'lucide-react'
import { memo, type DragEvent, type MouseEvent } from 'react'
import type { SignatureStatus } from '../../../data/types'
import type { CrmArtist } from '../../../types'
import { STATUS_META } from '../../../lib/constants'
import {
  contractStatusLabel,
  displayName,
  formatLastActivity,
  mailtoForArtist,
  nextFunnelStatus,
  triggerHaptic,
} from './artistFunnelUtils'
import { StatusMorphBadge } from './StatusMorphBadge'

type ArtistFunnelCardProps = {
  artist: CrmArtist
  onStatusChange: (id: string, status: SignatureStatus) => void
  onOpenDetail: (artist: CrmArtist) => void
  onContractAction: (artist: CrmArtist) => void
  draggable?: boolean
  onDragStart?: (event: DragEvent, artistId: string) => void
}

export const ArtistFunnelCard = memo(function ArtistFunnelCard({
  artist,
  onStatusChange,
  onOpenDetail,
  onContractAction,
  draggable = false,
  onDragStart,
}: ArtistFunnelCardProps) {
  const meta = STATUS_META[artist.status]
  const name = displayName(artist)

  const cycleStatus = (event: MouseEvent) => {
    event.stopPropagation()
    const next = nextFunnelStatus(artist.status)
    triggerHaptic(10)
    onStatusChange(artist.id, next)
  }

  return (
    <article
      className={`funnel-card funnel-card--${meta.tone}`}
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(event, artist.id)}
      onClick={() => onOpenDetail(artist)}
    >
      <div className="funnel-card-rail" aria-hidden />

      <div className="funnel-card-body">
        <div className="funnel-card-head">
          <h3 className="funnel-card-name">{name}</h3>
          <StatusMorphBadge
            status={artist.status}
            label={meta.label}
            tone={meta.tone}
            layoutId={`artist-status-${artist.id}`}
            onClick={cycleStatus}
            compact
          />
        </div>

        <dl className="funnel-card-meta">
          <div>
            <dt>חוזה</dt>
            <dd>{contractStatusLabel(artist.status)}</dd>
          </div>
          <div>
            <dt>פעילות</dt>
            <dd>{formatLastActivity(artist.updatedAt)}</dd>
          </div>
        </dl>

        <div className="funnel-quick-actions" role="group" aria-label="פעולות מהירות">
          <a
            className="funnel-quick-btn"
            href={mailtoForArtist(artist)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`שלח מייל ל${name}`}
          >
            <Mail size={15} />
            <span>מייל</span>
          </a>
          <button
            type="button"
            className="funnel-quick-btn"
            onClick={(e) => {
              e.stopPropagation()
              triggerHaptic(6)
              onContractAction(artist)
            }}
            aria-label={`עדכן חוזה — ${name}`}
          >
            <FileSignature size={15} />
            <span>חוזה</span>
          </button>
          <button
            type="button"
            className="funnel-quick-btn"
            onClick={(e) => {
              e.stopPropagation()
              triggerHaptic(6)
              onOpenDetail(artist)
            }}
            aria-label={`צור קשר — ${name}`}
          >
            <Phone size={15} />
            <span>קשר</span>
          </button>
        </div>
      </div>
    </article>
  )
})
