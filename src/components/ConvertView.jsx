import { useState, useRef, useEffect, useCallback } from 'react';
import { useJsonValidation } from '../hooks/useJsonValidation';
import { converterMap } from '../utils/converters';
import { formatJSON, minifyJSON, sortKeysJSON, computeStats } from '../utils/formatters';
import { CONVERT_SAMPLE } from '../constants/sampleData';
import Pane from './Pane';
import TreeView from './TreeView';
import StatsBar from './StatsBar';
import {
  FormatIcon, FourSpaceIcon, MinifyIcon, SortIcon, PlayIcon,
  FileIcon, CodeIcon, SampleIcon, ClearIcon, CopyIcon, TreeIcon,
} from './Icons';

export default function ConvertView({ active, toast, onStatusChange }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('Output will appear here');
  const [format, setFormat] = useState('pretty');
  const [stats, setStats] = useState(null);
  const { parsed, status, error, validate } = useJsonValidation();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const runConvert = useCallback((parsedData, fmt) => {
    if (parsedData === null) {
      setOutput('Output will appear here');
      return;
    }
    try {
      setOutput(converterMap[fmt](parsedData));
    } catch (e) {
      setOutput('Error: ' + e.message);
    }
  }, []);

  const handleInput = useCallback((value) => {
    setInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const result = validate(value);
      const trimmed = value.trim();
      if (trimmed) {
        setStats(computeStats(trimmed, result.parsed));
      } else {
        setStats(null);
      }
      runConvert(result.parsed, format);
    }, 150);
  }, [validate, runConvert, format]);

  const handleFormatChange = useCallback((fmt) => {
    setFormat(fmt);
    if (parsed !== null) {
      runConvert(parsed, fmt);
    }
  }, [parsed, runConvert]);

  const handleFormat = useCallback((spaces) => {
    try {
      const formatted = formatJSON(input, spaces);
      setInput(formatted);
      const result = validate(formatted);
      setStats(computeStats(formatted.trim(), result.parsed));
      runConvert(result.parsed, format);
      toast('Formatted');
    } catch { /* invalid JSON */ }
  }, [input, validate, runConvert, format, toast]);

  const handleMinify = useCallback(() => {
    try {
      const minified = minifyJSON(input);
      setInput(minified);
      const result = validate(minified);
      setStats(computeStats(minified.trim(), result.parsed));
      runConvert(result.parsed, format);
      toast('Minified');
    } catch { /* invalid JSON */ }
  }, [input, validate, runConvert, format, toast]);

  const handleSortKeys = useCallback(() => {
    try {
      const sorted = sortKeysJSON(input);
      setInput(sorted);
      const result = validate(sorted);
      setStats(computeStats(sorted.trim(), result.parsed));
      runConvert(result.parsed, format);
      toast('Keys sorted');
    } catch { /* invalid JSON */ }
  }, [input, validate, runConvert, format, toast]);

  const handleCopy = useCallback(() => {
    if (!output || output === 'Output will appear here') return;
    navigator.clipboard.writeText(output)
      .then(() => toast('Copied'))
      .catch(() => toast('Select text and copy manually'));
  }, [output, toast]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('Output will appear here');
    setStats(null);
    validate('');
    inputRef.current?.focus();
  }, [validate]);

  const handleSample = useCallback(() => {
    const sample = JSON.stringify(CONVERT_SAMPLE, null, 2);
    setInput(sample);
    const result = validate(sample);
    setStats(computeStats(sample.trim(), result.parsed));
    runConvert(result.parsed, format);
    toast('Sample loaded');
  }, [validate, runConvert, format, toast]);

  const handleTab = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const s = ta.selectionStart;
      const before = input.substring(0, s);
      const after = input.substring(ta.selectionEnd);
      const newVal = before + '  ' + after;
      setInput(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      });
    }
  }, [input]);

  return (
    <div className={`view${active ? ' active' : ''}`}>
      <div className="toolbar">
        <div className="toolbar-group">
          <button className="btn" onClick={() => handleFormat(2)}>
            <FormatIcon /> Format
          </button>
          <button className="btn" onClick={() => handleFormat(4)}>
            <FourSpaceIcon /> 4-space
          </button>
          <button className="btn" onClick={handleMinify}>
            <MinifyIcon /> Minify
          </button>
          <button className="btn" onClick={handleSortKeys}>
            <SortIcon /> Sort keys
          </button>
        </div>
        <div className="toolbar-group">
          <select
            className="convert-select"
            value={format}
            onChange={(e) => handleFormatChange(e.target.value)}
          >
            <option value="pretty">Pretty JSON</option>
            <option value="yaml">YAML</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
            <option value="typescript">TypeScript</option>
            <option value="toml">TOML</option>
            <option value="querystring">Query String</option>
            <option value="table">ASCII Table</option>
            <option value="tree">Tree View</option>
          </select>
          <button className="btn primary" onClick={() => runConvert(parsed, format)}>
            <PlayIcon /> Convert
          </button>
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
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleTab}
            placeholder="Paste or type JSON here..."
            spellCheck={false}
          />
        </Pane>
        <Pane
          label="Output"
          icon={format === 'tree' ? <TreeIcon /> : <CodeIcon />}
          actions={
            format !== 'tree' && (
              <button className="pane-action" onClick={handleCopy}>
                <CopyIcon /> Copy
              </button>
            )
          }
        >
          {format === 'tree'
            ? <TreeView data={parsed} />
            : <div className="output-area">{output}</div>
          }
        </Pane>
      </div>
      <StatsBar stats={stats} />
    </div>
  );
}
