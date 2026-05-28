import type { SignatureStatus } from '../../../data/types'
import type { CrmArtist } from '../../../types'
import { CompactKanbanBoard } from '../workspace/CompactKanbanBoard'

type StatusMeta = Record<SignatureStatus, { label: string; tone: string }>

type ArtistStatusFunnelProps = {
  artists: CrmArtist[]
  statusMeta: StatusMeta
  stats?: { signed: number; unsigned: number; stuck: number; total: number }
  filteredTotal?: number
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSetSelection: (ids: string[]) => void
  onOpenDetail: (artist: CrmArtist) => void
  onBulkStatusChange: (ids: string[], status: SignatureStatus) => void
}

/** Compact high-density kanban (default workspace view). */
export const ArtistStatusFunnel = (props: ArtistStatusFunnelProps) => (
  <CompactKanbanBoard {...props} />
)
