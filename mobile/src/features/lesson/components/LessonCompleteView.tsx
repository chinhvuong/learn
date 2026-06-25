import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import Confetti from '@/features/gamification/components/Confetti';
import type {CefrBand, Item} from '../types';
import type {ItemDecision} from '../lessonSessionSlice';

/** The skill whose Level this session moved (CONTEXT.md → "Level"). */
export type LessonSkill = 'reading' | 'listening';

/** A discovery suggestion shown below the fold (recommendation handoff stub). */
export interface DiscoverySuggestion {
  id: string;
  title: string;
  /** Minutes · topic · CEFR caption (e.g. "5 phút · Công nghệ · B1"). */
  meta: string;
}

/**
 * The single Top-pick Next Lesson recommendation shown on the Completion recap
 * (screens.md §10 LP6 `Z90VA2`; the "TIẾP THEO · CÙNG KÊNH" card). Carries the
 * Recommendation Reason + match % the card must always show (CONTEXT.md →
 * "Recommendation Reason"). Produced by the recommendation engine (`nextLesson`,
 * issue #13).
 */
export interface RecommendedNextLesson {
  /** The recommended Lesson id (deep-linked by the one-tap Continue). */
  lessonId: string;
  /** English Source title (e.g. "AI in Healthcare"). */
  title: string;
  /** Minutes · topic · CEFR caption (e.g. "TechVision · 5 phút · B1"). */
  meta: string;
  /** Human-readable Recommendation Reason (e.g. "vì bạn thích chủ đề Công nghệ"). */
  reason: string;
  /** Match strength shown as a percent (e.g. 94 → "94%"). */
  matchPct: number;
}

export interface LessonCompleteViewProps {
  items: Item[];
  decided: Record<string, ItemDecision>;
  /** Minutes studied this session (session recap — CONTEXT.md → "North Star"). */
  minutesStudied: number;
  /** Which skill this Lesson trains — selects the recap headline copy. */
  skill: LessonSkill;
  /** The learner's current CEFR band for that skill (the skill-specific Level). */
  skillLevel: CefrBand;
  /** The next CEFR band the learner is progressing toward (i+1). */
  skillLevelNext: CefrBand;
  /** North Star before this Lesson — animates up to + Absorbed this session. */
  northStarBase: number;
  northStarLive: number;
  /**
   * The Top-pick Next Lesson recommendation (Reason + match %) shown in the
   * "TIẾP THEO · CÙNG KÊNH" card and preloaded behind the one-tap Continue
   * (CONTEXT.md → "Next Lesson recommendation"). Absent only when the engine has
   * nothing eligible.
   */
  recommended?: RecommendedNextLesson | null;
  /** The learner's current Streak (folded streak pill). */
  streak: number;
  /**
   * Whether today's **Daily Goal** is met — folds the everyday-tier celebration
   * in (CONTEXT.md → "Celebration moment"). Reserved for future surfacing.
   */
  goalMet: boolean;
  /** True when a **major milestone** fired this completion (reserved). */
  hasMilestone?: boolean;
  /** Below-the-fold discovery suggestions (reserved; not shown in §10 LP6). */
  discovery?: DiscoverySuggestion[];
  /** One-tap Continue — opens the recommended Next Lesson (preloaded). */
  onContinue: () => void;
  /** Open a below-the-fold discovery suggestion (reserved). */
  onOpenDiscovery?: (id: string) => void;
  /** Open the full-screen Celebration (reserved). */
  onCelebrate?: () => void;
  /** Open the optional 60-second quick review (light SRS) — reserved. */
  onQuickReview?: () => void;
  /** Share this Lesson-complete moment ("↗ Chia sẻ"). */
  onShare?: () => void;
  /** The guilt-free rest exit ("Nghỉ, hẹn mai 👋"). */
  onRest?: () => void;
}

/** Format an integer with thousands separators (e.g. 1258 → "1,258"). */
function fmtCount(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** Confetti accent flecks scattered over the headline (design `cf` rects). */
const FLECKS: {x: number; tone: 'flow' | 'warm' | 'flowInk' | 'flowPress'}[] = [
  {x: 30, tone: 'flow'},
  {x: 110, tone: 'warm'},
  {x: 170, tone: 'flowPress'},
  {x: 215, tone: 'flowInk'},
  {x: 300, tone: 'warm'},
];

/**
 * Lesson-complete recap (screens.md §10 LP6 `Z90VA2`). Celebrates the just-
 * completed Lesson, leads with the North Star (the headline metric — cumulative
 * Absorbed Items, recolored amber), then surfaces the single Top-pick Next
 * Lesson and a one-tap Continue so the momentum fast-path stays default.
 *
 * The recommendation is produced by the engine (`nextLesson`, issue #13); the
 * screen passes it in already resolved + preloaded for one-tap Continue.
 */
export default function LessonCompleteView({
  items,
  decided,
  skill,
  northStarBase,
  northStarLive,
  recommended,
  streak,
  onContinue,
  onShare,
  onRest,
}: LessonCompleteViewProps) {
  const {t} = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const absorbedCount = items.filter(
    item => decided[item.id] === 'absorbed',
  ).length;
  const delta = Math.max(0, northStarLive - northStarBase);

  const toneColor = {
    flow: colors.flow,
    warm: colors.warm,
    flowInk: colors.flowInk,
    flowPress: colors.flowPress,
  } as const;

  // North Star count-up (handoff `lpCountUp` — base → live on the recap).
  const [nsValue, setNsValue] = useState(northStarBase);
  useEffect(() => {
    const from = northStarBase;
    const to = northStarLive;
    if (from === to) {
      setNsValue(to);
      return;
    }
    const steps = Math.min(20, Math.max(1, to - from));
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setNsValue(Math.round(from + ((to - from) * i) / steps));
      if (i >= steps) {
        clearInterval(timer);
        setNsValue(to);
      }
    }, 55);
    return () => clearInterval(timer);
  }, [northStarBase, northStarLive]);

  // Celebratory pop on the big North Star number at mount (`nsPop`).
  const nsPop = useSharedValue(1);
  useEffect(() => {
    nsPop.value = withSequence(
      withTiming(1.12, {duration: 240}),
      withTiming(1, {duration: 360}),
    );
  }, [nsPop]);
  const nsPopStyle = useAnimatedStyle(() => ({
    transform: [{scale: nsPop.value}],
  }));

  // Brief confetti burst over the recap (the everyday celebration).
  const [confettiActive, setConfettiActive] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setConfettiActive(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: colors.appBg, paddingTop: insets.top},
      ]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Confetti flecks scattered across the top. */}
        <View style={styles.fleckRow}>
          {FLECKS.map((fleck, i) => (
            <View
              key={i}
              style={[
                styles.fleck,
                {
                  left: fleck.x,
                  backgroundColor: toneColor[fleck.tone],
                },
              ]}
            />
          ))}
        </View>

        <AppText raw style={styles.emoji}>
          🎉
        </AppText>
        <AppText raw style={[styles.title, {color: colors.ink}]}>
          {t('LP_COMPLETE_TITLE_FULL')}
        </AppText>
        <AppText raw align="center" style={[styles.headline, {color: colors.ink2}]}>
          {t(
            skill === 'listening'
              ? 'LP_COMPLETE_HEADLINE_LISTENING'
              : 'LP_COMPLETE_HEADLINE_READING',
            {count: absorbedCount},
          )}
        </AppText>

        {/* North Star card — the headline metric, amber family. */}
        <View
          style={[
            styles.nsCard,
            {backgroundColor: colors.warmSoft, borderColor: colors.warm},
          ]}>
          <AppText raw style={[styles.nsLabel, {color: colors.warmInk}]}>
            {t('LP_COMPLETE_NS_LABEL')}
          </AppText>
          <Animated.View style={nsPopStyle}>
            <AppText raw style={[styles.nsBig, {color: colors.warmInk}]}>
              {fmtCount(nsValue)}
            </AppText>
          </Animated.View>
          <AppText raw style={[styles.nsDelta, {color: colors.warmInk}]}>
            {t('LP_COMPLETE_NS_DELTA', {count: delta})}
          </AppText>
          <View style={styles.streakWrap}>
            <View style={styles.streakPill}>
              <AppText raw style={[styles.streakText, {color: colors.warmInk}]}>
                {t('LP_COMPLETE_STREAK', {count: streak})}
              </AppText>
            </View>
          </View>
        </View>

        {/* Next Lesson recommendation card — "TIẾP THEO · CÙNG KÊNH". */}
        {recommended ? (
          <View
            style={[
              styles.nextCard,
              {backgroundColor: colors.flowSoft, borderColor: colors.flow},
            ]}>
            <AppText raw style={[styles.nextLabel, {color: colors.flowInk}]}>
              {t('LP_COMPLETE_NEXT_LABEL')}
            </AppText>
            <View style={styles.nextRow}>
              <View style={[styles.nextPlay, {backgroundColor: colors.flow}]}>
                <Icon name="Play" className="text-onFlow w-[18px] h-[18px]" />
              </View>
              <View style={styles.nextText}>
                <AppText
                  raw
                  numberOfLines={1}
                  style={[styles.nextTitle, {color: colors.ink}]}>
                  {recommended.title}
                </AppText>
                <AppText
                  raw
                  numberOfLines={1}
                  style={[styles.nextMeta, {color: colors.flowInk}]}>
                  {recommended.meta}
                </AppText>
              </View>
              <AppText raw style={[styles.nextMatch, {color: colors.flowInk}]}>
                {t('LP_COMPLETE_RECO_MATCH', {pct: recommended.matchPct})}
              </AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer: Học tiếp → · [↗ Chia sẻ, Nghỉ, hẹn mai 👋]. */}
      <View style={[styles.footer, {paddingBottom: 16 + insets.bottom}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('LP_COMPLETE_CONTINUE')}
          onPress={onContinue}
          style={[styles.cta, {backgroundColor: colors.flow}]}>
          <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
            {t('LP_COMPLETE_CONTINUE')}
          </AppText>
        </Pressable>
        <View style={styles.exitRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LP_COMPLETE_SHARE')}
            onPress={onShare}
            style={[
              styles.exitBtn,
              {backgroundColor: colors.surface, borderColor: colors.border},
            ]}>
            <AppText raw style={[styles.exitText, {color: colors.ink2}]}>
              {t('LP_COMPLETE_SHARE')}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LP_COMPLETE_REST_SHORT')}
            onPress={onRest}
            style={[
              styles.exitBtn,
              {backgroundColor: colors.surface, borderColor: colors.border},
            ]}>
            <AppText raw style={[styles.exitText, {color: colors.ink2}]}>
              {t('LP_COMPLETE_REST_SHORT')}
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* Brief celebratory confetti over the recap (auto-stops). */}
      {confettiActive ? <Confetti active={confettiActive} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 10,
  },
  fleckRow: {height: 22, alignSelf: 'stretch'},
  fleck: {
    position: 'absolute',
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 2,
    transform: [{rotate: '-20deg'}],
  },
  emoji: {fontSize: 34, marginTop: 8},
  title: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 23,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  headline: {
    fontFamily: InflowFonts.ui.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 290,
  },
  nsCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  nsLabel: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  nsBig: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 50,
    letterSpacing: -2,
    lineHeight: 56,
  },
  nsDelta: {fontFamily: InflowFonts.ui.bold, fontSize: 13},
  streakWrap: {paddingTop: 12, alignItems: 'center'},
  streakPill: {
    backgroundColor: '#FFFFFF66',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  streakText: {fontFamily: InflowFonts.ui.bold, fontSize: 12},
  nextCard: {
    alignSelf: 'stretch',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  nextLabel: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 10.5,
    letterSpacing: 1,
    marginBottom: 10,
  },
  nextRow: {flexDirection: 'row', alignItems: 'center', gap: 11},
  nextPlay: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {flex: 1, minWidth: 0, gap: 1},
  nextTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14.5},
  nextMeta: {fontFamily: InflowFonts.ui.regular, fontSize: 11.5},
  nextMatch: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11.5},
  footer: {paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16, gap: 10},
  cta: {borderRadius: 16, paddingVertical: 16, alignItems: 'center'},
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  exitRow: {flexDirection: 'row', gap: 10},
  exitBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
  },
  exitText: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
});

LessonCompleteView.displayName = 'LessonCompleteView';
