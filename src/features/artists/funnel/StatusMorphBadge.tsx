import { LayoutGroup, motion } from 'framer-motion'
import type { MouseEvent } from 'react'
import type { SignatureStatus } from '../../../data/types'

type StatusMorphBadgeProps = {
  status: SignatureStatus
  label: string
  tone: string
  layoutId?: string
  onClick?: (event: MouseEvent) => void
  compact?: boolean
}

export const StatusMorphBadge = ({
  status,
  label,
  tone,
  layoutId,
  onClick,
  compact = false,
}: StatusMorphBadgeProps) => (
  <LayoutGroup id={layoutId ?? `status-${status}`}>
    <motion.button
      type="button"
      className={`funnel-status-badge badge ${tone} ${compact ? 'funnel-status-badge--compact' : ''}`}
      layoutId={layoutId ? `${layoutId}-pill` : undefined}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
      aria-label={`סטטוס: ${label}. לחץ לעדכון`}
    >
      <motion.span
        key={status}
        className="funnel-status-badge-label"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
      >
        {label}
      </motion.span>
    </motion.button>
  </LayoutGroup>
)
