import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type PageTransitionProps = {
  children: ReactNode
  className?: string
}

export const PageTransition = ({ children, className }: PageTransitionProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
  >
    {children}
  </motion.div>
)
