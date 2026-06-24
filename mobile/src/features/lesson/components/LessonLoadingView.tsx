import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';

/** A staged step in the build checklist (screens.md §13 / handoff E4·LOADING). */
type StepState = 'done' | 'active' | 'pending';
interface BuildStep {
  state: StepState;
  label: string;
}

export interface LessonLoadingViewProps {
  /**
   * `loading` — a pre-analyzed Lesson is being opened (cache-hit; "mở ngay").
   * `processing` — a fresh Source is being analyzed into a Lesson (§13).
   * Both render a spinner before the Lesson opens; they differ only in copy.
   */
  variant?: 'loading' | 'processing';
}

/**
 * Lesson Player — loading / processing state (screens.md §13, E4; design
 * handoff `#core` step 2). A spinner plus a staged build checklist shown while
 * the Lesson is prepared, before the core Item-intro and reading surface.
 *
 * Cards/UI enter with the handoff's pop animation; the spinner ring rotates
 * (`@keyframes spin`).
 */
export default function LessonLoadingView({
  variant = 'loading',
}: LessonLoadingViewProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();

  // Spinner ring rotation (handoff `spin` — 1s linear infinite).
  const spin = useRef(new Animated.Value(0)).current;
  // Container pop-in (handoff `popUp`).
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  useEffect(() => {
    Animated.timing(pop, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pop]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const popStyle = {
    opacity: pop,
    transform: [
      {
        translateY: pop.interpolate({inputRange: [0, 1], outputRange: [14, 0]}),
      },
    ],
  };

  const processing = variant === 'processing';
  const title = processing ? t('LP_PROCESSING_TITLE') : t('LP_LOADING_TITLE');
  const subtitle = processing
    ? t('LP_PROCESSING_SUBTITLE')
    : t('LP_LOADING_SUBTITLE');

  // The staged checklist (§13). Different "active" step per variant.
  const steps: BuildStep[] = processing
    ? [
        {state: 'done', label: t('LP_STEP_FETCH')},
        {state: 'active', label: t('LP_STEP_EXTRACT')},
        {state: 'pending', label: t('LP_STEP_TRANSLATE')},
      ]
    : [
        {state: 'done', label: t('LP_STEP_FETCH')},
        {state: 'done', label: t('LP_STEP_EXTRACT')},
        {state: 'active', label: t('LP_STEP_TRANSLATE')},
        {state: 'pending', label: t('LP_STEP_LISTEN')},
      ];

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: colors.appBg, paddingTop: insets.top},
      ]}>
      <Animated.View style={[styles.center, popStyle]}>
        {/* Spinner: a soft ring with a rotating accent arc. */}
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={title}
          style={styles.spinnerWrap}>
          <View
            style={[styles.ring, {borderColor: colors.flowSoft}]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.ringArc,
              {borderTopColor: colors.flow, transform: [{rotate}]},
            ]}
            pointerEvents="none"
          />
          <AppText raw style={styles.spinnerEmoji}>
            {processing ? '⚙️' : '✦'}
          </AppText>
        </View>

        <AppText raw style={[styles.title, {color: colors.ink}]}>
          {title}
        </AppText>
        <AppText raw style={[styles.subtitle, {color: colors.ink3}]}>
          {subtitle}
        </AppText>

        <View style={styles.steps}>
          {steps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  step.state === 'done'
                    ? {backgroundColor: colors.flowSoft}
                    : step.state === 'active'
                      ? {backgroundColor: colors.warmSoft}
                      : {borderWidth: 1.5, borderColor: colors.border},
                ]}>
                <AppText
                  raw
                  style={[
                    styles.stepGlyph,
                    {
                      color:
                        step.state === 'done'
                          ? colors.flowInk
                          : step.state === 'active'
                            ? colors.warmInk
                            : colors.ink3,
                    },
                  ]}>
                  {step.state === 'done' ? '✓' : step.state === 'active' ? '⏳' : '○'}
                </AppText>
              </View>
              <AppText
                raw
                style={[
                  styles.stepLabel,
                  {
                    color: step.state === 'pending' ? colors.ink3 : colors.ink,
                    fontFamily:
                      step.state === 'active'
                        ? InflowFonts.ui.semibold
                        : InflowFonts.ui.regular,
                  },
                ]}>
                {step.label}
              </AppText>
            </View>
          ))}
        </View>

        <View style={[styles.hint, {backgroundColor: colors.flowSoft}]}>
          <AppText raw style={[styles.hintText, {color: colors.flowInk}]}>
            {processing ? t('LP_PROCESSING_HINT') : t('LP_LOADING_HINT')}
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  spinnerWrap: {
    width: 78,
    height: 78,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
  },
  ringArc: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  spinnerEmoji: {fontSize: 28},
  title: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 19,
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: InflowFonts.ui.regular,
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
  },
  steps: {alignSelf: 'stretch', gap: 11},
  stepRow: {flexDirection: 'row', alignItems: 'center', gap: 11},
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: {fontSize: 12, fontFamily: InflowFonts.ui.bold},
  stepLabel: {fontSize: 13.5, flex: 1},
  hint: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
  },
  hintText: {fontFamily: InflowFonts.ui.semibold, fontSize: 12},
});

LessonLoadingView.displayName = 'LessonLoadingView';
