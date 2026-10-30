import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMarks, lcsLines } from './diff.js';
import { sortKeysDeep } from './formatters.js';

const lines = (n, prefix) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

test('computeMarks flags inserted and removed lines', () => {
  const { leftMarks, rightMarks } = computeMarks(['a', 'b', 'c'], ['a', 'x', 'c', 'd']);
  assert.deepEqual(leftMarks, ['', 'removed', '']);
  assert.deepEqual(rightMarks, ['', 'added', '', 'added']);
});

test('lcsLines finds matches between changes in the middle', () => {
  const { pairs, approximate } = lcsLines(['a', 'b', 'c', 'd'], ['a', 'x', 'c', 'y', 'd']);
  assert.deepEqual(pairs, [[0, 0], [2, 2], [3, 4]]);
  assert.equal(approximate, false);
});

test('computeMarks handles an empty side', () => {
  const { leftMarks, rightMarks } = computeMarks([], ['a']);
  assert.deepEqual(leftMarks, []);
  assert.deepEqual(rightMarks, ['added']);
});

test('a small change in a huge file stays exact', () => {
  const left = lines(200000, 'x');
  const right = left.map((l, i) => (i === 100000 ? 'changed' : l));
  const { leftMarks, rightMarks, approximate } = computeMarks(left, right);
  assert.equal(approximate, false);
  assert.equal(leftMarks.filter(Boolean).length, 1);
  assert.equal(rightMarks.filter(Boolean).length, 1);
});

test('oversized middle sections are flagged instead of computed', () => {
  const left = ['same', ...lines(40000, 'l'), 'end'];
  const right = ['same', ...lines(40000, 'r'), 'end'];
  const { leftMarks, approximate } = computeMarks(left, right);
  assert.equal(approximate, true);
  assert.equal(leftMarks[0], '');
  assert.equal(leftMarks[1], 'removed');
  assert.equal(leftMarks.at(-1), '');
});

test('key order does not produce line changes once sorted', () => {
  const stringify = o => JSON.stringify(sortKeysDeep(o), null, 2).split('\n');
  const { leftMarks, rightMarks } = computeMarks(
    stringify({ a: 1, b: { c: 2, d: 3 } }),
    stringify({ b: { d: 3, c: 2 }, a: 1 }),
  );
  assert.ok(leftMarks.every(m => m === ''));
  assert.ok(rightMarks.every(m => m === ''));
});
