import { Fingerprint, Lock } from 'lucide-react'
import { useRef, useState } from 'react'
import { useBiometricUnlock } from '../hooks/useBiometricUnlock'
import './LockScreen.css'

const GATE_CODE = 'JUSIC'

type LockScreenProps = {
  onUnlock: () => void | Promise<void>
}

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const unlockStarted = useRef(false)
  const { available: biometricAvailable, busy: biometricBusy, unlock: unlockWithBiometric } =
    useBiometricUnlock(onUnlock)

  const tryUnlockWithCode = async (value: string) => {
    if (unlockStarted.current) return
    if (value.trim().toUpperCase() !== GATE_CODE) return

    unlockStarted.current = true
    setBusy(true)
    try {
      await onUnlock()
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void tryUnlockWithCode(password)
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value.trim().toUpperCase() === GATE_CODE) {
      void tryUnlockWithCode(value)
    }
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
            onChange={(event) => handlePasswordChange(event.target.value)}
            placeholder="••••••••••••••••••••"
            aria-label="סיסמא"
            disabled={busy}
          />
        </form>

        {biometricAvailable && (
          <button
            type="button"
            className="lock-biometric"
            onClick={() => void unlockWithBiometric()}
            disabled={biometricBusy || busy}
          >
            <Fingerprint size={22} strokeWidth={2} />
            <span>
              {biometricBusy || busy
                ? 'מאמת...'
                : 'כניסה ביומטרית (טביעת אצבע / Windows Hello)'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
