// ---------------------------------------------------------------------------
// extract.js — lightweight, dependency-free HTML metadata/content extraction.
// Runs server-side (inside the Vite dev middleware) so it can fetch any URL
// without CORS restrictions. Uses regex parsing on purpose to keep the
// subproject simple and free of extra dependencies.
// ---------------------------------------------------------------------------

const decodeEntities = (s = "") =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

const firstMatch = (html, re) => {
  const m = html.match(re);
  return m ? decodeEntities(m[1]) : "";
};

// Strip <script>/<style> and tags to get readable body text.
function stripToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Resolve a possibly-relative href against the page URL.
function absolutize(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Parse a raw HTML document into a structured extraction object.
 * @param {string} html
 * @param {string} pageUrl
 */
export function extractFromHtml(html, pageUrl) {
  const title =
    firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ||
    firstMatch(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);

  const metaDescription =
    firstMatch(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    ) ||
    firstMatch(
      html,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i
    );

  // All heading text (h1-h3), h1 kept separately.
  const headings = [];
  let h1 = "";
  const headingRe = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
  let hm;
  while ((hm = headingRe.exec(html)) !== null) {
    const text = decodeEntities(stripToText(hm[2]));
    if (!text) continue;
    headings.push(text);
    if (!h1 && hm[1].toLowerCase() === "h1") h1 = text;
  }

  const bodyText = stripToText(html);
  const bodySnippet = bodyText.slice(0, 600);

  const imageCount = (html.match(/<img[\s\S]*?>/gi) || []).length;

  // Collect links, split internal vs external relative to the page host.
  const links = [];
  let host = "";
  try {
    host = new URL(pageUrl).host;
  } catch {
    /* ignore */
  }
  let internalLinks = 0;
  const linkRe = /<a[^>]+href=["']([^"'#]+)["'][^>]*>/gi;
  let lm;
  while ((lm = linkRe.exec(html)) !== null) {
    const abs = absolutize(lm[1], pageUrl);
    if (!abs || !/^https?:/i.test(abs)) continue;
    links.push(abs);
    try {
      if (new URL(abs).host === host) internalLinks++;
    } catch {
      /* ignore */
    }
  }

  // Best-effort coordinate extraction (e.g. Wikipedia geo microformats).
  const coords = extractCoords(html);

  return {
    title,
    metaDescription,
    h1,
    headings,
    bodyText,
    bodySnippet,
    imageCount,
    internalLinks,
    links,
    coords, // {lat, lon} | null
  };
}

// Try a few common coordinate encodings; return null if none found.
function extractCoords(html) {
  // Wikipedia: <span class="geo">-30.5; 22.9</span>
  let m = html.match(/class=["']geo["'][^>]*>\s*(-?\d{1,3}(?:\.\d+)?)\s*;\s*(-?\d{1,3}(?:\.\d+)?)/i);
  if (m) return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };

  // Meta geo.position content="lat;lon"
  m = html.match(/name=["']geo\.position["'][^>]+content=["'](-?\d{1,3}(?:\.\d+)?)\s*[;,]\s*(-?\d{1,3}(?:\.\d+)?)/i);
  if (m) return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };

  // Generic "latitude": x ... "longitude": y in JSON-LD
  const latM = html.match(/"latitude"\s*:\s*"?(-?\d{1,3}(?:\.\d+)?)/i);
  const lonM = html.match(/"longitude"\s*:\s*"?(-?\d{1,3}(?:\.\d+)?)/i);
  if (latM && lonM) return { lat: parseFloat(latM[1]), lon: parseFloat(lonM[1]) };

  return null;
}

export { stripToText, decodeEntities };
