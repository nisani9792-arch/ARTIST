import { Lock } from 'lucide-react'
import './LockScreen.css'

type LockScreenProps = {
  pressCount: number
  requiredPresses: number
}

export const LockScreen = ({ pressCount, requiredPresses }: LockScreenProps) => {
  return (
    <div className="lock-screen" role="dialog" aria-modal="true" aria-label="מסך כניסה">
      <div className="lock-card">
        <img src="/artist-logo.png" className="lock-logo" alt="ARTIST" width={88} height={88} />
        <div className="lock-icon-wrap" aria-hidden>
          <Lock size={28} strokeWidth={2} />
        </div>
        <h1 className="lock-title">ARTIST</h1>
        <p className="lock-hint">לחץ על מקש הרווח 3 פעמים כדי להיכנס</p>
        <div className="lock-progress" aria-live="polite">
          {Array.from({ length: requiredPresses }, (_, index) => (
            <span key={index} className={`lock-dot ${index < pressCount ? 'active' : ''}`} />
          ))}
        </div>
        <p className="lock-counter">
          {pressCount > 0 ? `${pressCount} / ${requiredPresses}` : 'מערכת נעולה'}
        </p>
      </div>
    </div>
  )
}
