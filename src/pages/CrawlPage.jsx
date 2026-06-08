import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CrawlControls from "../components/crawl/CrawlControls";
import Counters from "../components/crawl/Counters";
import EntryList from "../components/crawl/EntryList";
import EntryDetailModal from "../components/crawl/EntryDetailModal";
import AnalyticsDashboard from "../components/crawl/AnalyticsDashboard";
import { runCrawl, getCrawled, reviewEntry } from "../services/crawlApi";
import { computeAnalytics } from "../utils/analytics";
import "../crawl.css";

// "Crawl & Review" subproject — crawl wildlife pages, review staged entries,
// approve into the globe dataset, and view analytics. Fully separate from the
// globe page; it never touches the live globe rendering.
const TABS = ["Review", "Analytics"];

export default function CrawlPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState("Review");
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const { entries } = await getCrawled();
      setEntries(entries);
    } catch (e) {
      setStatus(`Could not load staged entries: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const analytics = useMemo(() => computeAnalytics(entries), [entries]);

  const handleCrawl = async (params) => {
    setBusy(true);
    setStatus("Crawling… this may take a moment.");
    try {
      const res = await runCrawl(params);
      setEntries(res.entries);
      setStatus(
        `Fetched ${res.fetched} pages · kept ${res.kept} relevant · skipped ${res.skippedIrrelevant} irrelevant.`
      );
    } catch (e) {
      setStatus(`Crawl failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // Approve flow: send to server (validates + merges into animals.json).
  const handleApprove = async (entry, animalOverride) => {
    setBusyId(entry.id);
    try {
      const res = await reviewEntry(entry.id, "approve", animalOverride);
      setStatus(
        res.mergedToGlobe
          ? `Approved "${res.entry.animal.name}" — added to the globe dataset.`
          : `Approved "${res.entry.animal.name}" — already present in globe (name duplicate), not re-added.`
      );
      setSelected(null);
      await load();
    } catch (e) {
      if (e.status === 422) {
        // Needs manual completion — open the modal so the user can fill fields.
        setStatus(`"${entry.animal?.name || entry.title}" needs manual info: ${e.data?.missing?.join(", ")}`);
        setSelected(e.data?.entry || entry);
      } else {
        setStatus(`Approve failed: ${e.message}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (entry) => {
    setBusyId(entry.id);
    try {
      await reviewEntry(entry.id, "reject");
      setStatus(`Rejected "${entry.animal?.name || entry.title}".`);
      setSelected(null);
      await load();
    } catch (e) {
      setStatus(`Reject failed: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const visible = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.status === filter);
  }, [entries, filter]);

  return (
    <div className="crawl-page">
      <header className="crawl-header">
        <div className="crawl-brand">
          <span className="crawl-logo">🕸️</span>
          <h1>Crawl &amp; Review</h1>
          <span className="crawl-sub">Web Quality Analyzer</span>
        </div>
        <button className="crawl-back" onClick={() => navigate("/")}>
          🌍 Back to Globe
        </button>
      </header>

      <CrawlControls onCrawl={handleCrawl} busy={busy} status={status} />

      <Counters a={analytics} />

      <nav className="crawl-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`crawl-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Review" ? (
        <section className="review-section">
          <div className="review-filters">
            {["pending", "approved", "rejected", "all"].map((f) => (
              <button
                key={f}
                className={`filter-chip${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <EntryList
            entries={visible}
            onSelect={setSelected}
            onApprove={handleApprove}
            onReject={handleReject}
            busyId={busyId}
          />
        </section>
      ) : (
        <AnalyticsDashboard analytics={analytics} entries={entries} />
      )}

      {selected && (
        <EntryDetailModal
          entry={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          busy={busyId === selected.id}
        />
      )}
    </div>
  );
}
