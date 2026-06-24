import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {Milestone} from '../milestones';
import {milestoneDisplay} from '../milestoneDisplay';
import Confetti from './Confetti';
import MilestoneCard from './MilestoneCard';

export interface CelebrationViewProps {
  /** The major milestone being celebrated (Streak / Level up / North Star). */
  milestone: Milestone;
  /** Learner handle for the Milestone Card (e.g. "@user"). */
  handle: string;
  /** Cumulative North Star, shown on the card subline. */
  northStar: number;
  /** Share the Milestone Card (the only share surface in the core loop). */
  onShare: () => void;
  /** Keep the momentum — back into the learning flow. */
  onContinue: () => void;
  /** The guilt-free rest exit ("Nghỉ ngơi, hẹn mai 👋"). Always present. */
  onRest: () => void;
}

/**
 * Full-screen **Celebration** for a major milestone (CONTEXT.md → "Celebration
 * moment"; screens.md §12; handoff `#core` celebration). Confetti
 * (`confettiFall`) over a warm-soft radial wash, a popped-in hero number
 * (`nsPop`), the shareable **Milestone Card**, and — crucially — a guilt-free
 * **rest exit** alongside the continue CTA, protecting sustainable habit over
 * bingeing. Tokens only (amber `--warm` family for the hero, teal `--flow` for
 * the primary action).
 */
export default function CelebrationView({
  milestone,
  handle,
  northStar,
  onShare,
  onContinue,
  onRest,
}: CelebrationViewProps) {
  const {t} = useTranslation();
  const colors = useColors();
  const display = milestoneDisplay(milestone);

  // nsPop on the hero number (scale 1 → 1.12 → 1, run once on mount).
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pop, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [pop]);
  const popStyle = {
    transform: [
      {scale: pop.interpolate({inputRange: [0, 0.4, 1], outputRange: [0.7, 1.12, 1]})},
    ],
  };

  const heroColor = display.tone === 'warm' ? colors.warmInk : colors.flowInk;

  return (
    <View style={[styles.root, {backgroundColor: colors.appBg}]}>
      {/* warm-soft radial wash (top) behind the confetti */}
      <View style={[styles.wash, {backgroundColor: colors.warmSoft}]} />
      <Confetti />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <AppText raw style={[styles.sparkle, {color: heroColor}]}>
          ✨ {display.emoji} ✨
        </AppText>
        <Animated.View style={popStyle}>
          <AppText raw style={[styles.hero, {color: heroColor}]}>
            {display.heroValue}
          </AppText>
        </Animated.View>
        <AppText raw align="center" style={[styles.title, {color: colors.ink}]}>
          {display.title}
        </AppText>
        <AppText raw align="center" style={[styles.body, {color: colors.ink2}]}>
          {milestone.kind === 'streak'
            ? t('CELEBRATE_STREAK_BODY')
            : milestone.kind === 'levelUp'
              ? t('CELEBRATE_LEVELUP_BODY')
              : t('CELEBRATE_NORTHSTAR_BODY')}
        </AppText>

        <View style={styles.cardWrap}>
          <MilestoneCard milestone={milestone} handle={handle} northStar={northStar} />
        </View>

        <View style={styles.actions}>
          {/* Share the Milestone Card */}
          <Pressable
            accessibilityRole="button"
            onPress={onShare}
            style={[styles.shareBtn, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
            <AppText raw style={[styles.shareText, {color: colors.ink}]}>
              {t('CELEBRATE_SHARE')}
            </AppText>
          </Pressable>
          {/* Keep momentum */}
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={[styles.continueBtn, {backgroundColor: colors.flow, shadowColor: colors.flow}]}>
            <AppText raw style={[styles.continueText, {color: colors.onFlow}]}>
              {t('CELEBRATE_CONTINUE')}
            </AppText>
          </Pressable>
          {/* The guilt-free rest exit — always present */}
          <Pressable accessibilityRole="button" onPress={onRest} style={styles.restBtn}>
            <AppText raw style={[styles.restText, {color: colors.ink3}]}>
              {t('CELEBRATE_REST')}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, overflow: 'hidden'},
  wash: {position: 'absolute', top: 0, left: 0, right: 0, height: '52%', opacity: 0.6},
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 56,
  },
  sparkle: {fontSize: 15, letterSpacing: 6, marginBottom: 10},
  hero: {fontFamily: InflowFonts.ui.extrabold, fontSize: 64, letterSpacing: -2, lineHeight: 66},
  title: {fontFamily: InflowFonts.ui.extrabold, fontSize: 22, letterSpacing: -0.5, marginTop: 14},
  body: {
    fontFamily: InflowFonts.ui.medium,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 280,
  },
  cardWrap: {alignSelf: 'stretch', alignItems: 'center', marginTop: 22},
  actions: {alignSelf: 'stretch', alignItems: 'center', gap: 10, marginTop: 22},
  shareBtn: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  shareText: {fontFamily: InflowFonts.ui.bold, fontSize: 14.5},
  continueBtn: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  continueText: {fontFamily: InflowFonts.ui.bold, fontSize: 15.5},
  restBtn: {width: '100%', maxWidth: 300, paddingVertical: 12, alignItems: 'center'},
  restText: {fontFamily: InflowFonts.ui.semibold, fontSize: 13.5},
});

CelebrationView.displayName = 'CelebrationView';
