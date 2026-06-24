import { LESSON_TARGET_SECONDS } from '../constants/lesson.constants';

/** One segment of a Source destined to become a single Lesson. */
export interface SourceSegment {
  segmentIndex: number;
  text: string;
  durationSeconds: number;
}

/**
 * Segment a Source's full text into ~3–5-minute Lessons (CONTEXT.md →
 * Relationships). A Source at or under the target yields a single segment; a
 * longer Source is split on sentence boundaries into roughly equal segments,
 * each near the {@link LESSON_TARGET_SECONDS} target.
 */
export function segmentSource(fullText: string, durationSeconds: number): SourceSegment[] {
  const text = fullText.trim();

  if (durationSeconds <= LESSON_TARGET_SECONDS || !text) {
    return [{ segmentIndex: 0, text, durationSeconds }];
  }

  const segmentCount = Math.ceil(durationSeconds / LESSON_TARGET_SECONDS);

  // Split into sentences, then distribute sentences across segments by
  // proportion of total characters so each segment is roughly equal length.
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const perSegmentChars = Math.ceil(text.length / segmentCount);

  const segments: SourceSegment[] = [];
  let buffer = '';
  for (const sentence of sentences) {
    buffer += sentence;
    if (buffer.length >= perSegmentChars && segments.length < segmentCount - 1) {
      segments.push({ segmentIndex: segments.length, text: buffer.trim(), durationSeconds: 0 });
      buffer = '';
    }
  }
  if (buffer.trim()) {
    segments.push({ segmentIndex: segments.length, text: buffer.trim(), durationSeconds: 0 });
  }

  // Apportion duration to each segment by its share of total characters.
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0) || 1;
  return segments.map((segment) => ({
    ...segment,
    durationSeconds: Math.max(1, Math.round((segment.text.length / totalChars) * durationSeconds)),
  }));
}
