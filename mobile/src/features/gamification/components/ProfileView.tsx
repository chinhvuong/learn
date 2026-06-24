import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import {useAppSelector} from '@/store/hooks';
import {scoreToCefr, selectBandProgress} from '@/features/home';
import type {Milestone} from '../milestones';
import {milestoneDisplay} from '../milestoneDisplay';

export interface ProfileViewProps {
  /** Open the full-screen Celebration for a tapped trophy (share entry). */
  onShareMilestone?: (milestone: Milestone) => void;
  /** Open "Kho của tôi" — the Absorbed-Item collection (secondary door). */
  onOpenCollection?: () => void;
  /** Open Settings (top-right gear). */
  onOpenSettings?: () => void;
}

/** A faux 14-day streak history for the calendar heat row (display only). */
const STREAK_DAYS = [0.4, 0.5, 0, 0.6, 0.8, 1, 0.5, 0, 0.7, 1, 1, 0.8, 1, 1];

/**
 * Hồ sơ / Stats (tab Hồ sơ) — the **trophy case first** (screens.md §14; handoff
 * `#profile`). Motivation surfaces lead: the hero **North Star** (amber), the two
 * **Levels** (Reading / Listening) with progress toward the next CEFR band, the
 * **Streak** + total Input, the streak calendar, and the **Milestone** trophy
 * row (tap to open the shareable Milestone Card). **"Kho của tôi"** — the
 * Absorbed-Item collection — is a deliberately **secondary door** at the bottom
 * (avoid drifting into flashcard management).
 *
 * Colors come from tokens only: amber `--warm` for North Star / Streak (the
 * Absorbed family), teal `--flow` for Levels / progress.
 */
export default function ProfileView({
  onShareMilestone,
  onOpenCollection,
  onOpenSettings,
}: ProfileViewProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();
  const home = useAppSelector(state => state.home);

  const readingBand = scoreToCefr(home.readingLevel);
  const readingNext = scoreToCefr(home.readingLevel + 17);
  const listeningBand = scoreToCefr(home.listeningLevel);
  const listeningNext = scoreToCefr(home.listeningLevel + 17);

  // Trophy case: newest milestones first, capped to the visible row.
  const trophies = [...home.earnedMilestones].reverse().slice(0, 3);

  const renderLevel = (
    label: string,
    band: string,
    next: string,
    score: number,
  ) => (
    <View style={[styles.levelCard, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
      <View style={styles.levelHeader}>
        <AppText raw style={[styles.levelLabel, {color: colors.ink}]}>
          {label}
        </AppText>
        <View style={[styles.bandBadge, {backgroundColor: colors.flowSoft}]}>
          <AppText raw style={[styles.bandBadgeText, {color: colors.flowInk}]}>
            {band}
          </AppText>
        </View>
        <AppText raw style={[styles.levelNext, {color: colors.ink3}]}>
          → {next}
        </AppText>
      </View>
      <View style={[styles.levelTrack, {backgroundColor: colors.surface2}]}>
        <View
          style={[
            styles.levelFill,
            {backgroundColor: colors.flow, width: `${selectBandProgress(score)}%`},
          ]}
        />
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{backgroundColor: colors.appBg}}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 22,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Header: avatar · @user · settings */}
      <View style={styles.header}>
        <View style={[styles.avatar, {backgroundColor: colors.flow}]}>
          <AppText raw style={[styles.avatarText, {color: colors.onFlow}]}>
            M
          </AppText>
        </View>
        <View style={styles.headerText}>
          <AppText raw style={[styles.handle, {color: colors.ink}]}>
            {t('PROFILE_HANDLE')}
          </AppText>
          <AppText raw style={[styles.subhandle, {color: colors.ink3}]}>
            {t('PROFILE_MEMBER')}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('PROFILE_SETTINGS')}
          onPress={onOpenSettings}
          hitSlop={8}
          style={[styles.gear, {backgroundColor: colors.surface2, borderColor: colors.hair}]}>
          <AppText raw style={[styles.gearIcon, {color: colors.ink2}]}>
            ⚙
          </AppText>
        </Pressable>
      </View>

      {/* North Star hero (amber) + per-type breakdown */}
      <View style={[styles.northStar, {backgroundColor: colors.warmSoft, borderColor: colors.warm}]}>
        <AppText
          raw
          accessibilityRole="text"
          accessibilityLabel={t('HOME_NORTH_STAR_A11Y', {count: home.northStar})}
          style={[styles.northStarNumber, {color: colors.warmInk}]}>
          {home.northStar.toLocaleString('en-US')}
        </AppText>
        <View style={styles.breakdownRow}>
          <AppText raw style={[styles.breakdown, {color: colors.warmInk}]}>
            {t('PROFILE_BREAKDOWN_VOCAB', {count: home.vocabAbsorbed})}
          </AppText>
          <AppText raw style={[styles.breakdown, {color: colors.warmInk}]}>
            {t('PROFILE_BREAKDOWN_CHUNK', {count: home.chunkAbsorbed})}
          </AppText>
          <AppText raw style={[styles.breakdown, {color: colors.warmInk}]}>
            {t('PROFILE_BREAKDOWN_GRAMMAR', {count: home.grammarAbsorbed})}
          </AppText>
        </View>
      </View>

      {/* Two Levels with band progress */}
      <View style={styles.levels}>
        {renderLevel(t('PROFILE_LEVEL_READING'), readingBand, readingNext, home.readingLevel)}
        {renderLevel(t('PROFILE_LEVEL_LISTENING'), listeningBand, listeningNext, home.listeningLevel)}
      </View>

      {/* Streak + total Input */}
      <View style={styles.statsRow}>
        <View style={[styles.statCardWarm, {backgroundColor: colors.warmSoft}]}>
          <AppText raw style={[styles.statValueWarm, {color: colors.warmInk}]}>
            🔥 {home.streak}
          </AppText>
          <AppText raw style={[styles.statLabelWarm, {color: colors.warmInk}]}>
            {t('PROFILE_STREAK_LABEL')}
          </AppText>
        </View>
        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
          <AppText raw style={[styles.statValue, {color: colors.ink}]}>
            {t('PROFILE_INPUT_VALUE', {hours: Math.round(home.minutesInputTotal / 60)})}
          </AppText>
          <AppText raw style={[styles.statLabel, {color: colors.ink3}]}>
            {t('PROFILE_INPUT_LABEL')}
          </AppText>
        </View>
      </View>

      {/* Streak calendar (heat row) */}
      <View style={[styles.calendar, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
        <AppText raw style={[styles.calendarTitle, {color: colors.ink2}]}>
          {t('PROFILE_STREAK_CALENDAR')}
        </AppText>
        <View style={styles.calendarRow}>
          {STREAK_DAYS.map((heat, i) => (
            <View
              key={i}
              style={[
                styles.calendarCell,
                heat === 0
                  ? {backgroundColor: colors.surface2}
                  : {backgroundColor: colors.flow, opacity: 0.35 + heat * 0.65},
              ]}
            />
          ))}
        </View>
      </View>

      {/* Milestones — trophy case (tap to share) */}
      <View style={styles.milestoneHeader}>
        <AppText raw style={[styles.milestoneTitle, {color: colors.ink}]}>
          {t('PROFILE_MILESTONE_TITLE')}
        </AppText>
        <AppText raw style={[styles.milestoneHint, {color: colors.ink3}]}>
          {t('PROFILE_MILESTONE_HINT')}
        </AppText>
      </View>
      <View style={styles.trophyRow}>
        {trophies.map((milestone, i) => {
          const display = milestoneDisplay(milestone);
          const tint = display.tone === 'warm' ? colors.warmSoft : colors.flowSoft;
          const ink = display.tone === 'warm' ? colors.warmInk : colors.flowInk;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={display.badgeLabel}
              onPress={() => onShareMilestone?.(milestone)}
              style={[styles.trophy, {backgroundColor: tint}]}>
              <AppText raw style={styles.trophyEmoji}>
                {display.emoji}
              </AppText>
              <AppText raw style={[styles.trophyLabel, {color: ink}]}>
                {display.badgeLabel}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* My Collection — the secondary door */}
      <Pressable
        accessibilityRole="button"
        onPress={onOpenCollection}
        style={[styles.collection, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
        <AppText raw style={styles.collectionEmoji}>
          📚
        </AppText>
        <View style={styles.collectionText}>
          <AppText raw style={[styles.collectionTitle, {color: colors.ink}]}>
            {t('PROFILE_COLLECTION_TITLE')}
          </AppText>
          <AppText raw style={[styles.collectionSub, {color: colors.ink3}]}>
            {t('PROFILE_COLLECTION_SUB')}
          </AppText>
        </View>
        <AppText raw style={[styles.collectionArrow, {color: colors.ink3}]}>
          →
        </AppText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16},
  avatar: {width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 19},
  headerText: {flex: 1},
  handle: {fontFamily: InflowFonts.ui.extrabold, fontSize: 17},
  subhandle: {fontFamily: InflowFonts.ui.medium, fontSize: 12, marginTop: 1},
  gear: {width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  gearIcon: {fontSize: 15},
  northStar: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  northStarNumber: {fontFamily: InflowFonts.ui.extrabold, fontSize: 56, letterSpacing: -2, lineHeight: 58},
  breakdownRow: {flexDirection: 'row', gap: 13, marginTop: 10},
  breakdown: {fontFamily: InflowFonts.ui.semibold, fontSize: 12.5},
  levels: {gap: 10, marginBottom: 16},
  levelCard: {paddingVertical: 13, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1},
  levelHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9},
  levelLabel: {fontFamily: InflowFonts.ui.bold, fontSize: 13},
  bandBadge: {paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6},
  bandBadgeText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11},
  levelNext: {fontFamily: InflowFonts.ui.medium, fontSize: 11.5, marginLeft: 'auto'},
  levelTrack: {height: 7, borderRadius: 4, overflow: 'hidden'},
  levelFill: {height: '100%', borderRadius: 4},
  statsRow: {flexDirection: 'row', gap: 11, marginBottom: 14},
  statCardWarm: {flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
  statValueWarm: {fontFamily: InflowFonts.ui.extrabold, fontSize: 22},
  statLabelWarm: {fontFamily: InflowFonts.ui.semibold, fontSize: 11, opacity: 0.85, marginTop: 2},
  statCard: {flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center'},
  statValue: {fontFamily: InflowFonts.ui.extrabold, fontSize: 22},
  statLabel: {fontFamily: InflowFonts.ui.semibold, fontSize: 11, marginTop: 2},
  calendar: {paddingVertical: 14, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, marginBottom: 16},
  calendarTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 12, marginBottom: 10},
  calendarRow: {flexDirection: 'row', gap: 4},
  calendarCell: {flex: 1, aspectRatio: 1, borderRadius: 3},
  milestoneHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11},
  milestoneTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  milestoneHint: {fontFamily: InflowFonts.ui.medium, fontSize: 11.5},
  trophyRow: {flexDirection: 'row', gap: 9, marginBottom: 18},
  trophy: {flex: 1, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 13, alignItems: 'center'},
  trophyEmoji: {fontSize: 18},
  trophyLabel: {fontFamily: InflowFonts.ui.bold, fontSize: 11, marginTop: 3},
  collection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  collectionEmoji: {fontSize: 18},
  collectionText: {flex: 1},
  collectionTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  collectionSub: {fontFamily: InflowFonts.ui.medium, fontSize: 11.5, marginTop: 1},
  collectionArrow: {fontSize: 18},
});

ProfileView.displayName = 'ProfileView';
