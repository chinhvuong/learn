/**
 * Pure logic for the post-reading comprehension Quiz (screens.md §12; the
 * design handoff's `lpQuiz*`). Kept separate from the React component so the
 * lock / reveal / progress contract is unit-testable in isolation, mirroring
 * the pure derivations in `lessonSessionSlice`.
 *
 * The contract (issue #8 acceptance criteria):
 *   - an option **locks** the question after the FIRST selection (a later tap
 *     never changes the recorded answer);
 *   - once answered, the question **reveals** which option was correct and,
 *     if the learner missed it, which one they picked;
 *   - the progress bar tracks **answered / total**.
 *
 * Answers are stored as a sparse map of questionIndex → selectedOptionIndex.
 */

import type {QuizQuestion} from './types';

/** The learner's recorded answers: questionIndex → chosen option index. */
export type QuizAnswers = Record<number, number>;

/** Whether a question has already been answered (and is therefore locked). */
export const isAnswered = (answers: QuizAnswers, questionIndex: number): boolean =>
  answers[questionIndex] !== undefined;

/**
 * Record an answer for a question. Selection **locks** on first tap: if the
 * question is already answered, the map is returned unchanged (idempotent), so
 * a later tap can never overwrite the recorded choice.
 */
export const selectAnswer = (
  answers: QuizAnswers,
  questionIndex: number,
  optionIndex: number,
): QuizAnswers => {
  if (isAnswered(answers, questionIndex)) {
    return answers;
  }
  return {...answers, [questionIndex]: optionIndex};
};

/**
 * Clear a question's recorded answer so the learner can **retry** it (screens.md
 * §10 LP5b `WFyG7` — a wrong answer offers "Thử lại", which re-opens the same
 * question). Returns a new map without that question's entry; idempotent if it
 * was never answered.
 */
export const clearAnswer = (
  answers: QuizAnswers,
  questionIndex: number,
): QuizAnswers => {
  if (!isAnswered(answers, questionIndex)) {
    return answers;
  }
  const next = {...answers};
  delete next[questionIndex];
  return next;
};

/** How many questions have been answered so far. */
export const countAnswered = (answers: QuizAnswers): number =>
  Object.keys(answers).length;

/**
 * Progress as a 0–100 percentage of answered / total questions (drives the
 * progress bar). Returns 0 for an empty quiz.
 */
export const quizProgressPct = (
  answers: QuizAnswers,
  total: number,
): number => (total === 0 ? 0 : (countAnswered(answers) / total) * 100);

/** Whether the chosen option for a question is the correct one. */
export const isCorrect = (
  question: QuizQuestion,
  answers: QuizAnswers,
  questionIndex: number,
): boolean =>
  isAnswered(answers, questionIndex) &&
  answers[questionIndex] === question.correctIndex;

/** Number of questions answered correctly (the quiz score). */
export const quizScore = (
  questions: QuizQuestion[],
  answers: QuizAnswers,
): number =>
  questions.reduce(
    (score, question, index) =>
      isCorrect(question, answers, index) ? score + 1 : score,
    0,
  );

/** Whether every question has been answered (the quiz is finished). */
export const isQuizComplete = (
  questions: QuizQuestion[],
  answers: QuizAnswers,
): boolean =>
  questions.length > 0 && countAnswered(answers) >= questions.length;
