import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppButton, AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {Item} from '../types';
import type {ItemDecision} from '../lessonSessionSlice';
import NorthStarCounter from './NorthStarCounter';

export interface LessonCompleteViewProps {
  items: Item[];
  decided: Record<string, ItemDecision>;
  /** North Star before this Lesson — animates up to + Absorbed this session. */
  northStarBase: number;
  northStarLive: number;
  onContinue: () => void;
}

/**
 * Lesson-complete recap (screens.md §11, above the fold). Reports just-this-
 * Lesson stats — Items Absorbed broken down by type — and animates the North
 * Star count-up toward its new cumulative total. The fuller recommendation /
 * Preference Tuner surface is out of scope for this Reading slice.
 */
export default function LessonCompleteView({
  items,
  decided,
  northStarBase,
  northStarLive,
  onContinue,
}: LessonCompleteViewProps) {
  const {t} = useTranslation();
  const colors = useColors();

  const absorbedItems = items.filter(item => decided[item.id] === 'absorbed');
  const vCount = absorbedItems.filter(i => i.type === 'vocabulary').length;
  const cCount = absorbedItems.filter(i => i.type === 'chunk').length;
  const gCount = absorbedItems.filter(i => i.type === 'grammarPoint').length;

  return (
    <View style={[styles.root, {backgroundColor: colors.appBg}]}>
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

      <View
        style={[
          styles.northStarCard,
          {backgroundColor: colors.warmSoft},
        ]}>
        <NorthStarCounter value={northStarLive} floatKey={0} />
        <AppText raw style={[styles.delta, {color: colors.warmInk}]}>
          {t('LP_COMPLETE_DELTA', {count: northStarLive - northStarBase})}
        </AppText>
      </View>

      <View style={styles.cta}>
        <AppButton variant="primary" onPress={onContinue}>
          <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
            {t('LP_COMPLETE_CONTINUE')}
          </AppText>
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28},
  emoji: {fontSize: 40, marginBottom: 8},
  recap: {fontFamily: InflowFonts.ui.semibold, fontSize: 13.5, marginTop: 6},
  northStarCard: {
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 40,
    marginTop: 24,
  },
  delta: {fontFamily: InflowFonts.ui.bold, fontSize: 12.5, marginTop: 8},
  cta: {alignSelf: 'stretch', marginTop: 28},
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
});

LessonCompleteView.displayName = 'LessonCompleteView';
