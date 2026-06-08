import { useEffect, useState } from 'react'
import type { CrmArtist } from '../../types'
import type { SignatureStatus } from '../../data/types'
import { STATUS_META } from '../../lib/constants'
import { displayName } from '../../features/artists/funnel/artistFunnelUtils'
import { useUiStore } from '../../stores/useUiStore'

type QuickEditPanelProps = {
  artist: CrmArtist | null
  handlers: string[]
  onSave: (id: string, patch: Partial<CrmArtist>) => void
  onClose: () => void
}

export const QuickEditPanel = ({ artist, handlers, onSave, onClose }: QuickEditPanelProps) => {
  const quickEditId = useUiStore((s) => s.quickEditArtistId)
  const setQuickEditArtistId = useUiStore((s) => s.setQuickEditArtistId)

  const [owner, setOwner] = useState('')
  const [status, setStatus] = useState<SignatureStatus>('unsigned')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (!artist) return
    setOwner(artist.owner ?? '')
    setStatus(artist.status)
    setNotes(artist.notes ?? '')
    setTags((artist.tags ?? []).join(', '))
  }, [artist])

  if (!artist || quickEditId !== artist.id) return null

  const handleSave = () => {
    onSave(artist.id, {
      owner: owner.trim() || artist.owner,
      status,
      notes: notes.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <aside className="elite-quick-edit">
      <div className="flex items-center justify-between gap-2">
        <h3>{displayName(artist)}</h3>
        <button type="button" className="m3-btn-ghost" onClick={() => { setQuickEditArtistId(null); onClose() }}>
          ✕
        </button>
      </div>

      <label className="text-[11px] font-semibold opacity-70">מטפל</label>
      <select className="elite-field" value={owner} onChange={(e) => setOwner(e.target.value)}>
        {handlers.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>

      <label className="text-[11px] font-semibold opacity-70">סטטוס</label>
      <select
        className="elite-field"
        value={status}
        onChange={(e) => setStatus(e.target.value as SignatureStatus)}
      >
        {(Object.keys(STATUS_META) as SignatureStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_META[s].label}</option>
        ))}
      </select>

      <label className="text-[11px] font-semibold opacity-70">תגיות</label>
      <input className="elite-field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="תגית1, תגית2" />

      <label className="text-[11px] font-semibold opacity-70">הערות</label>
      <textarea
        className="elite-field"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button type="button" className="btn btn-primary" onClick={handleSave}>
        שמור
      </button>
    </aside>
  )
}
