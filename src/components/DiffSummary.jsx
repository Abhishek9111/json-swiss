import { CheckIcon, PlusIcon, MinusIcon } from './Icons';

export default function DiffSummary({ addedCount, removedCount, approximate }) {
  const total = addedCount + removedCount;

  if (total === 0) {
    return (
      <div className="diff-summary-bar">
        <span className="diff-badge ok"><CheckIcon /> Identical</span> No differences found
      </div>
    );
  }

  return (
    <div className="diff-summary-bar">
      <strong>{total}</strong> changed line{total !== 1 ? 's' : ''}
      {addedCount > 0 && (
        <span className="diff-badge add"><PlusIcon />{addedCount} added</span>
      )}
      {removedCount > 0 && (
        <span className="diff-badge rm"><MinusIcon />{removedCount} removed</span>
      )}
      {approximate && <span>Large diff: unchanged lines between the first and last change may be marked as changed</span>}
    </div>
  );
}
