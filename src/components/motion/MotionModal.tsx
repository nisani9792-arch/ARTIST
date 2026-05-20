import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type MotionModalProps = {
  children: ReactNode
  className?: string
  'aria-labelledby'?: string
}

const modalSpring = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.75 }

export const MotionModal = ({
  children,
  className = 'form-modal',
  'aria-labelledby': ariaLabelledBy,
}: MotionModalProps) => (
  <motion.div
    role="dialog"
    aria-modal="true"
    aria-labelledby={ariaLabelledBy}
    className={className}
    initial={{ opacity: 0, scale: 0.94, y: 12 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96, y: 8 }}
    transition={modalSpring}
  >
    {children}
  </motion.div>
)
