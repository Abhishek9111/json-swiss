import { useState, useRef, useCallback, useEffect } from 'react';
import { deepDiff, computeMarks } from '../utils/diff';
import { DIFF_SAMPLE_LEFT, DIFF_SAMPLE_RIGHT } from '../constants/sampleData';
import Pane from './Pane';
import DiffView from './DiffView';
import DiffSummary from './DiffSummary';
import DiffDetails from './DiffDetails';
import TreeView from './TreeView';
import {
  DiffCirclesIcon, SwapIcon, EditIcon, ClearIcon, SampleIcon, PaneIcon, TreeIcon,
} from './Icons';

export default function CompareView({ active, toast }) {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [editing, setEditing] = useState(true);
  const [viewMode, setViewMode] = useState('diff');
  const leftViewRef = useRef(null);
  const rightViewRef = useRef(null);

  const autoFormatOnPaste = useCallback((value) => {
    try {
      return JSON.stringify(JSON.parse(value.trim()), null, 2);
    } catch {
      return value;
    }
  }, []);

  const handlePaste = useCallback((setter) => (e) => {
    const ta = e.target;
    if (ta.selectionStart !== 0 || ta.selectionEnd !== ta.value.length) return;
    e.preventDefault();
    setter(autoFormatOnPaste(e.clipboardData.getData('text')));
  }, [autoFormatOnPaste]);

  const handleTab = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const s = ta.selectionStart;
      const val = ta.value;
      const newVal = val.substring(0, s) + '  ' + val.substring(ta.selectionEnd);
      const setter = ta.dataset.side === 'left' ? setLeft : setRight;
      setter(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      });
    }
  }, []);

  const runDiff = useCallback(() => {
    if (!left.trim() || !right.trim()) {
      toast('Paste JSON on both sides');
      return;
    }
    let leftObj, rightObj;
    try { leftObj = JSON.parse(left.trim()); } catch { toast('Left: invalid JSON'); return; }
    try { rightObj = JSON.parse(right.trim()); } catch { toast('Right: invalid JSON'); return; }

    const leftLines = JSON.stringify(leftObj, null, 2).split('\n');
    const rightLines = JSON.stringify(rightObj, null, 2).split('\n');
    const { leftMarks, rightMarks } = computeMarks(leftLines, rightLines);

    const addedCount = rightMarks.filter(m => m === 'added').length;
    const removedCount = leftMarks.filter(m => m === 'removed').length;
    const objDiffs = deepDiff(leftObj, rightObj, '');

    setDiffResult({ leftObj, rightObj, leftLines, rightLines, leftMarks, rightMarks, addedCount, removedCount, objDiffs });
    setEditing(false);
  }, [left, right, toast]);

  const handleEdit = useCallback(() => {
    setEditing(true);
    setDiffResult(null);
    setViewMode('diff');
  }, []);

  const handleSwap = useCallback(() => {
    setLeft(prev => {
      const oldLeft = prev;
      setRight(oldLeft);
      return right;
    });
    handleEdit();
    toast('Swapped');
  }, [right, handleEdit, toast]);

  const handleClear = useCallback(() => {
    setLeft('');
    setRight('');
    handleEdit();
  }, [handleEdit]);

  const handleSample = useCallback(() => {
    setLeft(JSON.stringify(DIFF_SAMPLE_LEFT, null, 2));
    setRight(JSON.stringify(DIFF_SAMPLE_RIGHT, null, 2));
    handleEdit();
    toast('Sample loaded');
  }, [handleEdit, toast]);

  useEffect(() => {
    if (!diffResult || !leftViewRef.current || !rightViewRef.current) return;
    const a = leftViewRef.current;
    const b = rightViewRef.current;
    // Scroll events fire async, and a shorter pane clamps; without this the
    // echo event would drag the longer pane back from its bottom.
    let ignoreNext = null;
    const syncFrom = (src, tgt) => () => {
      if (ignoreNext === src) {
        ignoreNext = null;
        return;
      }
      const { scrollTop, scrollLeft } = tgt;
      tgt.scrollTop = src.scrollTop;
      tgt.scrollLeft = src.scrollLeft;
      if (tgt.scrollTop !== scrollTop || tgt.scrollLeft !== scrollLeft) ignoreNext = tgt;
    };
    const syncAB = syncFrom(a, b);
    const syncBA = syncFrom(b, a);
    a.addEventListener('scroll', syncAB);
    b.addEventListener('scroll', syncBA);
    return () => {
      a.removeEventListener('scroll', syncAB);
      b.removeEventListener('scroll', syncBA);
    };
  }, [diffResult, viewMode]);

  const diffStats = diffResult
    ? diffResult.addedCount + diffResult.removedCount === 0
      ? <span className="stat">Identical</span>
      : (
        <>
          {diffResult.addedCount > 0 && <span className="stat" style={{ color: 'var(--diff-add-fg)' }}>+{diffResult.addedCount}</span>}
          {diffResult.removedCount > 0 && <span className="stat" style={{ color: 'var(--diff-rm-fg)' }}>-{diffResult.removedCount}</span>}
          <span className="stat"><strong>{diffResult.addedCount + diffResult.removedCount}</strong> changes</span>
        </>
      )
    : <span className="stat">Ready</span>;

  return (
    <div className={`view${active ? ' active' : ''}`}>
      <div className="toolbar">
        <div className="toolbar-group">
          <button className="btn compare-btn" onClick={runDiff}>
            <DiffCirclesIcon /> Compare
          </button>
          <button className="btn" onClick={handleSwap}>
            <SwapIcon /> Swap
          </button>
          <button className="btn" onClick={handleEdit}>
            <EditIcon /> Edit
          </button>
          {diffResult && (
            <button
              className={`btn${viewMode === 'tree' ? ' active' : ''}`}
              onClick={() => setViewMode(viewMode === 'diff' ? 'tree' : 'diff')}
            >
              <TreeIcon /> {viewMode === 'tree' ? 'Diff' : 'Tree'}
            </button>
          )}
        </div>
        <div className="toolbar-group">
          <button className="btn" onClick={handleClear}>
            <ClearIcon /> Clear
          </button>
          <button className="btn" onClick={handleSample}>
            <SampleIcon /> Sample
          </button>
        </div>
      </div>

      {diffResult && <DiffSummary addedCount={diffResult.addedCount} removedCount={diffResult.removedCount} />}
      {diffResult && <DiffDetails diffs={diffResult.objDiffs} />}

      <div className="editors">
        <Pane
          label="Left"
          icon={<PaneIcon />}
          actions={
            <button className="pane-action" onClick={() => { setLeft(''); handleEdit(); }}>
              <ClearIcon /> Clear
            </button>
          }
        >
          {editing ? (
            <textarea
              data-side="left"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              onPaste={handlePaste(setLeft)}
              onKeyDown={handleTab}
              placeholder="Paste first JSON here..."
              spellCheck={false}
            />
          ) : viewMode === 'tree' ? (
            <TreeView data={diffResult.leftObj} />
          ) : (
            <DiffView ref={leftViewRef} lines={diffResult.leftLines} marks={diffResult.leftMarks} />
          )}
        </Pane>
        <Pane
          label="Right"
          icon={<PaneIcon />}
          actions={
            <button className="pane-action" onClick={() => { setRight(''); handleEdit(); }}>
              <ClearIcon /> Clear
            </button>
          }
        >
          {editing ? (
            <textarea
              data-side="right"
              value={right}
              onChange={(e) => setRight(e.target.value)}
              onPaste={handlePaste(setRight)}
              onKeyDown={handleTab}
              placeholder="Paste second JSON here..."
              spellCheck={false}
            />
          ) : viewMode === 'tree' ? (
            <TreeView data={diffResult.rightObj} />
          ) : (
            <DiffView ref={rightViewRef} lines={diffResult.rightLines} marks={diffResult.rightMarks} />
          )}
        </Pane>
      </div>

      <div className="stats-bar">{diffStats}</div>
    </div>
  );
}
