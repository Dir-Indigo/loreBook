import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countWords, computeLineDiff, computeWordDiff } from '../src/utils/diffUtils.js';

test('countWords cuenta palabras con acentos y signos', () => {
  assert.equal(countWords('El niño comió, rápido.'), 4);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords(null), 0);
});

test('computeLineDiff: textos iguales están limpios', () => {
  const diff = computeLineDiff('a\nb', 'a\nb');
  assert.equal(diff.isClean, true);
  assert.equal(diff.addedLines, 0);
  assert.equal(diff.removedLines, 0);
});

test('computeLineDiff: detecta líneas añadidas y eliminadas', () => {
  const diff = computeLineDiff('uno\ndos\ntres', 'uno\ntres\ncuatro');
  assert.equal(diff.isClean, false);
  assert.equal(diff.addedLines, 1);
  assert.equal(diff.removedLines, 1);
});

test('computeWordDiff: marca palabras cambiadas', () => {
  const tokens = computeWordDiff('el gato negro', 'el perro negro');
  assert.ok(tokens.some((t) => t.type !== 'same'));
  assert.ok(tokens.some((t) => t.type === 'same'));
});
