import { getLiveChannels, getSheetSourceInfo } from "./sheet.js";
import { handleOptions, sendError, setCommonHeaders } from "./_utils.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  try {
    const channels = await getLiveChannels();
    setCommonHeaders(res, { cache: "no-store" });
    res.setHeader("X-Data-Source", "google-sheets");
    return res.status(200).json({
      success: true,
      count: channels.length,
      channels,
      source: getSheetSourceInfo(),
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, 502, "Unable to read Google Sheet");
  }
}
