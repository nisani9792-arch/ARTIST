import { motion } from 'framer-motion'
import type { MouseEventHandler } from 'react'

type MotionBackdropProps = {
  onClick: MouseEventHandler<HTMLButtonElement>
  className?: string
  'aria-label'?: string
}

export const MotionBackdrop = ({
  onClick,
  className = 'panel-backdrop',
  'aria-label': ariaLabel = 'סגור',
}: MotionBackdropProps) => (
  <motion.button
    type="button"
    className={className}
    aria-label={ariaLabel}
    onClick={onClick}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
  />
)
