import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, sortKeysJSON } from './formatters.js';

test('sortKeysJSON sorts nested keys and keeps array order', () => {
  assert.equal(sortKeysJSON('{"b":[{"d":1,"c":2}],"a":1}'), JSON.stringify({ a: 1, b: [{ c: 2, d: 1 }] }, null, 2));
});

test('sortKeysJSON keeps a __proto__ key', () => {
  assert.match(sortKeysJSON('{"__proto__":{"x":1},"b":2}'), /"__proto__"/);
});

test('computeStats reports JSON null as a type', () => {
  assert.equal(computeStats('null', null).typeStr, 'null');
});

test('computeStats leaves the type blank when nothing parsed', () => {
  assert.equal(computeStats('{', undefined).typeStr, '');
});
