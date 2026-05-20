import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type MotionPanelProps = {
  children: ReactNode
  className?: string
  'aria-label'?: string
}

const panelSpring = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.85 }

export const MotionPanel = ({ children, className = 'detail-panel', 'aria-label': ariaLabel }: MotionPanelProps) => (
  <motion.aside
    className={className}
    aria-label={ariaLabel}
    initial={{ x: '100%', opacity: 0.6 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: '100%', opacity: 0 }}
    transition={panelSpring}
  >
    {children}
  </motion.aside>
)
