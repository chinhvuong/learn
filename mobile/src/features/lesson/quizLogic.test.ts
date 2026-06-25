/**
 * Behavior tests over the comprehension Quiz logic — the lock / reveal /
 * progress contract (issue #8 acceptance criteria; screens.md §12).
 *
 * These assert:
 *   - an option locks the question after the first selection (a later tap
 *     never overwrites the recorded answer);
 *   - correct / incorrect is derivable once answered;
 *   - progress tracks answered / total.
 */

import {
  clearAnswer,
  countAnswered,
  isAnswered,
  isCorrect,
  isQuizComplete,
  quizProgressPct,
  quizScore,
  selectAnswer,
  type QuizAnswers,
} from './quizLogic';
import {GOLDEN_FIRST_LESSON_QUIZ} from './goldenFirstLesson';

const QUESTIONS = GOLDEN_FIRST_LESSON_QUIZ;

describe('quizLogic — selection locks on first answer', () => {
  it('records the first selection for a question', () => {
    const answers = selectAnswer({}, 0, 2);
    expect(answers[0]).toBe(2);
    expect(isAnswered(answers, 0)).toBe(true);
  });

  it('a later tap never overwrites the locked answer', () => {
    let answers: QuizAnswers = selectAnswer({}, 0, 1);
    answers = selectAnswer(answers, 0, 2); // try to change it
    expect(answers[0]).toBe(1); // still the first pick
  });

  it('returns the same map reference when already answered (idempotent)', () => {
    const first = selectAnswer({}, 0, 0);
    const second = selectAnswer(first, 0, 1);
    expect(second).toBe(first);
  });

  it('locks each question independently', () => {
    let answers: QuizAnswers = {};
    answers = selectAnswer(answers, 0, 0);
    answers = selectAnswer(answers, 1, 2);
    expect(answers[0]).toBe(0);
    expect(answers[1]).toBe(2);
    expect(isAnswered(answers, 2)).toBe(false);
  });
});

describe('quizLogic — correct / incorrect reveal', () => {
  it('marks a correct pick correct after answering', () => {
    const answers = selectAnswer({}, 0, QUESTIONS[0].correctIndex);
    expect(isCorrect(QUESTIONS[0], answers, 0)).toBe(true);
  });

  it('marks a wrong pick incorrect after answering', () => {
    const wrong = (QUESTIONS[0].correctIndex + 1) % QUESTIONS[0].options.length;
    const answers = selectAnswer({}, 0, wrong);
    expect(isCorrect(QUESTIONS[0], answers, 0)).toBe(false);
  });

  it('an unanswered question is not yet correct', () => {
    expect(isCorrect(QUESTIONS[0], {}, 0)).toBe(false);
  });

  it('scores the number of correctly-answered questions', () => {
    let answers: QuizAnswers = {};
    // answer first two correctly, third wrong
    answers = selectAnswer(answers, 0, QUESTIONS[0].correctIndex);
    answers = selectAnswer(answers, 1, QUESTIONS[1].correctIndex);
    const wrong = (QUESTIONS[2].correctIndex + 1) % QUESTIONS[2].options.length;
    answers = selectAnswer(answers, 2, wrong);
    expect(quizScore(QUESTIONS, answers)).toBe(2);
  });

  it('a perfect run scores every question', () => {
    let answers: QuizAnswers = {};
    QUESTIONS.forEach((q, i) => {
      answers = selectAnswer(answers, i, q.correctIndex);
    });
    expect(quizScore(QUESTIONS, answers)).toBe(QUESTIONS.length);
  });
});

describe('quizLogic — retry (clearAnswer) after a wrong pick', () => {
  it('re-opens a wrong question so it can be answered again (LP5b Thử lại)', () => {
    const wrong = (QUESTIONS[0].correctIndex + 1) % QUESTIONS[0].options.length;
    let answers: QuizAnswers = selectAnswer({}, 0, wrong);
    expect(isAnswered(answers, 0)).toBe(true);
    answers = clearAnswer(answers, 0);
    expect(isAnswered(answers, 0)).toBe(false);
    // After retry, the learner can lock a new (correct) answer.
    answers = selectAnswer(answers, 0, QUESTIONS[0].correctIndex);
    expect(isCorrect(QUESTIONS[0], answers, 0)).toBe(true);
  });

  it('only clears the targeted question, leaving others locked', () => {
    let answers: QuizAnswers = {};
    answers = selectAnswer(answers, 0, 0);
    answers = selectAnswer(answers, 1, 2);
    answers = clearAnswer(answers, 1);
    expect(isAnswered(answers, 0)).toBe(true);
    expect(isAnswered(answers, 1)).toBe(false);
  });

  it('is a no-op (same reference) when the question was never answered', () => {
    const answers = selectAnswer({}, 0, 0);
    expect(clearAnswer(answers, 1)).toBe(answers);
  });
});

describe('quizLogic — progress (answered / total)', () => {
  it('is 0% with nothing answered', () => {
    expect(quizProgressPct({}, QUESTIONS.length)).toBe(0);
    expect(countAnswered({})).toBe(0);
  });

  it('advances as questions are answered', () => {
    let answers: QuizAnswers = {};
    answers = selectAnswer(answers, 0, 0);
    expect(countAnswered(answers)).toBe(1);
    expect(quizProgressPct(answers, QUESTIONS.length)).toBeCloseTo(
      (1 / QUESTIONS.length) * 100,
    );
  });

  it('reaches 100% and complete once every question is answered', () => {
    let answers: QuizAnswers = {};
    QUESTIONS.forEach((_q, i) => {
      answers = selectAnswer(answers, i, 0);
    });
    expect(quizProgressPct(answers, QUESTIONS.length)).toBe(100);
    expect(isQuizComplete(QUESTIONS, answers)).toBe(true);
  });

  it('is not complete while a question remains unanswered', () => {
    const answers = selectAnswer({}, 0, 0);
    expect(isQuizComplete(QUESTIONS, answers)).toBe(false);
  });

  it('handles an empty quiz safely', () => {
    expect(quizProgressPct({}, 0)).toBe(0);
    expect(isQuizComplete([], {})).toBe(false);
  });
});
