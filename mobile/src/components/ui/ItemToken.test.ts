/**
 * Fidelity tests for the Item-encoding primitive and the OKLCH token sets,
 * locking them to the design handoff (#system legend + `tokenStyle()`, and the
 * Design Tokens table in design_handoff_inflow_app/README.md).
 *
 * These are pure-data assertions (no component render) so they run in the
 * repo's existing node/jest harness.
 */

import {AppColors, AppColorsLight} from '@/config/colors';
import {itemTokenStyle} from './itemTokenStyle';

describe('itemTokenStyle — Item-encoding legend', () => {
  const colors = AppColorsLight;

  it('Vocabulary: thin teal underline, no fill, default ink text', () => {
    const s = itemTokenStyle('vocabulary', false, true, colors);
    expect(s.textDecorationLine).toBe('underline');
    expect(s.textDecorationColor).toBe(colors.flow);
    expect(s.color).toBe(colors.ink);
    expect(s.backgroundColor).toBe('transparent');
  });

  it('Chunk: bold serif + thick teal underline, flow-ink text', () => {
    const s = itemTokenStyle('chunk', false, true, colors);
    expect(s.fontFamily).toBe('Newsreader-Bold');
    expect(s.textDecorationLine).toBe('underline');
    expect(s.textDecorationColor).toBe(colors.flow);
    expect(s.color).toBe(colors.flowInk);
    expect(s.backgroundColor).toBe('transparent');
  });

  it('Grammar Point: teal-soft pill (flow-soft fill, flow-ink text, 5px radius)', () => {
    const s = itemTokenStyle('grammarPoint', false, true, colors);
    expect(s.backgroundColor).toBe(colors.flowSoft);
    expect(s.color).toBe(colors.flowInk);
    expect(s.borderRadius).toBe(5);
  });

  it('Absorbed: recolors teal → amber AND gains a warm-soft fill', () => {
    const vocab = itemTokenStyle('vocabulary', true, true, colors);
    expect(vocab.textDecorationColor).toBe(colors.warm);
    expect(vocab.color).toBe(colors.warmInk);
    expect(vocab.backgroundColor).toBe(colors.warmSoft);

    const chunk = itemTokenStyle('chunk', true, true, colors);
    expect(chunk.textDecorationColor).toBe(colors.warm);
    expect(chunk.color).toBe(colors.warmInk);
    expect(chunk.backgroundColor).toBe(colors.warmSoft);

    const grammar = itemTokenStyle('grammarPoint', true, true, colors);
    expect(grammar.backgroundColor).toBe(colors.warmSoft);
    expect(grammar.color).toBe(colors.warmInk);
  });

  it('showAnnotations off: strips encoding (no underline/pill) but keeps Absorbed tint', () => {
    const plainVocab = itemTokenStyle('vocabulary', false, false, colors);
    expect(plainVocab.textDecorationLine).toBeUndefined();
    expect(plainVocab.backgroundColor).toBeUndefined();
    expect(plainVocab.color).toBe(colors.ink);

    const absorbedVocab = itemTokenStyle('vocabulary', true, false, colors);
    expect(absorbedVocab.color).toBe(colors.warmInk);
  });

  it('plain reading text is untreated ink', () => {
    const s = itemTokenStyle('plain', false, true, colors);
    expect(s.color).toBe(colors.ink);
    expect(s.textDecorationLine).toBeUndefined();
  });
});

describe('OKLCH token sets — values match the handoff Design Tokens table', () => {
  // Computed from the README/HTML oklch() values via the OKLCH→sRGB transform.
  it('light token family values are exact', () => {
    expect(AppColorsLight.flow).toBe('#218da3');
    expect(AppColorsLight.warm).toBe('#cf883d');
    expect(AppColorsLight.flowSoft).toBe('#d1f0f6');
    expect(AppColorsLight.warmSoft).toBe('#fee3c3');
    expect(AppColorsLight.flowInk).toBe('#005d73');
    expect(AppColorsLight.warmInk).toBe('#995212');
    expect(AppColorsLight.ink).toBe('#1f2730');
    expect(AppColorsLight.surface).toBe('#ffffff');
    expect(AppColorsLight.onFlow).toBe('#f5feff');
  });

  it('dark token family values are exact', () => {
    expect(AppColors.flow).toBe('#48b7bd');
    expect(AppColors.warm).toBe('#f0af60');
    expect(AppColors.flowSoft).toBe('#083840');
    expect(AppColors.warmSoft).toBe('#493118');
    expect(AppColors.flowInk).toBe('#7aced2');
    expect(AppColors.warmInk).toBe('#efbd7d');
    expect(AppColors.ink).toBe('#ecf1f3');
    expect(AppColors.surface).toBe('#1a2128');
    expect(AppColors.onFlow).toBe('#08131a');
  });
});
