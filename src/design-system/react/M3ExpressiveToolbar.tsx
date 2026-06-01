import { Search } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { M3ShapeMorphGroup, type MorphGroupItem } from "./M3ShapeMorphGroup";
import { M3SplitButton, type SplitMenuItem } from "./M3SplitButton";
import { M3WaveformProgress, M3WaveformStrip, type WaveformState } from "./M3WaveformProgress";

export type { MorphGroupItem, SplitMenuItem, WaveformState };

export type M3ToolbarMetric = {
  label: string;
  value: number;
  tone?: "primary" | "amber" | "muted";
};

export type M3ExpressiveToolbarProps = {
  /** Page-header mode */
  variant?: "workspace" | "header";
  title?: string;
  subtitle?: string;
  /** 0–100 strip progress (header variant) */
  stripProgress?: number;

  /** Workspace: inline search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Shape-morphing segmented control */
  morphItems?: MorphGroupItem[];
  morphValue?: string;
  onMorphChange?: (id: string) => void;
  morphAriaLabel?: string;

  /** Icon morph group (view mode) */
  viewItems?: MorphGroupItem[];
  viewValue?: string;
  onViewChange?: (id: string) => void;
  viewAriaLabel?: string;

  /** Flexible filter slot */
  children?: ReactNode;

  trailing?: ReactNode;
  metrics?: M3ToolbarMetric[];

  count?: number;
  selectedCount?: number;
  syncProgress?: number;
  syncState?: WaveformState;

  primaryAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    menu?: SplitMenuItem[];
  };

  sticky?: boolean;
  compressOnScroll?: boolean;
  className?: string;
};

function metricClass(tone?: M3ToolbarMetric["tone"]): string {
  if (tone === "amber") return "jm3-metric-chip jm3-metric-chip--amber";
  if (tone === "primary") return "jm3-metric-chip jm3-metric-chip--primary";
  return "jm3-metric-chip jm3-metric-chip--muted";
}

export const M3ExpressiveToolbar = ({
  variant = "workspace",
  title,
  subtitle,
  stripProgress,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "חיפוש...",
  morphItems,
  morphValue,
  onMorphChange,
  morphAriaLabel = "סינון",
  viewItems,
  viewValue,
  onViewChange,
  viewAriaLabel = "תצוגה",
  children,
  trailing,
  metrics = [],
  count,
  selectedCount = 0,
  syncProgress = 0,
  syncState = "idle",
  primaryAction,
  sticky = true,
  compressOnScroll = true,
  className,
}: M3ExpressiveToolbarProps) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const compact = useTransform(scrollY, [0, 72], [0, 1]);
  const padY = useTransform(compact, [0, 1], [8, 4]);
  const glowOpacity = useTransform(compact, [0, 1], [0.65, 0.25]);

  const isHeader = variant === "header";

  return (
    <motion.header
      ref={ref}
      className={cn(
        "jm3-ex-toolbar",
        sticky && "jm3-ex-toolbar--sticky",
        isHeader && "jm3-ex-toolbar--header",
        className,
      )}
      aria-label={isHeader ? title : "סרגל עבודה"}
      style={
        compressOnScroll && sticky ? { paddingBlock: padY } : undefined
      }
    >
      {stripProgress != null ? <M3WaveformStrip value={stripProgress} /> : null}

      <motion.div
        className="jm3-ex-toolbar__glow"
        aria-hidden
        style={compressOnScroll ? { opacity: glowOpacity } : undefined}
      />

      <div className="jm3-ex-toolbar__row">
        {isHeader && title ? (
          <div className="jm3-ex-toolbar__title-block">
            <h1 className="jm3-ex-toolbar__title">{title}</h1>
            {subtitle ? <p className="jm3-ex-toolbar__subtitle">{subtitle}</p> : null}
          </div>
        ) : null}

        {onSearchChange ? (
          <label className="jm3-ex-toolbar__search">
            <Search size={14} className="jm3-ex-toolbar__search-icon" aria-hidden />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="חיפוש"
            />
          </label>
        ) : null}

        {morphItems && morphValue != null && onMorphChange ? (
          <M3ShapeMorphGroup
            items={morphItems}
            value={morphValue}
            onChange={onMorphChange}
            aria-label={morphAriaLabel}
          />
        ) : null}

        <div className="jm3-ex-toolbar__filters">{children}</div>

        {viewItems && viewValue != null && onViewChange ? (
          <M3ShapeMorphGroup
            items={viewItems}
            value={viewValue}
            onChange={onViewChange}
            iconOnly
            aria-label={viewAriaLabel}
          />
        ) : null}

        {metrics.length > 0 ? (
          <div className="jm3-ex-toolbar__metrics">
            {metrics.map((m) => (
              <span key={m.label} className={metricClass(m.tone)} title={m.label}>
                <span className="jm3-metric-chip__label">{m.label}</span>
                {m.value.toLocaleString("he-IL")}
              </span>
            ))}
          </div>
        ) : null}

        {(syncState !== "idle" || count != null) && (
          <div className="jm3-ex-toolbar__status">
            {syncState !== "idle" ? (
              <M3WaveformProgress progress={syncProgress} state={syncState} />
            ) : null}
            {count != null ? (
              <span className="jm3-ex-toolbar__meta">
                {count.toLocaleString("he-IL")}
                {selectedCount > 0 ? ` · ${selectedCount} נבחרו` : ""}
              </span>
            ) : null}
          </div>
        )}

        <div className="jm3-ex-toolbar__trailing">
          {trailing}
          {primaryAction ? (
            <M3SplitButton
              label={primaryAction.label}
              icon={primaryAction.icon}
              onPrimaryClick={primaryAction.onClick}
              menuItems={primaryAction.menu}
            />
          ) : null}
        </div>
      </div>
    </motion.header>
  );
};
