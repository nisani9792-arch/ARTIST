import { useCallback, useRef, useState, type DragEvent } from 'react'
import type { SignatureStatus } from '../../../data/types'
import type { CrmArtist } from '../../../types'
import { FUNNEL_STATUSES } from '../funnel/artistFunnelUtils'
import { parseDragIdPayload, selectRangeInColumn } from './selection'
import { VirtualKanbanColumn } from './VirtualKanbanColumn'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type CompactKanbanBoardProps = {
  artists: CrmArtist[]
  statusMeta: StatusMeta
  stats?: { signed: number; unsigned: number; in_process: number; total: number }
  filteredTotal?: number
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSetSelection: (ids: string[]) => void
  onOpenDetail: (artist: CrmArtist) => void
  onBulkStatusChange: (ids: string[], status: SignatureStatus) => void
}

export const CompactKanbanBoard = ({
  artists,
  statusMeta,
  stats,
  filteredTotal,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
}: CompactKanbanBoardProps) => {
  const [dropTarget, setDropTarget] = useState<SignatureStatus | null>(null)
  const anchorIdRef = useRef<string | null>(null)

  const counts = stats ?? {
    signed: artists.filter((a) => a.status === 'signed').length,
    unsigned: artists.filter((a) => a.status === 'unsigned').length,
    in_process: artists.filter((a) => a.status === 'in_process').length,
    total: artists.length,
  }

  const grouped = FUNNEL_STATUSES.map((status) => ({
    status,
    meta: statusMeta[status],
    items: artists.filter((artist) => artist.status === status),
  }))

  const handleSelect = useCallback(
    (columnArtists: CrmArtist[], artist: CrmArtist, event: React.MouseEvent) => {
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

  const handleDrop = (event: DragEvent, nextStatus: SignatureStatus) => {
    event.preventDefault()
    setDropTarget(null)
    const ids = parseDragIdPayload(event.dataTransfer)
    if (ids.length === 0) return
    onBulkStatusChange([...new Set(ids)], nextStatus)
  }

  return (
    <div className="m3-kanban-board flex min-h-0 flex-1 flex-col gap-2">
      <div className="m3-kanban-stats flex shrink-0 flex-wrap gap-1.5 px-0.5">
        <span className="m3-stat-pill">
          סה״כ <strong>{counts.total.toLocaleString('he-IL')}</strong>
        </span>
        <span className="m3-stat-pill m3-stat-pill--unsigned">
          לא חתום <strong>{counts.unsigned.toLocaleString('he-IL')}</strong>
        </span>
        <span className="m3-stat-pill m3-stat-pill--in-process">
          בעבודה <strong>{counts.in_process.toLocaleString('he-IL')}</strong>
        </span>
        <span className="m3-stat-pill m3-stat-pill--signed">
          חתום <strong>{counts.signed.toLocaleString('he-IL')}</strong>
        </span>
        {filteredTotal != null && filteredTotal > artists.length && (
          <span className="m3-stat-pill m3-stat-pill--warn">
            מוצגים <strong>{artists.length.toLocaleString('he-IL')}</strong> מתוך{' '}
            {filteredTotal.toLocaleString('he-IL')} — צמצם סינון
          </span>
        )}
        {selectedIds.size > 0 && (
          <span className="m3-stat-pill m3-stat-pill--selected">
            נבחרו <strong>{selectedIds.size}</strong> · גרור לעמודה
          </span>
        )}
      </div>

      <div className="m3-kanban-grid grid min-h-0 flex-1 grid-cols-2 gap-2">
        {grouped.map(({ status, meta, items }) => (
          <VirtualKanbanColumn
            key={status}
            status={status}
            meta={meta}
            artists={items}
            selectedIds={selectedIds}
            dragOver={dropTarget === status}
            onSelectArtist={(artist, event) => handleSelect(items, artist, event)}
            onOpenDetail={onOpenDetail}
            onDragOver={(event) => {
              event.preventDefault()
              setDropTarget(status)
            }}
            onDragLeave={() => setDropTarget((current) => (current === status ? null : current))}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}
