import { ChevronIcon } from './Icons';
import { formatDiffValue } from '../utils/diff';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function DiffItem({ diff }) {
  let tag, vals;
  if (diff.type === 'added') {
    tag = <span className="di-tag add">Added</span>;
    vals = <span className="di-val new">{formatDiffValue(diff.right)}</span>;
  } else if (diff.type === 'removed') {
    tag = <span className="di-tag rm">Removed</span>;
    vals = <span className="di-val old">{formatDiffValue(diff.left)}</span>;
  } else {
    tag = <span className="di-tag chg">Changed</span>;
    vals = (
      <>
        <span className="di-val old">{formatDiffValue(diff.left)}</span>
        <span style={{ color: 'var(--fg-muted)' }}>&rarr;</span>
        <span className="di-val new">{formatDiffValue(diff.right)}</span>
      </>
    );
  }

  return (
    <div className="diff-item">
      {tag} <span className="di-path">{diff.path}</span>
      <div className="di-vals">{vals}</div>
    </div>
  );
}

export default function DiffDetails({ diffs }) {
  if (!diffs.length) return null;

  return (
    <details className="diff-details">
      <summary>
        <ChevronIcon />
        Differences <span className="count">({diffs.length})</span>
      </summary>
      <div className="diff-list">
        {diffs.map((d, i) => <DiffItem key={i} diff={d} />)}
      </div>
    </details>
  );
}
