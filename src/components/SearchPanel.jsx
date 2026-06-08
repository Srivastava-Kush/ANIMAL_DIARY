import { IUCN_COLORS, IUCN_LABELS, IUCN_ORDER } from "../utils/iucn";

export default function SearchPanel({
  search,
  onSearchChange,
  iucnFilter,
  onIucnFilterChange,
  onReset,
  occurrenceAnimal,
  onClearOccurrences,
  resultCount,
}) {
  return (
    <div className="search-panel">
      <input
        className="search-input"
        type="text"
        placeholder="🔍 Search animals..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select
        className="filter-select"
        value={iucnFilter}
        onChange={(e) => onIucnFilterChange(e.target.value)}
      >
        <option value="">All statuses</option>
        {IUCN_ORDER.map((status) => (
          <option key={status} value={status}>
            {IUCN_LABELS[status]}
          </option>
        ))}
      </select>

      {(search || iucnFilter) && (
        <button className="reset-btn" onClick={onReset}>
          ✕ Reset
        </button>
      )}

      {occurrenceAnimal && (
        <button className="occurrence-active-btn" onClick={onClearOccurrences}>
          ✕ Exit Occurrence View
        </button>
      )}

      <span className="result-count">{resultCount} animals</span>
    </div>
  );
}
