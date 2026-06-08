import { Command } from 'cmdk'
import { useEffect, useMemo, useState } from 'react'
import type { CrmArtist } from '../../types'
import type { SignatureStatus } from '../../data/types'
import { STATUS_META } from '../../lib/constants'
import { displayName } from '../../features/artists/funnel/artistFunnelUtils'
import { useUiStore } from '../../stores/useUiStore'

type CommandMenuProps = {
  artists: CrmArtist[]
  onStatusChange: (id: string, status: SignatureStatus) => void
  onOpenDetail: (artist: CrmArtist) => void
}

const ALL_STATUSES: SignatureStatus[] = ['unsigned', 'in_process', 'signed']

export const CommandMenu = ({ artists, onStatusChange, onOpenDetail }: CommandMenuProps) => {
  const open = useUiStore((s) => s.commandOpen)
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(!open)
      }
      if (e.key === 'Escape') setCommandOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setCommandOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return artists.slice(0, 50)
    return artists
      .filter((a) => {
        const name = displayName(a).toLowerCase()
        return (
          name.includes(q) ||
          a.owner?.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q))
        )
      })
      .slice(0, 40)
  }, [artists, query])

  if (!open) return null

  return (
    <div
      className="elite-cmdk-overlay"
      onClick={() => setCommandOpen(false)}
      role="presentation"
    >
      <div className="elite-cmdk" onClick={(e) => e.stopPropagation()}>
        <Command label="חיפוש אומנים" shouldFilter={false}>
          <Command.Input
            placeholder="חיפוש אומן, מטפל, תגית… (Ctrl+K)"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <Command.List>
            <Command.Empty>לא נמצאו תוצאות</Command.Empty>
            {filtered.map((artist) => (
              <Command.Item
                key={artist.id}
                value={artist.id}
                onSelect={() => {
                  onOpenDetail(artist)
                  setCommandOpen(false)
                }}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="truncate font-semibold">{displayName(artist)}</span>
                  <div className="flex shrink-0 gap-1">
                    {ALL_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          artist.status === status
                            ? 'bg-[var(--m3-primary)] text-black'
                            : 'border border-[var(--m3-outline-variant)] opacity-60'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (artist.status !== status) onStatusChange(artist.id, status)
                        }}
                      >
                        {STATUS_META[status].label}
                      </button>
                    ))}
                  </div>
                </div>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
