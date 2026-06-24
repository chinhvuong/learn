import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {Milestone} from '../milestones';
import {milestoneDisplay} from '../milestoneDisplay';

export interface MilestoneCardProps {
  /** The milestone this card commemorates. */
  milestone: Milestone;
  /** The learner's handle shown top-right (e.g. "@user"). */
  handle: string;
  /** Cumulative North Star, shown in the card's subline. */
  northStar: number;
}

/**
 * The shareable **Milestone Card** (CONTEXT.md → "Milestone Card"; the handoff
 * `#core` Celebration card): an attractive, auto-generated image marking a
 * moment worth showing off (Streak 7/30/100, Level up, round North Star).
 *
 * A teal (`--flow`) gradient-feel card branded "Inflow @handle", a big hero
 * value, and a one-line stat subline — the only sharing surface inside the core
 * learning loop. It carries `collapsable={false}` so the screen can snapshot it
 * for the actual share image. Tokens only — no hardcoded colors.
 */
export default function MilestoneCard({
  milestone,
  handle,
  northStar,
}: MilestoneCardProps) {
  const colors = useColors();
  const display = milestoneDisplay(milestone);

  // The card is branded teal regardless of tone, matching the handoff card.
  const nsLabel = `${northStar.toLocaleString('en-US')} Item đã nạp`;
  const subline =
    milestone.kind === 'streak'
      ? `ngày streak · ${nsLabel}`
      : milestone.kind === 'levelUp'
        ? `Lên Level · ${nsLabel}`
        : `Item đã nạp · cột mốc lớn`;

  return (
    <View
      collapsable={false}
      style={[
        styles.card,
        {backgroundColor: colors.flow, shadowColor: colors.flow},
      ]}>
      <View style={styles.headerRow}>
        <AppText raw style={[styles.brand, {color: colors.onFlow}]}>
          Inflow
        </AppText>
        <AppText raw style={[styles.handle, {color: colors.onFlow}]}>
          {handle}
        </AppText>
      </View>
      <AppText raw style={[styles.hero, {color: colors.onFlow}]}>
        {display.emoji} {display.heroValue}
      </AppText>
      <AppText raw style={[styles.subline, {color: colors.onFlow}]}>
        {subline}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 300,
    padding: 22,
    borderRadius: 20,
    shadowOpacity: 0.4,
    shadowRadius: 28,
    shadowOffset: {width: 0, height: 16},
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brand: {fontFamily: InflowFonts.ui.extrabold, fontSize: 14, letterSpacing: -0.2},
  handle: {fontFamily: InflowFonts.ui.medium, fontSize: 11, opacity: 0.85},
  hero: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 42,
    letterSpacing: -1,
    lineHeight: 46,
  },
  subline: {
    fontFamily: InflowFonts.ui.semibold,
    fontSize: 12.5,
    opacity: 0.9,
    marginTop: 6,
  },
});

MilestoneCard.displayName = 'MilestoneCard';
