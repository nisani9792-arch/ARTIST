import type { SignatureStatus } from '../data/types'

export const HANDLERS = [
  'לא שויך',
  'שימון',
  'ניהול זכויות',
  'סוכן חיצוני',
  'מעקב חוזים',
  'שימור קשר',
] as const

export const STATUS_META: Record<SignatureStatus, { label: string; tone: string }> = {
  signed: { label: 'חתום', tone: 'signed' },
  unsigned: { label: 'לא חתום', tone: 'unsigned' },
  stuck: { label: 'תקוע', tone: 'stuck' },
}

export const priorityForStatus = (status: SignatureStatus) => {
  if (status === 'signed') return 'שימור קשר'
  if (status === 'stuck') return 'פתיחת חסם'
  return 'ליצירת קשר'
}

export const CARD_PAGE_SIZES = [48, 96, 144] as const
export const TABLE_PAGE_SIZES = [50, 100, 200] as const
export const BACKUP_REMINDER_DAYS = 7
export const LAST_BACKUP_KEY = 'artist-last-backup'
export const MY_QUEUE_KEY = 'artist-my-queue-preset'
