// ---------------------------------------------------------------------------
// core.js — transport-agnostic Crawl & Review logic. Each handler takes plain
// JS args and returns { status, body }. Both the Vite dev middleware
// (crawlerPlugin.js) and the production Express server (server/index.js) call
// these, so crawl/score/merge behaviour is identical in dev and prod.
// ---------------------------------------------------------------------------

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { CRAWLED_FILE, ANIMALS_FILE, DATA_DIR } from "./config.js";
import { extractFromHtml } from "./lib/extract.js";
import {
  scorePage,
  classify,
  isRelevant,
  isExcludedUrl,
  normalizeUrl,
  contentFingerprint,
  detectIucnStatus,
} from "./lib/score.js";
import {
  buildAnimalDraft,
  validateAnimal,
  toAnimalRecord,
} from "./lib/transform.js";

// ---- file helpers ---------------------------------------------------------

async function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    const raw = await readFile(file, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

let idCounter = 0;
function makeId() {
  idCounter += 1;
  return `c_${Date.now().toString(36)}_${idCounter}`;
}

// ---- crawler --------------------------------------------------------------

async function fetchHtml(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "AnimalDiaryCrawler/1.0 (+demo)" },
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function crawl({ seedUrl, maxDepth, maxPages }, seenUrls, seenPrints) {
  const results = [];
  const queue = [{ url: seedUrl, depth: 0 }];
  const visited = new Set();
  let fetched = 0;

  while (queue.length && results.length < maxPages) {
    const { url, depth } = queue.shift();
    const norm = normalizeUrl(url);
    if (visited.has(norm)) continue;
    visited.add(norm);
    if (isExcludedUrl(url)) continue;

    const html = await fetchHtml(url);
    fetched += 1;
    if (!html) continue;

    const extracted = extractFromHtml(html, url);

    if (depth < maxDepth) {
      for (const link of extracted.links) {
        const ln = normalizeUrl(link);
        if (!visited.has(ln) && !isExcludedUrl(link)) {
          queue.push({ url: link, depth: depth + 1 });
        }
      }
    }

    const relevant = isRelevant(extracted);
    const scores = scorePage(extracted, url);
    const fingerprint = contentFingerprint(extracted.bodyText);
    const duplicate = seenUrls.has(norm) || seenPrints.has(fingerprint);
    seenUrls.add(norm);
    if (fingerprint) seenPrints.add(fingerprint);

    const detectedIucn = detectIucnStatus(`${extracted.title} ${extracted.bodyText}`);
    const animal = buildAnimalDraft(extracted, detectedIucn);
    const { ok } = validateAnimal(animal);

    results.push({
      id: makeId(),
      url,
      normalizedUrl: norm,
      title: extracted.title,
      metaDescription: extracted.metaDescription,
      h1: extracted.h1,
      headings: extracted.headings.slice(0, 10),
      bodySnippet: extracted.bodySnippet,
      imageCount: extracted.imageCount,
      internalLinks: extracted.internalLinks,
      depth,
      timestamp: new Date().toISOString(),
      relevant,
      duplicate,
      fingerprint,
      scores,
      classification: classify(scores.total),
      status: "pending",
      needsManualCompletion: !ok,
      animal,
    });
  }

  return { results, fetched };
}

// ---- handlers (return { status, body }) -----------------------------------

export async function handleCrawl(body = {}) {
  const seedUrl = String(body.seedUrl || "").trim();
  const maxDepth = Math.max(0, Math.min(4, Number(body.maxDepth) || 1));
  const maxPages = Math.max(1, Math.min(40, Number(body.maxPages) || 10));
  if (!/^https?:\/\//i.test(seedUrl)) {
    return { status: 400, body: { error: "A valid http(s) seed URL is required." } };
  }

  const existing = await readJson(CRAWLED_FILE, []);
  const seenUrls = new Set(existing.map((e) => e.normalizedUrl));
  const seenPrints = new Set(existing.map((e) => e.fingerprint).filter(Boolean));

  const { results, fetched } = await crawl({ seedUrl, maxDepth, maxPages }, seenUrls, seenPrints);
  const kept = results.filter((r) => r.relevant);
  const merged = [...existing, ...kept];
  await writeJson(CRAWLED_FILE, merged);

  return {
    status: 200,
    body: {
      fetched,
      found: results.length,
      kept: kept.length,
      skippedIrrelevant: results.length - kept.length,
      entries: merged,
    },
  };
}

export async function handleGetCrawled() {
  const entries = await readJson(CRAWLED_FILE, []);
  return { status: 200, body: { entries } };
}

export async function handleUpdateDraft(id, body = {}) {
  const entries = await readJson(CRAWLED_FILE, []);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return { status: 404, body: { error: "Entry not found." } };

  entries[idx].animal = { ...entries[idx].animal, ...(body.animal || {}) };
  entries[idx].needsManualCompletion = !validateAnimal(entries[idx].animal).ok;
  await writeJson(CRAWLED_FILE, entries);
  return { status: 200, body: { entry: entries[idx] } };
}

export async function handleReview(body = {}) {
  const { id, action } = body;
  const entries = await readJson(CRAWLED_FILE, []);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return { status: 404, body: { error: "Entry not found." } };
  const entry = entries[idx];

  if (action === "reject") {
    entry.status = "rejected";
    await writeJson(CRAWLED_FILE, entries);
    return { status: 200, body: { entry } };
  }

  if (action === "approve") {
    if (body.animal) entry.animal = { ...entry.animal, ...body.animal };

    const { ok, missing } = validateAnimal(entry.animal);
    if (!ok) {
      entry.needsManualCompletion = true;
      await writeJson(CRAWLED_FILE, entries);
      return {
        status: 422,
        body: { error: "Manual completion required before approval.", missing, entry },
      };
    }

    const animals = await readJson(ANIMALS_FILE, []);
    const record = toAnimalRecord(entry.animal);
    const dupName = animals.some(
      (a) => a.name.toLowerCase() === record.name.toLowerCase()
    );
    if (!dupName) {
      animals.push(record);
      await writeJson(ANIMALS_FILE, animals);
    }

    entry.status = "approved";
    entry.needsManualCompletion = false;
    entry.mergedToGlobe = !dupName;
    entry.mergedDuplicateName = dupName;
    await writeJson(CRAWLED_FILE, entries);
    return {
      status: 200,
      body: { entry, mergedToGlobe: !dupName, duplicateName: dupName },
    };
  }

  return { status: 400, body: { error: "Unknown action." } };
}

// Re-export config paths so the server can serve the raw JSON files.
export { CRAWLED_FILE, ANIMALS_FILE, DATA_DIR };
