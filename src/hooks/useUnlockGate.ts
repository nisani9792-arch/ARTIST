import { useCallback, useEffect, useState } from 'react'
import { fetchAccessState, unlockGate } from '../api/access'

const RESET_MS = 1600
const REQUIRED_PRESSES = 3

export const useUnlockGate = () => {
  const [gateUnlocked, setGateUnlocked] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)

  const applyAccess = useCallback((access: { gateUnlocked: boolean; displayName: string | null }) => {
    setGateUnlocked(access.gateUnlocked)
    setDisplayName(access.displayName)
  }, [])

  const unlock = useCallback(async () => {
    if (unlocking) return
    setUnlocking(true)
    try {
      const access = await unlockGate()
      applyAccess(access)
    } finally {
      setUnlocking(false)
    }
  }, [applyAccess, unlocking])

  useEffect(() => {
    let active = true

    fetchAccessState()
      .then((access) => {
        if (!active) return
        applyAccess(access)
      })
      .catch(() => {
        if (!active) return
        applyAccess({ gateUnlocked: false, displayName: null })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [applyAccess])

  useEffect(() => {
    if (gateUnlocked || loading) return

    let resetTimer: ReturnType<typeof setTimeout> | undefined
    let pressCount = 0

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return
      event.preventDefault()

      pressCount += 1
      if (pressCount >= REQUIRED_PRESSES) {
        void unlock()
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
  }, [gateUnlocked, loading, unlock])

  return { unlocked: gateUnlocked, displayName, loading, unlocking, unlock }
}
