import { useState } from 'react';

function TreeNode({ label, value, path, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (value === null) {
    return (
      <div className="tree-node">
        <span className="tree-toggle tree-leaf" />
        {label !== undefined && <span className="tree-key">{label}: </span>}
        <span className="tree-val tree-null">null</span>
      </div>
    );
  }

  if (typeof value === 'object') {
    const isArray = Array.isArray(value);
    const entries = isArray
      ? value.map((v, i) => [i, v])
      : Object.entries(value);
    const bracket = isArray ? ['[', ']'] : ['{', '}'];
    const count = entries.length;

    return (
      <div className="tree-node">
        <button className={`tree-toggle${open ? ' open' : ''}`} onClick={() => setOpen(!open)}>
          <svg viewBox="0 0 10 10" width="10" height="10">
            <path d={open ? 'M1 3l4 4 4-4' : 'M3 1l4 4-4 4'} stroke="currentColor" fill="none" strokeWidth="1.5" />
          </svg>
        </button>
        {label !== undefined && <span className="tree-key">{label}: </span>}
        <span className="tree-bracket">{bracket[0]}</span>
        {!open && (
          <span className="tree-collapsed" onClick={() => setOpen(true)}>
            {count} {count === 1 ? (isArray ? 'item' : 'key') : (isArray ? 'items' : 'keys')}
          </span>
        )}
        {!open && <span className="tree-bracket">{bracket[1]}</span>}
        {open && (
          <div className="tree-children">
            {entries.map(([k, v]) => (
              <TreeNode
                key={k}
                label={isArray ? k : k}
                value={v}
                path={path ? `${path}.${k}` : String(k)}
              />
            ))}
          </div>
        )}
        {open && <span className="tree-bracket">{bracket[1]}</span>}
      </div>
    );
  }

  const type = typeof value;
  let className = 'tree-val';
  let display = String(value);
  if (type === 'string') { className += ' tree-string'; display = `"${value}"`; }
  else if (type === 'number') className += ' tree-number';
  else if (type === 'boolean') className += ' tree-bool';

  return (
    <div className="tree-node">
      <span className="tree-toggle tree-leaf" />
      {label !== undefined && <span className="tree-key">{label}: </span>}
      <span className={className}>{display}</span>
    </div>
  );
}

export default function TreeView({ data, emptyMessage = 'Paste valid JSON to see the tree' }) {
  if (data === undefined) {
    return <div className="tree-container tree-empty">{emptyMessage}</div>;
  }

  return (
    <div className="tree-container">
      <TreeNode value={data} path="" defaultOpen={true} />
    </div>
  );
}
