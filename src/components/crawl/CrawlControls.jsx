import { useState } from "react";

// Crawl control form: seed URL, max depth, max pages.
export default function CrawlControls({ onCrawl, busy, status }) {
  const [seedUrl, setSeedUrl] = useState("https://en.wikipedia.org/wiki/Wildlife");
  const [maxDepth, setMaxDepth] = useState(1);
  const [maxPages, setMaxPages] = useState(10);

  const submit = (e) => {
    e.preventDefault();
    onCrawl({ seedUrl: seedUrl.trim(), maxDepth: Number(maxDepth), maxPages: Number(maxPages) });
  };

  return (
    <form className="crawl-controls" onSubmit={submit}>
      <div className="cc-field cc-grow">
        <label>Seed URL</label>
        <input
          type="url"
          value={seedUrl}
          onChange={(e) => setSeedUrl(e.target.value)}
          placeholder="https://..."
          required
        />
      </div>
      <div className="cc-field">
        <label>Max depth</label>
        <input
          type="number"
          min="0"
          max="4"
          value={maxDepth}
          onChange={(e) => setMaxDepth(e.target.value)}
        />
      </div>
      <div className="cc-field">
        <label>Max pages</label>
        <input
          type="number"
          min="1"
          max="40"
          value={maxPages}
          onChange={(e) => setMaxPages(e.target.value)}
        />
      </div>
      <button className="cc-btn" type="submit" disabled={busy}>
        {busy ? "Crawling…" : "Start Crawl"}
      </button>
      {status && <span className="cc-status">{status}</span>}
    </form>
  );
}
