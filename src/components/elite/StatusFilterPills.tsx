import type { StatusFilter } from '../../types'
import type { HeaderStats } from '../../api/artists'

const PILLS = [
  { id: 'all' as const, label: 'כולם', icon: null },
  { id: 'signed' as const, label: 'חתומים', icon: '✅' },
  { id: 'in_process' as const, label: 'בעבודה', icon: '⚠️' },
  { id: 'unsigned' as const, label: 'לא חתומים', icon: '⏳' },
]

type StatusFilterPillsProps = {
  active: StatusFilter
  stats?: HeaderStats | null
  onChange: (value: StatusFilter) => void
}

const countFor = (id: StatusFilter, stats?: HeaderStats | null) => {
  if (!stats) return null
  if (id === 'all') return stats.total
  if (id === 'signed') return stats.signed
  if (id === 'in_process') return stats.in_process
  if (id === 'unsigned') return stats.unsigned
  return null
}

export const StatusFilterPills = ({ active, stats, onChange }: StatusFilterPillsProps) => (
  <div className="elite-pills" role="group" aria-label="סינון סטטוס">
    {PILLS.map((pill) => {
      const count = countFor(pill.id, stats)
      return (
        <button
          key={pill.id}
          type="button"
          className={`elite-pill ${active === pill.id ? 'elite-pill--active' : ''}`}
          onClick={() => onChange(active === pill.id ? 'all' : pill.id)}
        >
          {pill.icon && <span aria-hidden>{pill.icon}</span>}
          {pill.label}
          {count != null && <span>({count.toLocaleString('he-IL')})</span>}
        </button>
      )
    })}
  </div>
)
