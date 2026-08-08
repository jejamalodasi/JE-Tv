import { getSheet, sendJSON } from "./sheet.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return sendJSON(res, 405, {
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const data = await getSheet("banners");

    return sendJSON(res, 200, {
      success: true,
      count: data.length,
      data,
      source: "google-sheets"
    });

  } catch (error) {

    console.error(error);

    return sendJSON(res, 502, {
      success: false,
      error: "Unable to read Banners Google Sheet"
    });
  }
}
