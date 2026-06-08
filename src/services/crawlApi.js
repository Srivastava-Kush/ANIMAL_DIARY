// ---------------------------------------------------------------------------
// crawlApi.js — thin client wrappers around the crawler dev-server endpoints.
// All Crawl & Review network access goes through here.
// ---------------------------------------------------------------------------

// Base URL for the crawler API.
// - Local dev: leave VITE_API_BASE_URL unset -> "" -> same-origin requests hit
//   the Vite dev middleware.
// - Production (Render): set VITE_API_BASE_URL to your API service URL, e.g.
//   https://animal-diary-api.onrender.com
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const api = (path) => `${API_BASE}${path}`;

async function asJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function runCrawl({ seedUrl, maxDepth, maxPages }) {
  return fetch(api("/api/crawl"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seedUrl, maxDepth, maxPages }),
  }).then(asJson);
}

export function getCrawled() {
  return fetch(api("/api/crawled")).then(asJson);
}

export function updateDraft(id, animal) {
  return fetch(api(`/api/crawled/${encodeURIComponent(id)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ animal }),
  }).then(asJson);
}

export function reviewEntry(id, action, animal) {
  return fetch(api("/api/review"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action, animal }),
  }).then(asJson);
}
