// ---------------------------------------------------------------------------
// analytics.js — derive Crawl Analytics metrics from the staged crawl results.
// Every number here is COMPUTED from the entries array; nothing is hardcoded.
// ---------------------------------------------------------------------------

const avg = (nums) =>
  nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;

function stats(nums) {
  if (!nums.length) return { min: 0, max: 0, avg: 0 };
  return {
    min: Math.min(...nums),
    max: Math.max(...nums),
    avg: avg(nums),
  };
}

/**
 * Compute the analytics dashboard model from staged crawl entries.
 * @param {Array} entries
 */
export function computeAnalytics(entries = []) {
  const total = entries.length;
  const approved = entries.filter((e) => e.status === "approved");
  const rejected = entries.filter((e) => e.status === "rejected");
  const pending = entries.filter((e) => e.status === "pending");
  const duplicates = entries.filter((e) => e.duplicate);
  const relevant = entries.filter((e) => e.relevant);
  const irrelevant = entries.filter((e) => !e.relevant);

  const metadataScores = entries.map((e) => e.scores?.metadata ?? 0);
  const contentScores = entries.map((e) => e.scores?.content ?? 0);
  const totalScores = entries.map((e) => e.scores?.total ?? 0);

  // Classification distribution (high / medium / low quality).
  const classification = { high: 0, medium: 0, low: 0 };
  for (const e of entries) {
    const c = e.classification || "low";
    if (classification[c] != null) classification[c] += 1;
  }

  const relevantYield = total ? Math.round((relevant.length / total) * 100) : 0;

  return {
    totalCrawled: total,
    approved: approved.length,
    rejected: rejected.length,
    pending: pending.length,
    duplicates: duplicates.length,
    relevant: relevant.length,
    irrelevant: irrelevant.length,
    relevantYield, // %
    metadataStats: stats(metadataScores),
    contentStats: stats(contentScores),
    averageQualityScore: avg(totalScores),
    classification,
  };
}

/** Build a downloadable JSON crawl report (metrics + per-entry summary). */
export function buildReport(entries = []) {
  const metrics = computeAnalytics(entries);
  return {
    generatedAt: new Date().toISOString(),
    metrics,
    entries: entries.map((e) => ({
      url: e.url,
      name: e.animal?.name || e.title,
      status: e.status,
      relevant: e.relevant,
      duplicate: e.duplicate,
      classification: e.classification,
      scores: e.scores,
    })),
  };
}
