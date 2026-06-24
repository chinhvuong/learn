import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppButton, AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {CefrBand, Item} from '../types';
import type {ItemDecision} from '../lessonSessionSlice';
import NorthStarCounter from './NorthStarCounter';

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
 * The single Top-pick Next Lesson recommendation shown above the fold (screens.md
 * §11; the `#core` completion frame). Carries the Recommendation Reason + match %
 * the card must always show (CONTEXT.md → "Recommendation Reason"). Produced by
 * the recommendation engine (`nextLesson`, issue #13).
 */
export interface RecommendedNextLesson {
  /** The recommended Lesson id (deep-linked by the one-tap Continue). */
  lessonId: string;
  /** English Source title (e.g. "AI in Healthcare"). */
  title: string;
  /** Minutes · topic · CEFR caption (e.g. "5 phút · Công nghệ · B1"). */
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
  /** Which skill this Lesson trains — selects the Level label shown. */
  skill: LessonSkill;
  /** The learner's current CEFR band for that skill (the skill-specific Level). */
  skillLevel: CefrBand;
  /** The next CEFR band the learner is progressing toward (i+1). */
  skillLevelNext: CefrBand;
  /** North Star before this Lesson — animates up to + Absorbed this session. */
  northStarBase: number;
  northStarLive: number;
  /**
   * The Top-pick Next Lesson recommendation (Reason + match %) shown above the
   * fold and preloaded behind the one-tap Continue (CONTEXT.md → "Next Lesson
   * recommendation"). Absent only when the engine has nothing eligible.
   */
  recommended?: RecommendedNextLesson | null;
  /** The learner's current Streak (folded streak pill). */
  streak: number;
  /**
   * Whether today's **Daily Goal** is met — folds the small "goal met"
   * celebration in (the everyday tier; CONTEXT.md → "Celebration moment").
   * When not met, the badge is omitted entirely (no separate screen either way).
   */
  goalMet: boolean;
  /**
   * True when a **major milestone** fired this completion — surfaces the
   * "Đạt mốc lớn? Xem màn ăn mừng →" link into the full-screen Celebration.
   */
  hasMilestone?: boolean;
  /** Below-the-fold discovery suggestions (recommendation target stubbed). */
  discovery?: DiscoverySuggestion[];
  /** One-tap Continue — opens the recommended Next Lesson (preloaded). */
  onContinue: () => void;
  /** Open a below-the-fold discovery suggestion (stubbed handoff). */
  onOpenDiscovery?: (id: string) => void;
  /** Open the full-screen Celebration (shown when a major milestone fired). */
  onCelebrate?: () => void;
  /** Open the optional 60-second quick review (light SRS). */
  onQuickReview?: () => void;
  /** The guilt-free rest exit ("Nghỉ — hẹn mai 👋"). */
  onRest?: () => void;
}

/**
 * Lesson-complete recap (screens.md §11). The momentum fast-path stays default:
 * above the fold = session recap (minutes studied, Items Absorbed, skill-
 * specific Level) + the animated North Star count-up + the single Top-pick Next
 * Lesson recommendation (Reason + match %) + a one-tap Continue CTA that opens
 * it. Richer discovery sits **below the fold** so scrolling is opt-in
 * (CONTEXT.md → "Discover" / "Preference Tuner").
 *
 * The recommendation is produced by the engine (`nextLesson`, issue #13); the
 * screen passes it in already resolved + preloaded for one-tap Continue.
 */
export default function LessonCompleteView({
  items,
  decided,
  minutesStudied,
  skill,
  skillLevel,
  skillLevelNext,
  northStarBase,
  northStarLive,
  recommended,
  streak,
  goalMet,
  hasMilestone = false,
  discovery = [],
  onContinue,
  onOpenDiscovery,
  onCelebrate,
  onQuickReview,
  onRest,
}: LessonCompleteViewProps) {
  const {t} = useTranslation();
  const colors = useColors();

  const absorbedItems = items.filter(item => decided[item.id] === 'absorbed');
  const vCount = absorbedItems.filter(i => i.type === 'vocabulary').length;
  const cCount = absorbedItems.filter(i => i.type === 'chunk').length;
  const gCount = absorbedItems.filter(i => i.type === 'grammarPoint').length;

  const skillLabel = t(
    skill === 'listening' ? 'LP_COMPLETE_SKILL_LISTENING' : 'LP_COMPLETE_SKILL_READING',
  );

  // North Star count-up (handoff `lpCountUp` — 1228 → 1234 on the recap): seed
  // the hero counter at the pre-Lesson base, then advance to the live total on
  // mount so NorthStarCounter ticks it up (it animates on `value` change).
  const [nsValue, setNsValue] = useState(northStarBase);
  useEffect(() => {
    setNsValue(northStarLive);
  }, [northStarLive]);

  return (
    <ScrollView
      style={{backgroundColor: colors.appBg}}
      contentContainerStyle={styles.content}>
      {/* Daily Goal met — the everyday-tier celebration folded in as a small
          warm "goal met" badge (no separate screen). Omitted when not met. */}
      {goalMet ? (
        <View style={[styles.goalPill, {backgroundColor: colors.warmSoft}]}>
          <AppText raw style={[styles.goalPillText, {color: colors.warmInk}]}>
            {t('LP_COMPLETE_GOAL_MET')}
          </AppText>
        </View>
      ) : null}
      <AppText raw style={styles.emoji}>
        🎉
      </AppText>
      <AppText raw variant="heading2" weight="bold" align="center">
        {t('LP_COMPLETE_TITLE')}
      </AppText>
      <AppText raw align="center" style={[styles.recap, {color: colors.ink2}]}>
        {t('LP_COMPLETE_RECAP', {
          count: absorbedItems.length,
          v: vCount,
          c: cCount,
          g: gCount,
        })}
      </AppText>

      {/* Session recap stats — minutes studied · Items Absorbed · Level. */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
          <AppText raw style={[styles.statValue, {color: colors.ink}]}>
            {t('LP_COMPLETE_MINUTES', {count: minutesStudied})}
          </AppText>
          <AppText raw style={[styles.statLabel, {color: colors.ink3}]}>
            {t('LP_COMPLETE_MINUTES_LABEL')}
          </AppText>
        </View>
        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
          <AppText raw style={[styles.statValue, {color: colors.ink}]}>
            {absorbedItems.length}
          </AppText>
          <AppText raw style={[styles.statLabel, {color: colors.ink3}]}>
            {t('LP_NORTH_STAR_LABEL')}
          </AppText>
        </View>
      </View>

      {/* Skill-specific Level (Reading or Listening), progressing i+1. */}
      <View style={[styles.levelCard, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
        <View style={styles.levelHeaderRow}>
          <AppText raw style={[styles.levelLabel, {color: colors.ink}]}>
            {skillLabel} · {skillLevel}
          </AppText>
          <AppText raw style={[styles.levelNext, {color: colors.ink3}]}>
            {t('LP_COMPLETE_LEVEL_NEXT', {next: skillLevelNext})}
          </AppText>
        </View>
      </View>

      {/* North Star recap card — uppercase label, the hero count-up (animates
          base → live on mount), a teal cumulative-delta line, and a warm
          streak pill (handoff §11 completion card). */}
      <View
        style={[
          styles.northStarCard,
          {backgroundColor: colors.surface, borderColor: colors.hair},
        ]}>
        <AppText raw style={[styles.northStarLabel, {color: colors.ink3}]}>
          {t('LP_COMPLETE_NORTH_STAR_LABEL')}
        </AppText>
        <NorthStarCounter value={nsValue} floatKey={0} />
        <AppText raw style={[styles.delta, {color: colors.flowInk}]}>
          {t('LP_COMPLETE_DELTA', {count: northStarLive - northStarBase})}
        </AppText>
        <View style={[styles.streakPill, {backgroundColor: colors.warmSoft}]}>
          <AppText raw style={[styles.streakPillText, {color: colors.warmInk}]}>
            {t('LP_COMPLETE_STREAK', {count: streak})}
          </AppText>
        </View>
      </View>

      {/* Top-pick Next Lesson recommendation (Reason + match %) + one-tap
          Continue, preloaded (screens.md §11; the #core completion frame). */}
      {recommended ? (
        <View
          style={[
            styles.recoCard,
            {
              backgroundColor: colors.flowSoft,
              borderColor: colors.flow,
            },
          ]}>
          <AppText raw style={[styles.recoLabel, {color: colors.flowInk}]}>
            {t('LP_COMPLETE_RECO_LABEL')}
          </AppText>
          <View style={styles.recoHeaderRow}>
            <View style={[styles.recoPlay, {backgroundColor: colors.flow}]}>
              <AppText raw style={[styles.recoPlayIcon, {color: colors.onFlow}]}>
                ▶
              </AppText>
            </View>
            <View style={styles.recoText}>
              <AppText
                raw
                numberOfLines={1}
                style={[styles.recoTitle, {color: colors.ink}]}>
                {recommended.title}
              </AppText>
              <AppText
                raw
                numberOfLines={1}
                style={[styles.recoMeta, {color: colors.flowInk}]}>
                {recommended.meta}
              </AppText>
            </View>
            <AppText raw style={[styles.recoMatch, {color: colors.flowInk}]}>
              {t('LP_COMPLETE_RECO_MATCH', {pct: recommended.matchPct})}
            </AppText>
          </View>
          <AppText raw style={[styles.recoReason, {color: colors.flowInk}]}>
            {t('LP_COMPLETE_RECO_REASON', {reason: recommended.reason})}
          </AppText>
          <AppButton variant="primary" onPress={onContinue}>
            <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
              {t('LP_COMPLETE_CONTINUE')}
            </AppText>
          </AppButton>
        </View>
      ) : (
        /* No recommendation available — keep the one-tap Continue alone. */
        <View style={styles.cta}>
          <AppButton variant="primary" onPress={onContinue}>
            <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
              {t('LP_COMPLETE_CONTINUE')}
            </AppText>
          </AppButton>
        </View>
      )}

      {/* Major-milestone entry — only when a Streak/Level-up/round North Star
          fired. Tier 2 lives full-screen, reached from here (handoff §11). */}
      {hasMilestone ? (
        <Pressable
          accessibilityRole="button"
          onPress={onCelebrate}
          style={styles.celebrateLink}>
          <AppText raw style={[styles.celebrateLinkText, {color: colors.ink3}]}>
            {t('LP_COMPLETE_MILESTONE_PROMPT')}{' '}
            <AppText raw style={[styles.celebrateLinkCta, {color: colors.warmInk}]}>
              {t('LP_COMPLETE_MILESTONE_CTA')}
            </AppText>
          </AppText>
        </Pressable>
      ) : null}

      {/* Guilt-free exits: optional quick review (light SRS) + rest reminder. */}
      <View style={styles.exitRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onQuickReview}
          style={[styles.exitBtn, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <AppText raw style={[styles.exitText, {color: colors.ink2}]}>
            {t('LP_COMPLETE_QUICK_REVIEW')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onRest}
          style={[styles.exitBtn, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <AppText raw style={[styles.exitText, {color: colors.ink2}]}>
            {t('LP_COMPLETE_REST')}
          </AppText>
        </Pressable>
      </View>

      {/* ─── below the fold ─── richer discovery (opt-in by scrolling). */}
      {discovery.length > 0 ? (
        <View style={styles.discovery}>
          <View style={[styles.foldDivider, {backgroundColor: colors.hair}]} />
          <AppText raw style={[styles.discoveryHeading, {color: colors.ink3}]}>
            {t('LP_COMPLETE_DISCOVERY_HEADING')}
          </AppText>
          {discovery.map(suggestion => (
            <Pressable
              key={suggestion.id}
              accessibilityRole="button"
              onPress={() => onOpenDiscovery?.(suggestion.id)}
              style={[
                styles.discoveryCard,
                {backgroundColor: colors.surface, borderColor: colors.hair},
              ]}>
              <View style={[styles.discoveryPlay, {backgroundColor: colors.flowSoft}]}>
                <AppText raw style={[styles.discoveryPlayIcon, {color: colors.flowInk}]}>
                  ▶
                </AppText>
              </View>
              <View style={styles.discoveryText}>
                <AppText raw numberOfLines={1} style={[styles.discoveryTitle, {color: colors.ink}]}>
                  {suggestion.title}
                </AppText>
                <AppText raw numberOfLines={1} style={[styles.discoveryMeta, {color: colors.flowInk}]}>
                  {suggestion.meta}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  goalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 16,
  },
  goalPillText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11.5},
  emoji: {fontSize: 40, marginBottom: 8},
  recap: {fontFamily: InflowFonts.ui.semibold, fontSize: 13.5, marginTop: 6},
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 22,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
  },
  statValue: {fontFamily: InflowFonts.ui.extrabold, fontSize: 22, letterSpacing: -0.4},
  statLabel: {fontFamily: InflowFonts.ui.semibold, fontSize: 11, marginTop: 4},
  levelCard: {
    alignSelf: 'stretch',
    borderRadius: 15,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginTop: 12,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelLabel: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5},
  levelNext: {fontFamily: InflowFonts.ui.semibold, fontSize: 12.5},
  northStarCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 22,
    marginTop: 18,
  },
  northStarLabel: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  delta: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5, marginTop: 8},
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9,
    marginTop: 12,
  },
  streakPillText: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5},
  cta: {alignSelf: 'stretch', marginTop: 24},
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  recoCard: {
    alignSelf: 'stretch',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  recoLabel: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  recoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 11,
  },
  recoPlay: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoPlayIcon: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  recoText: {flex: 1, minWidth: 0},
  recoTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14.5},
  recoMeta: {fontFamily: InflowFonts.ui.semibold, fontSize: 11.5, marginTop: 2},
  recoMatch: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11.5},
  recoReason: {fontFamily: InflowFonts.ui.semibold, fontSize: 12, marginBottom: 12},
  celebrateLink: {alignSelf: 'center', marginTop: 16},
  celebrateLinkText: {fontFamily: InflowFonts.ui.semibold, fontSize: 12.5},
  celebrateLinkCta: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5},
  exitRow: {flexDirection: 'row', alignSelf: 'stretch', gap: 10, marginTop: 16},
  exitBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  exitText: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  discovery: {alignSelf: 'stretch', marginTop: 28},
  foldDivider: {height: 1, alignSelf: 'stretch', marginBottom: 18},
  discoveryHeading: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  discoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 15,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  discoveryPlay: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryPlayIcon: {fontFamily: InflowFonts.ui.bold, fontSize: 15},
  discoveryText: {flex: 1, minWidth: 0},
  discoveryTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14.5},
  discoveryMeta: {fontFamily: InflowFonts.ui.semibold, fontSize: 11.5, marginTop: 2},
});

LessonCompleteView.displayName = 'LessonCompleteView';
