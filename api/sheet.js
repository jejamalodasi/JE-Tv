import { csvToObjects } from "./_utils.js";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const SHEET_GID = process.env.GOOGLE_SHEET_GID || "0";
const PUBLIC_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL || "";
const CACHE_MS = Number(process.env.SHEET_CACHE_MS || 15000);

let memoryCache = { at: 0, rows: null };

function sourceUrl() {
  if (PUBLIC_CSV_URL) return PUBLIC_CSV_URL;
  if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID or GOOGLE_SHEET_CSV_URL is required");
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${encodeURIComponent(SHEET_GID)}`;
}

export async function getLiveSheetRows({ force = false } = {}) {
  const now = Date.now();

  if (!force && memoryCache.rows && now - memoryCache.at < CACHE_MS) {
    return memoryCache.rows;
  }

  const response = await fetch(sourceUrl(), {
    cache: "no-store",
    headers: { "User-Agent": "JE-TV-Live-Sheet-Sync/2.0" },
  });

  if (!response.ok) {
    throw new Error(`Google Sheet returned ${response.status}`);
  }

  const rows = csvToObjects(await response.text());
  memoryCache = { at: now, rows };
  return rows;
}

export function normalizeChannel(row) {
  return {
    id: String(row.ID || row.id || row.Name || row.name || "").trim(),
    Name: String(row.Name || row.name || "").trim(),
    URL: String(row.URL || row.url || "").trim(),
    Group: String(row.Group || row.group || "Other").trim() || "Other",
    Logo: String(row.Logo || row.logo || "").trim(),
    EPG_ID: String(row.EPG_ID || row.epg_id || row["EPG ID"] || "").trim(),
    Country: String(row.Country || row.country || "").trim(),
    Language: String(row.Language || row.language || "").trim(),
    Enabled: String(row.Enabled ?? row.enabled ?? "TRUE").toLowerCase() !== "false",
  };
}

export async function getLiveChannels(options = {}) {
  const rows = await getLiveSheetRows(options);
  return rows.map(normalizeChannel).filter((c) => c.Enabled && c.Name && c.URL);
}

export function getSheetSourceInfo() {
  return {
    source: "google_sheets",
    gid: SHEET_GID,
    cache_ms: CACHE_MS,
  };
}
