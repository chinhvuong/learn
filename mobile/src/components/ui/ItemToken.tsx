import React, {useEffect, useRef} from 'react';
import {Text, TextProps} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useColors} from '@/hooks/useColors';
import {useAppSelector} from '@/store/hooks';
import {itemTokenStyle, type ItemKind, type ReadingSpanKind} from './itemTokenStyle';

const AnimatedText = Animated.createAnimatedComponent(Text);

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

  // tokPop (handoff `@keyframes tokPop`: scale 1 → 1.16 @35% → 1 over .55s):
  // fire the scale pop only on the *absorb transition* (teal → amber), never on
  // re-taps. RN renders Item tokens as INLINE text, and inline Text can't be
  // wrapped in an Animated.View without breaking the passage's text flow; a
  // `transform` on an inline `Animated.Text` is the closest faithful carrier of
  // the pop within that constraint (it may be visually subtle inline on some
  // platforms, but it's keyed correctly to the single absorb event).
  const pop = useSharedValue(1);
  const wasAbsorbed = useRef(absorbed);
  useEffect(() => {
    if (absorbed && !wasAbsorbed.current) {
      // 0.55s total: up to 1.16 by ~35% (~190ms), back to 1 by the end.
      pop.value = withSequence(
        withTiming(1.16, {duration: 190}),
        withTiming(1, {duration: 360}),
      );
    }
    wasAbsorbed.current = absorbed;
  }, [absorbed, pop]);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{scale: pop.value}],
  }));

  return (
    <AnimatedText {...props} style={[tokenStyle, style, popStyle]}>
      {children}
    </AnimatedText>
  );
}

ItemToken.displayName = 'ItemToken';
