import { Fingerprint, Lock } from 'lucide-react'
import { useState } from 'react'
import { useBiometricUnlock } from '../hooks/useBiometricUnlock'
import './LockScreen.css'

type LockScreenProps = {
  onUnlock: () => void
}

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [password, setPassword] = useState('')
  const { available: biometricAvailable, busy: biometricBusy, unlock: unlockWithBiometric } =
    useBiometricUnlock(onUnlock)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // שדה הסיסמה לתצוגה בלבד — לא פותח את המערכת
  }

  return (
    <div className="lock-screen" role="dialog" aria-modal="true" aria-label="מסך כניסה">
      <div className="lock-card">
        <img src="/artist-logo.png" className="lock-logo" alt="ARTIST" width={88} height={88} />

        <div className="lock-icon-wrap" aria-hidden>
          <Lock size={28} strokeWidth={2} />
        </div>

        <p className="lock-prompt">אנא הכנס סיסמא</p>

        <form className="lock-form" onSubmit={handleSubmit}>
          <input
            className="lock-input"
            type="password"
            inputMode="text"
            autoComplete="off"
            maxLength={20}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••••••••••••"
            aria-label="סיסמא"
          />
        </form>

        {biometricAvailable && (
          <button
            type="button"
            className="lock-biometric"
            onClick={() => void unlockWithBiometric()}
            disabled={biometricBusy}
          >
            <Fingerprint size={22} strokeWidth={2} />
            <span>{biometricBusy ? 'מאמת...' : 'כניסה בטביעת אצבע'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
