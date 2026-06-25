import {TextStyle} from 'react-native';

/**
 * Inflow typography.
 *
 * The handoff pairs two typefaces (design_handoff_inflow_app/README.md → Typography):
 *   - Be Vietnam Pro — UI, headings, numerals. Full Vietnamese support.
 *     Headings use negative letter-spacing (~ -0.4 to -1.2px) and weight 800.
 *   - Newsreader (serif) — the reading surface (English lesson text), so a
 *     Lesson reads like an article.
 *
 * Font family strings are the fonts' PostScript names (the cross-platform key
 * React Native resolves), matching the existing SourceSans3-* convention.
 */

export const InflowFonts = {
  ui: {
    regular: 'BeVietnamPro-Regular',
    medium: 'BeVietnamPro-Medium',
    semibold: 'BeVietnamPro-SemiBold',
    bold: 'BeVietnamPro-Bold',
    extrabold: 'BeVietnamPro-ExtraBold',
  },
  reading: {
    regular: 'Newsreader-Regular',
    medium: 'Newsreader-Medium',
    bold: 'Newsreader-Bold',
    italic: 'Newsreader-Italic',
    mediumItalic: 'Newsreader-MediumItalic',
  },
} as const;

/**
 * Named type styles, scaled from the handoff's authored values
 * (display 38 / H2 23–27 / body 14–16 / caption 11.5–13 / micro 10.5–11).
 * UI styles use Be Vietnam Pro; reading styles use Newsreader serif.
 */
export const inflowTextStyles = {
  // --- UI / headings / numerals (Be Vietnam Pro) ---
  display: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.2,
  },
  h1: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  h2: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  h3: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  bodyLarge: {
    fontFamily: InflowFonts.ui.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontFamily: InflowFonts.ui.regular,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: InflowFonts.ui.regular,
    fontSize: 12.5,
    lineHeight: 17,
    letterSpacing: 0,
  },
  // Uppercase micro label (1.4–1.6px tracking) — e.g. Item-type tags.
  micro: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Numerals (North Star counter) — Be Vietnam Pro, heavy.
  numeral: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1,
  },

  // --- Reading surface (Newsreader serif) ---
  reading: {
    fontFamily: InflowFonts.reading.regular,
    fontSize: 16.5,
    lineHeight: 28,
    letterSpacing: 0,
  },
  readingLarge: {
    fontFamily: InflowFonts.reading.regular,
    fontSize: 19,
    lineHeight: 34, // design passageStyle: 19px / 1.78
    letterSpacing: 0.1,
  },
  readingItalic: {
    fontFamily: InflowFonts.reading.italic,
    fontSize: 16.5,
    lineHeight: 28,
    fontStyle: 'italic',
    letterSpacing: 0,
  },
} satisfies Record<string, TextStyle>;

export type InflowTextStyleKey = keyof typeof inflowTextStyles;

export const getInflowTextStyle = (key: InflowTextStyleKey): TextStyle =>
  inflowTextStyles[key] as TextStyle;
