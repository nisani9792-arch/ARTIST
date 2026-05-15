import { Database, Filter, LayoutGrid, Plus, Table2 } from 'lucide-react'
import type { ViewMode } from '../types'

type MobileBottomBarProps = {
  viewMode: ViewMode
  filtersOpen: boolean
  onToggleFilters: () => void
  onSetView: (mode: ViewMode) => void
  onNewArtist: () => void
  onBackup: () => void
}

export const MobileBottomBar = ({
  viewMode,
  filtersOpen,
  onToggleFilters,
  onSetView,
  onNewArtist,
  onBackup,
}: MobileBottomBarProps) => {
  return (
    <nav className="mobile-bottom-bar" aria-label="ניווט נייד">
      <button
        type="button"
        className={`mobile-nav-btn ${filtersOpen ? 'active' : ''}`}
        onClick={onToggleFilters}
      >
        <Filter size={20} />
        <span>סינון</span>
      </button>
      <button
        type="button"
        className={`mobile-nav-btn ${viewMode === 'cards' ? 'active' : ''}`}
        onClick={() => onSetView('cards')}
      >
        <LayoutGrid size={20} />
        <span>כרטיסים</span>
      </button>
      <button type="button" className="mobile-nav-btn mobile-nav-fab" onClick={onNewArtist}>
        <Plus size={22} />
        <span>חדש</span>
      </button>
      <button
        type="button"
        className={`mobile-nav-btn ${viewMode === 'table' ? 'active' : ''}`}
        onClick={() => onSetView('table')}
      >
        <Table2 size={20} />
        <span>טבלה</span>
      </button>
      <button type="button" className="mobile-nav-btn" onClick={onBackup}>
        <Database size={20} />
        <span>גיבוי</span>
      </button>
    </nav>
  )
}
