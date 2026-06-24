/// <reference types="jest" />

import { GrammarMatcherAdapter } from '@modules/lessons/adapters/grammar-matcher.adapter';
import { GRAMMAR_INVENTORY_BY_ID } from '@modules/lessons/inventory';
import { FetchedContent } from '@modules/lessons/ports/lesson-engine.ports';
import { SourceType } from '@modules/lessons/constants/lesson.constants';

/**
 * The real GrammarMatcher classifies sentences against the closed Grammar
 * Inventory (ADR-0003): every match resolves to a stable Inventory id and it
 * never generates free-form grammar.
 */
const content = (fullText: string): FetchedContent => ({
  type: SourceType.TEXT,
  title: null,
  normalizedUrl: null,
  fullText,
  language: 'en',
  durationSeconds: 60,
});

describe('GrammarMatcherAdapter', () => {
  const matcher = new GrammarMatcherAdapter();

  it('classifies present perfect and resolves to its stable Inventory id', async () => {
    const matches = await matcher.match(content('She has decided to leave the company.'));
    const ids = matches.map((m) => m.inventoryId);
    expect(ids).toContain('GP_PRESENT_PERFECT');
  });

  it('classifies "used to + V" to its stable Inventory id', async () => {
    const matches = await matcher.match(content('I used to live in Hanoi.'));
    expect(matches.map((m) => m.inventoryId)).toContain('GP_USED_TO');
  });

  it('only ever returns stable Inventory ids — never free-form grammar', async () => {
    const matches = await matcher.match(
      content('She has finished. We used to go there. If it rains, we will stay.'),
    );
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      // Every Grammar Point resolves to a real entry in the closed Inventory.
      expect(match.inventoryId).not.toBeNull();
      expect(GRAMMAR_INVENTORY_BY_ID.has(match.inventoryId)).toBe(true);
    }
  });

  it('counts each Grammar Point once even when it appears in many sentences', async () => {
    const matches = await matcher.match(content('She has left. He has arrived. They have eaten.'));
    const presentPerfect = matches.filter((m) => m.inventoryId === 'GP_PRESENT_PERFECT');
    expect(presentPerfect).toHaveLength(1);
  });

  it('carries the authored Level from the Inventory entry', async () => {
    const matches = await matcher.match(content('She has decided.'));
    const match = matches.find((m) => m.inventoryId === 'GP_PRESENT_PERFECT');
    expect(match?.level).toBe(GRAMMAR_INVENTORY_BY_ID.get('GP_PRESENT_PERFECT')?.level);
  });

  it('returns nothing for text with no inventory grammar present', async () => {
    const matches = await matcher.match(content('Cat dog bird.'));
    expect(matches).toEqual([]);
  });
});
