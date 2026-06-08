// ---------------------------------------------------------------------------
// crawlerPlugin.js — Vite dev-server plugin that exposes the Crawl & Review
// API during local development (`npm run dev`). It is a thin transport layer
// over crawler/core.js; the SAME core powers the production server
// (server/index.js) so dev and prod behave identically.
//
// In production this middleware does NOT run — the deployed Express server
// handles /api/* instead.
// ---------------------------------------------------------------------------

import {
  handleCrawl,
  handleGetCrawled,
  handleUpdateDraft,
  handleReview,
} from "./core.js";

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function send(res, { status, body }) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default function crawlerPlugin() {
  return {
    name: "animal-crawler-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/")) return next();

        try {
          if (url === "/api/crawl" && req.method === "POST") {
            return send(res, await handleCrawl(await readBody(req)));
          }
          if (url === "/api/crawled" && req.method === "GET") {
            return send(res, await handleGetCrawled());
          }
          if (url.startsWith("/api/crawled/") && req.method === "PUT") {
            const id = decodeURIComponent(url.split("/").pop());
            return send(res, await handleUpdateDraft(id, await readBody(req)));
          }
          if (url === "/api/review" && req.method === "POST") {
            return send(res, await handleReview(await readBody(req)));
          }
          return next();
        } catch (err) {
          return send(res, {
            status: 500,
            body: { error: String((err && err.message) || "Server error") },
          });
        }
      });
    },
  };
}
