function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function DiffView({ lines, marks, ref }) {
  const html = lines.map((line, i) => {
    const cls = marks[i] ? ' ' + marks[i] : '';
    return `<div class="dl${cls}"><span class="ln">${i + 1}</span>${escapeHtml(line)}</div>`;
  }).join('');

  return (
    <div
      ref={ref}
      className="diff-view"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
