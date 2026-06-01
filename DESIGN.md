# Jusic Unified Design System — M3 Expressive (May 2026)

**Single source of truth** for three interconnected platforms:

| Platform | Repo / path | Stack | Shell |
|----------|-------------|-------|-------|
| **Jusic Artist CRM** | `ARTIST` | Vite + React 19 + Tailwind v4 | `ArtistsWorkspaceHeader` |
| **Jusic Elite Pro** | `SERVICE` | Next.js 14 + Tailwind v3 | `CrmWorkspaceHeader` |
| **Jusic Play / Consumer** | `PLAYLIST` | Vite monorepo | Workspace studio |

> **Rule:** Edit tokens only in `src/design-system/tokens/`. Copy or symlink into sibling repos, or run a future `design:sync` script.

---

## 1. Design principles

### M3 Expressive 2026

1. **Token-first** — No magic numbers in components. Use `--jm3-*` CSS variables or `design-system/tokens/*` TS exports.
2. **Motion physics** — Shape morphs and layout shifts use spring curves (`JM3_SPRING_MORPH`), not linear tweens.
3. **Expressive density** — Operator UIs: 36–44px rows, 48px toolbars, high information density without clutter.
4. **RTL-native** — `dir="rtl"` on root; logical properties (`margin-inline-start`, `inset-inline-end`).
5. **Reduced motion** — All durations collapse to `0ms` when `prefers-reduced-motion: reduce`.

### Antigravity-inspired AI aesthetics

- **Mesh canvas** — `--jm3-gradient-canvas` (soft cyan + slate radials)
- **Glass surfaces** — `--jm3-glass-bg` + `--jm3-glass-blur` + `--jm3-glass-edge`
- **Primary glow** — focus/active halos via `--jm3-glow-primary`
- **AI accent lane** — violet tertiary (`--jm3-color-tertiary`) for generative / assistant UI
- **Context transitions** — scroll-compress toolbars, morphing segmented controls, waveform sync indicators

### Mobile-first ergonomics

- Touch targets ≥ `--jm3-touch-min` (44px)
- Filter rows: horizontal scroll with `scroll-snap` (no wrap on narrow viewports)
- Search field full-width, ordered first on mobile
- Bottom sheets (planned P2) for overflow actions

---

## 2. Token architecture

All tokens use the **`--jm3-*`** prefix. Legacy `--jusic-*`, `--m3-*`, and app aliases (`--accent`, `--surface`) bridge automatically in `jusic-m3-tokens.css`.

### 2.1 Color roles (Material 3)

| Token | Role |
|-------|------|
| `--jm3-color-primary` | Brand cyan — primary actions, active nav |
| `--jm3-color-primary-container` | Tinted fills, focus rings |
| `--jm3-color-on-primary` | Text/icons on primary |
| `--jm3-color-secondary` | Teal — secondary actions |
| `--jm3-color-tertiary` | Violet — AI / generative accent |
| `--jm3-color-surface` | Page background |
| `--jm3-color-surface-container*` | Cards, panels, glass layers |
| `--jm3-color-on-surface` | Primary text |
| `--jm3-color-on-surface-variant` | Secondary text, placeholders |
| `--jm3-color-outline*` | Borders, dividers |
| `--jm3-color-error/warning/success` | Semantic states |

### 2.2 Typography

| Token | Use |
|-------|-----|
| `--jm3-font-family` | Heebo + system UI (Hebrew-first) |
| `--jm3-type-display-sm` | Page titles |
| `--jm3-type-title-md/sm` | Section / toolbar titles |
| `--jm3-type-body-md/sm` | Body copy, inputs |
| `--jm3-type-label-sm/xs` | Chips, meta, table headers |

### 2.3 Shape morphing

Corners morph between states using `--jm3-shape-morph-duration` + `--jm3-shape-morph-ease`:

| Token | Radius | Typical use |
|-------|--------|-------------|
| `--jm3-shape-xs` | 6px | Micro chips |
| `--jm3-shape-sm` | 10px | Buttons, inputs |
| `--jm3-shape-md` | 14px | Cards, morph groups |
| `--jm3-shape-lg` | 18px | Panels |
| `--jm3-shape-xl` | 24px | Modals, bottom sheets |
| `--jm3-shape-full` | pill | Segmented indicators, FABs |

**Framer mirror:** `JM3_SHAPE` in `tokens/shape.ts`, springs in `tokens/motion.ts`.

### 2.4 Motion physics

| CSS token | Value | Use |
|-----------|-------|-----|
| `--jm3-motion-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Hover, color |
| `--jm3-motion-ease-emphasized` | `cubic-bezier(0.22, 1, 0.36, 1)` | Enter/exit, morph |
| `--jm3-motion-ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interactions |
| `--jm3-motion-duration-short` | 150ms | Hover |
| `--jm3-motion-duration-medium` | 280ms | Panel open |
| `--jm3-motion-duration-long` | 420ms | Page transition |
| `--jm3-spring-stiffness/damping/mass` | 380 / 32 / 0.85 | Default spring |
| `--jm3-spring-bump-*` | 620 / 18 | Neighbor bump in morph groups |
| `--jm3-spring-morph-*` | 480 / 34 | Indicator pill slide |

**JS exports:** `JM3_SPRING`, `JM3_SPRING_MORPH`, `JM3_SPRING_BUMP`, `JM3_TOOLBAR_COMPRESS`.

### 2.5 Elevation & glass

| Token | Use |
|-------|-----|
| `--jm3-elevation-0…3` | Layered shadows |
| `--jm3-glass-bg` | Toolbar / overlay fill |
| `--jm3-glass-blur` | `blur(20px) saturate(1.15)` |
| `--jm3-glow-primary` | CTA / active glow |
| `--jm3-glow-ai` | Assistant panel glow |

### 2.6 Layout chrome

| Token | Default |
|-------|---------|
| `--jm3-toolbar-height` | 48px |
| `--jm3-toolbar-height-compact` | 40px (scroll-compressed) |
| `--jm3-row-height` | 44px |
| `--jm3-row-height-compact` | 36px |
| `--jm3-rail-width` | 52px |
| `--jm3-bottom-sheet-radius` | `--jm3-shape-xl` |

---

## 3. File map (canonical)

```
DESIGN.md                                      ← this document
src/design-system/
  tokens/
    jusic-m3-tokens.css                        ← CSS single source of truth
    index.ts                                   ← programmatic tokens
    motion.ts                                  ← Framer spring constants
    shape.ts                                   ← radius keys
  react/
    M3ExpressiveToolbar.tsx                    ← P0 adaptive toolbar
    M3ShapeMorphGroup.tsx                      ← bump morph segments
    M3SplitButton.tsx                          ← split CTA + menu
    M3WaveformProgress.tsx                     ← inline + strip waveform
    m3-expressive-toolbar.css                  ← component styles
    index.ts
src/components/m3/                             ← re-exports (app alias)
src/design/                                    ← legacy shims → design-system
```

---

## 4. Core components

### P0 — `M3ExpressiveToolbar` ✅

Adaptive workspace toolbar demonstrating all M3 Expressive patterns:

| Feature | Implementation |
|---------|----------------|
| Shape-morph segments | `M3ShapeMorphGroup` — sliding pill + neighbor bump |
| View mode toggles | Icon-only morph group |
| Split primary CTA | `M3SplitButton` with spring dropdown |
| Sync indicator | `M3WaveformProgress` (inline bars) |
| Scroll compress | Framer `useScroll` → padding + glow fade |
| Glass + glow | CSS `--jm3-glass-*`, `--jm3-gradient-glow-primary` |
| Mobile filters | Horizontal scroll + full-width search |

**Variants:** `workspace` (filters + search) | `header` (title + strip progress)

```tsx
import { M3ExpressiveToolbar } from "@/components/m3";

<M3ExpressiveToolbar
  searchValue={query}
  onSearchChange={setQuery}
  morphItems={[{ id: "all", label: "הכל" }, { id: "signed", label: "חתום" }]}
  morphValue={status}
  onMorphChange={setStatus}
  viewItems={viewModes}
  viewValue={mode}
  onViewChange={setMode}
  count={total}
  syncState={isFetching ? "active" : "idle"}
  primaryAction={{ label: "חדש", onClick: onCreate, menu: [...] }}
>
  {/* filter selects */}
</M3ExpressiveToolbar>
```

### Roadmap

| Priority | Component | Status |
|----------|-----------|--------|
| P0 | Token system + Tailwind `@theme` bridge | ✅ |
| P0 | `M3ExpressiveToolbar` | ✅ |
| P1 | `M3BottomSheet` | Planned |
| P1 | `M3AdaptiveNavigationRail` | Planned (SERVICE) |
| P2 | `M3ContextTransition` (route morph) | Planned |
| P2 | Skeleton loaders (dimension-matched) | Planned |

---

## 5. Performance rules

1. **CSS first** — hover/focus/active via CSS; JS motion only for layout morph + scroll physics.
2. **Framer Motion scope** — toolbar, morph groups, sheets — never per-row in virtualized lists.
3. **Virtualize** lists > 30 rows (`@tanstack/react-virtual`).
4. **Skeletons** match final layout dimensions (zero CLS).
5. **Memo** row components; stable callback refs for handlers.

---

## 6. Cross-platform integration

### ARTIST (Vite)

```css
/* src/index.css */
@import "./design-system/tokens/jusic-m3-tokens.css";
@import "./design-system/react/m3-expressive-toolbar.css";
```

```tsx
import { M3ExpressiveToolbar } from "./components/m3";
```

### SERVICE (Next.js)

```css
/* src/app/globals.css */
@import "../design-system/tokens/jusic-m3-tokens.css";
@import "../design-system/react/m3-expressive-toolbar.css";
```

Copy `src/design-system/` from ARTIST, or symlink in monorepo.

### Tailwind v4 `@theme` bridge

```css
@theme {
  --color-jm3-primary: var(--jm3-color-primary);
  --radius-jm3-md: var(--jm3-shape-md);
  --ease-jm3-emphasized: var(--jm3-motion-ease-emphasized);
}
```

Use as `bg-jm3-primary`, `rounded-jm3-md`, etc.

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-28 | Unified `--jm3-*` token file with legacy bridges |
| 2026-05-28 | Consolidated `M3ExpressiveToolbar` + morph/split/waveform in `design-system/react` |
| 2026-05-28 | Scroll-compress physics, mobile filter scroll, DESIGN.md blueprint |
