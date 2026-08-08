import { getChannels } from "./sheet.js";

function clean(value) {
  return String(value || "")
    .replace(/"/g, "'")
    .replace(/\r?\n/g, " ");
}

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  try {

    const channels = await getChannels();

    let m3u = "#EXTM3U\n";

    for (const channel of channels) {

      m3u +=
        `#EXTINF:-1 ` +
        `tvg-id="${clean(channel.EPG_ID)}" ` +
        `tvg-name="${clean(channel.Name)}" ` +
        `tvg-logo="${clean(channel.Logo)}" ` +
        `group-title="${clean(channel.Group)}",` +
        `${clean(channel.Name)}\n`;

      m3u += `${channel.URL}\n`;
    }

    res.status(200);

    res.setHeader(
      "Content-Type",
      "application/vnd.apple.mpegurl; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-store, max-age=0"
    );

    res.setHeader(
      "X-Data-Source",
      "google-sheets"
    );

    return res.send(m3u);

  } catch (error) {

    console.error("M3U ERROR:", error);

    return res.status(502).send(
      "# JE TV ERROR: Google Sheets unavailable"
    );
  }
}
