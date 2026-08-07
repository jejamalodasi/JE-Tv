import { csvToObjects, handleOptions, sendError, setCommonHeaders } from "./_utils.js";

const CSV_URL =
  process.env.VERSION_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1135955112&single=true&output=csv";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error("Version source unavailable");

    const data = csvToObjects(await response.text());
    const version = data[0] || {};

    setCommonHeaders(res, { cache: "s-maxage=300, stale-while-revalidate=1800" });
    return res.status(200).json({
      success: true,
      ...version,
    });
  } catch {
    return sendError(res, 502, "Unable to load version information");
  }
}
