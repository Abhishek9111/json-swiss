import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toTOML, toYAML } from './converters.js';

test('toYAML aligns nested sequences', () => {
  assert.equal(toYAML([[1, 2], [3, 4]]), '- - 1\n  - 2\n- - 3\n  - 4');
});

test('toYAML keeps objects in sequences compact', () => {
  assert.equal(toYAML([{ id: 1, name: 'a' }]), '- id: 1\n  name: a');
});

test('toYAML renders empty containers inline', () => {
  assert.equal(toYAML({ a: [], b: {}, c: 1 }), 'a: []\nb: {}\nc: 1');
});

test('toYAML quotes strings a parser would reinterpret', () => {
  for (const s of ['- x', ' pad ', '~', 'yes', 'No', 'NULL', '12', '2024-01-01', '.inf', '---', '']) {
    assert.equal(toYAML({ k: s }), `k: ${JSON.stringify(s)}`);
  }
  assert.equal(toYAML({ k: 'plain text' }), 'k: plain text');
});

test('toYAML quotes reserved keys', () => {
  assert.equal(toYAML({ true: 1 }), '"true": 1');
});

test('toYAML only uses a block scalar when it is lossless', () => {
  assert.equal(toYAML({ k: 'a\nb' }), 'k: |-\n    a\n    b');
  assert.equal(toYAML({ k: 'a\nb\n' }), 'k: "a\\nb\\n"');
  assert.equal(toYAML({ k: ' a\nb' }), 'k: " a\\nb"');
});

test('toTOML keeps arrays inside tables and deep nesting', () => {
  const out = toTOML({ config: { tags: ['x'], deep: { a: { b: 1 } } } });
  assert.equal(out, '[config]\ntags = ["x"]\n\n[config.deep]\n\n[config.deep.a]\nb = 1');
});

test('toTOML keeps nested fields in arrays of tables', () => {
  const out = toTOML({ users: [{ id: 1, tags: ['y'], p: { q: 2 } }] });
  assert.equal(out, '[[users]]\nid = 1\ntags = ["y"]\n\n[users.p]\nq = 2');
});

test('toTOML writes keys before subtables', () => {
  assert.equal(toTOML({ t: { x: 1 }, a: 2 }), 'a = 2\n\n[t]\nx = 1');
});

test('toTOML does not alter numbers', () => {
  assert.equal(toTOML({ a: 0.0000001, b: 1.23456789, c: 1.5 }), 'a = 1e-7\nb = 1.23456789\nc = 1.5');
});

test('toTOML omits null visibly instead of writing a string', () => {
  assert.equal(toTOML({ a: null }), '# a omitted: TOML has no null');
  assert.equal(toTOML({ a: [1, null] }), '# a: null items omitted, TOML has no null\na = [1]');
});

test('toTOML handles nested and mixed arrays', () => {
  assert.equal(toTOML({ m: [[1, 2]], o: [1, { a: 2 }] }), 'm = [[1, 2]]\no = [1, { a = 2 }]');
});
