// Top-line counters for crawled / pending / approved / rejected / duplicates.
export default function Counters({ a }) {
  const items = [
    { label: "Crawled", value: a.totalCrawled, cls: "cnt-crawled" },
    { label: "Pending", value: a.pending, cls: "cnt-pending" },
    { label: "Approved", value: a.approved, cls: "cnt-approved" },
    { label: "Rejected", value: a.rejected, cls: "cnt-rejected" },
    { label: "Duplicates", value: a.duplicates, cls: "cnt-dup" },
  ];
  return (
    <div className="counters">
      {items.map((it) => (
        <div key={it.label} className={`counter ${it.cls}`}>
          <span className="counter-value">{it.value}</span>
          <span className="counter-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
