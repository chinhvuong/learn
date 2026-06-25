import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {CefrBand} from '@/features/lesson/types';
import type {LevelSkill} from '../milestones';
import Confetti from './Confetti';

export interface LevelUpViewProps {
  /** Which skill levelled up (Reading or Listening). */
  skill: LevelSkill;
  /** The band just left behind (e.g. A2). */
  fromBand: CefrBand;
  /** The new band reached (e.g. B1). */
  toBand: CefrBand;
  /** Move into the freshly-unlocked content for the new band. */
  onSeeContent: () => void;
  /** The guilt-free "later" exit ("Để sau"). Always present. */
  onLater: () => void;
}

/**
 * The **Level up** moment (CONTEXT.md → "Level"; screens.md §14b; handoff
 * `#profile` 14b takeover). Fired **automatically from behavior** when a fine
 * Level score crosses a CEFR band boundary — never from a test. A flow-soft
 * gradient takeover with confetti, the old band (dimmed) → new band (popped,
 * "MỚI" badge), what it unlocks, and a low-pressure "Để sau" exit beside the CTA.
 *
 * Tokens only — teal `--flow` for the new-band badge / primary action.
 */
export default function LevelUpView({
  skill,
  fromBand,
  toBand,
  onSeeContent,
  onLater,
}: LevelUpViewProps) {
  const {t} = useTranslation();
  const colors = useColors();
  const skillLabel = skill === 'reading' ? t('LEVELUP_SKILL_READING') : t('LEVELUP_SKILL_LISTENING');

  // Render the title with only the skill word in teal (flow-ink), the rest in
  // ink — matching the design (`Kỹ năng <flow>Nghe</flow> đã lên B1!`). We
  // interpolate with a unique sentinel for the skill, then split around it so
  // the visible sentence reads identically to LEVELUP_TITLE.
  const SKILL_TOKEN = '\u0000';
  const titleRaw = t('LEVELUP_TITLE', {skill: SKILL_TOKEN, band: toBand});
  const [titleBefore, titleAfter = ''] = titleRaw.split(SKILL_TOKEN);

  // nsPop on the new-band badge.
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
    transform: [
      {scale: pop.interpolate({inputRange: [0, 0.4, 1], outputRange: [0.7, 1.12, 1]})},
    ],
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.appBg}]}>
      {/* Takeover gradient: flow-soft tint at top → app-bg at bottom (design
          `linear-gradient(180deg, flow-soft 70% → app-bg)`). */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="levelUpBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.flowSoft} stopOpacity={0.7} />
            <Stop offset="1" stopColor={colors.appBg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#levelUpBg)" />
      </Svg>
      <Confetti />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <AppText raw style={[styles.eyebrow, {color: colors.flowInk}]}>
          {t('LEVELUP_EYEBROW')}
        </AppText>

        {/* from-band (dimmed) → to-band (popped, MỚI badge) */}
        <View style={styles.bandsRow}>
          <View style={styles.fromCol}>
            <View style={[styles.fromBadge, {backgroundColor: colors.surface, borderColor: colors.border}]}>
              <AppText raw style={[styles.fromBandText, {color: colors.ink2}]}>
                {fromBand}
              </AppText>
            </View>
            <AppText raw style={[styles.bandCaption, {color: colors.ink3}]}>
              {t('LEVELUP_FROM_CAPTION')}
            </AppText>
          </View>

          <AppText raw style={[styles.arrow, {color: colors.flow}]}>
            →
          </AppText>

          <View style={styles.toCol}>
            <Animated.View
              style={[styles.toBadge, {backgroundColor: colors.flow, shadowColor: colors.flow}, popStyle]}>
              <AppText raw style={[styles.toBandText, {color: colors.onFlow}]}>
                {toBand}
              </AppText>
              <View style={[styles.newPill, {backgroundColor: colors.warm}]}>
                <AppText raw style={[styles.newPillText, {color: colors.onFlow}]}>
                  {t('LEVELUP_NEW')}
                </AppText>
              </View>
            </Animated.View>
            <AppText raw style={[styles.toCaption, {color: colors.flowInk}]}>
              {t('LEVELUP_TO_CAPTION')}
            </AppText>
          </View>
        </View>

        <AppText raw align="center" style={[styles.title, {color: colors.ink}]}>
          {titleBefore}
          <AppText raw style={[styles.title, {color: colors.flowInk}]}>
            {skillLabel}
          </AppText>
          {titleAfter}
        </AppText>
        <AppText raw align="center" style={[styles.body, {color: colors.ink2}]}>
          {t('LEVELUP_BODY', {band: fromBand})}
        </AppText>

        {/* what this unlocks */}
        <View style={[styles.unlockCard, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
          <View style={[styles.unlockIcon, {backgroundColor: colors.flowSoft}]}>
            <AppText raw style={styles.unlockEmoji}>
              🎧
            </AppText>
          </View>
          <AppText raw style={[styles.unlockText, {color: colors.ink2}]}>
            {t('LEVELUP_UNLOCK', {band: toBand})}
          </AppText>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onSeeContent}
          style={[styles.primaryBtn, {backgroundColor: colors.flow, shadowColor: colors.flow}]}>
          <AppText raw style={[styles.primaryText, {color: colors.onFlow}]}>
            {t('LEVELUP_SEE_CONTENT', {band: toBand})}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onLater}
          style={[styles.laterBtn, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <AppText raw style={[styles.laterText, {color: colors.ink2}]}>
            {t('LEVELUP_LATER')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, overflow: 'hidden'},
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 24,
  },
  eyebrow: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 14,
    letterSpacing: 4,
    marginBottom: 20,
  },
  bandsRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 24},
  fromCol: {alignItems: 'center', gap: 7, opacity: 0.5},
  fromBadge: {
    width: 56,
    height: 56,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fromBandText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 21},
  bandCaption: {fontFamily: InflowFonts.ui.semibold, fontSize: 11},
  arrow: {fontFamily: InflowFonts.ui.extrabold, fontSize: 24, marginBottom: 18},
  toCol: {alignItems: 'center', gap: 8},
  toBadge: {
    width: 86,
    height: 86,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: {width: 0, height: 18},
    elevation: 10,
  },
  toBandText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 35},
  newPill: {
    position: 'absolute',
    top: -9,
    right: -12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9,
  },
  newPillText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 9.5, letterSpacing: 0.5},
  toCaption: {fontFamily: InflowFonts.ui.extrabold, fontSize: 12.5},
  title: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 25,
    letterSpacing: -0.6,
    lineHeight: 29,
    marginBottom: 9,
  },
  body: {
    fontFamily: InflowFonts.ui.medium,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 285,
  },
  unlockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    maxWidth: 300,
  },
  unlockIcon: {width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center'},
  unlockEmoji: {fontSize: 17},
  unlockText: {fontFamily: InflowFonts.ui.medium, fontSize: 12.5, lineHeight: 18, flex: 1},
  actions: {paddingHorizontal: 28, paddingBottom: 26, gap: 11},
  primaryBtn: {
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  primaryText: {fontFamily: InflowFonts.ui.bold, fontSize: 15.5},
  laterBtn: {paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center'},
  laterText: {fontFamily: InflowFonts.ui.bold, fontSize: 15},
});

LevelUpView.displayName = 'LevelUpView';
