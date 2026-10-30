export function toPretty(d) {
  return JSON.stringify(d, null, 2);
}

function yamlNeedsQuotes(s) {
  return s === ''
    || s !== s.trim()
    || /[:#{}[\],&*?|>!%@`"'\p{Cc}]/u.test(s)
    || /^(~|null|true|false|yes|no|on|off|y|n)$/i.test(s)
    || /^-(\s|$)|^---|^\.\.\./.test(s)
    || /^[-+]?\.(inf|nan)$/i.test(s)
    || /^\d{4}-\d{2}-\d{2}/.test(s)
    || !isNaN(s);
}

function isYamlBlock(v) {
  return typeof v === 'object' && v !== null && Object.keys(v).length > 0;
}

export function toYAML(d, indent = 0) {
  const pad = '  '.repeat(indent);
  if (d === null) return 'null';
  if (typeof d === 'boolean') return d ? 'true' : 'false';
  if (typeof d === 'number') return String(d);
  if (typeof d === 'string') {
    // `|-` cannot represent a trailing newline, leading space, or control chars.
    if (d.includes('\n') && !d.endsWith('\n') && !/^\s/.test(d) && !/[^\P{Cc}\n\t]/u.test(d))
      return '|-\n' + d.split('\n').map(l => pad + '  ' + l).join('\n');
    return yamlNeedsQuotes(d) ? JSON.stringify(d) : d;
  }
  if (Array.isArray(d)) {
    if (!d.length) return '[]';
    return d.map(item => {
      const val = toYAML(item, indent + 1);
      return pad + '- ' + (isYamlBlock(item) ? val.trimStart() : val);
    }).join('\n');
  }
  const keys = Object.keys(d);
  if (!keys.length) return '{}';
  return keys.map(k => {
    const sk = /\s/.test(k) || yamlNeedsQuotes(k) ? JSON.stringify(k) : k;
    const v = d[k];
    if (isYamlBlock(v))
      return pad + sk + ':\n' + toYAML(v, indent + 1);
    return pad + sk + ': ' + toYAML(v, indent + 1);
  }).join('\n');
}

export function toCSV(d) {
  let rows = Array.isArray(d) ? d : [d];
  rows = rows.filter(r => typeof r === 'object' && r !== null && !Array.isArray(r));
  if (!rows.length) return '// CSV requires an array of objects';
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const esc = v => {
    if (v == null) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[,"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function toXML(d, root = 'root', indent = 0) {
  const pad = '  '.repeat(indent);
  if (d == null) return pad + `<${root}/>`;
  if (typeof d !== 'object') return pad + `<${root}>${escXml(String(d))}</${root}>`;
  if (Array.isArray(d)) {
    if (!d.length) return pad + `<${root}/>`;
    const item = root.endsWith('s') ? root.slice(0, -1) : 'item';
    return pad + `<${root}>\n` + d.map(i => toXML(i, item, indent + 1)).join('\n') + '\n' + pad + `</${root}>`;
  }
  const keys = Object.keys(d);
  if (!keys.length) return pad + `<${root}/>`;
  const inner = keys.map(k => {
    const n = k.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/^([^a-zA-Z_])/, '_$1');
    return toXML(d[k], n, indent + 1);
  }).join('\n');
  return (indent === 0 ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '') +
    pad + `<${root}>\n${inner}\n${pad}</${root}>`;
}

function tsType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return v.length ? tsType(v[0]) + '[]' : 'unknown[]';
  return typeof v;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z0-9]/g, '');
}

function genInterface(obj, name) {
  const lines = [`interface ${name} {`];
  const nested = [];
  for (const [k, v] of Object.entries(obj)) {
    const sk = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const n = name + capitalize(k);
      lines.push(`  ${sk}: ${n};`);
      nested.push(genInterface(v, n));
    } else if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0] !== null) {
      const n = name + capitalize(k) + 'Item';
      lines.push(`  ${sk}: ${n}[];`);
      nested.push(genInterface(v[0], n));
    } else {
      lines.push(`  ${sk}: ${tsType(v)};`);
    }
  }
  lines.push('}');
  return [...nested, lines.join('\n')].join('\n\n');
}

export function toTypeScript(d, name = 'Root') {
  if (d === null) return 'type Root = null;';
  if (typeof d !== 'object') return `type Root = ${typeof d};`;
  if (Array.isArray(d)) {
    if (!d.length) return 'type Root = unknown[];';
    const s = d[0];
    if (typeof s === 'object' && s !== null && !Array.isArray(s))
      return genInterface(s, name + 'Item') + '\n\ntype ' + name + ' = ' + name + 'Item[];';
    return `type Root = ${tsType(s)}[];`;
  }
  return genInterface(d, name);
}

function tomlKey(k) {
  return /^[a-zA-Z0-9_-]+$/.test(k) ? k : JSON.stringify(k);
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isTableArray(v) {
  return Array.isArray(v) && v.length > 0 && v.every(isPlainObject);
}

function containsNull(v) {
  if (v === null) return true;
  if (Array.isArray(v)) return v.some(containsNull);
  return isPlainObject(v) && Object.values(v).some(containsNull);
}

function tomlValue(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v))
    return `[${v.filter(i => i !== null).map(tomlValue).join(', ')}]`;
  if (isPlainObject(v)) {
    const entries = Object.entries(v)
      .filter(([, iv]) => iv !== null)
      .map(([ik, iv]) => `${tomlKey(ik)} = ${tomlValue(iv)}`);
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }
  return String(v);
}

// Keys must precede subtables: TOML assigns any key after a header to that table.
function emitToml(obj, path, lines) {
  const subtables = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = tomlKey(k);
    if (v === null) {
      lines.push(`# ${key} omitted: TOML has no null`);
    } else if (isPlainObject(v) || isTableArray(v)) {
      subtables.push([key, v]);
    } else {
      if (containsNull(v)) lines.push(`# ${key}: null items omitted, TOML has no null`);
      lines.push(`${key} = ${tomlValue(v)}`);
    }
  }
  for (const [key, v] of subtables) {
    const childPath = [...path, key];
    const header = childPath.join('.');
    if (Array.isArray(v)) {
      for (const item of v) {
        lines.push('', `[[${header}]]`);
        emitToml(item, childPath, lines);
      }
    } else {
      lines.push('', `[${header}]`);
      emitToml(v, childPath, lines);
    }
  }
}

export function toTOML(d) {
  if (typeof d !== 'object' || d === null || Array.isArray(d))
    return '# TOML requires a top-level object';
  const lines = [];
  emitToml(d, [], lines);
  return lines.join('\n').trimStart();
}

export function toQueryString(d) {
  if (typeof d !== 'object' || d === null || Array.isArray(d))
    return '// Requires a flat object';
  return Object.entries(d)
    .map(([k, v]) =>
      `${encodeURIComponent(k)}=${encodeURIComponent(
        typeof v === 'object' && v !== null ? JSON.stringify(v) : (v == null ? '' : v)
      )}`
    )
    .join('&');
}

export function toTable(d) {
  let rows = Array.isArray(d) ? d : [d];
  rows = rows.filter(r => typeof r === 'object' && r !== null && !Array.isArray(r));
  if (!rows.length) return '// Requires an array of objects';
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const widths = keys.map(k =>
    Math.max(k.length, ...rows.map(r => {
      const v = r[k];
      return (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)).length;
    }))
  );
  const sep = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  const hdr = '|' + keys.map((k, i) => ' ' + k.padEnd(widths[i]) + ' ').join('|') + '|';
  const body = rows.map(r =>
    '|' + keys.map((k, i) => {
      const v = r[k];
      const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return ' ' + s.padEnd(widths[i]) + ' ';
    }).join('|') + '|'
  );
  return [sep, hdr, sep, ...body, sep].join('\n');
}

export const converterMap = {
  pretty: toPretty,
  yaml: toYAML,
  csv: toCSV,
  xml: toXML,
  typescript: toTypeScript,
  toml: toTOML,
  querystring: toQueryString,
  table: toTable,
};
