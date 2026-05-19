import { Database, Home, LayoutGrid, Plus, Search } from 'lucide-react'

type MobileBottomBarProps = {
  searchOpen: boolean
  onNavigateHome: () => void
  onNavigateArtists: () => void
  onToggleSearch: () => void
  onNewArtist: () => void
  onBackup: () => void
}

export const MobileBottomBar = ({
  searchOpen,
  onNavigateHome,
  onNavigateArtists,
  onToggleSearch,
  onNewArtist,
  onBackup,
}: MobileBottomBarProps) => {
  return (
    <nav className="mobile-bottom-bar" aria-label="ניווט נייד">
      <button type="button" className="mobile-nav-btn" onClick={onNavigateHome}>
        <Home size={20} />
        <span>בית</span>
      </button>
      <button type="button" className="mobile-nav-btn" onClick={onNavigateArtists}>
        <LayoutGrid size={20} />
        <span>אומנים</span>
      </button>
      <button
        type="button"
        className={`mobile-nav-btn ${searchOpen ? 'active' : ''}`}
        onClick={onToggleSearch}
      >
        <Search size={20} />
        <span>חיפוש</span>
      </button>
      <button type="button" className="mobile-nav-btn mobile-nav-fab" onClick={onNewArtist}>
        <Plus size={22} />
        <span>חדש</span>
      </button>
      <button type="button" className="mobile-nav-btn" onClick={onBackup}>
        <Database size={20} />
        <span>גיבוי</span>
      </button>
    </nav>
  )
}
