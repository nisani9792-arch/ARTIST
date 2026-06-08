import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { Archive } from 'lucide-react'
import type { CrmArtist } from '../../types'
import { displayName } from '../../features/artists/funnel/artistFunnelUtils'
import { useUiStore } from '../../stores/useUiStore'

type UnsignedVaultProps = {
  artists: CrmArtist[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onOpenDetail: (artist: CrmArtist) => void
}

const ROW_HEIGHT = 44

export const UnsignedVault = ({
  artists,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
}: UnsignedVaultProps) => {
  const vaultOpen = useUiStore((s) => s.vaultOpen)
  const toggleVault = useUiStore((s) => s.toggleVault)
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })

  if (!vaultOpen) {
    return (
      <aside
        className="elite-vault elite-vault--closed"
        onClick={toggleVault}
        title="Unsigned Vault — לחץ לפתיחה"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggleVault()}
      >
        <div className="elite-vault-tab">
          <Archive size={16} />
          <span>Vault ({artists.length})</span>
        </div>
      </aside>
    )
  }

  return (
    <aside className="elite-vault elite-vault--open">
      <header className="elite-vault-header">
        <span>לא חתומים — Vault</span>
        <button type="button" className="m3-btn-ghost" onClick={toggleVault}>
          סגור
        </button>
      </header>
      <div ref={parentRef} className="elite-vault-scroll">
        {artists.length === 0 ? (
          <p className="py-4 text-center text-[11px] opacity-60">אין אומנים ב-Vault</p>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((row) => {
              const artist = artists[row.index]
              return (
                <div
                  key={artist.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${row.start}px)`,
                    height: row.size,
                    paddingBottom: 4,
                  }}
                >
                  <div
                    className={`elite-vault-row ${selectedIds.has(artist.id) ? 'selected' : ''}`}
                    onClick={() => onToggleSelect(artist.id)}
                    onDoubleClick={() => onOpenDetail(artist)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(artist.id)}
                      readOnly
                      tabIndex={-1}
                    />
                    <span className="truncate">{displayName(artist)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
