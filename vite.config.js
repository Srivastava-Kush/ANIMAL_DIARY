import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Crawl & Review subproject backend (dev-server middleware).
import crawlerPlugin from "./crawler/crawlerPlugin.js";

export default defineConfig({
  plugins: [react(), crawlerPlugin()],
});
