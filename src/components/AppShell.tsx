import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Database, Download, LayoutGrid, Plus, RefreshCw, Table2, Columns3 } from 'lucide-react'
import { APP_NAME } from '../lib/branding'
import { JusicLogo } from './JusicLogo'
import { InstallPrompt } from './InstallPrompt'
import { MobileBottomBar } from './MobileBottomBar'
import { ToastStack } from '../contexts/ToastProvider'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { BACKUP_REMINDER_DAYS, LAST_BACKUP_KEY } from '../lib/constants'
import type { HeaderStats } from '../api/artists'
import { useState, type ReactNode } from 'react'

type AppShellProps = {
  operatorName: string
  stats?: HeaderStats
  saveStatus: 'idle' | 'loading' | 'saving' | 'error'
  viewMode?: 'cards' | 'table' | 'kanban'
  searchOpen?: boolean
  onRefresh?: () => void
  onExport?: () => void
  onBackup?: () => void
  onNewArtist?: () => void
  onSetView?: (mode: 'cards' | 'table' | 'kanban') => void
  onToggleSearch?: () => void
  backupMessage?: string
  children: ReactNode
}

export const AppShell = ({
  operatorName,
  stats,
  saveStatus,
  viewMode = 'cards',
  searchOpen = false,
  onRefresh,
  onExport,
  onBackup,
  onNewArtist,
  onSetView,
  onToggleSearch,
  backupMessage,
  children,
}: AppShellProps) => {
  const online = useOnlineStatus()
  const location = useLocation()
  const navigate = useNavigate()
  const [localBackupMessage, setLocalBackupMessage] = useState('')
  const [mountedAt] = useState(() => Date.now())

  const lastBackupAt = localStorage.getItem(LAST_BACKUP_KEY)

  const backupDue =
    !lastBackupAt ||
    mountedAt - new Date(lastBackupAt).getTime() > BACKUP_REMINDER_DAYS * 24 * 60 * 60 * 1000

  const displayBackupMessage = backupMessage || localBackupMessage
  const isArtistsRoute = location.pathname.startsWith('/artists')

  const handleBackup = async () => {
    if (!onBackup) return
    await onBackup()
    setLocalBackupMessage('גיבוי הורד בהצלחה')
  }

  return (
    <div className="app" dir="rtl">
      <InstallPrompt />
      <ToastStack />

      {!online && (
        <div className="app-alert offline-alert">
          אין חיבור לאינטרנט — לא ניתן לעדכן נתונים עד שיחזור החיבור
        </div>
      )}

      <div className="persist-banner">
        <span>כל שינוי נשמר אוטומטית בשרת המאובטח</span>
        <button className="btn btn-ghost btn-sm desktop-only" type="button" onClick={() => void handleBackup()}>
          <Database size={14} />
          הורד גיבוי
        </button>
      </div>

      {backupDue && !displayBackupMessage && (
        <div className="backup-reminder">
          מומלץ להוריד גיבוי JSON לשמירה חיצונית (פעם בשבוע)
          <button className="btn btn-primary btn-sm" type="button" onClick={() => void handleBackup()}>
            גיבוי עכשיו
          </button>
        </div>
      )}

      {displayBackupMessage && <div className="backup-ok">{displayBackupMessage}</div>}

      <header className="app-header">
        <div className="brand">
          <Link to="/" className="brand-link">
            <JusicLogo size={36} variant="mark" />
            <span className="brand-title">{APP_NAME}</span>
          </Link>
          <span className="operator-badge" title="גורם מטפל מחובר">
            {operatorName}
          </span>
        </div>

        {stats && (
          <div className="header-stats mobile-stats-scroll" aria-label="סיכום">
            <span className="stat-pill">
              סה״כ <strong>{stats.total.toLocaleString('he-IL')}</strong>
            </span>
            <span className="stat-pill signed">
              חתומים <strong>{stats.signed.toLocaleString('he-IL')}</strong>
            </span>
            <span className="stat-pill unsigned">
              לא חתומים <strong>{stats.unsigned.toLocaleString('he-IL')}</strong>
            </span>
            <span className="stat-pill stuck">
              תקועים <strong>{stats.stuck.toLocaleString('he-IL')}</strong>
            </span>
          </div>
        )}

        <div className="header-actions">
          {isArtistsRoute && onSetView && (
            <div className="view-toggle desktop-only" role="group" aria-label="תצוגה">
              <button
                type="button"
                className={`btn btn-icon ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => onSetView('cards')}
                title="כרטיסיות"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={`btn btn-icon ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => onSetView('table')}
                title="טבלה"
              >
                <Table2 size={15} />
              </button>
              <button
                type="button"
                className={`btn btn-icon ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => onSetView('kanban')}
                title="לוח"
              >
                <Columns3 size={15} />
              </button>
            </div>
          )}

          <span
            className={`status-dot ${saveStatus}`}
            title={
              saveStatus === 'loading'
                ? 'טוען'
                : saveStatus === 'saving'
                  ? 'שומר'
                  : saveStatus === 'error'
                    ? 'שגיאה'
                    : 'מחובר'
            }
          />

          {onRefresh && (
            <button
              className="btn btn-ghost btn-icon desktop-only"
              type="button"
              onClick={onRefresh}
              title="רענון"
            >
              <RefreshCw size={15} />
            </button>
          )}

          {onExport && (
            <button className="btn btn-ghost" type="button" onClick={onExport}>
              <Download size={14} />
              <span className="desktop-only">ייצוא</span>
            </button>
          )}

          <button className="btn btn-ghost desktop-only" type="button" onClick={() => void handleBackup()}>
            <Database size={14} />
            גיבוי
          </button>

      {onNewArtist && (
        <button className="btn btn-primary desktop-only" type="button" onClick={onNewArtist}>
          <Plus size={14} />
          אומן חדש
        </button>
      )}
      {!onNewArtist && (
        <button
          className="btn btn-primary desktop-only"
          type="button"
          onClick={() => navigate('/artists')}
        >
          <Plus size={14} />
          אומנים
        </button>
      )}
        </div>
      </header>

      {children}

      <MobileBottomBar
        searchOpen={searchOpen}
        onNavigateHome={() => navigate('/')}
        onNavigateArtists={() => navigate('/artists')}
        onToggleSearch={() => onToggleSearch?.()}
        onNewArtist={() => (onNewArtist ? onNewArtist() : navigate('/artists'))}
        onBackup={() => void handleBackup()}
      />
    </div>
  )
}
