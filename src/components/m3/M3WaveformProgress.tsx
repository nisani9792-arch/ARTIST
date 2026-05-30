import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { cn } from '../../lib/cn'
import { WAVEFORM_STAGGER } from '../../design/motion'

export type WaveformState = 'idle' | 'active' | 'success' | 'error'

type M3WaveformProgressProps = {
  /** 0–1 fill level when idle/success */
  progress?: number
  state?: WaveformState
  barCount?: number
  className?: string
  'aria-label'?: string
}

const BAR_HEIGHTS = [0.35, 0.55, 0.85, 0.5, 0.7]

export const M3WaveformProgress = ({
  progress = 0,
  state = 'idle',
  barCount = 5,
  className,
  'aria-label': ariaLabel = 'סטטוס סנכרון',
}: M3WaveformProgressProps) => {
  const bars = useMemo(() => Array.from({ length: barCount }, (_, i) => i), [barCount])
  const active = state === 'active'

  return (
    <div
      className={cn(
        'm3-ex-waveform',
        `m3-ex-waveform--${state}`,
        active && 'm3-ex-waveform--active',
        className,
      )}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      {bars.map((i) => {
        const base = BAR_HEIGHTS[i % BAR_HEIGHTS.length] ?? 0.5
        const height = active ? base : Math.max(0.2, progress * base)

        return (
          <motion.span
            key={i}
            className="m3-ex-waveform__bar"
            animate={
              active
                ? {
                    scaleY: [base, base * 1.35, base * 0.65, base * 1.2, base],
                  }
                : { scaleY: height }
            }
            transition={
              active
                ? {
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * WAVEFORM_STAGGER,
                    ease: 'easeInOut',
                  }
                : { duration: 0.25 }
            }
            style={{ height: `${height * 100}%` }}
          />
        )
      })}
    </div>
  )
}
