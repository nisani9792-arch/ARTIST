import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { JUSIC_BUMP } from '../../design/motion'

export type SplitMenuItem = {
  id: string
  label: string
  icon?: ReactNode
  onSelect: () => void
}

type M3SplitButtonProps = {
  label: string
  icon?: ReactNode
  onPrimaryClick: () => void
  menuItems?: SplitMenuItem[]
  className?: string
  disabled?: boolean
}

export const M3SplitButton = ({
  label,
  icon,
  onPrimaryClick,
  menuItems = [],
  className,
  disabled = false,
}: M3SplitButtonProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const hasMenu = menuItems.length > 0

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <div className="m3-ex-split">
        <button
          type="button"
          className="m3-ex-split__main"
          disabled={disabled}
          onClick={onPrimaryClick}
        >
          {icon}
          <span>{label}</span>
        </button>
        {hasMenu && (
          <motion.button
            type="button"
            className="m3-ex-split__menu"
            aria-expanded={open}
            aria-haspopup="menu"
            disabled={disabled}
            animate={{ scale: open ? 0.94 : 1 }}
            transition={JUSIC_BUMP}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown size={14} />
          </motion.button>
        )}
      </div>

      {open && hasMenu && (
        <motion.div
          className="m3-ex-split__dropdown"
          role="menu"
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={JUSIC_BUMP}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="m3-ex-split__dropdown-item"
              onClick={() => {
                item.onSelect()
                setOpen(false)
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}
