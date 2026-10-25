import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createController } from '../src/controllers/_base.js';

const silenceErrors = (fn) => async () => {
  const original = console.error;
  console.error = () => {};
  try {
    await fn();
  } finally {
    console.error = original;
  }
};

test('run devuelve { data, error: null } y gestiona el indicador de carga', async () => {
  const calls = [];
  const { run } = createController('Test');
  const result = await run(Promise.resolve(42), (v) => calls.push(v));
  assert.deepEqual(result, { data: 42, error: null });
  assert.deepEqual(calls, [true, false]);
});

test('run convierte excepciones en { data: null, error }', silenceErrors(async () => {
  const calls = [];
  const { run } = createController('Test');
  const boom = new Error('fallo');
  const result = await run(Promise.reject(boom), (v) => calls.push(v));
  assert.deepEqual(result, { data: null, error: boom });
  assert.deepEqual(calls, [true, false]);
}));

test('runQuery desenvuelve { data, error } de Supabase', async () => {
  const { runQuery } = createController('Test');
  const result = await runQuery(Promise.resolve({ data: [1, 2], error: null }));
  assert.deepEqual(result, { data: [1, 2], error: null });
});

test('runQuery usa el fallback cuando hay error', silenceErrors(async () => {
  const { runQuery } = createController('Test');
  const error = { message: 'rls' };
  const result = await runQuery(() => Promise.resolve({ data: null, error }), undefined, { fallback: [] });
  assert.deepEqual(result, { data: [], error });
}));

test('runQuery acepta una función y captura excepciones síncronas', silenceErrors(async () => {
  const { runQuery } = createController('Test');
  const result = await runQuery(() => { throw new Error('sync'); });
  assert.equal(result.data, null);
  assert.equal(result.error.message, 'sync');
}));
