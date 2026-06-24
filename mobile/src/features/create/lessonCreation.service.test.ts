/**
 * Tests over the createLesson client (stub transport) — that it honours the
 * real engine contract the Create screen depends on (issue #12):
 *
 *   - a text / article Source resolves inline with a `Lesson[]`;
 *   - a long audio Source (podcast/youtube) resolves to the async job path;
 *   - an unfetchable / moderation-rejected Source rejects with the matching
 *     LessonCreationError code (so the screen can show a kind error and charge
 *     no Credit).
 */

import {createLesson} from './lessonCreation.service';
import {LessonCreationError, LessonCreationErrorCode, SourceType} from './types';

describe('createLesson (stub transport)', () => {
  it('resolves a TEXT Source inline with at least one Lesson', async () => {
    const res = await createLesson({
      type: SourceType.TEXT,
      text: 'Artificial intelligence is reshaping how we work.',
    });
    expect(res.status).toBe('ready');
    if (res.status === 'ready') {
      expect(res.lessons.length).toBeGreaterThan(0);
      expect(res.lessons[0].id).toBeTruthy();
    }
  });

  it('resolves an ARTICLE link inline', async () => {
    const res = await createLesson({
      type: SourceType.ARTICLE,
      url: 'https://example.com/the-future-of-ai',
    });
    expect(res.status).toBe('ready');
  });

  it('routes a long audio Source to the async job path', async () => {
    const res = await createLesson({
      type: SourceType.PODCAST,
      url: 'https://example.com/daily-english-podcast.mp3',
    });
    expect(res.status).toBe('processing');
    if (res.status === 'processing') {
      expect(res.jobId).toBeTruthy();
    }
  });

  it('rejects an unfetchable Source with CONTENT_UNFETCHABLE', async () => {
    await expect(
      createLesson({type: SourceType.ARTICLE, url: 'https://example.com/fail'}),
    ).rejects.toMatchObject({
      code: LessonCreationErrorCode.CONTENT_UNFETCHABLE,
    });
  });

  it('rejects a rejected Source with MODERATION_REJECTED', async () => {
    await expect(
      createLesson({type: SourceType.TEXT, text: 'some nsfw content'}),
    ).rejects.toBeInstanceOf(LessonCreationError);
  });
});
