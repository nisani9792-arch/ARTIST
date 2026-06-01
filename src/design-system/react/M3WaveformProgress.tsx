import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "../../lib/cn";
import { WAVEFORM_STAGGER } from "../tokens/motion";

export type WaveformState = "idle" | "active" | "success" | "error";

type M3WaveformProgressProps = {
  /** 0–1 fill level when idle/success */
  progress?: number;
  state?: WaveformState;
  barCount?: number;
  className?: string;
  "aria-label"?: string;
};

const BAR_HEIGHTS = [0.35, 0.55, 0.85, 0.5, 0.7];

export const M3WaveformProgress = ({
  progress = 0,
  state = "idle",
  barCount = 5,
  className,
  "aria-label": ariaLabel = "סטטוס סנכרון",
}: M3WaveformProgressProps) => {
  const bars = useMemo(() => Array.from({ length: barCount }, (_, i) => i), [barCount]);
  const active = state === "active";

  return (
    <div
      className={cn(
        "jm3-waveform-inline",
        `jm3-waveform-inline--${state}`,
        active && "jm3-waveform-inline--active",
        className,
      )}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      {bars.map((i) => {
        const base = BAR_HEIGHTS[i % BAR_HEIGHTS.length] ?? 0.5;
        const height = active ? base : Math.max(0.2, progress * base);

        return (
          <motion.span
            key={i}
            className="jm3-waveform-inline__bar"
            animate={
              active
                ? { scaleY: [base, base * 1.35, base * 0.65, base * 1.2, base] }
                : { scaleY: height }
            }
            transition={
              active
                ? {
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * WAVEFORM_STAGGER,
                    ease: "easeInOut",
                  }
                : { duration: 0.25 }
            }
            style={{ height: `${height * 100}%` }}
          />
        );
      })}
    </div>
  );
};

/** Full-width strip variant (page headers, sync bars) */
export type WaveformStripProps = {
  value: number;
  className?: string;
  animated?: boolean;
};

export const M3WaveformStrip = ({
  value,
  className = "",
  animated = true,
}: WaveformStripProps) => {
  const pct = Math.min(100, Math.max(0, value));
  const bars = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  return (
    <div
      className={`jm3-waveform ${className}`.trim()}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="jm3-waveform__fill" style={{ transform: `scaleX(${pct / 100})` }} />
      {animated && pct > 0 && pct < 100 ? (
        <div className="jm3-waveform__bars" aria-hidden>
          {bars.map((i) => (
            <span
              key={i}
              className="jm3-waveform__bar"
              style={{
                height: `${28 + ((i * 17) % 72)}%`,
                animationDelay: `${(i % 8) * 0.08}s`,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
