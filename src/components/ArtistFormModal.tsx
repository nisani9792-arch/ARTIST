import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { SignatureStatus } from '../data/artists'
import {
  artistToForm,
  emptyArtistForm,
  formToPayload,
  type ArtistFormValues,
} from '../utils/artistForm'
import type { CrmArtist } from '../types'

type ArtistFormModalProps = {
  mode: 'create' | 'edit'
  artist?: CrmArtist
  handlers: string[]
  onClose: () => void
  onSave: (payload: Partial<CrmArtist>) => Promise<void>
}

export const ArtistFormModal = ({
  mode,
  artist,
  handlers,
  onClose,
  onSave,
}: ArtistFormModalProps) => {
  const [form, setForm] = useState<ArtistFormValues>(
    artist ? artistToForm(artist) : emptyArtistForm(),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(artist ? artistToForm(artist) : emptyArtistForm())
    setError('')
  }, [artist, mode])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const setField = <K extends keyof ArtistFormValues>(key: K, value: ArtistFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.nameHe.trim()) {
      setError('שם האומן בעברית הוא שדה חובה')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSave(formToPayload(form))
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'השמירה נכשלה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button className="panel-backdrop" type="button" aria-label="סגור" onClick={onClose} />
      <dialog className="form-modal" open aria-labelledby="artist-form-title">
        <header className="form-modal-header">
          <h2 id="artist-form-title">{mode === 'create' ? 'אומן חדש' : 'עריכת אומן'}</h2>
          <button className="btn btn-icon" type="button" onClick={onClose} aria-label="סגור">
            <X size={16} />
          </button>
        </header>

        <form className="form-modal-body" onSubmit={(e) => void handleSubmit(e)}>
          <label className="detail-field">
            <span>שם בעברית *</span>
            <input
              value={form.nameHe}
              onChange={(e) => setField('nameHe', e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="detail-field">
            <span>שם באנגלית</span>
            <input value={form.nameEn} onChange={(e) => setField('nameEn', e.target.value)} />
          </label>

          <label className="detail-field">
            <span>סטטוס חתימה</span>
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value as SignatureStatus)}
            >
              <option value="signed">חתום</option>
              <option value="unsigned">לא חתום</option>
              <option value="stuck">תקוע</option>
            </select>
          </label>

          <label className="detail-field">
            <span>גורם מטפל</span>
            <select value={form.owner} onChange={(e) => setField('owner', e.target.value)}>
              {handlers.map((handler) => (
                <option key={handler} value={handler}>
                  {handler}
                </option>
              ))}
            </select>
          </label>

          <label className="detail-field">
            <span>אלבום אחרון</span>
            <input
              value={form.latestAlbum}
              onChange={(e) => setField('latestAlbum', e.target.value)}
            />
          </label>

          <label className="detail-field">
            <span>מקור</span>
            <input value={form.source} onChange={(e) => setField('source', e.target.value)} />
          </label>

          <label className="detail-field">
            <span>ז׳אנרים (מופרדים בפסיק)</span>
            <input value={form.genresText} onChange={(e) => setField('genresText', e.target.value)} />
          </label>

          <label className="detail-field">
            <span>תגיות (מופרדות בפסיק)</span>
            <input value={form.tagsText} onChange={(e) => setField('tagsText', e.target.value)} />
          </label>

          <label className="detail-field">
            <span>הערות</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <footer className="form-modal-footer">
            <button className="btn" type="button" onClick={onClose} disabled={saving}>
              ביטול
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'שומר...' : mode === 'create' ? 'צור אומן' : 'שמור שינויים'}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  )
}
