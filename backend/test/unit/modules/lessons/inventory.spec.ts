/// <reference types="jest" />

import {
  CHUNK_INVENTORY,
  CHUNK_INVENTORY_BY_ID,
  GRAMMAR_INVENTORY,
  GRAMMAR_INVENTORY_BY_ID,
} from '@modules/lessons/inventory';
import { canonicalizeChunk } from '@modules/lessons/utils/canonical-chunk.util';

const CEFR_BANDS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * The closed Grammar Inventory and reference Chunk Inventory are the authored
 * content asset (ADR-0003 / ADR-0004). These tests guard the schema invariants
 * the matchers and the rest of the engine rely on, so the full HITL curation
 * can grow the catalog safely without breaking the contract.
 */
describe('Grammar Inventory (ADR-0003)', () => {
  it('has stable, unique, prefixed ids', () => {
    const ids = GRAMMAR_INVENTORY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^GP_[A-Z0-9_]+$/);
    }
  });

  it('tags every entry with a CEFR band and a derived fine Level', () => {
    for (const entry of GRAMMAR_INVENTORY) {
      expect(CEFR_BANDS).toContain(entry.cefr);
      expect(entry.level).toBeGreaterThanOrEqual(0);
      expect(entry.level).toBeLessThanOrEqual(100);
    }
  });

  it('carries exactly one authored Vietnamese explanation per entry', () => {
    for (const entry of GRAMMAR_INVENTORY) {
      expect(typeof entry.explanationVi).toBe('string');
      expect(entry.explanationVi.trim().length).toBeGreaterThan(0);
      // Vietnamese copy contains Vietnamese diacritics (sanity check it is VI).
      expect(entry.explanationVi).toMatch(/[àáảãạăâđèéêìíòóôơùúưýỳ]/i);
    }
  });

  it('has at least one classification matcher per entry (classify, never generate)', () => {
    for (const entry of GRAMMAR_INVENTORY) {
      expect(entry.matchers.length).toBeGreaterThan(0);
    }
  });

  it('exposes a by-id lookup covering every entry', () => {
    expect(GRAMMAR_INVENTORY_BY_ID.size).toBe(GRAMMAR_INVENTORY.length);
  });

  it('spans multiple CEFR bands (representative starter slice)', () => {
    const bands = new Set(GRAMMAR_INVENTORY.map((e) => e.cefr));
    expect(bands.size).toBeGreaterThanOrEqual(3);
  });
});

describe('reference Chunk Inventory (ADR-0004)', () => {
  it('has stable, unique, prefixed ids', () => {
    const ids = CHUNK_INVENTORY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^CH_[A-Z0-9_]+$/);
    }
  });

  it('stores each canonical form already in canonical lemmatized form (mandatory)', () => {
    for (const entry of CHUNK_INVENTORY) {
      // The authored canonical form must equal what the canonicalizer produces,
      // otherwise variants would not collapse onto the Inventory entry.
      expect(canonicalizeChunk(entry.canonical)).toBe(entry.canonical);
    }
  });

  it('has unique canonical forms (one entity per canonical Chunk)', () => {
    const canon = CHUNK_INVENTORY.map((e) => e.canonical);
    expect(new Set(canon).size).toBe(canon.length);
  });

  it('tags every entry with CEFR, Level, and one authored Vietnamese explanation', () => {
    for (const entry of CHUNK_INVENTORY) {
      expect(CEFR_BANDS).toContain(entry.cefr);
      expect(entry.level).toBeGreaterThanOrEqual(0);
      expect(entry.level).toBeLessThanOrEqual(100);
      expect(entry.explanationVi.trim().length).toBeGreaterThan(0);
      expect(entry.explanationVi).toMatch(/[àáảãạăâđèéêìíòóôơùúưýỳ]/i);
    }
  });

  it('exposes a by-id lookup covering every entry', () => {
    expect(CHUNK_INVENTORY_BY_ID.size).toBe(CHUNK_INVENTORY.length);
  });
});
