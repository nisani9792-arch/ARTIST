import { memo, type DragEvent, type MouseEvent } from 'react'
import type { CrmArtist } from '../../../types'
import { cn } from '../../../lib/cn'
import { displayName } from '../funnel/artistFunnelUtils'
import { COMPACT_CARD_HEIGHT } from './constants'

type StatusMeta = { label: string; tone: string }

type CompactKanbanCardProps = {
  artist: CrmArtist
  statusMeta: StatusMeta
  selected: boolean
  draggable?: boolean
  onSelect: (event: MouseEvent) => void
  onOpenDetail: () => void
  onDragStart?: (event: DragEvent, artistId: string) => void
}

export const CompactKanbanCard = memo(function CompactKanbanCard({
  artist,
  statusMeta,
  selected,
  draggable = true,
  onSelect,
  onOpenDetail,
  onDragStart,
}: CompactKanbanCardProps) {
  const name = displayName(artist)

  return (
    <article
      role="listitem"
      draggable={draggable}
      style={{ height: COMPACT_CARD_HEIGHT, maxHeight: COMPACT_CARD_HEIGHT }}
      className={cn(
        'm3-compact-card group flex cursor-pointer select-none items-center gap-2 rounded-lg border px-2',
        'border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-lowest)]',
        'hover:bg-[var(--m3-surface-container)]',
        selected &&
          'border-[var(--m3-primary)] bg-[var(--m3-primary-container)] ring-1 ring-[var(--m3-primary)]',
        `m3-compact-card--${statusMeta.tone}`,
      )}
      onClick={(event) => {
        event.preventDefault()
        onSelect(event)
      }}
      onDoubleClick={(event) => {
        event.preventDefault()
        onOpenDetail()
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        onOpenDetail()
      }}
      onDragStart={(event) => onDragStart?.(event, artist.id)}
      title={`${name} · ${statusMeta.label}\nלחיצה = בחירה · לחיצה כפולה = פרטים`}
    >
      <input
        type="checkbox"
        checked={selected}
        readOnly
        tabIndex={-1}
        className="m3-compact-check size-3.5 shrink-0 rounded border-[var(--m3-outline)]"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-none text-[var(--m3-on-surface)]">
        {name}
      </span>
      <span
        className={cn(
          'm3-compact-tag shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
          `m3-compact-tag--${statusMeta.tone}`,
        )}
      >
        {statusMeta.label}
      </span>
    </article>
  )
})
