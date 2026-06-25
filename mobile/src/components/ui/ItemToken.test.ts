/**
 * Fidelity tests for the Item-encoding primitive and the design token sets,
 * locking them to the design (#system legend + `tokenStyle()`, and the token
 * variable set in docs/design/design.pen — the binding visual contract).
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

describe('token sets — values match docs/design/design.pen', () => {
  // Exact light/dark hex from the design.pen variable set (the binding visual
  // contract — read via the Pencil `get_variables` tool, issue #41).
  it('light token family values are exact', () => {
    expect(AppColorsLight.flow).toBe('#2c8b9d');
    expect(AppColorsLight.warm).toBe('#cf8a44');
    expect(AppColorsLight.flowSoft).toBe('#d7ebf0');
    expect(AppColorsLight.warmSoft).toBe('#f2e2c9');
    expect(AppColorsLight.flowInk).toBe('#1b6573');
    expect(AppColorsLight.warmInk).toBe('#9a5f2a');
    expect(AppColorsLight.ink).toBe('#2c3440');
    expect(AppColorsLight.surface).toBe('#ffffff');
    expect(AppColorsLight.onFlow).toBe('#fafdfe');
    expect(AppColorsLight.appBg).toBe('#f8fafb');
    expect(AppColorsLight.hair).toBe('#e3e6e9');
  });

  it('dark token family values are exact', () => {
    expect(AppColors.flow).toBe('#4fb6c5');
    expect(AppColors.warm).toBe('#e5ab5e');
    expect(AppColors.flowSoft).toBe('#294751');
    expect(AppColors.warmSoft).toBe('#493826');
    expect(AppColors.flowInk).toBe('#84cfda');
    expect(AppColors.warmInk).toBe('#e8b877');
    expect(AppColors.ink).toBe('#eff1f4');
    expect(AppColors.surface).toBe('#2a2f37');
    expect(AppColors.onFlow).toBe('#1a2028');
    expect(AppColors.appBg).toBe('#22272e');
    expect(AppColors.hair).toBe('#343a43');
  });
});
