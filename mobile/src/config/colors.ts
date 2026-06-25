/**
 * Inflow design tokens.
 *
 * Sourced from the canonical design file `docs/design/design.pen` (the Pencil
 * variable set — see `get_variables`), the binding visual contract. Each token
 * below is the exact light/dark hex declared there; the colors.ts →
 * generate-colors-css.js pipeline parses hex and emits `rgb(var(--color-*))`
 * triplets for NativeWind, and `useColors` reads the same source for inline JS.
 *
 * Token families (use these verbatim — they are the product's design language):
 *   - flow (teal)  = primary / actions / progress / nav            (--flow)
 *   - warm (amber) = Absorbed Items / North Star / Streak          (--warm)
 *   - ink          = text (primary / secondary / tertiary)
 *   - surface / bg = cards, sheets, canvas
 *   - hair / border = dividers and borders
 *   - danger       = destructive / error
 *
 * The legacy boilerplate semantic names (primary, foreground, background,
 * neutrals*, …) are kept as aliases mapped onto the Inflow families so the whole
 * app re-themes from these tokens with no per-screen hardcoded colors.
 *
 * NOTE: `AppColors` is the DARK set (it drives Tailwind utility-name generation
 * in tailwind.config.js and the `.dark` block in generated/colors.css);
 * `AppColorsLight` is the LIGHT set mapped to `:root`.
 */

// Dark set — design.pen `mode: dark`
export const AppColors = {
  // --- Inflow tokens ---
  flow: '#4fb6c5',
  flowPress: '#3ca3b3',
  flowInk: '#84cfda',
  flowSoft: '#294751',
  warm: '#e5ab5e',
  warmInk: '#e8b877',
  warmSoft: '#493826',
  onFlow: '#1a2028',
  ink: '#eff1f4',
  ink2: '#afb6bf',
  ink3: '#828b96',
  bg: '#1a1e24',
  bg2: '#22262d',
  appBg: '#22272e',
  surface: '#2a2f37',
  surface2: '#252a31',
  hair: '#343a43',

  // --- Legacy semantic aliases (mapped onto Inflow families) ---
  primary: '#4fb6c5',
  secondary: '#4fb6c5',
  primaryForeground: '#1a2028',
  secondaryForeground: '#1a2028',
  foreground: '#eff1f4',
  background: '#1a1e24',
  success: '#4fb6c5',
  warning: '#e5ab5e',
  error: '#e06a5a',
  border: '#3d444e',
  neutrals100: '#afb6bf',
  neutrals200: '#a2a9b2',
  neutrals300: '#8d959e',
  neutrals400: '#828b96',
  neutrals500: '#5a616b',
  neutrals600: '#3d444e',
  neutrals700: '#343a43',
  neutrals800: '#2a2f37',
  neutrals900: '#252a31',
  neutrals1000: '#22272e',
};

// Light set — design.pen `mode: light`
export const AppColorsLight: typeof AppColors = {
  // --- Inflow tokens ---
  flow: '#2c8b9d',
  flowPress: '#1f7888',
  flowInk: '#1b6573',
  flowSoft: '#d7ebf0',
  warm: '#cf8a44',
  warmInk: '#9a5f2a',
  warmSoft: '#f2e2c9',
  onFlow: '#fafdfe',
  ink: '#2c3440',
  ink2: '#5c6775',
  ink3: '#838e9c',
  bg: '#eceff2',
  bg2: '#e1e6ea',
  appBg: '#f8fafb',
  surface: '#ffffff',
  surface2: '#f1f3f5',
  hair: '#e3e6e9',

  // --- Legacy semantic aliases (mapped onto Inflow families) ---
  primary: '#2c8b9d',
  secondary: '#2c8b9d',
  primaryForeground: '#fafdfe',
  secondaryForeground: '#fafdfe',
  foreground: '#2c3440',
  background: '#eceff2',
  success: '#2c8b9d',
  warning: '#cf8a44',
  error: '#c0392b',
  border: '#d7dbdf',
  neutrals100: '#5c6775',
  neutrals200: '#6a7480',
  neutrals300: '#79828d',
  neutrals400: '#838e9c',
  neutrals500: '#aab0b7',
  neutrals600: '#d7dbdf',
  neutrals700: '#e3e6e9',
  neutrals800: '#f1f3f5',
  neutrals900: '#f8fafb',
  neutrals1000: '#ffffff',
};
