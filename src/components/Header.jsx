import { ConvertIcon, CompareIcon, QueryIcon } from './Icons';

export default function Header({ mode, onModeChange, status }) {
  const statusLabels = { empty: 'Paste JSON', valid: 'Valid', invalid: 'Invalid' };

  return (
    <div className="header">
      <h1><span>{'{'}</span> JSON Toolkit <span>{'}'}</span></h1>
      <div className="mode-tabs">
        <button
          className={`mode-tab${mode === 'convert' ? ' active' : ''}`}
          onClick={() => onModeChange('convert')}
        >
          <ConvertIcon /> Convert
        </button>
        <button
          className={`mode-tab compare-tab${mode === 'compare' ? ' active' : ''}`}
          onClick={() => onModeChange('compare')}
        >
          <CompareIcon /> Compare
        </button>
        <button
          className={`mode-tab query-tab${mode === 'query' ? ' active' : ''}`}
          onClick={() => onModeChange('query')}
        >
          <QueryIcon /> Extract
        </button>
      </div>
      <div className="header-right" style={{ display: mode === 'convert' ? '' : 'none' }}>
        <div className={`status ${status}`}>{statusLabels[status]}</div>
      </div>
    </div>
  );
}
