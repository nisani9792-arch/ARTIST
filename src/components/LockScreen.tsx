import { motion } from 'framer-motion'
import { Fingerprint, Lock } from 'lucide-react'
import { useRef, useState } from 'react'
import { useBiometricUnlock } from '../hooks/useBiometricUnlock'
import type { UnlockMethod } from '../api/access'
import { JusicLogo } from './JusicLogo'
import './LockScreen.css'

type LockScreenProps = {
  onUnlock: (options?: { method?: UnlockMethod; secret?: string }) => Promise<void>
}

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const unlockStarted = useRef(false)

  const tryUnlock = async (options: { method: UnlockMethod; secret?: string }) => {
    if (unlockStarted.current) return

    unlockStarted.current = true
    setBusy(true)
    setError('')
    try {
      await onUnlock(options)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'פתיחת השער נכשלה')
      unlockStarted.current = false
    } finally {
      setBusy(false)
    }
  }

  const { available: biometricAvailable, busy: biometricBusy, unlock: unlockWithBiometric } =
    useBiometricUnlock(() => tryUnlock({ method: 'biometric' }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void tryUnlock({ method: 'password', secret: password })
  }

  return (
    <div className="lock-screen" role="dialog" aria-modal="true" aria-label="מסך כניסה">
      <motion.div
        className="lock-card"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      >
        <div className="lock-logo-wrap">
          <JusicLogo size={72} variant="mark" />
        </div>

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
            disabled={busy}
          />
        </form>

        {error && <p className="lock-error">{error}</p>}

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
      </motion.div>
    </div>
  )
}
