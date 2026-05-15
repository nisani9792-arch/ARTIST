const STORAGE_KEY = 'artist_operator_name'

export const getStoredOperatorName = (): string | null => {
  if (typeof localStorage === 'undefined') return null
  const name = localStorage.getItem(STORAGE_KEY)?.trim()
  if (!name || name.length < 2) return null
  return name.slice(0, 40)
}

export const setStoredOperatorName = (name: string): void => {
  const trimmed = name.trim().slice(0, 40)
  if (trimmed.length >= 2) {
    localStorage.setItem(STORAGE_KEY, trimmed)
  }
}
