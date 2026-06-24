import React from 'react';
import {Text, TextProps} from 'react-native';
import {useColors} from '@/hooks/useColors';
import {useAppSelector} from '@/store/hooks';
import {itemTokenStyle, type ItemKind, type ReadingSpanKind} from './itemTokenStyle';

export type {ItemKind, ReadingSpanKind};

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
 * design handoff's Item-encoding legend (#system). The style derivation is the
 * pure `itemTokenStyle` helper (kept separate so it's unit-testable); this
 * component just resolves the active token set + the `showAnnotations` setting
 * and applies it. Encoding is suppressed when the learner has turned off
 * `showAnnotations`: the word still renders, just without its type marking.
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

  const tokenStyle = itemTokenStyle(kind, absorbed, showAnnotations, colors);

  return (
    <Text {...props} style={[tokenStyle, style]}>
      {children}
    </Text>
  );
}

ItemToken.displayName = 'ItemToken';
