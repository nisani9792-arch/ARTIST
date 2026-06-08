import { useDroppable } from '@dnd-kit/core'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, type MouseEvent } from 'react'
import type { SignatureStatus } from '../../data/types'
import type { CrmArtist } from '../../types'
import { EliteKanbanCard } from './EliteKanbanCard'

const CARD_HEIGHT = 108
const COLS = 2

type EliteKanbanColumnProps = {
  status: SignatureStatus
  label: string
  artists: CrmArtist[]
  selectedIds: Set<string>
  onSelectArtist: (artist: CrmArtist, event: MouseEvent) => void
  onOpenDetail: (artist: CrmArtist) => void
  onSelectAll: (checked: boolean) => void
}

export const EliteKanbanColumn = ({
  status,
  label,
  artists,
  selectedIds,
  onSelectArtist,
  onOpenDetail,
  onSelectAll,
}: EliteKanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const parentRef = useRef<HTMLDivElement>(null)

  const rowCount = Math.ceil(artists.length / COLS)
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + 8,
    overscan: 8,
  })

  const allSelected = artists.length > 0 && artists.every((a) => selectedIds.has(a.id))

  return (
    <section
      ref={setNodeRef}
      className={`elite-kanban-col ${isOver ? 'elite-kanban-col--over' : ''}`}
    >
      <header className="elite-kanban-col-header">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums opacity-70">
            {artists.length.toLocaleString('he-IL')}
          </span>
          <label className="flex items-center gap-1 text-[11px] cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
            הכל
          </label>
        </div>
      </header>

      <div ref={parentRef} className="m3-kanban-scroll min-h-0 flex-1 overflow-y-auto p-2">
        {artists.length === 0 ? (
          <p className="py-6 text-center text-[11px] opacity-60">אין אומנים</p>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((row) => {
              const startIdx = row.index * COLS
              const rowArtists = artists.slice(startIdx, startIdx + COLS)
              return (
                <div
                  key={row.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${row.start}px)`,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    paddingBottom: 8,
                  }}
                >
                  {rowArtists.map((artist) => {
                    const dragIds = selectedIds.has(artist.id)
                      ? [...selectedIds]
                      : [artist.id]
                    return (
                      <EliteKanbanCard
                        key={artist.id}
                        artist={artist}
                        selected={selectedIds.has(artist.id)}
                        dragIds={dragIds}
                        onSelect={(event) => onSelectArtist(artist, event)}
                        onOpenDetail={() => onOpenDetail(artist)}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
