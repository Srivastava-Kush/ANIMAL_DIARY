// ---------------------------------------------------------------------------
// server/index.js — standalone Crawl & Review API for production (Render Web
// Service). Wraps the shared crawler/core.js handlers with Express + CORS.
//
// Run:   npm run start        (build command: npm install)
// Env:   PORT             (Render sets this automatically)
//        FRONTEND_ORIGIN  (your static-site URL, or "*" for any origin)
//        DATA_DIR         (optional: a Render Disk mount for persistence)
// ---------------------------------------------------------------------------

import express from "express";
import cors from "cors";

import { PORT, FRONTEND_ORIGIN } from "../crawler/config.js";
import {
  handleCrawl,
  handleGetCrawled,
  handleUpdateDraft,
  handleReview,
  ANIMALS_FILE,
  CRAWLED_FILE,
} from "../crawler/core.js";

const app = express();

// CORS — allow the configured frontend origin(s). "*" allows any.
const origins = FRONTEND_ORIGIN === "*" ? "*" : FRONTEND_ORIGIN.split(",").map((s) => s.trim());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "1mb" }));

// Health check (handy for Render).
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Expose the raw data files (exposing animals.json is intentional/allowed).
app.get("/api/data/animals.json", (_req, res) => res.sendFile(ANIMALS_FILE));
app.get("/api/data/animal_crawled.json", (_req, res) => res.sendFile(CRAWLED_FILE));

// Crawl & Review endpoints — delegate to the shared core.
app.post("/api/crawl", async (req, res) => {
  const { status, body } = await handleCrawl(req.body);
  res.status(status).json(body);
});

app.get("/api/crawled", async (_req, res) => {
  const { status, body } = await handleGetCrawled();
  res.status(status).json(body);
});

app.put("/api/crawled/:id", async (req, res) => {
  const { status, body } = await handleUpdateDraft(req.params.id, req.body);
  res.status(status).json(body);
});

app.post("/api/review", async (req, res) => {
  const { status, body } = await handleReview(req.body);
  res.status(status).json(body);
});

app.listen(PORT, () => {
  console.log(`Crawl & Review API listening on :${PORT}`);
});
