import { getLiveSheetRows } from "./sheet.js";
import { handleOptions, sendError, setCommonHeaders } from "./_utils.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const secret = process.env.SHEET_SYNC_SECRET;
  const provided = req.headers["x-sheet-sync-secret"] || req.query?.secret;

  if (secret && provided !== secret) {
    return sendError(res, 401, "Invalid sync secret");
  }

  try {
    const rows = await getLiveSheetRows({ force: true });
    setCommonHeaders(res, { cache: "no-store" });
    return res.status(200).json({
      success: true,
      rows: rows.length,
      synced_at: new Date().toISOString(),
      message: "Google Sheet cache refreshed",
    });
  } catch {
    return sendError(res, 502, "Google Sheet sync failed");
  }
}
