import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';

export interface NorthStarCounterProps {
  /** The target North Star value (cumulative Absorbed Items). */
  value: number;
  /**
   * Bumped whenever a genuine first-absorption happens, so we can fire the
   * "+1" float-up animation only on real increments (never on re-taps).
   */
  floatKey: number;
  /**
   * Presentation:
   *   - `hero` — the large stat number (Home / Completion recap).
   *   - `pill` — the compact in-player chrome badge `✦ N` (the reading /
   *     listening header in `#core`): amber (--warm) text on a --warm-soft pill,
   *     the "+1 ✦" rising from it (`riseFade`). This is the absorption-gesture
   *     North Star readout, NOT the headline stat.
   */
  variant?: 'hero' | 'pill';
}

/**
 * The North Star — the learner's cumulative count of Absorbed Items, the
 * headline metric (CONTEXT.md → "North Star"). Rendered in the amber (--warm)
 * family because every Absorbed Item recolors teal → amber.
 *
 * On each genuine absorption the displayed number animates a count-up toward
 * its new target (~70–110ms ticks per the handoff) and a "+1 ✦" floats up
 * (`riseFade` in the design). The `pill` variant matches the in-lesson header
 * chrome (`✦ {{lpNsLive}}` in `#core`); the `hero` variant is the large stat.
 */
export default function NorthStarCounter({
  value,
  floatKey,
  variant = 'hero',
}: NorthStarCounterProps) {
  const colors = useColors();
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // "+1 ✦" float — driven by an Animated value, keyed off floatKey.
  const floatAnim = useRef(new Animated.Value(0)).current;
  const firstFloat = useRef(true);
  // `nsPop` — a brief scale pop on the number itself on each absorption.
  const popAnim = useRef(new Animated.Value(0)).current;

  // Count-up: step the displayed number toward `value` in short ticks (the
  // handoff interpolates in ~70–110ms ticks; 90ms sits in that window).
  useEffect(() => {
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
    if (display === value) {
      return;
    }
    tickTimer.current = setInterval(() => {
      const current = displayRef.current;
      if (current === value) {
        if (tickTimer.current) {
          clearInterval(tickTimer.current);
          tickTimer.current = null;
        }
        return;
      }
      const next = current < value ? current + 1 : current - 1;
      displayRef.current = next;
      setDisplay(next);
    }, 90);
    return () => {
      if (tickTimer.current) {
        clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Fire the "+1 ✦" float + `nsPop` on each genuine absorption (skip mount).
  useEffect(() => {
    if (firstFloat.current) {
      firstFloat.current = false;
      return;
    }
    floatAnim.setValue(0);
    Animated.timing(floatAnim, {
      toValue: 1,
      duration: 1100,
      easing: Easing.bezier(0.2, 0.7, 0.3, 1),
      useNativeDriver: true,
    }).start();
    popAnim.setValue(0);
    Animated.timing(popAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floatKey]);

  // riseFade: opacity 0 → 1 (by 25%) → 0; translateY 8 → -26; scale .7 → 1.05.
  const floatStyle = {
    opacity: floatAnim.interpolate({
      inputRange: [0, 0.25, 1],
      outputRange: [0, 1, 0],
    }),
    transform: [
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, -26],
        }),
      },
      {
        scale: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1.05],
        }),
      },
    ],
  };

  // nsPop: scale 1 → 1.12 (at 40%) → 1.
  const popStyle = {
    transform: [
      {
        scale: popAnim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [1, 1.12, 1],
        }),
      },
    ],
  };

  const numberText = display.toLocaleString('en-US');

  if (variant === 'pill') {
    return (
      <View style={styles.pillWrap}>
        <Animated.View
          style={[styles.pill, {backgroundColor: colors.warmSoft}, popStyle]}>
          <AppText
            raw
            accessibilityRole="text"
            accessibilityLabel={`North Star ${display}`}
            style={[styles.pillText, {color: colors.warmInk}]}>
            ✦ {numberText}
          </AppText>
        </Animated.View>
        <Animated.View
          style={[styles.pillFloat, floatStyle]}
          pointerEvents="none">
          <AppText raw style={[styles.pillFloatText, {color: colors.warmInk}]}>
            +1 ✦
          </AppText>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.heroWrap}>
      <Animated.View style={popStyle}>
        <AppText
          raw
          accessibilityRole="text"
          accessibilityLabel={`North Star ${display}`}
          style={[
            styles.heroNumber,
            {fontFamily: InflowFonts.ui.extrabold, color: colors.warm},
          ]}>
          {numberText}
        </AppText>
      </Animated.View>
      <Animated.View style={[styles.heroFloat, floatStyle]} pointerEvents="none">
        <AppText raw style={[styles.heroFloatText, {color: colors.warmInk}]}>
          +1 ✦
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {alignItems: 'center', justifyContent: 'center'},
  heroNumber: {fontSize: 38, lineHeight: 44, letterSpacing: -1},
  heroFloat: {position: 'absolute', top: -4, right: -18},
  heroFloatText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 18},
  pillWrap: {position: 'relative', alignItems: 'center', justifyContent: 'center'},
  pill: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10},
  pillText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 12.5},
  pillFloat: {position: 'absolute', top: -11, right: 2},
  pillFloatText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 13},
});

NorthStarCounter.displayName = 'NorthStarCounter';
