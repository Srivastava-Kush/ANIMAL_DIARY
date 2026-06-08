// Small labelled 0..100 score bar used across the review UI.
export default function ScoreBar({ label, value }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const color = v >= 75 ? "#388e3c" : v >= 50 ? "#fbc02d" : "#d32f2f";
  return (
    <div className="scorebar">
      <span className="scorebar-label">{label}</span>
      <span className="scorebar-track">
        <span className="scorebar-fill" style={{ width: `${v}%`, background: color }} />
      </span>
      <span className="scorebar-value">{v}</span>
    </div>
  );
}
