import { handleOptions, setCommonHeaders } from "./_utils.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  setCommonHeaders(res, { cache: "no-store" });
  return res.status(200).json({
    success: true,
    app_name: process.env.APP_NAME || "JE TV",
    app_version: process.env.APP_VERSION || "2.0.0",
    maintenance: process.env.MAINTENANCE === "true",
    force_update: process.env.FORCE_UPDATE === "true",
    data_source: "google_sheets",
    auto_sync: true,
    refresh_interval_ms: Number(process.env.CLIENT_REFRESH_MS || 30000),
    playlist_url: "/api/playlist",
    m3u_url: "/api/m3u",
    epg_url: "/api/epg",
    status_url: "/api/status",
  });
}
