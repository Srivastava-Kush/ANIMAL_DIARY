// ---------------------------------------------------------------------------
// score.js — rule-based quality scoring, relevance filtering, and duplicate
// detection for crawled pages. Every score is 0..100. Kept deliberately
// simple and transparent so results are explainable in the demo UI.
// ---------------------------------------------------------------------------

// Keywords that signal an animal / wildlife page. Used as a regex filter.
const RELEVANCE_KEYWORDS = [
  "animal", "animals", "wildlife", "species", "mammal", "bird", "reptile",
  "amphibian", "fish", "insect", "habitat", "endangered", "conservation",
  "predator", "prey", "fauna", "zoo", "biodiversity", "ecosystem",
  "carnivore", "herbivore", "nocturnal", "iucn", "extinct", "creature",
];
const RELEVANCE_RE = new RegExp(`\\b(${RELEVANCE_KEYWORDS.join("|")})\\b`, "gi");

// Pages we never want (login, search, category index, etc.).
const EXCLUDE_RE =
  /\b(login|sign\s?in|register|cart|checkout|privacy|cookie\s?policy|terms\s+of\s+service|advertis)/i;
const EXCLUDE_URL_RE =
  /(\/login|\/signin|\/cart|\/checkout|\/tag\/|\/category\/|\?replytocom=|\/wp-admin|\.(?:pdf|zip|jpg|png|gif|mp4)(?:$|\?))/i;

const IUCN_STATUSES = [
  "critically endangered",
  "endangered",
  "vulnerable",
  "near threatened",
  "least concern",
];

/** Normalize a URL for duplicate detection (drop hash, query, trailing slash). */
export function normalizeUrl(url) {
  try {
    const u = new URL(url);
    let path = u.pathname.replace(/\/+$/, "");
    return (u.host + path).toLowerCase();
  } catch {
    return (url || "").toLowerCase();
  }
}

/** Cheap content fingerprint for near-duplicate detection. */
export function contentFingerprint(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .slice(0, 40)
    .join(" ");
}

/** Decide whether a page is animal/wildlife relevant. */
export function isRelevant(extracted) {
  const haystack = `${extracted.title} ${extracted.metaDescription} ${extracted.bodySnippet}`;
  if (EXCLUDE_RE.test(haystack)) return false;
  const matches = haystack.match(RELEVANCE_RE);
  return !!matches && matches.length >= 2; // need a couple of signals
}

export function isExcludedUrl(url) {
  return EXCLUDE_URL_RE.test(url || "");
}

// --- individual score dimensions (each 0..100) ----------------------------

function scoreMetadata(e) {
  let s = 0;
  if (e.title) s += Math.min(30, e.title.length > 10 ? 30 : 15);
  if (e.metaDescription) s += Math.min(35, e.metaDescription.length > 50 ? 35 : 18);
  if (e.h1) s += 20;
  if (e.headings.length >= 3) s += 15;
  else if (e.headings.length > 0) s += 7;
  return Math.min(100, s);
}

function scoreContent(e) {
  let s = 0;
  const len = e.bodyText.length;
  if (len > 2000) s += 45;
  else if (len > 800) s += 30;
  else if (len > 200) s += 15;
  if (e.imageCount >= 3) s += 25;
  else if (e.imageCount > 0) s += 12;
  if (e.headings.length >= 2) s += 15;
  if (e.metaDescription) s += 15;
  return Math.min(100, s);
}

function scoreUrl(url) {
  let s = 60;
  try {
    const u = new URL(url);
    if (u.protocol === "https:") s += 15;
    const depth = u.pathname.split("/").filter(Boolean).length;
    if (depth <= 3) s += 15;
    else if (depth <= 5) s += 5;
    else s -= 10;
    if (/[?&]/.test(url)) s -= 10; // query-heavy URLs are lower quality
    if (u.pathname.length > 100) s -= 10;
  } catch {
    s = 30;
  }
  return Math.max(0, Math.min(100, s));
}

function scoreRelevance(e) {
  const haystack =
    `${e.title} ${e.metaDescription} ${e.bodyText}`.toLowerCase();
  const matches = haystack.match(RELEVANCE_RE) || [];
  // unique keyword variety + raw frequency, capped.
  const unique = new Set(matches.map((m) => m.toLowerCase())).size;
  return Math.min(100, unique * 12 + Math.min(40, matches.length * 2));
}

/**
 * Compute all scores for an extracted page.
 * @returns {{metadata,content,url,relevance,total}}
 */
export function scorePage(extracted, url) {
  const metadata = scoreMetadata(extracted);
  const content = scoreContent(extracted);
  const urlScore = scoreUrl(url);
  const relevance = scoreRelevance(extracted);
  // Weighted blend — relevance & content matter most for this dataset.
  const total = Math.round(
    metadata * 0.25 + content * 0.3 + urlScore * 0.15 + relevance * 0.3
  );
  return { metadata, content, url: urlScore, relevance, total };
}

/** Simple quality classification from the total score. */
export function classify(total) {
  if (total >= 75) return "high";
  if (total >= 50) return "medium";
  return "low";
}

/** Best-effort IUCN status detection from page text. */
export function detectIucnStatus(text = "") {
  const lower = text.toLowerCase();
  for (const status of IUCN_STATUSES) {
    if (lower.includes(status)) return status;
  }
  return null;
}

export { IUCN_STATUSES, RELEVANCE_KEYWORDS };
