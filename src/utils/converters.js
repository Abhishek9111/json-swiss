export function toPretty(d) {
  return JSON.stringify(d, null, 2);
}

export function toYAML(d, indent = 0) {
  const pad = '  '.repeat(indent);
  if (d === null) return 'null';
  if (typeof d === 'boolean') return d ? 'true' : 'false';
  if (typeof d === 'number') return String(d);
  if (typeof d === 'string') {
    if (d.includes('\n'))
      return '|\n' + d.split('\n').map(l => pad + '  ' + l).join('\n');
    if (/[:#{}[\],&*?|>!%@`"']/.test(d) || d === '' || d === 'true' || d === 'false' || d === 'null' || !isNaN(d))
      return JSON.stringify(d);
    return d;
  }
  if (Array.isArray(d)) {
    if (!d.length) return '[]';
    return d.map(item => {
      const val = toYAML(item, indent + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const lines = val.split('\n');
        return pad + '- ' + lines[0] + (lines.length > 1 ? '\n' + lines.slice(1).map(l => pad + '  ' + l).join('\n') : '');
      }
      return pad + '- ' + val;
    }).join('\n');
  }
  const keys = Object.keys(d);
  if (!keys.length) return '{}';
  return keys.map(k => {
    const sk = /[:#{}[\],&*?|>!%@`"'\s]/.test(k) ? JSON.stringify(k) : k;
    const v = d[k];
    if (typeof v === 'object' && v !== null)
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

function tomlValue(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number')
    return Number.isInteger(v) ? String(v) : v.toFixed(6).replace(/0+$/, '0');
  return JSON.stringify(String(v));
}

export function toTOML(d) {
  if (typeof d !== 'object' || d === null || Array.isArray(d))
    return '# TOML requires a top-level object';
  const lines = [];
  const tables = [];
  for (const [k, v] of Object.entries(d)) {
    const tk = tomlKey(k);
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (v.length && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
        v.forEach(item => {
          tables.push(`\n[[${tk}]]`);
          for (const [ik, iv] of Object.entries(item))
            if (typeof iv !== 'object' || iv === null) tables.push(`${tomlKey(ik)} = ${tomlValue(iv)}`);
        });
      } else {
        lines.push(`${tk} = [${v.map(tomlValue).join(', ')}]`);
      }
    } else if (typeof v === 'object') {
      tables.push(`\n[${tk}]`);
      for (const [ik, iv] of Object.entries(v)) {
        if (typeof iv !== 'object' || iv === null) {
          tables.push(`${tomlKey(ik)} = ${tomlValue(iv)}`);
        } else if (!Array.isArray(iv)) {
          tables.push(`\n[${tk}.${tomlKey(ik)}]`);
          for (const [iik, iiv] of Object.entries(iv))
            if (typeof iiv !== 'object' || iiv === null)
              tables.push(`${tomlKey(iik)} = ${tomlValue(iiv)}`);
        }
      }
    } else {
      lines.push(`${tk} = ${tomlValue(v)}`);
    }
  }
  return lines.concat(tables).join('\n');
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
