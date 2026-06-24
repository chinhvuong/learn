/**
 * Behavior tests over the Create reducer — the Creation Credit + creation-phase
 * contract from issue #12 / screens.md §13:
 *
 *   - remaining Creation Credits are tracked and shown before creating;
 *   - an inline success consumes exactly one Credit and exposes the Lesson id;
 *   - a long async Source consumes a Credit and exposes a job handle;
 *   - a FAILED creation consumes NO Credit (CONTEXT.md "Creation Credit");
 *   - reset returns the composer to idle.
 */

import reducer, {
  CreateState,
  creationFailed,
  creationQueuedAsync,
  creationReset,
  creationStarted,
  creationSucceeded,
  selectCreditsRemaining,
  selectHasCredit,
} from './createSlice';
import {LessonCreationErrorCode} from './types';

const initial = (): CreateState => reducer(undefined, {type: '@@INIT'});

describe('createSlice', () => {
  it('starts idle with a visible Creation Credit balance', () => {
    const s = initial();
    expect(s.phase).toBe('idle');
    expect(s.creditsTotal).toBeGreaterThan(0);
    expect(selectCreditsRemaining({create: s})).toBe(s.creditsRemaining);
    expect(selectHasCredit({create: s})).toBe(true);
  });

  it('enters processing without touching Credits', () => {
    const before = initial();
    const s = reducer(before, creationStarted());
    expect(s.phase).toBe('processing');
    expect(s.creditsRemaining).toBe(before.creditsRemaining);
  });

  it('consumes exactly one Credit on inline success and exposes the Lesson id', () => {
    let s = initial();
    const start = s.creditsRemaining;
    s = reducer(s, creationStarted());
    s = reducer(s, creationSucceeded({lessonId: 'lesson-1'}));
    expect(s.phase).toBe('ready');
    expect(s.createdLessonId).toBe('lesson-1');
    expect(s.creditsRemaining).toBe(start - 1);
  });

  it('consumes one Credit on async queue and exposes the job handle', () => {
    let s = initial();
    const start = s.creditsRemaining;
    s = reducer(s, creationStarted());
    s = reducer(s, creationQueuedAsync({jobId: 'job-7'}));
    expect(s.phase).toBe('async');
    expect(s.jobId).toBe('job-7');
    expect(s.creditsRemaining).toBe(start - 1);
  });

  it('consumes NO Credit on a failed creation', () => {
    let s = initial();
    const start = s.creditsRemaining;
    s = reducer(s, creationStarted());
    s = reducer(
      s,
      creationFailed({code: LessonCreationErrorCode.CONTENT_UNFETCHABLE}),
    );
    expect(s.phase).toBe('error');
    expect(s.errorCode).toBe(LessonCreationErrorCode.CONTENT_UNFETCHABLE);
    expect(s.creditsRemaining).toBe(start);
  });

  it('never drops Credits below zero', () => {
    let s: CreateState = {...initial(), creditsRemaining: 0};
    s = reducer(s, creationSucceeded({lessonId: 'x'}));
    expect(s.creditsRemaining).toBe(0);
    expect(selectHasCredit({create: s})).toBe(false);
  });

  it('reset returns to idle and clears the run', () => {
    let s = initial();
    s = reducer(s, creationStarted());
    s = reducer(s, creationSucceeded({lessonId: 'lesson-9'}));
    s = reducer(s, creationReset());
    expect(s.phase).toBe('idle');
    expect(s.createdLessonId).toBeNull();
    expect(s.jobId).toBeNull();
    expect(s.errorCode).toBeNull();
  });
});
