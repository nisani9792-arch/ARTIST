import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useCallback, useRef, useState, type MouseEvent } from 'react'
import type { SignatureStatus } from '../../data/types'
import type { CrmArtist } from '../../types'
import { MAIN_BOARD_STATUSES, STATUS_META } from '../../lib/constants'
import { selectRangeInColumn } from '../../features/artists/workspace/selection'
import { EliteKanbanCard } from './EliteKanbanCard'
import { EliteKanbanColumn } from './EliteKanbanColumn'

type EliteStatusKanbanProps = {
  artists: CrmArtist[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSetSelection: (ids: string[]) => void
  onOpenDetail: (artist: CrmArtist) => void
  onBulkStatusChange: (ids: string[], status: SignatureStatus) => void
}

export const EliteStatusKanban = ({
  artists,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
}: EliteStatusKanbanProps) => {
  const [activeArtist, setActiveArtist] = useState<CrmArtist | null>(null)
  const anchorIdRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const boardArtists = artists.filter(
    (a) => a.status === 'in_process' || a.status === 'signed',
  )

  const grouped = MAIN_BOARD_STATUSES.map((status) => ({
    status,
    meta: STATUS_META[status],
    items: boardArtists.filter((a) => a.status === status),
  }))

  const handleSelect = useCallback(
    (columnArtists: CrmArtist[], artist: CrmArtist, event: MouseEvent) => {
      if (event.shiftKey && anchorIdRef.current) {
        const range = selectRangeInColumn(columnArtists, anchorIdRef.current, artist.id)
        onSetSelection(range)
        return
      }
      onToggleSelect(artist.id)
      anchorIdRef.current = artist.id
    },
    [onSetSelection, onToggleSelect],
  )

  const handleDragStart = (event: DragStartEvent) => {
    const artist = event.active.data.current?.artist as CrmArtist | undefined
    if (artist) setActiveArtist(artist)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveArtist(null)
    const { active, over } = event
    if (!over) return

    const targetStatus = over.id as SignatureStatus
    if (!MAIN_BOARD_STATUSES.includes(targetStatus)) return

    const dragIds = (active.data.current?.dragIds as string[] | undefined) ?? [String(active.id)]
    const artist = active.data.current?.artist as CrmArtist | undefined
    if (!artist || artist.status === targetStatus) return

    onBulkStatusChange([...new Set(dragIds)], targetStatus)
  }

  const handleSelectAllInCol = (status: SignatureStatus, checked: boolean) => {
    const colArtists = boardArtists.filter((a) => a.status === status)
    if (checked) {
      onSetSelection([...new Set([...selectedIds, ...colArtists.map((a) => a.id)])])
    } else {
      const colIds = new Set(colArtists.map((a) => a.id))
      onSetSelection([...selectedIds].filter((id) => !colIds.has(id)))
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="elite-kanban-grid">
        {grouped.map(({ status, meta, items }) => (
          <EliteKanbanColumn
            key={status}
            status={status}
            label={meta.label}
            artists={items}
            selectedIds={selectedIds}
            onSelectArtist={(artist, event) => handleSelect(items, artist, event)}
            onOpenDetail={onOpenDetail}
            onSelectAll={(checked) => handleSelectAllInCol(status, checked)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeArtist ? (
          <EliteKanbanCard
            artist={activeArtist}
            selected={selectedIds.has(activeArtist.id)}
            dragIds={
              selectedIds.has(activeArtist.id) ? [...selectedIds] : [activeArtist.id]
            }
            onSelect={() => {}}
            onOpenDetail={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
