import type {TextStyle} from 'react-native';
import {InflowFonts} from '@/config/typography';
import type {AppColors} from '@/config/colors';

/**
 * The three Item types, plus the rendering modes for a span of reading text.
 * `plain` is ordinary (non-notable) reading text.
 */
export type ItemKind = 'vocabulary' | 'chunk' | 'grammarPoint';
export type ReadingSpanKind = ItemKind | 'plain';

/** A resolved Inflow token set (light or dark) — the shape `useColors` returns. */
export type TokenSet = typeof AppColors;

/**
 * Pure derivation of an Item token's text style from its kind + Absorbed state,
 * the active token set, and the `showAnnotations` setting. Lives apart from the
 * `ItemToken` component (which imports React/RN values) so the encoding rules
 * stay unit-testable in the repo's node/jest harness, asserted against the
 * design handoff's Item-encoding legend (#system) and `tokenStyle()`:
 *
 *   - Vocabulary    — thin (1.5px) teal underline
 *   - Chunk         — bold (800) text + thick (2.5px) teal underline
 *   - Grammar Point — teal-soft pill (--flow-soft fill, --flow-ink text, 5px radius)
 *   - Absorbed      — any of the above recolored teal → amber (--warm family),
 *                     PLUS a --warm-soft fill behind the token (the absorption
 *                     signal: it now counts toward the North Star)
 *
 * RN inline text can't express CSS underline thickness/offset, so "thick vs
 * thin" is carried by weight (Chunk is bold) plus the decoration color; pills
 * use an inline background. This matches the legend's intent within the
 * platform's text capabilities.
 */
export function itemTokenStyle(
  kind: ReadingSpanKind,
  absorbed: boolean,
  showAnnotations: boolean,
  colors: TokenSet,
): TextStyle {
  // The teal (flow) accent, recolored to amber (warm) once Absorbed.
  const accent = absorbed ? colors.warm : colors.flow;
  const accentInk = absorbed ? colors.warmInk : colors.flowInk;

  if (kind === 'plain' || !showAnnotations) {
    // Absorbed Items stay subtly marked even with annotations off, so the
    // learner can still see what they've taken in.
    return absorbed && kind !== 'plain' ? {color: accentInk} : {color: colors.ink};
  }

  if (kind === 'chunk') {
    // Chunk — bold (800) text + thick (2.5px) teal underline; flow-ink text
    // turns warm-ink and gains a warm-soft fill once Absorbed.
    return {
      fontFamily: InflowFonts.reading.bold,
      color: absorbed ? accentInk : colors.flowInk,
      textDecorationLine: 'underline',
      textDecorationColor: accent,
      backgroundColor: absorbed ? colors.warmSoft : 'transparent',
    };
  }

  if (kind === 'grammarPoint') {
    // Grammar Point — teal-soft highlight pill (5px radius); recolors to the
    // warm-soft pill once Absorbed.
    return {
      color: accentInk,
      backgroundColor: absorbed ? colors.warmSoft : colors.flowSoft,
      borderRadius: 5,
    };
  }

  // Vocabulary — thin (1.5px) teal underline; gains a warm-soft fill once
  // Absorbed.
  return {
    color: absorbed ? accentInk : colors.ink,
    textDecorationLine: 'underline',
    textDecorationColor: accent,
    backgroundColor: absorbed ? colors.warmSoft : 'transparent',
  };
}
