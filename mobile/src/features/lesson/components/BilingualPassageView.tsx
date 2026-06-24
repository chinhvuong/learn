import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppText, ItemToken, ReadingText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {Item, PassageSentence} from '../types';
import type {ItemDecision} from '../lessonSessionSlice';

export interface BilingualPassageViewProps {
  sentences: PassageSentence[];
  /** Lookup from Item id → Item (projected + pre-Absorbed review Items). */
  itemsById: Record<string, Item>;
  /** Per-Item decision map; an `absorbed` Item renders teal→amber. */
  decided: Record<string, ItemDecision>;
  /** Item ids that were Absorbed in a previous Lesson (review-in-context). */
  preAbsorbedItemIds: readonly string[];
  /** Which sentences currently show their Native-Language translation. */
  revealedSentences: Record<string, boolean>;
  /** Tap an Item token — the absorption gesture. */
  onTapItem: (itemId: string) => void;
  /** Toggle one sentence's translation. */
  onToggleSentence: (sentenceId: string) => void;
}

/**
 * The Bilingual Passage reading surface (CONTEXT.md → "Bilingual Passage";
 * screens.md §9). The Target-Language (English) text is primary and prominent
 * in the Newsreader serif; the Native-Language translation is revealed only on
 * demand by tapping the per-sentence "VI" badge — never side-by-side by
 * default. Items are encoded via `ItemToken` and recolor teal → amber once
 * Absorbed.
 */
export default function BilingualPassageView({
  sentences,
  itemsById,
  decided,
  preAbsorbedItemIds,
  revealedSentences,
  onTapItem,
  onToggleSentence,
}: BilingualPassageViewProps) {
  const {t} = useTranslation();
  const colors = useColors();

  return (
    <ReadingText size="large">
      {sentences.map((sentence, idx) => {
        const open = !!revealedSentences[sentence.id];
        return (
          <ReadingText key={sentence.id} size="large">
            {idx > 0 ? '  ' : ''}
            {/* Per-sentence VI translation badge — tap to reveal. */}
            <ReadingText
              size="large"
              accessibilityRole="button"
              accessibilityLabel={t('LP_TRANSLATE_SENTENCE')}
              onPress={() => onToggleSentence(sentence.id)}
              style={[
                styles.badge,
                {
                  color: open ? colors.onFlow : colors.flowInk,
                  backgroundColor: open ? colors.flow : colors.flowSoft,
                  fontFamily: InflowFonts.ui.bold,
                },
              ]}>
              {' VI '}
            </ReadingText>
            {' '}
            {/* The Target-Language sentence, with Item tokens inline. */}
            {sentence.spans.map((span, spanIdx) => {
              if (span.kind === 'text') {
                return (
                  <ReadingText size="large" key={spanIdx}>
                    {span.text}
                  </ReadingText>
                );
              }
              const item = itemsById[span.itemId];
              if (!item) {
                return null;
              }
              const absorbed =
                decided[span.itemId] === 'absorbed' ||
                preAbsorbedItemIds.includes(span.itemId);
              return (
                <ItemToken
                  key={spanIdx}
                  kind={item.type}
                  absorbed={absorbed}
                  accessibilityRole="button"
                  accessibilityLabel={item.headword}
                  onPress={() => onTapItem(span.itemId)}>
                  {item.headword}
                </ItemToken>
              );
            })}
            {/* Revealed Native-Language translation, inline after the sentence. */}
            {open ? (
              <AppText
                raw
                style={[
                  styles.translation,
                  {color: colors.flowInk, backgroundColor: colors.flowSoft},
                ]}>
                {'  '}
                {sentence.translation}
                {' '}
              </AppText>
            ) : null}
          </ReadingText>
        );
      })}
    </ReadingText>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 11,
    letterSpacing: 0.3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  translation: {
    fontFamily: InflowFonts.reading.italic,
    fontStyle: 'italic',
    fontSize: 14.5,
    borderRadius: 6,
    overflow: 'hidden',
  },
});

BilingualPassageView.displayName = 'BilingualPassageView';
