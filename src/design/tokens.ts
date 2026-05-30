/**
 * Jusic Design Tokens — M3 Expressive 2026
 * Import via tokens.css; use this module for programmatic access (Framer, charts, etc.)
 */

export const jusicColors = {
  primary: '#29abe2',
  onPrimary: '#ffffff',
  primaryContainer: 'rgba(41, 171, 226, 0.14)',
  surface: '#f6f8fa',
  surfaceContainer: '#eef2f5',
  surfaceContainerLow: '#f3f5f7',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1e',
  onSurfaceVariant: '#5c6268',
  outline: 'rgba(85, 85, 85, 0.22)',
  outlineVariant: 'rgba(85, 85, 85, 0.12)',
  success: '#0d9f6e',
  warning: '#b07808',
  error: '#c94a4a',
} as const

export const jusicShape = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
  morphDurationMs: 320,
} as const

export const jusicMotion = {
  fast: 150,
  medium: 280,
  slow: 420,
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easeEmphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  easeSpring: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeBounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const jusicSpace = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  touchMin: 44,
} as const

export const jusicType = {
  fontFamily: "'Heebo', 'Plus Jakarta Sans', 'Segoe UI', Assistant, Rubik, system-ui, sans-serif",
  displaySm: '22px',
  titleMd: '17px',
  bodyMd: '14px',
  labelSm: '11px',
  labelXs: '10px',
} as const

/** CSS variable names for dynamic theming */
export const jusicCssVar = {
  primary: '--jusic-color-primary',
  motionSpring: '--jusic-motion-ease-spring',
  shapeMd: '--jusic-shape-md',
  glassBg: '--jusic-glass-bg',
} as const

export type JusicColorRole = keyof typeof jusicColors
export type JusicShapeToken = keyof typeof jusicShape
