export default function StatsBar({ stats }) {
  if (!stats) {
    return (
      <div className="stats-bar">
        <span className="stat">Ready</span>
      </div>
    );
  }

  return (
    <div className="stats-bar">
      <span className="stat">Size: <strong>{stats.sizeStr}</strong></span>
      <span className="stat">Lines: <strong>{stats.lines}</strong></span>
      <span className="stat">Depth: <strong>{stats.maxDepth}</strong></span>
      {stats.typeStr && <span className="stat">Type: <strong>{stats.typeStr}</strong></span>}
    </div>
  );
}
