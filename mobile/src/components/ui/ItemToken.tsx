import React from 'react';
import {Text, TextProps, TextStyle} from 'react-native';
import {useColors} from '@/hooks/useColors';
import {useAppSelector} from '@/store/hooks';
import {InflowFonts} from '@/config/typography';

/**
 * The three Item types, plus the rendering modes for a span of reading text.
 * `plain` is ordinary (non-notable) reading text.
 */
export type ItemKind = 'vocabulary' | 'chunk' | 'grammarPoint';
export type ReadingSpanKind = ItemKind | 'plain';

export interface ItemTokenProps extends TextProps {
  /** Which Item encoding to render. `plain` renders untreated reading text. */
  kind?: ReadingSpanKind;
  /**
   * Whether this Item has been Absorbed. When true the token recolors
   * teal → amber (the absorption signal — it now counts toward the North Star).
   */
  absorbed?: boolean;
  children: React.ReactNode;
}

/**
 * Inline reading-text primitive that renders the four Item encodings from the
 * design handoff's Item-encoding legend (#system):
 *
 *   - Vocabulary   — thin teal underline
 *   - Chunk        — bold text + thick teal underline
 *   - Grammar Point — teal-soft pill (soft fill, flow-ink text, rounded)
 *   - Absorbed     — any of the above, recolored teal → amber (--warm family)
 *
 * Encoding is suppressed when the learner has turned off `showAnnotations`
 * (handoff flag): the word still renders, just without its type marking.
 *
 * NOTE: React Native inline text can't express CSS underline thickness /
 * offset, so "thick vs thin" is conveyed via weight (Chunk is bold) plus the
 * decoration color; the pill uses an inline background. This matches the
 * legend's intent within the platform's text capabilities.
 */
export default function ItemToken({
  kind = 'plain',
  absorbed = false,
  children,
  style,
  ...props
}: ItemTokenProps) {
  const colors = useColors();
  const showAnnotations = useAppSelector(state => state.app.showAnnotations);

  // The teal (flow) accent, recolored to amber (warm) once Absorbed.
  const accent = absorbed ? colors.warm : colors.flow;
  const accentInk = absorbed ? colors.warmInk : colors.flowInk;
  const accentSoft = absorbed ? colors.warmSoft : colors.flowSoft;

  if (kind === 'plain' || !showAnnotations) {
    // Absorbed Items stay subtly marked even with annotations off, so the
    // learner can still see what they've taken in.
    const plainStyle: TextStyle | undefined =
      absorbed && kind !== 'plain' ? {color: accentInk} : {color: colors.ink};
    return (
      <Text {...props} style={[plainStyle, style]}>
        {children}
      </Text>
    );
  }

  let tokenStyle: TextStyle;
  if (kind === 'chunk') {
    // Bold + thick teal underline.
    tokenStyle = {
      fontFamily: InflowFonts.reading.bold,
      color: accentInk,
      textDecorationLine: 'underline',
      textDecorationColor: accent,
    };
  } else if (kind === 'grammarPoint') {
    // Teal-soft highlight pill.
    tokenStyle = {
      color: accentInk,
      backgroundColor: accentSoft,
    };
  } else {
    // Vocabulary — thin teal underline.
    tokenStyle = {
      color: absorbed ? accentInk : colors.ink,
      textDecorationLine: 'underline',
      textDecorationColor: accent,
    };
  }

  return (
    <Text {...props} style={[tokenStyle, style]}>
      {children}
    </Text>
  );
}

ItemToken.displayName = 'ItemToken';
