import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ChevronRight, Settings} from 'lucide-react-native';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import {useAppSelector} from '@/store/hooks';
import {scoreToCefr, selectBandProgress} from '@/features/home';
import type {CefrBand} from '@/features/home';
import type {Milestone} from '../milestones';
import {milestoneDisplay} from '../milestoneDisplay';

export interface ProfileViewProps {
  /** Open the full-screen Celebration for a tapped trophy (share entry). */
  onShareMilestone?: (milestone: Milestone) => void;
  /** Open "Thư viện của tôi" — every Lesson & Series the learner created. */
  onOpenLibrary?: () => void;
  /** Open "Kho của tôi" — the Absorbed-Item collection (secondary door). */
  onOpenCollection?: () => void;
  /** Open the Daily Goal / Streak moment (the Streak tile). */
  onOpenDailyGoal?: () => void;
  /** Open Settings (top-right gear). */
  onOpenSettings?: () => void;
}

/**
 * The streak heat grid — 5 rows × 14 cells of flow-tinted squares (the design's
 * "Lịch streak" contribution grid), display-only. Each value is a fill opacity
 * (0 = an empty surface-2 gap day) mirroring the `M48sz` wireframe pattern.
 */
const STREAK_GRID: number[][] = [
  [1, 0.32, 0.6, 0, 1, 1, 0.32, 0.6, 1, 0, 0.32, 1, 0.6, 0.32],
  [0.6, 1, 0.32, 1, 0, 0.6, 1, 1, 0.32, 0.6, 1, 0, 0.6, 1],
  [0.32, 0.6, 1, 0.32, 1, 0, 0.6, 1, 0.32, 1, 0.6, 1, 0, 0.32],
  [1, 0, 0.6, 1, 0.32, 1, 0.6, 0, 1, 0.32, 0.6, 1, 1, 0.6],
  [0.6, 1, 0.32, 0.6, 1, 0, 1, 0.32, 0.6, 1, 0, 0.6, 1, 0.32],
];

const MILESTONE_TILES: {key: string; emoji: string}[] = [
  {key: 'PROFILE_MILESTONE_TILE_NORTHSTAR', emoji: '📘'},
  {key: 'PROFILE_MILESTONE_TILE_STREAK', emoji: '🔥'},
  {key: 'PROFILE_MILESTONE_TILE_LEVELUP', emoji: '⬆️'},
];

/**
 * 14 Hồ sơ / Stats (`VEvmj`; screens.md §05). The **trophy case first**:
 * identity header, the Inflow Pro upsell (teal gradient), the hero **North Star**
 * (amber "Tổng Input" card), the two **Levels** (Reading / Listening) each with
 * band-progress toward the next CEFR band, the Streak + total Input tiles, the
 * "Lịch streak" heat grid, the **Milestone** tiles (tap to open the shareable
 * Milestone Card), and the secondary "Thư viện của tôi" / "Kho của tôi" doors.
 *
 * Tokens only — amber `--warm` for North Star / Streak (the Absorbed family),
 * teal `--flow` for Levels / progress / the Pro upsell.
 */
export default function ProfileView({
  onShareMilestone,
  onOpenLibrary,
  onOpenCollection,
  onOpenDailyGoal,
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

  // Trophy tiles: the milestone kinds the learner has earned (newest first),
  // each opening the shareable Milestone Card.
  const trophies = [...home.earnedMilestones].reverse();

  const renderLevel = (
    label: string,
    band: CefrBand,
    next: CefrBand,
    score: number,
  ) => (
    <View style={[styles.levelCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
      <View style={styles.levelTop}>
        <AppText raw style={[styles.levelSkill, {color: colors.ink}]}>
          {label}
        </AppText>
        <AppText raw style={[styles.levelLv, {color: colors.flowInk}]}>
          {t('PROFILE_LEVEL_PROGRESS', {from: band, to: next, percent: selectBandProgress(score)})}
        </AppText>
      </View>
      <View style={[styles.levelTrack, {backgroundColor: colors.surface2}]}>
        <View
          style={[styles.levelFill, {backgroundColor: colors.flow, width: `${selectBandProgress(score)}%`}]}
        />
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{backgroundColor: colors.appBg}}
      contentContainerStyle={{
        paddingTop: insets.top + 10,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 16,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Header: avatar · @minh / meta · settings */}
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <LinearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={colors.flow} stopOpacity={1} />
                  <Stop offset="1" stopColor={colors.flowPress} stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" rx={26} fill="url(#avatarBg)" />
            </Svg>
            <AppText raw style={[styles.avatarText, {color: colors.onFlow}]}>
              M
            </AppText>
          </View>
          <View style={styles.nameCol}>
            <AppText raw style={[styles.handle, {color: colors.ink}]}>
              {t('PROFILE_HANDLE')}
            </AppText>
            <AppText raw style={[styles.meta, {color: colors.ink3}]}>
              {t('PROFILE_MEMBER')}
            </AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('PROFILE_SETTINGS')}
          onPress={onOpenSettings}
          hitSlop={8}
          style={[styles.gear, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <Settings size={18} color={colors.ink2} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Inflow Pro upsell — flow→flow-press gradient card. */}
      <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.pro}>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="proBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.flow} stopOpacity={1} />
              <Stop offset="1" stopColor={colors.flowPress} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={18} fill="url(#proBg)" />
        </Svg>
        <View style={styles.proTop}>
          <View style={[styles.proTile, {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
            <AppText raw style={[styles.proSpark, {color: colors.onFlow}]}>
              ✦
            </AppText>
          </View>
          <View style={styles.proText}>
            <AppText raw style={[styles.proTitle, {color: colors.onFlow}]}>
              {t('PROFILE_PRO_TITLE')}
            </AppText>
            <AppText raw style={[styles.proSub, {color: colors.onFlow}]}>
              {t('PROFILE_PRO_SUB')}
            </AppText>
          </View>
        </View>
        <View style={[styles.proBtn, {backgroundColor: '#FFFFFF'}]}>
          <AppText raw style={[styles.proBtnText, {color: colors.flowInk}]}>
            {t('PROFILE_PRO_CTA')}
          </AppText>
        </View>
      </Pressable>

      {/* North Star hero (amber) + per-type breakdown. */}
      <View style={[styles.northStar, {backgroundColor: colors.warmSoft}]}>
        <AppText raw style={[styles.nsCaption, {color: colors.warmInk}]}>
          {t('PROFILE_NORTH_STAR_CAPTION')}
        </AppText>
        <AppText
          raw
          accessibilityRole="text"
          accessibilityLabel={t('HOME_NORTH_STAR_A11Y', {count: home.northStar})}
          style={[styles.nsNumber, {color: colors.warmInk}]}>
          {home.northStar.toLocaleString('en-US')}
        </AppText>
        <View style={styles.breakdown}>
          <AppText raw style={[styles.breakdownItem, {color: colors.warmInk}]}>
            {t('PROFILE_BREAKDOWN_VOCAB', {count: home.vocabAbsorbed})}
          </AppText>
          <AppText raw style={[styles.breakdownItem, {color: colors.warmInk}]}>
            {t('PROFILE_BREAKDOWN_CHUNK', {count: home.chunkAbsorbed})}
          </AppText>
          <AppText raw style={[styles.breakdownItem, {color: colors.warmInk}]}>
            {t('PROFILE_BREAKDOWN_GRAMMAR', {count: home.grammarAbsorbed})}
          </AppText>
        </View>
      </View>

      {/* Two Levels with band progress */}
      <View style={styles.levels}>
        {renderLevel(t('PROFILE_LEVEL_READING'), readingBand, readingNext, home.readingLevel)}
        {renderLevel(t('PROFILE_LEVEL_LISTENING'), listeningBand, listeningNext, home.listeningLevel)}
      </View>

      {/* Streak + total Input tiles */}
      <View style={styles.statRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('PROFILE_STREAK_VALUE', {count: home.streak})}
          onPress={onOpenDailyGoal}
          style={[styles.statWarm, {backgroundColor: colors.warmSoft}]}>
          <AppText raw style={[styles.statEmoji, {color: colors.warm}]}>
            🔥
          </AppText>
          <AppText raw style={[styles.statNumWarm, {color: colors.warmInk}]}>
            {t('PROFILE_STREAK_VALUE', {count: home.streak})}
          </AppText>
          <AppText raw style={[styles.statSubWarm, {color: colors.warmInk}]}>
            {t('PROFILE_STREAK_SUB')}
          </AppText>
        </Pressable>
        <View style={[styles.stat, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <AppText raw style={[styles.statEmoji, {color: colors.ink2}]}>
            ⏱
          </AppText>
          <AppText raw style={[styles.statNum, {color: colors.ink}]}>
            {t('PROFILE_INPUT_VALUE', {hours: Math.round(home.minutesInputTotal / 60)})}
          </AppText>
          <AppText raw style={[styles.statSub, {color: colors.ink2}]}>
            {t('PROFILE_INPUT_SUB')}
          </AppText>
        </View>
      </View>

      {/* Lịch streak — heat grid */}
      <View style={[styles.calendar, {backgroundColor: colors.surface, borderColor: colors.border}]}>
        <AppText raw style={[styles.calendarTitle, {color: colors.ink}]}>
          {t('PROFILE_STREAK_CALENDAR')}
        </AppText>
        <View style={styles.grid}>
          {STREAK_GRID.map((row, r) => (
            <View key={r} style={styles.gridRow}>
              {row.map((heat, c) => (
                <View
                  key={c}
                  style={[
                    styles.gridCell,
                    heat === 0
                      ? {backgroundColor: colors.surface2}
                      : {backgroundColor: colors.flow, opacity: heat},
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Milestones — trophy tiles (tap to share) */}
      <View style={styles.milestoneHead}>
        <View style={styles.milestoneTitleRow}>
          <AppText raw style={[styles.milestoneMedal, {color: colors.warm}]}>
            🏅
          </AppText>
          <AppText raw style={[styles.milestoneTitle, {color: colors.ink}]}>
            Milestone
          </AppText>
        </View>
        <AppText raw style={[styles.milestoneHint, {color: colors.ink3}]}>
          {t('PROFILE_MILESTONE_HINT')}
        </AppText>
      </View>
      <View style={styles.tiles}>
        {MILESTONE_TILES.map((tile, i) => {
          const milestone = trophies[i];
          const display = milestone ? milestoneDisplay(milestone) : undefined;
          const warm = i === 1; // streak tile is amber; northStar + levelUp are teal
          const tint = warm ? colors.warmSoft : colors.flowSoft;
          const ink = warm ? colors.warmInk : colors.flowInk;
          return (
            <Pressable
              key={tile.key}
              accessibilityRole="button"
              accessibilityLabel={display?.badgeLabel ?? t(tile.key)}
              disabled={!milestone}
              onPress={() => milestone && onShareMilestone?.(milestone)}
              style={[styles.tile, {backgroundColor: tint}]}>
              <AppText raw style={[styles.tileEmoji, {color: ink}]}>
                {tile.emoji}
              </AppText>
              <AppText raw style={[styles.tileLabel, {color: ink}]}>
                {t(tile.key)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Secondary doors */}
      <View style={styles.navRows}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenLibrary ?? onOpenCollection}
          style={[styles.navRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <AppText raw style={styles.navEmoji}>
            📖
          </AppText>
          <View style={styles.navCol}>
            <AppText raw style={[styles.navTitle, {color: colors.ink}]}>
              {t('PROFILE_LIBRARY_TITLE')}
            </AppText>
            <AppText raw style={[styles.navSub, {color: colors.ink3}]}>
              {t('PROFILE_LIBRARY_SUB')}
            </AppText>
          </View>
          <ChevronRight size={18} color={colors.ink3} strokeWidth={2} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenCollection}
          style={[styles.navRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <AppText raw style={styles.navEmoji}>
            📚
          </AppText>
          <View style={styles.navCol}>
            <AppText raw style={[styles.navTitle, {color: colors.ink}]}>
              {t('PROFILE_COLLECTION_TITLE')}
            </AppText>
            <AppText raw style={[styles.navSub, {color: colors.ink3}]}>
              {t('PROFILE_COLLECTION_SUB')}
            </AppText>
          </View>
          <ChevronRight size={18} color={colors.ink3} strokeWidth={2} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  identity: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  avatarText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 21},
  nameCol: {gap: 2},
  handle: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  meta: {fontFamily: InflowFonts.ui.regular, fontSize: 12},
  gear: {borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', justifyContent: 'center'},

  pro: {borderRadius: 18, padding: 18, gap: 14, overflow: 'hidden'},
  proTop: {flexDirection: 'row', alignItems: 'center', gap: 12},
  proTile: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  proSpark: {fontSize: 20},
  proText: {flex: 1, gap: 3},
  proTitle: {fontFamily: InflowFonts.ui.extrabold, fontSize: 17},
  proSub: {fontFamily: InflowFonts.ui.regular, fontSize: 12, lineHeight: 16},
  proBtn: {borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center'},
  proBtnText: {fontFamily: InflowFonts.ui.bold, fontSize: 14},

  northStar: {borderRadius: 18, padding: 18, gap: 6},
  nsCaption: {fontFamily: InflowFonts.ui.semibold, fontSize: 12},
  nsNumber: {fontFamily: InflowFonts.ui.extrabold, fontSize: 56, lineHeight: 56, letterSpacing: -2},
  breakdown: {flexDirection: 'row', gap: 14, alignItems: 'center'},
  breakdownItem: {fontFamily: InflowFonts.ui.semibold, fontSize: 12},

  levels: {gap: 10},
  levelCard: {borderRadius: 16, borderWidth: 1, padding: 14, gap: 10},
  levelTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  levelSkill: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  levelLv: {fontFamily: InflowFonts.ui.semibold, fontSize: 12},
  levelTrack: {height: 8, borderRadius: 999, overflow: 'hidden'},
  levelFill: {height: '100%', borderRadius: 999},

  statRow: {flexDirection: 'row', gap: 12},
  statWarm: {flex: 1, borderRadius: 16, padding: 14, gap: 3},
  stat: {flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, gap: 3},
  statEmoji: {fontSize: 22},
  statNumWarm: {fontFamily: InflowFonts.ui.extrabold, fontSize: 18},
  statSubWarm: {fontFamily: InflowFonts.ui.regular, fontSize: 11},
  statNum: {fontFamily: InflowFonts.ui.extrabold, fontSize: 18},
  statSub: {fontFamily: InflowFonts.ui.regular, fontSize: 11},

  calendar: {borderRadius: 16, borderWidth: 1, padding: 14, gap: 10},
  calendarTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  grid: {gap: 4},
  gridRow: {flexDirection: 'row', gap: 4},
  gridCell: {flex: 1, height: 18, borderRadius: 4},

  milestoneHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  milestoneTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  milestoneMedal: {fontSize: 15},
  milestoneTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  milestoneHint: {fontFamily: InflowFonts.ui.regular, fontSize: 11},
  tiles: {flexDirection: 'row', gap: 10},
  tile: {flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', gap: 6},
  tileEmoji: {fontSize: 22},
  tileLabel: {fontFamily: InflowFonts.ui.semibold, fontSize: 12},

  navRows: {gap: 10},
  navRow: {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16},
  navEmoji: {fontSize: 20},
  navCol: {flex: 1, gap: 2},
  navTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  navSub: {fontFamily: InflowFonts.ui.regular, fontSize: 12},
});

ProfileView.displayName = 'ProfileView';
