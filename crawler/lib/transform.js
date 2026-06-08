// ---------------------------------------------------------------------------
// transform.js — convert a crawled/staged entry into the EXACT shape the
// existing globe expects (see src/data/animals.json), and validate that all
// globe-required fields are present before an entry may be approved.
//
// The original animals.json schema is NEVER modified. We only produce objects
// that conform to it.
// ---------------------------------------------------------------------------

import { IUCN_STATUSES } from "./score.js";

// Fields the globe truly needs to render a usable, non-broken marker.
// (name = React key/search, lat/lon = marker position, iucn_status = colour)
const REQUIRED_FIELDS = ["name", "lat", "lon", "iucn_status"];

/** Derive a clean animal name from a page title. */
export function deriveName(title = "", h1 = "") {
  let name = (h1 || title || "").trim();
  // Drop common "Name - Wikipedia" / "Name | Site" suffixes.
  name = name.split(/\s+[-|–—]\s+/)[0].trim();
  return name.slice(0, 80);
}

/**
 * Build the editable `animal` draft attached to a staged entry. Coordinates
 * and IUCN status are filled only when confidently extracted; otherwise left
 * null so the review UI forces manual completion (requirement #7).
 */
export function buildAnimalDraft(extracted, detectedIucn) {
  return {
    name: deriveName(extracted.title, extracted.h1),
    lat: extracted.coords ? extracted.coords.lat : null,
    lon: extracted.coords ? extracted.coords.lon : null,
    iucn_status: detectedIucn || "",
    img: "",
    country: "",
    habitat: "",
    fun_fact: (extracted.metaDescription || extracted.bodySnippet || "").slice(0, 200),
    sound: "",
    occurrences: [],
  };
}

/**
 * Validate an animal draft against the globe's required fields.
 * @returns {{ok:boolean, missing:string[]}}
 */
export function validateAnimal(animal = {}) {
  const missing = [];
  if (!animal.name || !String(animal.name).trim()) missing.push("name");
  if (animal.lat == null || isNaN(Number(animal.lat))) missing.push("lat");
  if (animal.lon == null || isNaN(Number(animal.lon))) missing.push("lon");
  if (!IUCN_STATUSES.includes(animal.iucn_status)) missing.push("iucn_status");
  return { ok: missing.length === 0, missing };
}

/**
 * Produce the final object inserted into animals.json — coerced to the exact
 * existing schema, with sensible defaults for optional fields.
 */
export function toAnimalRecord(animal) {
  return {
    name: String(animal.name).trim(),
    country: animal.country || "Unknown",
    lat: Number(animal.lat),
    lon: Number(animal.lon),
    iucn_status: animal.iucn_status,
    habitat: animal.habitat || "",
    fun_fact: animal.fun_fact || "",
    img: animal.img || "",
    sound: animal.sound || "",
    occurrences: Array.isArray(animal.occurrences) ? animal.occurrences : [],
  };
}

export { REQUIRED_FIELDS };
