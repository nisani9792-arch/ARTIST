import { useEffect, useState } from 'react'

const STORAGE_KEY = 'artist-crm-unlocked'
const RESET_MS = 1600

export const useUnlockGate = () => {
  const [unlocked, setUnlocked] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1',
  )
  const [pressCount, setPressCount] = useState(0)

  useEffect(() => {
    if (unlocked) return

    let resetTimer: ReturnType<typeof setTimeout> | undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return
      event.preventDefault()

      setPressCount((current) => {
        const next = current + 1
        if (next >= 3) {
          sessionStorage.setItem(STORAGE_KEY, '1')
          setUnlocked(true)
          return 0
        }
        return next
      })

      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => setPressCount(0), RESET_MS)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(resetTimer)
    }
  }, [unlocked])

  return { unlocked, pressCount, requiredPresses: 3 }
}
