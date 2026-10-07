export default function Pane({ label, icon, actions, children }) {
  return (
    <div className="pane">
      <div className="pane-header">
        <span className="pane-label">
          {icon}
          {label}
        </span>
        <div className="pane-actions">
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}
