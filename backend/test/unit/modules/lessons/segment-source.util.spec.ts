/// <reference types="jest" />

import { LESSON_TARGET_SECONDS } from '@modules/lessons/constants/lesson.constants';
import { segmentSource } from '@modules/lessons/utils/segment-source.util';

describe('segmentSource', () => {
  it('yields a single segment for a Source within the ~3–5-min target', () => {
    const segments = segmentSource('A short text.', LESSON_TARGET_SECONDS - 10);
    expect(segments).toHaveLength(1);
    expect(segments[0].segmentIndex).toBe(0);
    expect(segments[0].durationSeconds).toBe(LESSON_TARGET_SECONDS - 10);
  });

  it('splits a long Source into multiple contiguously-indexed segments', () => {
    const text = Array.from({ length: 60 }, (_, i) => `Sentence number ${i}.`).join(' ');
    const segments = segmentSource(text, LESSON_TARGET_SECONDS * 3);

    expect(segments.length).toBeGreaterThan(1);
    expect(segments.map((s) => s.segmentIndex)).toEqual(segments.map((_, i) => i));
    // Each segment gets a positive apportioned duration.
    for (const segment of segments) {
      expect(segment.durationSeconds).toBeGreaterThan(0);
      expect(segment.text.length).toBeGreaterThan(0);
    }
  });
});
