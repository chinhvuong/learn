import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Animated, {Easing, withTiming} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {Item} from '../types';

export interface ItemMeaningCardProps {
  item: Item;
  onClose: () => void;
}

/**
 * The Item detail / meaning card opened by tapping an Item in the Bilingual
 * Passage (screens.md §10b, B1/B2/B3). Its content varies by Item type:
 *
 *   - Vocabulary   — headword · IPA · part of speech · CEFR · VI meaning.
 *   - Chunk        — chunk · CEFR · VI meaning · usage pattern · anchor/candidate.
 *   - Grammar Point — name · CEFR · pattern with slot · authored VI explanation.
 *
 * Because tapping is the absorption gesture, the card always shows the Item as
 * already "✓ Đã nạp" (Absorbed) — the marking and the meaning are one gesture.
 */
export default function ItemMeaningCard({item, onClose}: ItemMeaningCardProps) {
  const {t} = useTranslation();
  const colors = useColors();

  return (
    <Animated.View
      entering={cardEntering}
      style={[
        styles.card,
        {backgroundColor: colors.surface, borderColor: colors.border},
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.headerMain}>
          <View style={styles.headwordRow}>
            <AppText
              raw
              style={[styles.headword, {color: colors.ink}]}>
              {item.headword}
            </AppText>
            <View style={[styles.posPill, {backgroundColor: colors.flowSoft}]}>
              <AppText raw style={[styles.posPillText, {color: colors.flowInk}]}>
                {item.posLabel}
              </AppText>
            </View>
          </View>
          {item.ipa ? (
            <AppText raw style={[styles.ipa, {color: colors.ink3}]}>
              {item.ipa}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.closeBtn, {backgroundColor: colors.surface2}]}>
          <Icon name="X" className="text-neutrals200 w-4 h-4" />
        </Pressable>
      </View>

      {/* Vocabulary / Chunk → the Native-Language meaning. */}
      {item.type !== 'grammarPoint' ? (
        <AppText raw style={[styles.meaning, {color: colors.warmInk}]}>
          → {item.meaning}
        </AppText>
      ) : null}

      {/* Chunk → usage pattern + anchor/candidate indicator (ADR-0004). */}
      {item.type === 'chunk' ? (
        <View>
          {item.pattern ? (
            <AppText raw style={[styles.pattern, {color: colors.ink2}]}>
              ⚙ {item.pattern}
            </AppText>
          ) : null}
          {item.chunkOrigin === 'anchor' ? (
            <View style={[styles.tag, {backgroundColor: colors.flowSoft}]}>
              <AppText raw style={[styles.tagText, {color: colors.flowInk}]}>
                {t('LP_CHUNK_ANCHOR')}
              </AppText>
            </View>
          ) : item.chunkOrigin === 'candidate' ? (
            <View style={[styles.tag, {backgroundColor: colors.surface2}]}>
              <AppText raw style={[styles.tagText, {color: colors.ink2}]}>
                {t('LP_CHUNK_CANDIDATE')}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Grammar Point → pattern with slot + authored VI explanation (ADR-0003). */}
      {item.type === 'grammarPoint' ? (
        <View>
          <View
            style={[
              styles.patternBox,
              {backgroundColor: colors.surface2, borderColor: colors.hair},
            ]}>
            <AppText raw style={[styles.patternLabel, {color: colors.ink3}]}>
              {t('LP_GRAMMAR_PATTERN')}
            </AppText>
            <AppText
              raw
              style={[styles.patternText, {color: colors.ink}]}>
              {item.pattern}
            </AppText>
          </View>
          {item.explanation ? (
            <AppText raw style={[styles.explain, {color: colors.ink2}]}>
              <AppText raw style={{color: colors.ink}}>
                {t('LP_GRAMMAR_EXPLAIN')}:{' '}
              </AppText>
              {item.explanation}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <AppText raw style={[styles.example, {color: colors.ink3}]}>
        {t('LP_IN_PASSAGE')}: “{item.example}”
      </AppText>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          style={[
            styles.listenBtn,
            {borderColor: colors.border, backgroundColor: colors.surface},
          ]}>
          <AppText raw style={[styles.listenText, {color: colors.ink}]}>
            🔊 {t('LP_LISTEN')}
          </AppText>
        </Pressable>
        <View style={[styles.absorbedBtn, {backgroundColor: colors.warmSoft}]}>
          <AppText raw style={[styles.absorbedText, {color: colors.warmInk}]}>
            ✓ {t('LP_ABSORBED')}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * floatPop entrance (handoff `@keyframes floatPop`: opacity 0 → 1, translateY
 * 8 → 0, scale 0.9 → 1 over .26s with a cubic-bezier(.2,.8,.3,1) ease). A
 * reanimated custom entering builder carries all three transforms (Layout-
 * Animation presets like FadeInUp don't include the scale leg).
 */
const cardEntering = () => {
  'worklet';
  const ease = Easing.bezier(0.2, 0.8, 0.3, 1);
  return {
    initialValues: {opacity: 0, transform: [{translateY: 8}, {scale: 0.9}]},
    animations: {
      opacity: withTiming(1, {duration: 260, easing: ease}),
      transform: [
        {translateY: withTiming(0, {duration: 260, easing: ease})},
        {scale: withTiming(1, {duration: 260, easing: ease})},
      ],
    },
  };
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 12},
    elevation: 12,
  },
  headerRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  headerMain: {flex: 1, minWidth: 0},
  headwordRow: {flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'},
  headword: {
    // Design card headword weight is 600; Newsreader ships regular/medium/bold,
    // so reading.medium (500) is the closest available step (bold 700 was too
    // heavy).
    fontFamily: InflowFonts.reading.medium,
    fontSize: 20,
  },
  posPill: {borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3},
  posPillText: {fontFamily: InflowFonts.ui.bold, fontSize: 10},
  ipa: {
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 13.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meaning: {fontFamily: InflowFonts.ui.bold, fontSize: 18, marginTop: 11},
  pattern: {fontFamily: InflowFonts.ui.regular, fontSize: 12.5, marginTop: 4},
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 9,
  },
  tagText: {fontFamily: InflowFonts.ui.semibold, fontSize: 11.5},
  patternBox: {borderWidth: 1, borderRadius: 11, padding: 11, marginTop: 11},
  patternLabel: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  patternText: {fontFamily: InflowFonts.reading.medium, fontSize: 15},
  explain: {fontFamily: InflowFonts.ui.regular, fontSize: 12.5, marginTop: 9, lineHeight: 19},
  example: {
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 12.5,
    marginTop: 11,
    lineHeight: 18,
  },
  actionRow: {flexDirection: 'row', gap: 9, marginTop: 14},
  listenBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
  },
  listenText: {fontFamily: InflowFonts.ui.bold, fontSize: 13.5},
  absorbedBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 11,
  },
  absorbedText: {fontFamily: InflowFonts.ui.bold, fontSize: 13.5},
});

ItemMeaningCard.displayName = 'ItemMeaningCard';
