import { getLiveChannels } from "./sheet.js";
import { getQuery, handleOptions, sendError, setCommonHeaders } from "./_utils.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const q = getQuery(req, "q").trim().toLowerCase();
  if (!q) return sendError(res, 400, 'Query parameter "q" is required');

  try {
    const channels = await getLiveChannels();
    const result = channels.filter((item) =>
      [item.Name, item.Group, item.Country, item.Language, item.EPG_ID]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );

    setCommonHeaders(res, { cache: "no-store" });
    return res.status(200).json({
      success: true,
      query: q,
      count: result.length,
      result,
      synced_at: new Date().toISOString(),
    });
  } catch {
    return sendError(res, 502, "Unable to search Google Sheet");
  }
}
