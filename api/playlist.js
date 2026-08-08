import {
  getChannels,
  sendJSON
} from "./sheet.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return sendJSON(res, 405, {
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const channels = await getChannels();

    return sendJSON(res, 200, {
      success: true,
      count: channels.length,
      channels,
      source: "google-sheets",
      synced_at: new Date().toISOString()
    });

  } catch (error) {

    console.error("CHANNELS SHEET ERROR:", error);

    return sendJSON(res, 502, {
      success: false,
      error: "Unable to read Channels Google Sheet",
      details: error.message
    });
  }
}
