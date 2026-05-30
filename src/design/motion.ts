import type { Transition, Variants } from 'framer-motion'

/** Shared spring physics — mirror of --jusic-motion-* tokens */
export const JUSIC_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.82,
}

export const JUSIC_BUMP = {
  type: 'spring' as const,
  stiffness: 620,
  damping: 18,
  mass: 0.48,
}

export const JUSIC_MORPH: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 34,
  mass: 0.75,
}

export const JUSIC_TOOLBAR_EXPAND: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
  mass: 0.9,
}

export const morphIndicatorVariants: Variants = {
  idle: { scale: 1 },
  active: { scale: 1.02 },
}

export const bumpNeighborVariants: Variants = {
  rest: { scale: 1, x: 0 },
  bump: { scale: 0.96, x: 0 },
  bumpOpposite: { scale: 0.96, x: 0 },
}

/** Waveform bar animation stagger (ms) */
export const WAVEFORM_STAGGER = 0.08
