import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { useState } from 'react'
import { JusicLogo } from './JusicLogo'
import './LockScreen.css'
import './OperatorRegistration.css'

type OperatorRegistrationProps = {
  onRegister: (displayName: string) => Promise<string | null>
  error?: string
  defaultName?: string
}

export const OperatorRegistration = ({ onRegister, error, defaultName }: OperatorRegistrationProps) => {
  const [name, setName] = useState(defaultName?.trim() ?? '')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setLocalError('יש להזין שם של לפחות 2 תווים')
      return
    }
    if (trimmed.length > 40) {
      setLocalError('שם ארוך מדי (עד 40 תווים)')
      return
    }

    setBusy(true)
    setLocalError('')
    try {
      await onRegister(trimmed)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'הרישום נכשל')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lock-screen operator-screen" role="dialog" aria-modal="true" aria-label="רישום משתמש">
      <motion.div
        className="lock-card operator-card"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      >
        <div className="lock-logo-wrap">
          <JusicLogo size={64} variant="mark" />
        </div>

        <div className="lock-icon-wrap" aria-hidden>
          <User size={28} strokeWidth={2} />
        </div>

        <p className="lock-prompt">רישום לפעילות במערכת</p>
        <p className="operator-hint">
          הזינו שם משתמש — השם נשמר במכשיר זה וכל שינוי במערכת יירשם על שמכם כגורם מטפל.
        </p>

        <form className="lock-form" onSubmit={(e) => void handleSubmit(e)}>
          <input
            className="lock-input operator-input"
            type="text"
            inputMode="text"
            autoComplete="name"
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="שם משתמש"
            aria-label="שם משתמש"
            autoFocus
          />
          {(localError || error) && <p className="operator-error">{localError || error}</p>}
          <button className="lock-biometric operator-submit" type="submit" disabled={busy}>
            {busy ? 'שומר...' : 'המשך למערכת'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
