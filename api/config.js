import { getSheet, sendJSON } from "./sheet.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return sendJSON(res, 405, {
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const data = await getSheet("config");

    const config = {};

    for (const row of data) {

      const key =
        row.key ??
        row.Key ??
        row.name ??
        row.Name;

      const value =
        row.value ??
        row.Value ??
        row.val ??
        row.Val;

      if (key) {
        config[String(key).trim()] =
          String(value ?? "").trim();
      }
    }

    return sendJSON(res, 200, {
      success: true,
      data,
      config,
      source: "google-sheets",
      auto_sync: true,
      refresh_interval_ms:
        Number(
          process.env.CLIENT_REFRESH_MS ||
          config.CLIENT_REFRESH_MS ||
          30000
        )
    });

  } catch (error) {

    console.error(error);

    return sendJSON(res, 502, {
      success: false,
      error: "Unable to read Config Google Sheet"
    });
  }
}
