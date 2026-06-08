import { useState } from "react";
import ScoreBar from "./ScoreBar";
import { IUCN_ORDER, IUCN_LABELS } from "../../utils/iucn";

// Globe-required fields that must be present before approval.
const REQUIRED = ["name", "lat", "lon", "iucn_status"];

/**
 * Detail / manual-completion modal for a single staged entry. Lets the
 * reviewer fill any missing globe-required fields, then approve or reject.
 */
export default function EntryDetailModal({ entry, onClose, onApprove, onReject, busy }) {
  const [animal, setAnimal] = useState(() => ({ ...entry.animal }));
  const [error, setError] = useState("");

  const set = (k, v) => setAnimal((a) => ({ ...a, [k]: v }));

  const missing = REQUIRED.filter((f) => {
    if (f === "lat" || f === "lon") return animal[f] == null || animal[f] === "" || isNaN(Number(animal[f]));
    if (f === "iucn_status") return !IUCN_ORDER.includes(animal.iucn_status);
    return !animal[f] || !String(animal[f]).trim();
  });

  const handleApprove = () => {
    if (missing.length) {
      setError(`Please complete required fields: ${missing.join(", ")}`);
      return;
    }
    // Coerce numeric coordinates before sending.
    onApprove(entry, { ...animal, lat: Number(animal.lat), lon: Number(animal.lon) });
  };

  const s = entry.scores || {};

  return (
    <div className="crawl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="crawl-modal">
        <button className="crawl-modal-close" onClick={onClose}>×</button>
        <h2 className="cm-title">{entry.animal?.name || entry.title || "Entry details"}</h2>
        <a className="cm-url" href={entry.url} target="_blank" rel="noreferrer">{entry.url}</a>

        <div className="cm-flags">
          <span className={`badge badge-class-${entry.classification}`}>{entry.classification}</span>
          {entry.duplicate && <span className="badge badge-dup">DUPLICATE</span>}
          <span className="badge">depth {entry.depth}</span>
          <span className="badge">{entry.imageCount} imgs</span>
          <span className="badge">{entry.internalLinks} links</span>
        </div>

        <div className="cm-scores">
          <ScoreBar label="Metadata" value={s.metadata} />
          <ScoreBar label="Content" value={s.content} />
          <ScoreBar label="URL" value={s.url} />
          <ScoreBar label="Relevance" value={s.relevance} />
          <ScoreBar label="TOTAL" value={s.total} />
        </div>

        {entry.metaDescription && (
          <p className="cm-meta">{entry.metaDescription}</p>
        )}

        <h3 className="cm-section">
          Globe fields {missing.length > 0 && <span className="cm-warn">— complete required fields to approve</span>}
        </h3>
        <div className="cm-form">
          <Field label="Name *" req={missing.includes("name")}>
            <input value={animal.name || ""} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="IUCN status *" req={missing.includes("iucn_status")}>
            <select value={animal.iucn_status || ""} onChange={(e) => set("iucn_status", e.target.value)}>
              <option value="">— select —</option>
              {IUCN_ORDER.map((k) => (
                <option key={k} value={k}>{IUCN_LABELS[k]}</option>
              ))}
            </select>
          </Field>
          <Field label="Latitude *" req={missing.includes("lat")}>
            <input type="number" step="any" value={animal.lat ?? ""} onChange={(e) => set("lat", e.target.value)} />
          </Field>
          <Field label="Longitude *" req={missing.includes("lon")}>
            <input type="number" step="any" value={animal.lon ?? ""} onChange={(e) => set("lon", e.target.value)} />
          </Field>
          <Field label="Country">
            <input value={animal.country || ""} onChange={(e) => set("country", e.target.value)} />
          </Field>
          <Field label="Image URL">
            <input value={animal.img || ""} onChange={(e) => set("img", e.target.value)} />
          </Field>
          <Field label="Habitat" full>
            <input value={animal.habitat || ""} onChange={(e) => set("habitat", e.target.value)} />
          </Field>
          <Field label="Fun fact" full>
            <textarea rows="2" value={animal.fun_fact || ""} onChange={(e) => set("fun_fact", e.target.value)} />
          </Field>
        </div>

        {error && <p className="cm-error">{error}</p>}

        <div className="cm-actions">
          <button className="btn-approve" disabled={busy} onClick={handleApprove}>
            Approve & add to Globe
          </button>
          <button className="btn-reject" disabled={busy} onClick={() => onReject(entry)}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, req, full }) {
  return (
    <label className={`cm-field${full ? " cm-field-full" : ""}${req ? " cm-field-req" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
