/**
 * Canonical screen layout, derived from `docs/design/design.pen`.
 *
 * The PhoneShell (`saexg`) and StatusBar (`v0nSM`) are design-frame constructs
 * (372×780) — never shipped as a literal phone frame. They establish the screen
 * envelope: an `$app-bg` canvas inset by the device safe areas (status bar at
 * top, home indicator at bottom). Inside that, every content screen uses the
 * same content box — measured from the Home screen's Scroll frame (`RW9TL`),
 * whose `padding` is `[14, 16, 18, 16]` (top/right/bottom/left), fill `$app-bg`,
 * and vertical `gap` 14 between stacked cards.
 *
 * These are the single source for the `Screen` scaffold so downstream screens
 * inherit the same gutter, rhythm, and canvas instead of re-deriving padding.
 */
export const screenLayout = {
  /** Horizontal content gutter (left == right). */
  paddingHorizontal: 16,
  /** Content top padding, below the safe-area / status bar. */
  paddingTop: 14,
  /** Content bottom padding, above the tab bar / home indicator. */
  paddingBottom: 18,
  /** Default vertical gap between stacked content blocks. */
  gap: 14,
} as const;
