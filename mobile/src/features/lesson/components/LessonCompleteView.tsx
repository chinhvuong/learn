import React from 'react';
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
  /** Below-the-fold discovery suggestions (recommendation target stubbed). */
  discovery?: DiscoverySuggestion[];
  /** One-tap Continue — recommendation handoff is stubbed (wired in #3). */
  onContinue: () => void;
  /** Open a below-the-fold discovery suggestion (stubbed handoff). */
  onOpenDiscovery?: (id: string) => void;
}

/**
 * Lesson-complete recap (screens.md §11). The momentum fast-path stays default:
 * above the fold = session recap (minutes studied, Items Absorbed, skill-
 * specific Level) + the animated North Star count-up + a one-tap Continue CTA.
 * Richer discovery sits **below the fold** so scrolling is opt-in (CONTEXT.md →
 * "Discover" / "Preference Tuner").
 *
 * The recommendation target behind Continue / discovery is **stubbed** here;
 * the real Next-Lesson handoff is wired by #3's consumer slice.
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
  discovery = [],
  onContinue,
  onOpenDiscovery,
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

  return (
    <ScrollView
      style={{backgroundColor: colors.appBg}}
      contentContainerStyle={styles.content}>
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

      {/* North Star count-up (reuses NorthStarCounter — fires on mount). */}
      <View style={[styles.northStarCard, {backgroundColor: colors.warmSoft}]}>
        <AppText raw style={[styles.northStarLabel, {color: colors.warmInk}]}>
          {t('LP_COMPLETE_NORTH_STAR_LABEL')}
        </AppText>
        <NorthStarCounter value={northStarLive} floatKey={0} />
        <AppText raw style={[styles.delta, {color: colors.warmInk}]}>
          {t('LP_COMPLETE_DELTA', {count: northStarLive - northStarBase})}
        </AppText>
      </View>

      {/* One-tap Continue (recommendation handoff stubbed — wired in #3). */}
      <View style={styles.cta}>
        <AppButton variant="primary" onPress={onContinue}>
          <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
            {t('LP_COMPLETE_CONTINUE')}
          </AppText>
        </AppButton>
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
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 40,
    marginTop: 18,
  },
  northStarLabel: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  delta: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5, marginTop: 8},
  cta: {alignSelf: 'stretch', marginTop: 24},
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
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
