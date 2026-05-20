import { Download, Share, X } from 'lucide-react'
import { APP_NAME } from '../lib/branding'
import { usePwaInstall } from '../hooks/usePwaInstall'
import './InstallPrompt.css'

export const InstallPrompt = () => {
  const { canInstall, install, dismiss, isIos, isStandalone } = usePwaInstall()

  if (!canInstall || isStandalone) {
    return null
  }

  return (
    <aside className="install-banner" aria-label="התקנת אפליקציה">
      <div className="install-banner-text">
        <strong>התקן את {APP_NAME} בנייד</strong>
        {isIos ? (
          <p>
            ב-Safari: לחץ <Share size={14} className="inline-icon" /> שיתוף → «הוסף למסך הבית»
          </p>
        ) : (
          <p>גישה מהירה מהמסך הראשי, בלי לפתוח דפדפן</p>
        )}
      </div>
      <div className="install-banner-actions">
        {!isIos && (
          <button className="btn btn-primary btn-sm" type="button" onClick={() => void install()}>
            <Download size={14} />
            התקן
          </button>
        )}
        <button className="btn btn-ghost btn-sm" type="button" onClick={dismiss} aria-label="סגור">
          <X size={14} />
        </button>
      </div>
    </aside>
  )
}
