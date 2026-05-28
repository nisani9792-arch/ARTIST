import { Columns3, Layers3, LayoutGrid, PanelRight, Table2 } from 'lucide-react'
import type { ViewMode } from '../../types'

const VIEW_OPTIONS: { mode: ViewMode; label: string; Icon: typeof Columns3 }[] = [
  { mode: 'kanban', label: 'משפך', Icon: Columns3 },
  { mode: 'segments', label: 'קטגוריות', Icon: Layers3 },
  { mode: 'cards', label: 'כרטיסים', Icon: LayoutGrid },
  { mode: 'table', label: 'טבלה', Icon: Table2 },
  { mode: 'multi', label: 'מקביל', Icon: PanelRight },
]

type ArtistsViewSwitcherProps = {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export const ArtistsViewSwitcher = ({ viewMode, onChange }: ArtistsViewSwitcherProps) => (
  <div className="artists-view-switcher mobile-only" role="tablist" aria-label="תצוגת אומנים">
    {VIEW_OPTIONS.map(({ mode, label, Icon }) => (
      <button
        key={mode}
        type="button"
        role="tab"
        aria-selected={viewMode === mode}
        className={`artists-view-switcher-btn ${viewMode === mode ? 'active' : ''}`}
        onClick={() => onChange(mode)}
      >
        <Icon size={16} />
        <span>{label}</span>
      </button>
    ))}
  </div>
)
