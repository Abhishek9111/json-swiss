import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateQuery, queryJsonPath } from './jsonpath.js';

const doc = { name: 'root', users: [{ role: 'a' }, { role: 'b' }], child: { name: 'kid' } };

test('recursive descent returns each match once', () => {
  assert.deepEqual(queryJsonPath(doc, '$..role'), ['a', 'b']);
});

test('recursive descent includes the starting node', () => {
  assert.deepEqual(queryJsonPath(doc, '$..name'), ['root', 'kid']);
});

test('dot notation still maps over arrays', () => {
  assert.deepEqual(queryJsonPath(doc, '$.users.role'), ['a', 'b']);
});

test('evaluateQuery with no data has nothing to report', () => {
  assert.deepEqual(evaluateQuery(undefined, '$.a'), { results: undefined, count: 0, error: null });
});

test('evaluateQuery with an empty query returns the document', () => {
  assert.deepEqual(evaluateQuery({ a: 1 }, '  '), { results: { a: 1 }, count: 1, error: null });
});

test('evaluateQuery tells a null match from no match', () => {
  assert.deepEqual(evaluateQuery({ b: null }, '$.b'), { results: null, count: 1, error: null });
  assert.deepEqual(evaluateQuery({ b: null }, '$.c'), { results: undefined, count: 0, error: null });
});

test('evaluateQuery unwraps one match and lists several', () => {
  assert.equal(evaluateQuery({ a: 1 }, '$.a').results, 1);
  assert.deepEqual(evaluateQuery(doc, '$.users[*].role').results, ['a', 'b']);
});
