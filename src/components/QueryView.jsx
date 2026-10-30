import { useState, useRef, useCallback, useMemo } from 'react';
import { evaluateQuery } from '../utils/jsonpath';
import Pane from './Pane';
import TreeView from './TreeView';
import {
  FileIcon, ClearIcon, SampleIcon, CopyIcon, QueryIcon,
} from './Icons';

const QUERY_EXAMPLES = [
  { label: '$.users[*].name', desc: 'All user names' },
  { label: '$.config', desc: 'Config object' },
  { label: '$.users[0]', desc: 'First user' },
  { label: '$..role', desc: 'All roles (recursive)' },
  { label: '$.users[-1]', desc: 'Last user' },
];

export default function QueryView({ active, toast }) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const queryRef = useRef(null);

  const source = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return { data: undefined, error: null };
    try {
      return { data: JSON.parse(trimmed), error: null };
    } catch (e) {
      return { data: undefined, error: e.message };
    }
  }, [input]);

  const { results, count: resultCount, error: queryError } = useMemo(
    () => evaluateQuery(source.data, query),
    [source, query],
  );
  const error = source.error ?? queryError;
  const hasSource = source.data !== undefined;

  const handleSample = useCallback(() => {
    const sample = JSON.stringify({
      name: "JSON Toolkit",
      version: "1.0.0",
      config: { theme: "auto", indent: 2 },
      users: [
        { id: 1, name: "Alice", role: "admin", active: true },
        { id: 2, name: "Bob", role: "editor", active: true },
        { id: 3, name: "Charlie", role: "viewer", active: false },
      ],
    }, null, 2);
    setInput(sample);
    setQuery('$.users[*].name');
    toast('Sample loaded');
  }, [toast]);

  const handleClear = useCallback(() => {
    setInput('');
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleCopy = useCallback(() => {
    if (results === undefined) return;
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text)
      .then(() => toast('Copied'))
      .catch(() => toast('Select text and copy manually'));
  }, [results, toast]);

  const handleTab = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const s = ta.selectionStart;
      const val = ta.value;
      const newVal = val.substring(0, s) + '  ' + val.substring(ta.selectionEnd);
      setInput(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      });
    }
  }, []);

  return (
    <div className={`view${active ? ' active' : ''}`}>
      <div className="toolbar">
        <div className="toolbar-group">
          <div className="query-input-wrap">
            <QueryIcon />
            <input
              ref={queryRef}
              className="query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="$.path.to.value"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="toolbar-group">
          {QUERY_EXAMPLES.slice(0, 3).map((ex) => (
            <button
              key={ex.label}
              className="btn"
              title={ex.desc}
              onClick={() => setQuery(ex.label)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="editors">
        <Pane
          label="Input"
          icon={<FileIcon />}
          actions={
            <>
              <button className="pane-action" onClick={handleSample}>
                <SampleIcon /> Sample
              </button>
              <button className="pane-action" onClick={handleClear}>
                <ClearIcon /> Clear
              </button>
            </>
          }
        >
          {error && <div className="error-msg">{error}</div>}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleTab}
            placeholder="Paste JSON here..."
            spellCheck={false}
          />
        </Pane>
        <Pane
          label={`Results${resultCount > 0 ? ` (${resultCount})` : ''}`}
          icon={<QueryIcon />}
          actions={
            <button className="pane-action" onClick={handleCopy}>
              <CopyIcon /> Copy
            </button>
          }
        >
          <TreeView
            data={results}
            emptyMessage={hasSource && !queryError ? 'No matches' : undefined}
          />
        </Pane>
      </div>

      <div className="stats-bar">
        <span className="stat">
          {resultCount > 0
            ? <><strong>{resultCount}</strong> match{resultCount !== 1 ? 'es' : ''}</>
            : 'Ready'
          }
        </span>
        {query && <span className="stat">Path: <strong>{query}</strong></span>}
      </div>
    </div>
  );
}
