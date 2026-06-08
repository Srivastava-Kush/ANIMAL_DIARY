import { IUCN_COLORS, IUCN_LABELS, IUCN_ORDER } from "../utils/iucn";

export default function Legend() {
  return (
    <div className="legend">
      <p className="legend-title">Conservation Status</p>
      {IUCN_ORDER.map((status) => (
        <div key={status} className="legend-item">
          <span
            className="legend-dot"
            style={{ background: IUCN_COLORS[status] }}
          />
          <span className="legend-label">{IUCN_LABELS[status]}</span>
        </div>
      ))}
      <div className="legend-hints">
        <p>Drag to rotate · Scroll to zoom</p>
        <p>Double-click marker for details</p>
      </div>
    </div>
  );
}
