import type { SignatureStatus } from '../../../data/types'
import type { CrmArtist } from '../../../types'

export const FUNNEL_STATUSES: SignatureStatus[] = ['unsigned', 'stuck', 'signed']

export const nextFunnelStatus = (status: SignatureStatus): SignatureStatus => {
  const index = FUNNEL_STATUSES.indexOf(status)
  return FUNNEL_STATUSES[(index + 1) % FUNNEL_STATUSES.length]
}

export const displayName = (artist: CrmArtist) =>
  artist.nameHe || artist.nameEn || 'ללא שם'

export const formatLastActivity = (updatedAt?: string) => {
  if (!updatedAt) return 'אין פעילות רשומה'
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return 'אין פעילות רשומה'

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return 'היום'
  if (diffDays === 1) return 'אתמול'
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

/** תווית חוזה נגזרת מסטטוס — אין שדה תאריך פג תוקף ב-DB */
export const contractStatusLabel = (status: SignatureStatus) => {
  if (status === 'signed') return 'חוזה פעיל'
  if (status === 'stuck') return 'משא ומתן / חסום'
  return 'ממתין לחתימה'
}

export const mailtoForArtist = (artist: CrmArtist) => {
  const name = displayName(artist)
  const subject = encodeURIComponent(`JUSIC ARTIST — ${name}`)
  const body = encodeURIComponent(
    `שלום ${name},\n\n` +
      `סטטוס: ${artist.status}\n` +
      `גורם מטפל: ${artist.owner}\n`,
  )
  return `mailto:?subject=${subject}&body=${body}`
}

export const triggerHaptic = (pattern: number | number[] = 8) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}
