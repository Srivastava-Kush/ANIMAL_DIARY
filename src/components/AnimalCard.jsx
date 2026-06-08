import { useEffect } from "react";
import { IUCN_COLORS, IUCN_LABELS } from "../utils/iucn";
import { useResolvedImageUrl } from "../hooks/useResolvedImageUrl";

export default function AnimalCard({ animal, onClose, onShowOccurrences }) {
  const resolvedImg = useResolvedImageUrl(animal?.img);

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!animal) return null;

  const statusColor = IUCN_COLORS[animal.iucn_status] || "#666";
  const statusLabel = IUCN_LABELS[animal.iucn_status] || animal.iucn_status;

  return (
    <div className="card-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="animal-card">
        <button className="card-close" onClick={onClose}>×</button>

        <div className="card-image-wrap">
          {resolvedImg ? (
            <img
              src={resolvedImg}
              alt={animal.name}
              className="card-img"
              crossOrigin="anonymous"
            />
          ) : (
            <div
              className="card-img-placeholder"
              style={{ background: statusColor }}
            >
              {animal.name[0]}
            </div>
          )}
          <span className="iucn-badge" style={{ background: statusColor }}>
            {statusLabel}
          </span>
        </div>

        <div className="card-body">
          <h2 className="card-name">{animal.name}</h2>
          <p className="card-country">📍 {animal.country}</p>

          {animal.habitat && (
            <div className="card-row">
              <span className="card-label">Habitat</span>
              <span>{animal.habitat}</span>
            </div>
          )}

          {animal.fun_fact && (
            <div className="card-row card-funfact">
              <span className="card-label">Fun Fact</span>
              <span>{animal.fun_fact}</span>
            </div>
          )}

          <div className="card-actions">
            {animal.occurrences && animal.occurrences.length > 0 && (
              <button
                className="btn-occurrences"
                onClick={() => onShowOccurrences(animal)}
              >
                🌍 Show All {animal.occurrences.length + 1} Locations
              </button>
            )}
            <button className="btn-close-card" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
