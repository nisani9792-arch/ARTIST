import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { MorphGroupItem } from './M3ShapeMorphGroup'
import { M3ShapeMorphGroup } from './M3ShapeMorphGroup'
import { M3SplitButton, type SplitMenuItem } from './M3SplitButton'
import { M3WaveformProgress, type WaveformState } from './M3WaveformProgress'

export type M3ExpressiveToolbarProps = {
  /** Inline search */
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string

  /** Shape-morphing segmented control (e.g. status filters) */
  morphItems?: MorphGroupItem[]
  morphValue?: string
  onMorphChange?: (id: string) => void
  morphAriaLabel?: string

  /** Icon morph group (e.g. view mode) */
  viewItems?: MorphGroupItem[]
  viewValue?: string
  onViewChange?: (id: string) => void
  viewAriaLabel?: string

  /** Flexible filter slot (selects, chips) */
  children?: ReactNode

  /** Right-side actions */
  trailing?: ReactNode

  /** Result count meta */
  count?: number
  selectedCount?: number

  /** Sync / fetch indicator */
  syncProgress?: number
  syncState?: WaveformState

  /** Primary split action */
  primaryAction?: {
    label: string
    icon?: ReactNode
    onClick: () => void
    menu?: SplitMenuItem[]
  }

  sticky?: boolean
  className?: string
}

export const M3ExpressiveToolbar = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'חיפוש...',
  morphItems,
  morphValue,
  onMorphChange,
  morphAriaLabel = 'סינון',
  viewItems,
  viewValue,
  onViewChange,
  viewAriaLabel = 'תצוגה',
  children,
  trailing,
  count,
  selectedCount = 0,
  syncProgress = 0,
  syncState = 'idle',
  primaryAction,
  sticky = true,
  className,
}: M3ExpressiveToolbarProps) => (
  <header
    className={cn('m3-ex-toolbar', sticky && 'm3-ex-toolbar--sticky', className)}
    aria-label="סרגל עבודה"
  >
    {onSearchChange && (
      <label className="m3-ex-toolbar__search">
        <Search size={14} className="shrink-0 text-[var(--jusic-color-on-surface-variant)]" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="חיפוש"
        />
      </label>
    )}

    {morphItems && morphValue != null && onMorphChange && (
      <M3ShapeMorphGroup
        items={morphItems}
        value={morphValue}
        onChange={onMorphChange}
        aria-label={morphAriaLabel}
      />
    )}

    <div className="m3-ex-toolbar__filters">{children}</div>

    {viewItems && viewValue != null && onViewChange && (
      <M3ShapeMorphGroup
        items={viewItems}
        value={viewValue}
        onChange={onViewChange}
        iconOnly
        aria-label={viewAriaLabel}
      />
    )}

    {(syncState !== 'idle' || count != null) && (
      <div className="flex items-center gap-2">
        {syncState !== 'idle' && (
          <M3WaveformProgress progress={syncProgress} state={syncState} />
        )}
        {count != null && (
          <span className="m3-ex-toolbar__meta">
            {count.toLocaleString('he-IL')}
            {selectedCount > 0 ? ` · ${selectedCount} נבחרו` : ''}
          </span>
        )}
      </div>
    )}

    <div className="m3-ex-toolbar__trailing">
      {trailing}
      {primaryAction && (
        <M3SplitButton
          label={primaryAction.label}
          icon={primaryAction.icon}
          onPrimaryClick={primaryAction.onClick}
          menuItems={primaryAction.menu}
        />
      )}
    </div>
  </header>
)
