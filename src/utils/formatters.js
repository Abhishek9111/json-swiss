export function formatJSON(raw, spaces = 2) {
  const parsed = JSON.parse(raw);
  return JSON.stringify(parsed, null, spaces);
}

export function minifyJSON(raw) {
  const parsed = JSON.parse(raw);
  return JSON.stringify(parsed);
}

export function sortKeysDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  if (obj !== null && typeof obj === 'object')
    // fromEntries defines own properties, so a "__proto__" key survives.
    return Object.fromEntries(Object.keys(obj).sort().map(k => [k, sortKeysDeep(obj[k])]));
  return obj;
}

export function sortKeysJSON(raw) {
  const parsed = JSON.parse(raw);
  return JSON.stringify(sortKeysDeep(parsed), null, 2);
}

export function computeStats(raw, parsed) {
  const bytes = new Blob([raw]).size;
  const lines = raw.split('\n').length;
  const sizeStr = bytes > 1024 ? (bytes / 1024).toFixed(1) + ' KB' : bytes + ' B';

  let depth = 0, maxDepth = 0;
  for (const ch of raw) {
    if (ch === '{' || ch === '[') { depth++; if (depth > maxDepth) maxDepth = depth; }
    else if (ch === '}' || ch === ']') depth--;
  }

  let typeStr = '';
  if (parsed !== undefined) {
    if (parsed === null) typeStr = 'null';
    else if (Array.isArray(parsed)) typeStr = `Array[${parsed.length}]`;
    else if (typeof parsed === 'object') typeStr = `Object{${Object.keys(parsed).length}}`;
    else typeStr = typeof parsed;
  }

  return { sizeStr, lines, maxDepth, typeStr };
}
