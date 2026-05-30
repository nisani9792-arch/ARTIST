import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { JUSIC_MORPH } from '../../design/motion'

export type MorphGroupItem = {
  id: string
  label: string
  icon?: ReactNode
  title?: string
}

type M3ShapeMorphGroupProps = {
  items: MorphGroupItem[]
  value: string
  onChange: (id: string) => void
  /** Icon-only compact mode (view toggles) */
  iconOnly?: boolean
  className?: string
  'aria-label'?: string
}

export const M3ShapeMorphGroup = ({
  items,
  value,
  onChange,
  iconOnly = false,
  className,
  'aria-label': ariaLabel,
}: M3ShapeMorphGroupProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [indicator, setIndicator] = useState({ width: 0, x: 0 })

  const measure = useCallback(() => {
    const btn = btnRefs.current.get(value)
    const container = containerRef.current
    if (!btn || !container) return
    const cRect = container.getBoundingClientRect()
    const bRect = btn.getBoundingClientRect()
    setIndicator({ width: bRect.width, x: bRect.left - cRect.left })
  }, [value])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const delta = event.key === 'ArrowLeft' ? 1 : -1
    const next = (index + delta + items.length) % items.length
    onChange(items[next]!.id)
    btnRefs.current.get(items[next]!.id)?.focus()
  }

  return (
    <div
      ref={containerRef}
      className={cn('m3-ex-morph-group', iconOnly && 'm3-ex-morph-group--icon', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      <motion.span
        className="m3-ex-morph-group__indicator"
        layout
        animate={{ width: indicator.width, x: indicator.x }}
        transition={JUSIC_MORPH}
        aria-hidden
      />
      {items.map((item, index) => {
        const active = item.id === value
        const activeIndex = items.findIndex((i) => i.id === value)
        const distance = Math.abs(index - activeIndex)
        const bump = active ? 1 : distance === 1 ? 0.97 : 1

        return (
          <motion.button
            key={item.id}
            ref={(el) => {
              if (el) btnRefs.current.set(item.id, el)
              else btnRefs.current.delete(item.id)
            }}
            type="button"
            role="tab"
            aria-selected={active}
            title={item.title ?? item.label}
            className={cn('m3-ex-morph-group__btn', active && 'm3-ex-morph-group__btn--active')}
            animate={{ scale: bump }}
            transition={JUSIC_MORPH}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {item.icon ?? item.label}
          </motion.button>
        )
      })}
    </div>
  )
}
