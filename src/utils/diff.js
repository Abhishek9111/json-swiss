export function lcsLines(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { result.push([i - 1, j - 1]); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return result.reverse();
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
  const lcs = lcsLines(leftLines, rightLines);
  const leftMarks = new Array(leftLines.length).fill('');
  const rightMarks = new Array(rightLines.length).fill('');

  let li = 0, ri = 0;
  for (const [ml, mr] of lcs) {
    while (li < ml) { leftMarks[li] = 'removed'; li++; }
    while (ri < mr) { rightMarks[ri] = 'added'; ri++; }
    li++; ri++;
  }
  while (li < leftLines.length) { leftMarks[li] = 'removed'; li++; }
  while (ri < rightLines.length) { rightMarks[ri] = 'added'; ri++; }

  return { leftMarks, rightMarks };
}

export function formatDiffValue(v) {
  if (v === null) return 'null';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string') return '"' + v + '"';
  return String(v);
}
