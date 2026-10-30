export function queryJsonPath(data, path) {
  if (!path || path === '$') return [data];

  const normalized = path.startsWith('$') ? path.slice(1) : path;
  const tokens = tokenize(normalized);
  let results = [data];

  for (const token of tokens) {
    const next = [];
    for (const current of results) {
      if (current === null || current === undefined || typeof current !== 'object') continue;

      if (token === '*') {
        const vals = Array.isArray(current) ? current : Object.values(current);
        next.push(...vals);
      } else if (token.startsWith('[') && token.endsWith(']')) {
        const inner = token.slice(1, -1);
        if (inner === '*') {
          const vals = Array.isArray(current) ? current : Object.values(current);
          next.push(...vals);
        } else if (/^-?\d+$/.test(inner)) {
          const idx = parseInt(inner, 10);
          const arr = Array.isArray(current) ? current : Object.values(current);
          const resolved = idx < 0 ? arr[arr.length + idx] : arr[idx];
          if (resolved !== undefined) next.push(resolved);
        } else if (/^-?\d+:-?\d*$/.test(inner)) {
          const [startStr, endStr] = inner.split(':');
          const arr = Array.isArray(current) ? current : Object.values(current);
          const start = parseInt(startStr, 10);
          const end = endStr === '' ? arr.length : parseInt(endStr, 10);
          const resolvedStart = start < 0 ? Math.max(0, arr.length + start) : start;
          const resolvedEnd = end < 0 ? arr.length + end : end;
          next.push(...arr.slice(resolvedStart, resolvedEnd));
        } else {
          const key = inner.replace(/^['"]|['"]$/g, '');
          if (key in current) next.push(current[key]);
        }
      } else if (token === '..') {
        collectDescendants(current, next);
      } else {
        if (Array.isArray(current)) {
          for (const item of current) {
            if (item && typeof item === 'object' && token in item) {
              next.push(item[token]);
            }
          }
        } else if (token in current) {
          next.push(current[token]);
        }
      }
    }
    results = next;
  }

  return results;
}

// `undefined` data means nothing to query; JSON null is a real value.
export function evaluateQuery(data, query) {
  if (data === undefined) return { results: undefined, count: 0, error: null };
  const trimmed = query.trim();
  if (!trimmed) return { results: data, count: 1, error: null };

  try {
    const matches = queryJsonPath(data, trimmed);
    if (matches.length === 0) return { results: undefined, count: 0, error: null };
    return {
      results: matches.length === 1 ? matches[0] : matches,
      count: matches.length,
      error: null,
    };
  } catch (e) {
    return { results: undefined, count: 0, error: 'Query error: ' + e.message };
  }
}

function collectDescendants(obj, results) {
  if (obj === null || typeof obj !== 'object') return;
  const values = Array.isArray(obj) ? obj : Object.values(obj);
  for (const v of values) {
    results.push(v);
    if (v && typeof v === 'object') collectDescendants(v, results);
  }
}

function tokenize(path) {
  const tokens = [];
  let i = 0;
  while (i < path.length) {
    if (path[i] === '.') {
      if (path[i + 1] === '.') {
        tokens.push('..');
        i += 2;
      } else {
        i++;
      }
    } else if (path[i] === '[') {
      const end = path.indexOf(']', i);
      if (end === -1) break;
      tokens.push(path.slice(i, end + 1));
      i = end + 1;
    } else {
      let end = i;
      while (end < path.length && path[end] !== '.' && path[end] !== '[') end++;
      tokens.push(path.slice(i, end));
      i = end;
    }
  }
  return tokens;
}
