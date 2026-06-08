// List of staged crawl entries. Defaults to showing pending items (the review
// queue) but the parent can pass any filtered list.
export default function EntryList({ entries, onSelect, onApprove, onReject, busyId }) {
  if (!entries.length) {
    return <p className="entry-empty">No entries to review. Start a crawl above.</p>;
  }

  return (
    <ul className="entry-list">
      {entries.map((e) => {
        const total = e.scores?.total ?? 0;
        return (
          <li key={e.id} className={`entry-row status-${e.status}`}>
            <button className="entry-main" onClick={() => onSelect(e)} title="View details">
              <div className="entry-title-row">
                <span className="entry-name">{e.animal?.name || e.title || "(untitled)"}</span>
                {e.duplicate && <span className="badge badge-dup">DUPLICATE</span>}
                {e.needsManualCompletion && (
                  <span className="badge badge-incomplete">NEEDS INFO</span>
                )}
                <span className={`badge badge-class-${e.classification}`}>{e.classification}</span>
              </div>
              <a
                className="entry-url"
                href={e.url}
                target="_blank"
                rel="noreferrer"
                onClick={(ev) => ev.stopPropagation()}
              >
                {e.url}
              </a>
              <div className="entry-scores">
                <span>meta {e.scores?.metadata ?? 0}</span>
                <span>content {e.scores?.content ?? 0}</span>
                <span className="entry-total">total {total}</span>
              </div>
            </button>
            <div className="entry-actions">
              <button
                className="btn-approve"
                disabled={busyId === e.id}
                onClick={() => onApprove(e)}
              >
                Approve
              </button>
              <button
                className="btn-reject"
                disabled={busyId === e.id}
                onClick={() => onReject(e)}
              >
                Reject
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
