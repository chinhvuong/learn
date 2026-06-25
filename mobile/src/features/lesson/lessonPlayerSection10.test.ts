/**
 * Tests for the §10 Lesson Player data (Cover → Warm-up → Reading immersion).
 * Guards the shape the flagship flow renders against: the per-Source-type Cover
 * variants, the Warm-up grouping by Item type, and the reading-page span model
 * (every teal Item span resolves to a real Item — the absorption-gesture target).
 */

import {
  SECTION10_COVERS,
  SECTION10_COVER_TITLES,
  SECTION10_ITEMS,
  SECTION10_ITEMS_BY_ID,
  SECTION10_LESSON,
  SECTION10_PAGE_COUNT,
  SECTION10_READING_PAGES,
  SECTION10_WARMUP_GROUPS,
  SECTION10_WARMUP_ORDER,
} from './lessonPlayerSection10';
import type {SourceType} from './types';

describe('§10 Cover variants', () => {
  const types: SourceType[] = ['youtube', 'article', 'podcast', 'text'];

  it('defines all four Source-type Cover variants', () => {
    types.forEach(type => {
      expect(SECTION10_COVERS[type].sourceType).toBe(type);
      expect(SECTION10_COVERS[type].sourcePillLabel).toBeTruthy();
      expect(SECTION10_COVERS[type].originTag).toMatch(/^✨/);
      expect(SECTION10_COVERS[type].originalLinkLabel).toBeTruthy();
    });
  });

  it('mirrors the pen copy for each variant', () => {
    expect(SECTION10_COVERS.youtube.sourcePillLabel).toBe('▶ YouTube');
    expect(SECTION10_COVERS.youtube.durationLabel).toBe('12:30');
    expect(SECTION10_COVERS.article.sourcePillLabel).toBe('📄 Bài viết');
    expect(SECTION10_COVERS.article.lengthChip).toBe('1 240 từ');
    expect(SECTION10_COVERS.podcast.sourcePillLabel).toBe('🎧 Podcast');
    expect(SECTION10_COVERS.podcast.lengthChip).toBe('Tập 142');
    expect(SECTION10_COVERS.text.sourcePillLabel).toBe('📝 Văn bản của bạn');
    expect(SECTION10_COVERS.text.textPreview).toContain('Học từ vựng');
  });

  it('carries per-variant Source titles for the non-default variants', () => {
    expect(SECTION10_COVER_TITLES.article).toBe('Tâm lý của thói quen');
    expect(SECTION10_COVER_TITLES.podcast).toBe('Deep Work in a Distracted World');
    expect(SECTION10_COVER_TITLES.text).toBe('Ghi chú: Cách học từ vựng');
    expect(SECTION10_COVER_TITLES.youtube).toBeUndefined();
  });

  it('only the audio/video variants carry a hero text preview vs none', () => {
    expect(SECTION10_COVERS.youtube.textPreview).toBeUndefined();
    expect(SECTION10_COVERS.podcast.textPreview).toBeUndefined();
    expect(SECTION10_COVERS.text.textPreview).toBeDefined();
  });
});

describe('§10 Warm-up grouping', () => {
  it('groups by the three Item types in Vocabulary → Chunk → Grammar order', () => {
    expect(SECTION10_WARMUP_GROUPS.map(g => g.type)).toEqual([
      'vocabulary',
      'chunk',
      'grammarPoint',
    ]);
  });

  it('every group holds only Items of its own type', () => {
    SECTION10_WARMUP_GROUPS.forEach(group => {
      group.items.forEach(item => expect(item.type).toBe(group.type));
    });
  });

  it('the flat deck order is the concatenation of the groups', () => {
    const fromGroups = SECTION10_WARMUP_GROUPS.flatMap(g => g.items);
    expect(SECTION10_WARMUP_ORDER).toEqual(fromGroups);
    expect(SECTION10_WARMUP_ORDER.length).toBe(SECTION10_ITEMS.length);
  });
});

describe('§10 Reading pages', () => {
  it('has five book-like pages (Trang 1/5 … 5/5)', () => {
    expect(SECTION10_PAGE_COUNT).toBe(5);
    expect(SECTION10_READING_PAGES).toHaveLength(5);
  });

  it('every Item span resolves to a real Item (the tap target)', () => {
    SECTION10_READING_PAGES.forEach(page => {
      page.spans.forEach(span => {
        if (span.kind === 'item') {
          expect(SECTION10_ITEMS_BY_ID[span.itemId]).toBeDefined();
        }
      });
    });
  });

  it('marks the page-1 conditional sentence as a Grammar-Point run', () => {
    const grammarSpans = SECTION10_READING_PAGES[0].spans.filter(
      s => s.kind === 'item' && s.grammar,
    );
    expect(grammarSpans).toHaveLength(1);
    expect((grammarSpans[0] as {itemId: string}).itemId).toBe('s10-cond2');
  });

  it('reproduces the pen page-1 / page-3 / page-5 anchor words', () => {
    const surfaces = (i: number) =>
      SECTION10_READING_PAGES[i].spans
        .filter(s => s.kind === 'item')
        .map(s => (s as {text: string}).text);
    expect(surfaces(0)).toEqual(
      expect.arrayContaining(['distant', 'rely on', 'reluctant']),
    );
    expect(surfaces(2)).toEqual(
      expect.arrayContaining(['struggled to', 'vast', 'on their own']),
    );
    expect(surfaces(4)).toEqual(expect.arrayContaining(['versus', 'set free']));
  });
});

describe('§10 flagship Lesson', () => {
  it('bundles the Cover + reading pages so the player runs the §10 flow', () => {
    expect(SECTION10_LESSON.cover).toBeDefined();
    expect(SECTION10_LESSON.readingPages).toBe(SECTION10_READING_PAGES);
    expect(SECTION10_LESSON.items).toBe(SECTION10_ITEMS);
    expect(SECTION10_LESSON.title).toBe('The Future of AI');
  });

  it('derives a Bilingual Passage sentence per reading page', () => {
    expect(SECTION10_LESSON.passage.sentences).toHaveLength(SECTION10_PAGE_COUNT);
  });
});
