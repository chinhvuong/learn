import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppButton, AppText, Icon, ProgressBar} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {QuizQuestion, QuizQuestionType} from '../types';
import {
  countAnswered,
  isAnswered,
  isCorrect,
  isQuizComplete,
  quizProgressPct,
  quizScore,
  selectAnswer,
  type QuizAnswers,
} from '../quizLogic';

export interface LessonComprehensionQuizProps {
  /** The Lesson title (header chrome). */
  lessonTitle: string;
  /** The comprehension questions, in order (main-idea · detail · inference). */
  questions: QuizQuestion[];
  /** Close the Lesson Player (the ✕ in the header). */
  onClose: () => void;
  /** Called once the learner finishes the Quiz → hands off to Completion. */
  onFinished: () => void;
}

/** i18n key for each question-type chip. */
const TYPE_LABEL_KEY: Record<QuizQuestionType, string> = {
  mainIdea: 'LP_QUIZ_TYPE_MAIN_IDEA',
  detail: 'LP_QUIZ_TYPE_DETAIL',
  inference: 'LP_QUIZ_TYPE_INFERENCE',
};

/**
 * Lesson Player — comprehension Quiz (screens.md §12; the design handoff's
 * `lpQuiz*`). After reading/listening, a short optional quiz asks main-idea /
 * detail / inference questions about the passage.
 *
 * Per the issue contract:
 *   - selecting an option **locks** the question after the first tap;
 *   - correct / incorrect is then **revealed** (correct option in teal --flow;
 *     a missed pick in amber --warm);
 *   - the progress bar tracks **answered / total**.
 *
 * Finishing the Quiz closes the Lesson (no debt badge) and hands off to the
 * Completion recap. Self-contained local state — the durable absorption /
 * North Star state lives in the session reducer, untouched here.
 */
export default function LessonComprehensionQuiz({
  lessonTitle,
  questions,
  onClose,
  onFinished,
}: LessonComprehensionQuizProps) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const colors = useColors();

  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const done = isQuizComplete(questions, answers) && index >= total;
  const question = !done && index < total ? questions[index] : null;
  const answered = question ? isAnswered(answers, index) : false;
  const pickedIndex = question ? answers[index] : undefined;
  const right = question ? isCorrect(question, answers, index) : false;

  const progressPct = useMemo(
    () => quizProgressPct(answers, total),
    [answers, total],
  );

  const pick = (optionIndex: number) => {
    // Lock on first selection: selectAnswer is idempotent once answered.
    setAnswers(prev => selectAnswer(prev, index, optionIndex));
  };

  const next = () => {
    if (index + 1 >= total) {
      // Step past the last question into the done state.
      setIndex(total);
    } else {
      setIndex(index + 1);
    }
  };

  const optionStyle = (optionIndex: number) => {
    if (!answered || !question) {
      return {
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.ink,
      };
    }
    if (optionIndex === question.correctIndex) {
      return {
        borderColor: colors.flow,
        backgroundColor: colors.flowSoft,
        color: colors.flowInk,
      };
    }
    if (optionIndex === pickedIndex) {
      return {
        borderColor: colors.warm,
        backgroundColor: colors.warmSoft,
        color: colors.warmInk,
      };
    }
    return {
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.ink,
      opacity: 0.5,
    };
  };

  const optionMark = (optionIndex: number) => {
    if (!answered || !question) {
      return '';
    }
    if (optionIndex === question.correctIndex) {
      return '✓';
    }
    if (optionIndex === pickedIndex) {
      return '✕';
    }
    return '';
  };

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: colors.appBg, paddingTop: insets.top},
      ]}>
      {/* Header chrome: close · title. */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={styles.closeBtn}>
          <Icon name="X" className="text-foreground w-6 h-6" />
        </Pressable>
        <View style={styles.headerTitle}>
          <AppText raw variant="heading5" weight="bold" numberOfLines={1}>
            {lessonTitle}
          </AppText>
        </View>
        {!done ? (
          <View style={[styles.countPill, {backgroundColor: colors.flowSoft}]}>
            <AppText raw style={[styles.countPillText, {color: colors.flowInk}]}>
              {t('LP_QUIZ_COUNT', {num: index + 1, total})}
            </AppText>
          </View>
        ) : (
          <View style={styles.countPillSpacer} />
        )}
      </View>

      {/* Quiz card title row. */}
      <View style={styles.cardTitleRow}>
        <View style={[styles.cardIcon, {backgroundColor: colors.flowSoft}]}>
          <Icon name="BookOpenText" className="text-primary w-4 h-4" />
        </View>
        <View style={styles.cardTitleText}>
          <AppText raw style={styles.cardTitle}>
            {t('LP_QUIZ_TITLE')}
          </AppText>
          <AppText raw style={[styles.cardSubtitle, {color: colors.ink3}]}>
            {t('LP_QUIZ_SUBTITLE')}
          </AppText>
        </View>
      </View>

      {/* Progress bar — answered / total. */}
      <View style={styles.progressRow}>
        <ProgressBar value={progressPct} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        {question ? (
          <>
            {/* Type chip: ý chính · chi tiết · suy luận. */}
            <View
              style={[styles.typeChip, {backgroundColor: colors.flowSoft}]}>
              <AppText raw style={[styles.typeChipText, {color: colors.flowInk}]}>
                {t(TYPE_LABEL_KEY[question.type])}
              </AppText>
            </View>

            {/* Prompt. */}
            <AppText raw style={[styles.prompt, {color: colors.ink}]}>
              {question.prompt}
            </AppText>

            {/* Options — lock after first pick, then reveal correct/incorrect. */}
            <View style={styles.options}>
              {question.options.map((option, optionIndex) => {
                const oStyle = optionStyle(optionIndex);
                const mark = optionMark(optionIndex);
                return (
                  <Pressable
                    key={optionIndex}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: answered,
                      selected: optionIndex === pickedIndex,
                    }}
                    disabled={answered}
                    onPress={() => pick(optionIndex)}
                    style={[
                      styles.option,
                      {
                        borderColor: oStyle.borderColor,
                        backgroundColor: oStyle.backgroundColor,
                        opacity: oStyle.opacity ?? 1,
                      },
                    ]}>
                    <AppText
                      raw
                      style={[styles.optionText, {color: oStyle.color}]}>
                      {option}
                    </AppText>
                    {mark ? (
                      <AppText
                        raw
                        style={[styles.optionMark, {color: oStyle.color}]}>
                        {mark}
                      </AppText>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Feedback after answering. */}
            {answered && right ? (
              <AppText raw style={[styles.feedbackRight, {color: colors.flowInk}]}>
                {t('LP_QUIZ_CORRECT')}
              </AppText>
            ) : null}
            {answered && !right ? (
              <AppText raw style={[styles.feedbackWrong, {color: colors.ink2}]}>
                {t('LP_QUIZ_WRONG')}
              </AppText>
            ) : null}
          </>
        ) : (
          /* Done state — bài học hoàn thành (no debt badge). */
          <View style={styles.doneWrap}>
            <AppText raw style={styles.doneEmoji}>
              ✓
            </AppText>
            <AppText raw style={styles.doneScore}>
              {t('LP_QUIZ_SCORE', {
                score: quizScore(questions, answers),
                total,
              })}
            </AppText>
            <AppText raw align="center" style={[styles.doneBody, {color: colors.ink2}]}>
              {t('LP_QUIZ_DONE_BODY')}
            </AppText>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA: Tiếp / Hoàn tất / (done) → Completion. */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.hair,
            backgroundColor: colors.appBg,
            paddingBottom: 14 + insets.bottom,
          },
        ]}>
        {question ? (
          <AppButton
            variant="primary"
            disabled={!answered}
            onPress={next}
            accessibilityLabel={
              index + 1 >= total ? t('LP_QUIZ_FINISH') : t('LP_QUIZ_NEXT')
            }>
            <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
              {index + 1 >= total ? t('LP_QUIZ_FINISH') : t('LP_QUIZ_NEXT')}
            </AppText>
          </AppButton>
        ) : (
          <AppButton
            variant="primary"
            onPress={onFinished}
            accessibilityLabel={t('LP_QUIZ_TO_RECAP')}>
            <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
              {t('LP_QUIZ_TO_RECAP')}
            </AppText>
          </AppButton>
        )}
      </View>
    </View>
  );
}

// Re-exported so the screen can show answered progress in chrome if needed.
export {countAnswered};

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  closeBtn: {paddingRight: 4},
  headerTitle: {flex: 1, minWidth: 0},
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  countPillText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11.5},
  countPillSpacer: {minWidth: 28},
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 12,
  },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleText: {flex: 1, minWidth: 0},
  cardTitle: {fontFamily: InflowFonts.ui.bold, fontSize: 13.5},
  cardSubtitle: {fontFamily: InflowFonts.ui.regular, fontSize: 10.5, marginTop: 1},
  progressRow: {paddingHorizontal: 22, marginBottom: 4},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 22, paddingTop: 14, paddingBottom: 32},
  typeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9,
    marginBottom: 14,
  },
  typeChipText: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  prompt: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 18,
  },
  options: {gap: 10},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  optionText: {
    flex: 1,
    fontFamily: InflowFonts.ui.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  optionMark: {fontFamily: InflowFonts.ui.extrabold, fontSize: 15},
  feedbackRight: {
    fontFamily: InflowFonts.ui.bold,
    fontSize: 13.5,
    marginTop: 16,
  },
  feedbackWrong: {
    fontFamily: InflowFonts.ui.regular,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 16,
  },
  doneWrap: {alignItems: 'center', paddingTop: 24},
  doneEmoji: {fontSize: 34, marginBottom: 10},
  doneScore: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  doneBody: {
    fontFamily: InflowFonts.ui.regular,
    fontSize: 13.5,
    lineHeight: 21,
    maxWidth: 280,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 13,
    borderTopWidth: 1,
  },
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
});

LessonComprehensionQuiz.displayName = 'LessonComprehensionQuiz';
