import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AppText, Icon} from '@/components/ui';
import {useColors} from '@/hooks/useColors';
import {InflowFonts} from '@/config/typography';
import type {QuizQuestion} from '../types';
import {
  clearAnswer,
  countAnswered,
  isAnswered,
  isCorrect,
  selectAnswer,
  type QuizAnswers,
} from '../quizLogic';

export interface LessonComprehensionQuizProps {
  /** The Lesson title (kept for parity with the player chrome / a11y). */
  lessonTitle: string;
  /** The comprehension questions, in order (main-idea · detail · inference). */
  questions: QuizQuestion[];
  /** Close the Lesson Player (the ✕ in the header). */
  onClose: () => void;
  /** Called once the learner finishes the Quiz → hands off to Completion. */
  onFinished: () => void;
}

/**
 * Lesson Player — comprehension Quiz (screens.md §10; design nodes `SwjYj` LP5
 * Kiểm tra nhanh and `WFyG7` LP5b Sai → Thử lại). After reading/listening, a
 * short low-stakes check ("kiểm tra nhẹ, không tính điểm") asks main-idea /
 * detail / inference questions about the passage.
 *
 * Per the design + issue contract:
 *   - selecting an option **locks** the question after the first tap;
 *   - a **correct** pick recolors teal (--flow soft + a ✓) and the rest dim;
 *   - a **wrong** pick recolors the chosen option in --danger (a ✕ badge) and
 *     the footer swaps to a "↻ Thử lại" retry that re-opens the same question;
 *   - the header carries a "N/total" count pill.
 *
 * Finishing the Quiz hands off to the Completion recap. Self-contained local
 * state — the durable absorption / North Star state lives in the session
 * reducer, untouched here.
 */
export default function LessonComprehensionQuiz({
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

  const question = index < total ? questions[index] : null;
  const answered = question ? isAnswered(answers, index) : false;
  const pickedIndex = question ? answers[index] : undefined;
  const right = question ? isCorrect(question, answers, index) : false;

  const pick = (optionIndex: number) => {
    setAnswers(prev => selectAnswer(prev, index, optionIndex));
  };

  const retry = () => {
    setAnswers(prev => clearAnswer(prev, index));
  };

  const advance = () => {
    if (index + 1 >= total) {
      onFinished();
    } else {
      setIndex(index + 1);
    }
  };

  /** Per-option chrome for the answered reveal (correct · wrong · dimmed). */
  const optionChrome = (optionIndex: number) => {
    if (!answered || !question) {
      return {
        bg: colors.surface,
        border: colors.border,
        borderWidth: 1.5,
        text: colors.ink,
        textWeight: InflowFonts.ui.semibold,
        opacity: 1,
        mark: null as 'check' | 'cross' | null,
      };
    }
    if (optionIndex === question.correctIndex) {
      return {
        bg: colors.flowSoft,
        border: colors.flow,
        borderWidth: 1.5,
        text: colors.flowInk,
        textWeight: InflowFonts.ui.bold,
        opacity: 1,
        mark: 'check' as const,
      };
    }
    if (optionIndex === pickedIndex) {
      return {
        bg: colors.surface,
        border: colors.error,
        borderWidth: 2,
        text: colors.error,
        textWeight: InflowFonts.ui.bold,
        opacity: 1,
        mark: 'cross' as const,
      };
    }
    return {
      bg: colors.surface,
      border: colors.border,
      borderWidth: 1.5,
      text: colors.ink,
      textWeight: InflowFonts.ui.semibold,
      opacity: 0.5,
      mark: null,
    };
  };

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: colors.appBg, paddingTop: insets.top},
      ]}>
      {/* Header chrome: ✕ · centered title · N/total count pill. */}
      <View style={[styles.header, {borderBottomColor: colors.hair}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.closeBtn, {backgroundColor: colors.surface2}]}>
          <AppText raw style={[styles.closeIcon, {color: colors.ink2}]}>
            ✕
          </AppText>
        </Pressable>
        <View style={styles.headerSpacer} />
        <AppText raw style={[styles.titleText, {color: colors.ink}]}>
          {t('LP_QUIZ_HEADER')}
        </AppText>
        <View style={styles.headerSpacer} />
        <View style={[styles.countPill, {backgroundColor: colors.flowSoft}]}>
          <AppText raw style={[styles.countPillText, {color: colors.flowInk}]}>
            {t('LP_QUIZ_COUNT', {num: Math.min(index + 1, total), total})}
          </AppText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        {question ? (
          <>
            {/* Eyebrow — the low-stakes framing badge. */}
            <View style={[styles.eyebrow, {backgroundColor: colors.flowSoft}]}>
              <AppText raw style={[styles.eyebrowText, {color: colors.flowInk}]}>
                {t('LP_QUIZ_EYEBROW')}
              </AppText>
            </View>

            <View style={styles.gap16} />

            <AppText raw style={[styles.prompt, {color: colors.ink}]}>
              {question.prompt}
            </AppText>

            <View style={styles.gap18} />

            {/* Options — lock after first pick, then reveal correct/wrong. */}
            <View style={styles.options}>
              {question.options.map((option, optionIndex) => {
                const c = optionChrome(optionIndex);
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
                        backgroundColor: c.bg,
                        borderColor: c.border,
                        borderWidth: c.borderWidth,
                        opacity: c.opacity,
                      },
                    ]}>
                    <AppText
                      raw
                      style={[
                        styles.optionText,
                        {color: c.text, fontFamily: c.textWeight},
                      ]}>
                      {option}
                    </AppText>
                    {c.mark === 'check' ? (
                      <AppText
                        raw
                        style={[styles.checkMark, {color: colors.flowInk}]}>
                        ✓
                      </AppText>
                    ) : null}
                    {c.mark === 'cross' ? (
                      <View
                        style={[styles.crossBadge, {backgroundColor: colors.error}]}>
                        <AppText raw style={styles.crossBadgeText}>
                          ✕
                        </AppText>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.gap16} />

            {/* Feedback after answering. */}
            {answered && right ? (
              <AppText
                raw
                style={[styles.feedbackRight, {color: colors.flowInk}]}>
                {t('LP_QUIZ_FEEDBACK_RIGHT')}
              </AppText>
            ) : null}
            {answered && !right ? (
              <AppText
                raw
                style={[styles.feedbackWrong, {color: colors.ink2}]}>
                {t('LP_QUIZ_FEEDBACK_WRONG')}
              </AppText>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {/* Footer CTA: Tiếp → (advance) or ↻ Thử lại (re-open wrong question). */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.hair,
            backgroundColor: colors.appBg,
            paddingBottom: 16 + insets.bottom,
          },
        ]}>
        {answered && !right ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('LP_QUIZ_RETRY')}
            onPress={retry}
            style={[
              styles.retryBtn,
              {backgroundColor: colors.flowSoft, borderColor: colors.flow},
            ]}>
            <Icon name="RotateCcw" className="text-flowInk w-[17px] h-[17px]" />
            <AppText raw style={[styles.retryText, {color: colors.flowInk}]}>
              {t('LP_QUIZ_RETRY')}
            </AppText>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: !answered}}
            accessibilityLabel={t('LP_QUIZ_NEXT')}
            disabled={!answered}
            onPress={advance}
            style={[
              styles.cta,
              {backgroundColor: colors.flow, opacity: answered ? 1 : 0.5},
            ]}>
            <AppText raw style={[styles.ctaText, {color: colors.onFlow}]}>
              {t('LP_QUIZ_NEXT')}
            </AppText>
          </Pressable>
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
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    gap: 11,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {fontFamily: InflowFonts.ui.regular, fontSize: 15},
  headerSpacer: {flex: 1},
  titleText: {fontFamily: InflowFonts.ui.bold, fontSize: 14},
  countPill: {borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10},
  countPillText: {fontFamily: InflowFonts.ui.extrabold, fontSize: 11.5},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 24, paddingVertical: 22},
  eyebrow: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  eyebrowText: {fontFamily: InflowFonts.ui.bold, fontSize: 12},
  gap16: {height: 16},
  gap18: {height: 18},
  prompt: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 18,
    lineHeight: 25.2,
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
  },
  optionText: {flex: 1, fontSize: 14, lineHeight: 20},
  checkMark: {fontFamily: InflowFonts.ui.extrabold, fontSize: 15},
  crossBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossBadgeText: {
    fontFamily: InflowFonts.ui.extrabold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  feedbackRight: {fontFamily: InflowFonts.ui.bold, fontSize: 13.5},
  feedbackWrong: {
    fontFamily: InflowFonts.ui.semibold,
    fontSize: 13.5,
    lineHeight: 19.6,
  },
  footer: {
    paddingTop: 13,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  cta: {borderRadius: 16, paddingVertical: 16, alignItems: 'center'},
  ctaText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
  },
  retryText: {fontFamily: InflowFonts.ui.bold, fontSize: 16},
});

LessonComprehensionQuiz.displayName = 'LessonComprehensionQuiz';
