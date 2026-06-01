import type { Transition, Variants } from "framer-motion";

/** CSS: --jm3-motion-ease-emphasized */
export const JM3_EASE_EMPHASIZED = [0.22, 1, 0.36, 1] as const;

/** Default layout / indicator spring — mirrors --jm3-spring-* */
export const JM3_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.85,
};

export const JM3_SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 520,
  damping: 38,
  mass: 0.75,
};

/** Segmented control morph pill */
export const JM3_SPRING_MORPH: Transition = {
  type: "spring",
  stiffness: 480,
  damping: 34,
  mass: 0.75,
};

/** Neighbor bump on shape-morph groups */
export const JM3_SPRING_BUMP: Transition = {
  type: "spring",
  stiffness: 620,
  damping: 18,
  mass: 0.48,
};

/** Toolbar scroll compress */
export const JM3_TOOLBAR_COMPRESS: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 28,
  mass: 0.9,
};

export const JM3_DURATION = {
  instant: 0.1,
  short: 0.15,
  medium: 0.28,
  long: 0.42,
} as const;

export const WAVEFORM_STAGGER = 0.08;

export const morphIndicatorVariants: Variants = {
  idle: { scale: 1 },
  active: { scale: 1.02 },
};

/** Legacy aliases — migrate imports to JM3_* */
export const JUSIC_SPRING = JM3_SPRING;
export const JUSIC_BUMP = JM3_SPRING_BUMP;
export const JUSIC_MORPH = JM3_SPRING_MORPH;
export const JUSIC_TOOLBAR_EXPAND = JM3_TOOLBAR_COMPRESS;
