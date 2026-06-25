import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import Confetti from './Confetti';

export interface DailyGoalViewProps {
  /** Consecutive days the learner met their Daily Goal (the ring number). */
  streak: number;
  /** Continue learning (keep the momentum). */
  onContinue: () => void;
  /** The guilt-free "done for today" exit. Always present. */
  onDone: () => void;
}

/** The week strip ordered Mon→Sun; the last (Sun) is "today". */
const WEEK_KEYS = [
  'DAILYGOAL_DAY_MON',
  'DAILYGOAL_DAY_TUE',
  'DAILYGOAL_DAY_WED',
  'DAILYGOAL_DAY_THU',
  'DAILYGOAL_DAY_FRI',
  'DAILYGOAL_DAY_SAT',
  'DAILYGOAL_DAY_SUN',
] as const;

/**
 * 14c Mục tiêu ngày — Streak (`j2fWf`; screens.md §05). The **Daily Goal** met
 * moment: a warm-soft takeover with confetti, the big amber **Streak** ring
 * ("🔥 7 NGÀY"), the "Chuỗi N ngày liên tiếp!" headline, the week strip showing
 * the days met (the final dot = today), and a guilt-free rest-or-continue choice
 * ("Xong cho hôm nay") beside the Continue CTA.
 *
 * Per CONTEXT.md the everyday Daily-Goal tier is a small moment (not a major
 * milestone), so it stays low-key — amber `--warm` throughout (Streak family).
 */
export default function DailyGoalView({streak, onContinue, onDone}: DailyGoalViewProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();

  // The week shows up to `streak` days met (capped to the 7-day strip); the
  // final dot is always "today".
  const metCount = Math.min(7, Math.max(0, streak));

  // Ring pop-in.
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pop, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [pop]);
  const popStyle = {
    transform: [{scale: pop.interpolate({inputRange: [0, 0.4, 1], outputRange: [0.7, 1.12, 1]})}],
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.warmSoft}]}>
      <Confetti />
      <ScrollView
        contentContainerStyle={[styles.content, {paddingTop: insets.top + 16}]}
        showsVerticalScrollIndicator={false}>
        <AppText raw style={[styles.kicker, {color: colors.warmInk}]}>
          {t('DAILYGOAL_KICKER')}
        </AppText>

        {/* Big amber Streak ring */}
        <Animated.View style={[styles.ring, popStyle, {shadowColor: colors.warm}]}>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id="dailyGoalRing" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.warm} stopOpacity={1} />
                <Stop offset="1" stopColor={colors.warmInk} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx={70} fill="url(#dailyGoalRing)" />
          </Svg>
          <AppText raw style={[styles.ringFlame, {color: colors.onFlow}]}>
            🔥
          </AppText>
          <AppText raw style={[styles.ringNum, {color: colors.onFlow}]}>
            {streak}
          </AppText>
          <AppText raw style={[styles.ringUnit, {color: colors.onFlow}]}>
            {t('DAILYGOAL_RING_UNIT')}
          </AppText>
        </Animated.View>

        <AppText raw align="center" style={[styles.heading, {color: colors.ink}]}>
          {t('DAILYGOAL_HEADING', {count: streak})}
        </AppText>
        <AppText raw align="center" style={[styles.body, {color: colors.ink2}]}>
          {t('DAILYGOAL_BODY')}
        </AppText>

        {/* Week strip */}
        <View style={[styles.week, {backgroundColor: colors.surface}]}>
          {WEEK_KEYS.map((key, i) => {
            const isToday = i === WEEK_KEYS.length - 1;
            const met = i < metCount;
            return (
              <View key={key} style={styles.day}>
                {isToday ? (
                  <View style={styles.dot}>
                    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                      <Defs>
                        <LinearGradient id="todayDot" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0" stopColor={colors.warm} stopOpacity={1} />
                          <Stop offset="1" stopColor={colors.warmInk} stopOpacity={1} />
                        </LinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="100%" height="100%" rx={15} fill="url(#todayDot)" />
                    </Svg>
                    <AppText raw style={[styles.dotGlyph, {color: colors.onFlow}]}>
                      🔥
                    </AppText>
                  </View>
                ) : (
                  <View
                    style={[styles.dot, {backgroundColor: met ? colors.warm : colors.surface2}]}>
                    {met && (
                      <AppText raw style={[styles.dotGlyph, {color: colors.onFlow}]}>
                        ✓
                      </AppText>
                    )}
                  </View>
                )}
                <AppText
                  raw
                  weight={isToday ? 'bold' : 'regular'}
                  style={[styles.dayLabel, {color: isToday ? colors.warmInk : colors.ink3}]}>
                  {t(key)}
                </AppText>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.actions, {paddingBottom: insets.bottom + 18}]}>
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={[styles.primary, {backgroundColor: colors.warm}]}>
          <AppText raw style={[styles.primaryText, {color: colors.onFlow}]}>
            {t('DAILYGOAL_CONTINUE')}
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.secondary}>
          <AppText raw style={[styles.secondaryText, {color: colors.ink2}]}>
            {t('DAILYGOAL_DONE')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, overflow: 'hidden'},
  content: {flexGrow: 1, alignItems: 'center', paddingHorizontal: 18, paddingBottom: 16, gap: 16},
  kicker: {fontFamily: InflowFonts.ui.extrabold, fontSize: 13, letterSpacing: 3},
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.4,
    shadowRadius: 26,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
  },
  ringFlame: {fontSize: 26, lineHeight: 30},
  ringNum: {fontFamily: InflowFonts.ui.extrabold, fontSize: 46, lineHeight: 50},
  ringUnit: {fontFamily: InflowFonts.ui.bold, fontSize: 11, letterSpacing: 3, lineHeight: 14},
  heading: {fontFamily: InflowFonts.ui.extrabold, fontSize: 25, letterSpacing: -0.4, lineHeight: 30},
  body: {fontFamily: InflowFonts.ui.regular, fontSize: 14, lineHeight: 20, maxWidth: 300},
  week: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '100%',
  },
  day: {alignItems: 'center', gap: 7},
  dot: {width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  dotGlyph: {fontFamily: InflowFonts.ui.bold, fontSize: 13, lineHeight: 16},
  dayLabel: {fontFamily: InflowFonts.ui.regular, fontSize: 11},
  actions: {paddingHorizontal: 18, gap: 8},
  primary: {borderRadius: 16, paddingVertical: 16, alignItems: 'center'},
  primaryText: {fontFamily: InflowFonts.ui.bold, fontSize: 15},
  secondary: {paddingVertical: 12, alignItems: 'center'},
  secondaryText: {fontFamily: InflowFonts.ui.semibold, fontSize: 14},
});

DailyGoalView.displayName = 'DailyGoalView';
