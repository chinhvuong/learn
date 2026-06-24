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
}

/**
 * The North Star — the learner's cumulative count of Absorbed Items, the
 * headline metric (CONTEXT.md → "North Star"). Rendered in the amber (--warm)
 * family because every Absorbed Item recolors teal → amber.
 *
 * On each genuine absorption the displayed number animates a count-up toward
 * its new target (~70–110ms ticks per the handoff) and a "+1" floats up
 * (`floatPop` / `riseFade` in the design).
 */
export default function NorthStarCounter({value, floatKey}: NorthStarCounterProps) {
  const colors = useColors();
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // "+1" float — driven by an Animated value, keyed off floatKey.
  const floatAnim = useRef(new Animated.Value(0)).current;
  const firstFloat = useRef(true);

  // Count-up: step the displayed number toward `value` in short ticks.
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

  // Fire the "+1" float on each genuine absorption (skip initial mount).
  useEffect(() => {
    if (firstFloat.current) {
      firstFloat.current = false;
      return;
    }
    floatAnim.setValue(0);
    Animated.timing(floatAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floatKey]);

  const floatStyle = {
    opacity: floatAnim.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [0, 1, 0],
    }),
    transform: [
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [4, -26],
        }),
      },
    ],
  };

  return (
    <View style={styles.wrap}>
      <AppText
        raw
        accessibilityRole="text"
        accessibilityLabel={`North Star ${display}`}
        style={[
          styles.number,
          {fontFamily: InflowFonts.ui.extrabold, color: colors.warm},
        ]}>
        {display.toLocaleString('en-US')}
      </AppText>
      <Animated.View style={[styles.float, floatStyle]} pointerEvents="none">
        <AppText raw style={[styles.floatText, {color: colors.warm}]}>
          +1
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
  },
  float: {
    position: 'absolute',
    top: -4,
    right: -18,
  },
  floatText: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 18,
  },
});

NorthStarCounter.displayName = 'NorthStarCounter';
