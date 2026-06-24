import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AppText} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {QuickReviewPrompt} from '../srs';

export interface QuickReviewViewProps {
  /** The Items to review (selected by light SRS — never a due-queue). */
  prompts: QuickReviewPrompt[];
  /** Close the review (it is always optional — skipping costs nothing). */
  onDone: () => void;
}

/**
 * The optional **60-second quick review** (CONTEXT.md → "SRS"; screens.md §10b
 * C2). A short, learner-chosen pass over a few Absorbed Items: prompt → reveal →
 * "Nhớ / Chưa nhớ" self-check. Deliberately low-pressure — it carries the
 * "không badge nợ" reassurance and there is **no due-queue and no red debt
 * badge**. Self-grades are not persisted as a schedule; the value is the
 * re-encounter itself.
 */
export default function QuickReviewView({prompts, onDone}: QuickReviewViewProps) {
  const {t} = useTranslation();
  const colors = useColors();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const total = prompts.length;
  const current = prompts[index];

  if (total === 0 || !current) {
    return (
      <View style={[styles.root, {backgroundColor: colors.appBg}]}>
        <AppText raw align="center" style={[styles.empty, {color: colors.ink2}]}>
          {t('QUICK_REVIEW_EMPTY')}
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={onDone}
          style={[styles.doneBtn, {backgroundColor: colors.flow}]}>
          <AppText raw style={[styles.doneText, {color: colors.onFlow}]}>
            {t('QUICK_REVIEW_DONE')}
          </AppText>
        </Pressable>
      </View>
    );
  }

  const advance = () => {
    if (index + 1 >= total) {
      onDone();
      return;
    }
    setIndex(index + 1);
    setRevealed(false);
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.appBg}]}>
      <AppText raw style={[styles.counter, {color: colors.ink3}]}>
        {t('QUICK_REVIEW_COUNTER', {index: index + 1, total})}
      </AppText>

      <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.hair}]}>
        <AppText raw align="center" style={[styles.prompt, {color: colors.ink}]}>
          {t('QUICK_REVIEW_PROMPT', {word: current.item.headword})}
        </AppText>

        {revealed ? (
          <View style={[styles.answerPill, {backgroundColor: colors.flowSoft}]}>
            <AppText raw style={[styles.answerText, {color: colors.flowInk}]}>
              {current.answer}
            </AppText>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setRevealed(true)}
            style={[styles.revealBtn, {borderColor: colors.border}]}>
            <AppText raw style={[styles.revealText, {color: colors.ink2}]}>
              {t('QUICK_REVIEW_REVEAL')}
            </AppText>
          </Pressable>
        )}
      </View>

      {revealed ? (
        <View style={styles.gradeRow}>
          <Pressable
            accessibilityRole="button"
            onPress={advance}
            style={[styles.gradeBtn, {backgroundColor: colors.flow}]}>
            <AppText raw style={[styles.gradeText, {color: colors.onFlow}]}>
              {t('QUICK_REVIEW_REMEMBER')}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={advance}
            style={[styles.gradeBtnOutline, {backgroundColor: colors.surface, borderColor: colors.border}]}>
            <AppText raw style={[styles.gradeTextOutline, {color: colors.ink2}]}>
              {t('QUICK_REVIEW_FORGOT')}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {/* No due-queue, no red debt badge — reassure it's an opportunity. */}
      <AppText raw align="center" style={[styles.noDebt, {color: colors.ink3}]}>
        {t('QUICK_REVIEW_NO_DEBT')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, paddingHorizontal: 28, paddingTop: 32, alignItems: 'center'},
  counter: {fontFamily: InflowFonts.ui.bold, fontSize: 13, marginBottom: 20},
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 40,
    paddingHorizontal: 22,
  },
  prompt: {fontFamily: InflowFonts.ui.bold, fontSize: 20, marginBottom: 20},
  revealBtn: {paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1},
  revealText: {fontFamily: InflowFonts.ui.semibold, fontSize: 14},
  answerPill: {paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12},
  answerText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  gradeRow: {flexDirection: 'row', alignSelf: 'stretch', gap: 12, marginTop: 22},
  gradeBtn: {flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center'},
  gradeText: {fontFamily: InflowFonts.ui.bold, fontSize: 15},
  gradeBtnOutline: {flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1, alignItems: 'center'},
  gradeTextOutline: {fontFamily: InflowFonts.ui.bold, fontSize: 15},
  noDebt: {fontFamily: InflowFonts.ui.medium, fontSize: 12, marginTop: 18},
  empty: {fontFamily: InflowFonts.ui.medium, fontSize: 15, marginBottom: 20},
  doneBtn: {paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14},
  doneText: {fontFamily: InflowFonts.ui.bold, fontSize: 15},
});

QuickReviewView.displayName = 'QuickReviewView';
