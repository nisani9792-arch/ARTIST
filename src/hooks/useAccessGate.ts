import { useCallback, useEffect, useState } from 'react'
import { fetchAccessState, registerOperator as registerOperatorApi, unlockGate } from '../api/access'
import { getStoredOperatorName, setStoredOperatorName } from '../lib/operator'

const RESET_MS = 1600
const REQUIRED_PRESSES = 3

export type AccessPhase = 'loading' | 'locked' | 'register' | 'ready'

export const useAccessGate = () => {
  const [phase, setPhase] = useState<AccessPhase>('loading')
  const [operatorName, setOperatorName] = useState<string | null>(null)
  const [error, setError] = useState('')

  const applyReady = useCallback((name: string) => {
    setStoredOperatorName(name)
    setOperatorName(name)
    setPhase('ready')
  }, [])

  const refresh = useCallback(async () => {
    setError('')
    try {
      const access = await fetchAccessState()
      const local = getStoredOperatorName()

      if (!access.gateUnlocked) {
        setOperatorName(null)
        setPhase('locked')
        return
      }

      if (local) {
        setOperatorName(local)
        setPhase('ready')
        return
      }

      if (access.displayName) {
        applyReady(access.displayName)
        return
      }

      setOperatorName(null)
      setPhase('register')
    } catch {
      const local = getStoredOperatorName()
      if (local) {
        setOperatorName(local)
        setPhase('ready')
        return
      }
      setOperatorName(null)
      setPhase('locked')
    }
  }, [applyReady])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const unlock = useCallback(async () => {
    setError('')
    const access = await unlockGate()
    if (!access.gateUnlocked) {
      setPhase('locked')
      return
    }

    const local = getStoredOperatorName()
    if (local) {
      setOperatorName(local)
      setPhase('ready')
      return
    }

    setOperatorName(null)
    setPhase('register')
  }, [])

  const register = useCallback(
    async (name: string) => {
      setError('')
      const access = await registerOperatorApi(name)
      if (!access.displayName) {
        throw new Error('הרישום נכשל')
      }
      applyReady(access.displayName)
      return access.displayName
    },
    [applyReady],
  )

  useEffect(() => {
    if (phase !== 'locked') return

    let resetTimer: ReturnType<typeof setTimeout> | undefined
    let pressCount = 0

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return
      event.preventDefault()

      pressCount += 1
      if (pressCount >= REQUIRED_PRESSES) {
        void unlock().catch((err) => {
          setError(err instanceof Error ? err.message : 'פתיחת השער נכשלה')
        })
        pressCount = 0
        return
      }

      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        pressCount = 0
      }, RESET_MS)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(resetTimer)
    }
  }, [phase, unlock])

  return {
    phase,
    operatorName,
    error,
    unlock,
    register,
  }
}
