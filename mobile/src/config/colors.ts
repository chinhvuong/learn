/**
 * Inflow design tokens.
 *
 * Authored as OKLCH light + dark sets in the design handoff
 * (design_handoff_inflow_app/README.md → "Design Tokens"); converted to sRGB
 * hex here because the colors.ts → generate-colors-css.js pipeline parses hex
 * and emits `rgb(var(--color-*))` triplets for NativeWind.
 *
 * Token families (use these verbatim — they are the product's design language):
 *   - flow (teal)  = primary / actions / progress / nav            (--flow)
 *   - warm (amber) = Absorbed Items / North Star / Streak          (--warm)
 *   - ink          = text (primary / secondary / tertiary)
 *   - surface / bg = cards, sheets, canvas
 *   - hair / border = dividers and borders
 *
 * The legacy boilerplate semantic names (primary, foreground, background,
 * neutrals*, …) are kept as aliases mapped onto the Inflow families so the whole
 * app re-themes from these tokens with no per-screen hardcoded colors.
 *
 * NOTE: `AppColors` is the DARK set (it drives Tailwind utility-name generation
 * in tailwind.config.js and the `.dark` block in generated/colors.css);
 * `AppColorsLight` is the LIGHT set mapped to `:root`.
 */

// Dark set
export const AppColors = {
  // --- Inflow tokens ---
  flow: '#48b7bd',
  flowPress: '#30a4aa',
  flowInk: '#7aced2',
  flowSoft: '#083840',
  warm: '#f0af60',
  warmInk: '#efbd7d',
  warmSoft: '#493118',
  onFlow: '#08131a',
  ink: '#ecf1f3',
  ink2: '#a5aeb3',
  ink3: '#778086',
  bg: '#0b1015',
  bg2: '#12181d',
  appBg: '#12181e',
  surface: '#1a2128',
  surface2: '#161c23',
  hair: '#272d34',

  // --- Legacy semantic aliases (mapped onto Inflow families) ---
  primary: '#48b7bd',
  secondary: '#48b7bd',
  primaryForeground: '#08131a',
  secondaryForeground: '#08131a',
  foreground: '#ecf1f3',
  background: '#0b1015',
  success: '#48b7bd',
  warning: '#f0af60',
  error: '#e4626f',
  border: '#2f363e',
  neutrals100: '#a5aeb3',
  neutrals200: '#9aa3a9',
  neutrals300: '#8b949a',
  neutrals400: '#778086',
  neutrals500: '#5e676d',
  neutrals600: '#2f363e',
  neutrals700: '#272d34',
  neutrals800: '#1a2128',
  neutrals900: '#161c23',
  neutrals1000: '#12181e',
};

// Light set
export const AppColorsLight: typeof AppColors = {
  // --- Inflow tokens ---
  flow: '#218da3',
  flowPress: '#007589',
  flowInk: '#005d73',
  flowSoft: '#d1f0f6',
  warm: '#cf883d',
  warmInk: '#995212',
  warmSoft: '#fee3c3',
  onFlow: '#f5feff',
  ink: '#1f2730',
  ink2: '#545d67',
  ink3: '#818991',
  bg: '#eaf1f5',
  bg2: '#dfe8ed',
  appBg: '#f8fbfe',
  surface: '#ffffff',
  surface2: '#eff4f7',
  hair: '#dfe5e8',

  // --- Legacy semantic aliases (mapped onto Inflow families) ---
  primary: '#218da3',
  secondary: '#218da3',
  primaryForeground: '#f5feff',
  secondaryForeground: '#f5feff',
  foreground: '#1f2730',
  background: '#eaf1f5',
  success: '#218da3',
  warning: '#cf883d',
  error: '#e4626f',
  border: '#d3dadf',
  neutrals100: '#545d67',
  neutrals200: '#5e6770',
  neutrals300: '#6f7880',
  neutrals400: '#818991',
  neutrals500: '#9aa1a8',
  neutrals600: '#d3dadf',
  neutrals700: '#dfe5e8',
  neutrals800: '#eff4f7',
  neutrals900: '#f8fbfe',
  neutrals1000: '#ffffff',
};
