import { useEffect, useMemo } from 'react'
import type { HeaderStats } from '../../api/artists'
import type { CrmArtist } from '../../types'
import type { SignatureStatus } from '../../data/types'
import type { StatusFilter } from '../../types'
import { CommandMenu } from '../../components/elite/CommandMenu'
import { EliteStatusKanban } from '../../components/elite/EliteStatusKanban'
import { QuickEditPanel } from '../../components/elite/QuickEditPanel'
import { StatusFilterPills } from '../../components/elite/StatusFilterPills'
import { StatusProgressBar } from '../../components/elite/StatusProgressBar'
import { UnsignedVault } from '../../components/elite/UnsignedVault'
import { useArtistsStore } from '../../stores/useArtistsStore'
import { useUiStore } from '../../stores/useUiStore'
import '../../components/elite/elite-workspace.css'

type EliteArtistWorkspaceProps = {
  artists: CrmArtist[]
  stats?: HeaderStats
  handlers: string[]
  statusFilter: StatusFilter
  selectedIds: Set<string>
  onStatusFilterChange: (value: StatusFilter) => void
  onToggleSelect: (id: string) => void
  onSetSelection: (ids: string[]) => void
  onOpenDetail: (artist: CrmArtist) => void
  onBulkStatusChange: (ids: string[], status: SignatureStatus) => void
  onUpdateArtist: (id: string, patch: Partial<CrmArtist>) => void
}

export const EliteArtistWorkspace = ({
  artists,
  stats,
  handlers,
  statusFilter,
  selectedIds,
  onStatusFilterChange,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
  onUpdateArtist,
}: EliteArtistWorkspaceProps) => {
  const hydrate = useArtistsStore((s) => s.hydrate)
  const quickEditId = useUiStore((s) => s.quickEditArtistId)
  const setQuickEditArtistId = useUiStore((s) => s.setQuickEditArtistId)
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)

  useEffect(() => {
    hydrate(artists, stats)
  }, [artists, stats, hydrate])

  const vaultArtists = useMemo(
    () => artists.filter((a) => a.status === 'unsigned'),
    [artists],
  )

  const quickEditArtist = useMemo(
    () => (quickEditId ? artists.find((a) => a.id === quickEditId) ?? null : null),
    [artists, quickEditId],
  )

  const handleOpenDetail = (artist: CrmArtist) => {
    setQuickEditArtistId(artist.id)
    onOpenDetail(artist)
  }

  return (
    <div className="elite-workspace">
      <StatusProgressBar stats={stats} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusFilterPills
          active={statusFilter}
          stats={stats}
          onChange={onStatusFilterChange}
        />
        <button
          type="button"
          className="m3-btn-ghost"
          onClick={() => setCommandOpen(true)}
          title="Ctrl+K"
        >
          🔍 חיפוש מהיר
        </button>
      </div>

      <div className="elite-main-layout">
        <div className="elite-board">
          <EliteStatusKanban
            artists={artists}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onSetSelection={onSetSelection}
            onOpenDetail={handleOpenDetail}
            onBulkStatusChange={onBulkStatusChange}
          />
        </div>

        <UnsignedVault
          artists={vaultArtists}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onOpenDetail={handleOpenDetail}
        />

        <QuickEditPanel
          artist={quickEditArtist}
          handlers={handlers}
          onSave={onUpdateArtist}
          onClose={() => setQuickEditArtistId(null)}
        />
      </div>

      <CommandMenu
        artists={artists}
        onStatusChange={(id, status) => onBulkStatusChange([id], status)}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  )
}
