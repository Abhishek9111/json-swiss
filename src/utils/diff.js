// About 200ms and 50MB. Also keeps min(m, n) <= 5000, so Uint16Array cannot wrap.
const MAX_LCS_CELLS = 25_000_000;

function lcsMiddle(a, b, offset, m, n) {
  const width = n + 1;
  const dp = new Uint16Array((m + 1) * width);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cell = i * width + j;
      dp[cell] = a[offset + i - 1] === b[offset + j - 1]
        ? dp[cell - width - 1] + 1
        : Math.max(dp[cell - width], dp[cell - 1]);
    }
  }

  const result = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    const cell = i * width + j;
    if (a[offset + i - 1] === b[offset + j - 1]) {
      result.push([offset + i - 1, offset + j - 1]);
      i--; j--;
    } else if (dp[cell - width] >= dp[cell - 1]) i--;
    else j--;
  }
  return result.reverse();
}

export function lcsLines(a, b) {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;

  let endA = a.length, endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }

  const m = endA - start, n = endB - start;
  const approximate = (m + 1) * (n + 1) > MAX_LCS_CELLS;

  const pairs = [];
  for (let i = 0; i < start; i++) pairs.push([i, i]);
  if (!approximate) for (const pair of lcsMiddle(a, b, start, m, n)) pairs.push(pair);
  for (let i = 0; i < a.length - endA; i++) pairs.push([endA + i, endB + i]);

  return { pairs, approximate };
}

export function deepDiff(a, b, path) {
  const r = [];
  if (a === b) return r;
  if (a === null || b === null || typeof a !== typeof b || typeof a !== 'object') {
    r.push({ type: 'changed', path: path || '(root)', left: a, right: b });
    return r;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    r.push({ type: 'changed', path: path || '(root)', left: a, right: b });
    return r;
  }
  if (Array.isArray(a)) {
    const m = Math.max(a.length, b.length);
    for (let i = 0; i < m; i++) {
      const p = path ? path + '[' + i + ']' : '[' + i + ']';
      if (i >= a.length) r.push({ type: 'added', path: p, right: b[i] });
      else if (i >= b.length) r.push({ type: 'removed', path: p, left: a[i] });
      else r.push(...deepDiff(a[i], b[i], p));
    }
    return r;
  }
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of allKeys) {
    const p = path ? path + '.' + k : k;
    if (!(k in a)) r.push({ type: 'added', path: p, right: b[k] });
    else if (!(k in b)) r.push({ type: 'removed', path: p, left: a[k] });
    else r.push(...deepDiff(a[k], b[k], p));
  }
  return r;
}

export function computeMarks(leftLines, rightLines) {
  const { pairs, approximate } = lcsLines(leftLines, rightLines);
  const leftMarks = new Array(leftLines.length).fill('');
  const rightMarks = new Array(rightLines.length).fill('');

  let li = 0, ri = 0;
  for (const [ml, mr] of pairs) {
    while (li < ml) { leftMarks[li] = 'removed'; li++; }
    while (ri < mr) { rightMarks[ri] = 'added'; ri++; }
    li++; ri++;
  }
  while (li < leftLines.length) { leftMarks[li] = 'removed'; li++; }
  while (ri < rightLines.length) { rightMarks[ri] = 'added'; ri++; }

  return { leftMarks, rightMarks, approximate };
}

export function formatDiffValue(v) {
  if (v === null) return 'null';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string') return '"' + v + '"';
  return String(v);
}
