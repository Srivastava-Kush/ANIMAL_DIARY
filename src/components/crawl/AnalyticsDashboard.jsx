import { buildReport } from "../../utils/analytics";

// Crawl Analytics dashboard — all metrics are computed from the entries array
// (see utils/analytics.js). Includes simple CSS bar charts and report export.
export default function AnalyticsDashboard({ analytics, entries }) {
  const a = analytics;

  const exportReport = () => {
    const report = buildReport(entries);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crawl-report-${report.generatedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusData = [
    { label: "Pending", value: a.pending, color: "#1976d2" },
    { label: "Approved", value: a.approved, color: "#388e3c" },
    { label: "Rejected", value: a.rejected, color: "#d32f2f" },
  ];
  const classData = [
    { label: "High", value: a.classification.high, color: "#388e3c" },
    { label: "Medium", value: a.classification.medium, color: "#fbc02d" },
    { label: "Low", value: a.classification.low, color: "#d32f2f" },
  ];

  return (
    <section className="analytics">
      <div className="analytics-head">
        <h2>Crawl Analytics</h2>
        <button className="cc-btn" onClick={exportReport} disabled={!entries.length}>
          ⭳ Export Report
        </button>
      </div>

      <div className="metric-grid">
        <Metric label="Total Crawled" value={a.totalCrawled} />
        <Metric label="Approved" value={a.approved} />
        <Metric label="Rejected" value={a.rejected} />
        <Metric label="Duplicates" value={a.duplicates} />
        <Metric label="Relevant Pages" value={a.relevant} />
        <Metric label="Irrelevant Pages" value={a.irrelevant} />
        <Metric label="Relevant Yield" value={`${a.relevantYield}%`} />
        <Metric label="Avg Quality" value={a.averageQualityScore} />
      </div>

      <div className="chart-row">
        <BarChart title="Review Status" data={statusData} />
        <BarChart title="Quality Classification" data={classData} />
      </div>

      <div className="stat-row">
        <StatBlock title="Metadata Quality" stat={a.metadataStats} />
        <StatBlock title="Content Quality" stat={a.contentStats} />
        <YieldBlock relevant={a.relevant} irrelevant={a.irrelevant} yieldPct={a.relevantYield} />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}

function BarChart({ title, data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="chart">
      <h3>{title}</h3>
      <div className="bars">
        {data.map((d) => (
          <div key={d.label} className="bar-item">
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ height: `${(d.value / max) * 100}%`, background: d.color }}
              />
            </div>
            <span className="bar-value">{d.value}</span>
            <span className="bar-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBlock({ title, stat }) {
  return (
    <div className="stat-block">
      <h3>{title}</h3>
      <div className="stat-line"><span>Min</span><b>{stat.min}</b></div>
      <div className="stat-line"><span>Avg</span><b>{stat.avg}</b></div>
      <div className="stat-line"><span>Max</span><b>{stat.max}</b></div>
    </div>
  );
}

function YieldBlock({ relevant, irrelevant, yieldPct }) {
  return (
    <div className="stat-block">
      <h3>Relevant vs Irrelevant</h3>
      <div className="stat-line"><span>Relevant</span><b>{relevant}</b></div>
      <div className="stat-line"><span>Irrelevant</span><b>{irrelevant}</b></div>
      <div className="yield-bar">
        <div className="yield-fill" style={{ width: `${yieldPct}%` }} />
      </div>
      <div className="stat-line"><span>Yield</span><b>{yieldPct}%</b></div>
    </div>
  );
}
