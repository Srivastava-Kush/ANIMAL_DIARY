// ---------------------------------------------------------------------------
// config.js — single source of truth for crawler file paths / runtime config.
// All values are env-driven with sensible defaults so the same code runs
// locally (Vite dev middleware) and on Render (standalone API server).
// ---------------------------------------------------------------------------

import path from "node:path";

// DATA_DIR lets you point the API at a persistent Render Disk in production.
// Defaults to the repo's src/data so local dev "just works".
export const DATA_DIR =
  process.env.DATA_DIR || path.resolve(process.cwd(), "src", "data");

export const CRAWLED_FILE = path.join(DATA_DIR, "animal_crawled.json");
export const ANIMALS_FILE = path.join(DATA_DIR, "animals.json");

// API server port (Render injects PORT automatically).
export const PORT = Number(process.env.PORT) || 8787;

// Allowed browser origin(s) for CORS. Comma-separated, or "*" for any.
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
