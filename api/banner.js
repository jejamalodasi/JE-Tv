import { csvToObjects, handleOptions, sendError, setCommonHeaders } from "./_utils.js";

const CSV_URL =
  process.env.BANNERS_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1391882960&single=true&output=csv";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const response = await fetch(CSV_URL, {
      headers: { "User-Agent": "JE-TV-API/1.0" },
    });
    if (!response.ok) throw new Error(`CSV source returned ${response.status}`);

    const csv = await response.text();
    const data = csvToObjects(csv);

    setCommonHeaders(res, {
      cache: "s-maxage=300, stale-while-revalidate=1800",
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      banners: data,
    });
  } catch {
    return sendError(res, 502, "Unable to load remote data");
  }
}
