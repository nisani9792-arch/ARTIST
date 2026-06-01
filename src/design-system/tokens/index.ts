export * from "./motion";
export * from "./shape";

/** Programmatic color access (charts, canvas, Framer) */
export const jm3Colors = {
  primary: "#29abe2",
  onPrimary: "#ffffff",
  primaryContainer: "rgba(41, 171, 226, 0.14)",
  tertiary: "#7c3aed",
  tertiaryContainer: "rgba(124, 58, 237, 0.1)",
  surface: "#f6f8fa",
  surfaceContainer: "#eef2f5",
  onSurface: "#1a1c1e",
  onSurfaceVariant: "#5c6268",
  outline: "rgba(85, 85, 85, 0.22)",
  success: "#0d9f6e",
  warning: "#b07808",
  error: "#c94a4a",
} as const;

export const jm3CssVar = {
  primary: "--jm3-color-primary",
  surface: "--jm3-color-surface",
  motionEmphasized: "--jm3-motion-ease-emphasized",
  shapeMd: "--jm3-shape-md",
  glassBg: "--jm3-glass-bg",
  springStiffness: "--jm3-spring-stiffness",
} as const;

export type Jm3ColorRole = keyof typeof jm3Colors;
