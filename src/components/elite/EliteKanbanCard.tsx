import { memo, type MouseEvent } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { CrmArtist } from '../../types'
import type { SignatureStatus } from '../../data/types'
import { displayName, formatLastActivity } from '../../features/artists/funnel/artistFunnelUtils'

type EliteKanbanCardProps = {
  artist: CrmArtist
  selected: boolean
  dragIds: string[]
  onSelect: (event: MouseEvent) => void
  onOpenDetail: () => void
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const EliteKanbanCard = memo(function EliteKanbanCard({
  artist,
  selected,
  dragIds,
  onSelect,
  onOpenDetail,
}: EliteKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: artist.id,
    data: { artist, dragIds },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined

  const name = displayName(artist)
  const statusClass = `elite-card--${artist.status as SignatureStatus}`

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`elite-card ${statusClass} ${selected ? 'selected' : ''}`}
      {...listeners}
      {...attributes}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(event)
      }}
      onDoubleClick={(event) => {
        event.preventDefault()
        onOpenDetail()
      }}
      title={name}
    >
      <input
        type="checkbox"
        className="elite-card-check"
        checked={selected}
        readOnly
        tabIndex={-1}
        aria-hidden
      />
      <span className="elite-card-initials">{initials(name)}</span>
      <span className="elite-card-name">{name}</span>
      {artist.owner && artist.owner !== 'לא שויך' && (
        <span className="elite-card-meta">{artist.owner}</span>
      )}
      <span className="elite-card-meta">{formatLastActivity(artist.updatedAt)}</span>
    </article>
  )
})
