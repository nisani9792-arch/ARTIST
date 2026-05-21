import { Settings2 } from 'lucide-react'
import { useState } from 'react'
import { classifyArtistBuckets } from '../api/artists'
import {
  DEFAULT_WORKSPACE_SETTINGS,
  POPULAR_LIMIT_OPTIONS,
  loadWorkspaceSettings,
  saveWorkspaceSettings,
  type WorkspaceSettings,
} from '../lib/artistBuckets'
import type { ViewMode } from '../types'

type WorkspaceSettingsPanelProps = {
  onSettingsChange: (settings: WorkspaceSettings) => void
  onViewModeChange?: (mode: ViewMode) => void
}

export const WorkspaceSettingsPanel = ({
  onSettingsChange,
  onViewModeChange,
}: WorkspaceSettingsPanelProps) => {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState(loadWorkspaceSettings)
  const [classifying, setClassifying] = useState(false)
  const [message, setMessage] = useState('')

  const apply = (next: WorkspaceSettings) => {
    setSettings(next)
    saveWorkspaceSettings(next)
    onSettingsChange(next)
    onViewModeChange?.(next.defaultViewMode)
  }

  const runClassify = async () => {
    setClassifying(true)
    setMessage('')
    try {
      const result = await classifyArtistBuckets(settings.popularLimit)
      setMessage(`סווגו ${result.updated.toLocaleString('he-IL')} אומנים (טופ ${result.popularLimit})`)
    } catch {
      setMessage('סיווג אוטומטי נכשל — נסו שוב')
    } finally {
      setClassifying(false)
    }
  }

  return (
    <div className="workspace-settings">
      <button
        type="button"
        className={`btn btn-ghost ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Settings2 size={15} />
        הגדרות עבודה
      </button>

      {open && (
        <div className="workspace-settings-panel">
          <label>
            <span>כמות אומנים פופולריים (טופ)</span>
            <select
              value={settings.popularLimit}
              onChange={(e) =>
                apply({
                  ...settings,
                  popularLimit: Number(e.target.value) as WorkspaceSettings['popularLimit'],
                })
              }
            >
              {POPULAR_LIMIT_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>תצוגת ברירת מחדל</span>
            <select
              value={settings.defaultViewMode}
              onChange={(e) =>
                apply({
                  ...settings,
                  defaultViewMode: e.target.value as ViewMode,
                })
              }
            >
              <option value="segments">3 קטגוריות</option>
              <option value="cards">כרטיסיות</option>
              <option value="table">טבלה</option>
              <option value="kanban">לוח סטטוס</option>
            </select>
          </label>

          <label>
            <span>גודל דשבורד</span>
            <select
              value={settings.dashboardLayout}
              onChange={(e) =>
                apply({
                  ...settings,
                  dashboardLayout: e.target.value as WorkspaceSettings['dashboardLayout'],
                })
              }
            >
              <option value="compact">קומפקטי</option>
              <option value="comfortable">נוח</option>
              <option value="spacious">מרווח</option>
            </select>
          </label>

          <div className="workspace-settings-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={classifying}
              onClick={() => void runClassify()}
            >
              {classifying ? 'מסווג...' : 'סיווג אוטומטי מחדש'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => apply(DEFAULT_WORKSPACE_SETTINGS)}
            >
              איפוס
            </button>
          </div>

          {message && <p className="workspace-settings-msg">{message}</p>}
        </div>
      )}
    </div>
  )
}
