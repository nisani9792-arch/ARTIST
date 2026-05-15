import { useCallback, useEffect, useState } from 'react'
import { fetchAccessState, registerOperator as registerOperatorApi } from '../api/access'

export const useOperator = (gateUnlocked: boolean, seedDisplayName?: string | null) => {
  const [displayName, setDisplayName] = useState<string | null>(seedDisplayName ?? null)
  const [loading, setLoading] = useState(gateUnlocked && !seedDisplayName)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!gateUnlocked) {
      setDisplayName(null)
      setLoading(false)
      return
    }

    if (seedDisplayName) {
      setDisplayName(seedDisplayName)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    fetchAccessState()
      .then((access) => {
        if (!active) return
        setDisplayName(access.displayName)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'לא ניתן לטעון פרטי משתמש')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [gateUnlocked, seedDisplayName])

  const register = useCallback(async (name: string) => {
    setError('')
    try {
      const access = await registerOperatorApi(name)
      setDisplayName(access.displayName)
      return access.displayName
    } catch (err) {
      const message = err instanceof Error ? err.message : 'הרישום נכשל'
      setError(message)
      throw err
    }
  }, [])

  return {
    displayName,
    loading,
    error,
    register,
  }
}
