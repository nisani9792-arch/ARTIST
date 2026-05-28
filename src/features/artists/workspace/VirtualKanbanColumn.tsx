import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, type DragEvent } from 'react'
import type { SignatureStatus } from '../../../data/types'
import type { CrmArtist } from '../../../types'
import { CompactKanbanCard } from './CompactKanbanCard'
import { COMPACT_CARD_HEIGHT } from './constants'
import { buildDragIdPayload } from './selection'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type VirtualKanbanColumnProps = {
  status: SignatureStatus
  meta: StatusMeta[SignatureStatus]
  artists: CrmArtist[]
  selectedIds: Set<string>
  dragOver: boolean
  onSelectArtist: (artist: CrmArtist, event: React.MouseEvent) => void
  onOpenDetail: (artist: CrmArtist) => void
  onDragOver: (event: DragEvent) => void
  onDragLeave: () => void
  onDrop: (event: DragEvent, status: SignatureStatus) => void
}

export const VirtualKanbanColumn = ({
  status,
  meta,
  artists,
  selectedIds,
  dragOver,
  onSelectArtist,
  onOpenDetail,
  onDragOver,
  onDragLeave,
  onDrop,
}: VirtualKanbanColumnProps) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => COMPACT_CARD_HEIGHT + 4,
    overscan: 12,
  })

  const handleDragStart = (event: DragEvent, artistId: string) => {
    const payload = buildDragIdPayload(artistId, selectedIds)
    event.dataTransfer.setData('application/x-jusic-artist-ids', payload)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <section
      className={`m3-kanban-column flex min-h-0 flex-col rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] ${dragOver ? 'm3-kanban-column--drop' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, status)}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--m3-outline-variant)] px-3 py-2">
        <span className={`m3-col-badge m3-col-badge--${meta.tone}`}>{meta.label}</span>
        <span className="text-[11px] font-semibold tabular-nums text-[var(--m3-on-surface-variant)]">
          {artists.length.toLocaleString('he-IL')}
        </span>
      </header>

      <div ref={parentRef} className="m3-kanban-scroll min-h-0 flex-1 overflow-y-auto p-1.5">
        {artists.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-[var(--m3-on-surface-variant)]">
            אין אומנים
          </p>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const artist = artists[virtualRow.index]
              return (
                <div
                  key={artist.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: 4,
                  }}
                >
                  <CompactKanbanCard
                    artist={artist}
                    statusMeta={meta}
                    selected={selectedIds.has(artist.id)}
                    onSelect={(event) => onSelectArtist(artist, event)}
                    onOpenDetail={() => onOpenDetail(artist)}
                    onDragStart={handleDragStart}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
