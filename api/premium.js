import crypto from "node:crypto";
import { csvToObjects, getQuery, handleOptions, sendError, setCommonHeaders } from "./_utils.js";

const CSV_URL =
  process.env.PREMIUM_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1507668387&single=true&output=csv";

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const supplied = getQuery(req, "password");
  const expectedHash = process.env.PREMIUM_PASSWORD_HASH;

  // Backward-compatible fallback for the existing Google Sheet flow.
  // For production, set PREMIUM_PASSWORD_HASH and remove Password values from public sheets.
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error("Premium source unavailable");

    const rows = csvToObjects(await response.text());

    let access = [];
    if (expectedHash) {
      const suppliedHash = hash(supplied);
      access = supplied && suppliedHash === expectedHash
        ? rows
        : [];
    } else {
      access = rows.filter((item) => item.Password === supplied);
    }

    setCommonHeaders(res, { cache: "no-store" });

    if (!access.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.status(200).json({
      success: true,
      count: access.length,
      channels: access,
    });
  } catch {
    return sendError(res, 502, "Unable to load premium content");
  }
}
