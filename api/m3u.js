import { getLiveChannels } from "./sheet.js";
import { handleOptions, sendError } from "./_utils.js";

function safe(value = "") {
  return String(value).replace(/"/g, "'");
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const channels = await getLiveChannels();
    let m3u = "#EXTM3U\n";

    for (const c of channels) {
      m3u += `#EXTINF:-1 tvg-id="${safe(c.EPG_ID)}" tvg-name="${safe(c.Name)}" tvg-logo="${safe(c.Logo)}" group-title="${safe(c.Group)}",${safe(c.Name)}\n`;
      m3u += `${c.URL}\n`;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Data-Source", "google-sheets");
    return res.send(m3u);
  } catch {
    return sendError(res, 502, "Unable to generate live M3U");
  }
}
