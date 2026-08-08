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

  const query = String(
    req.query?.q || ""
  ).trim().toLowerCase();

  if (!query) {
    return sendJSON(res, 400, {
      success: false,
      error: "Query parameter q is required"
    });
  }

  try {

    const channels = await getChannels();

    const result = channels.filter(channel => {

      const fields = [
        channel.Name,
        channel.Group,
        channel.Country,
        channel.Language,
        channel.EPG_ID
      ];

      return fields.some(value =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });

    return sendJSON(res, 200, {
      success: true,
      query,
      count: result.length,
      result,
      source: "google-sheets"
    });

  } catch (error) {

    console.error("SEARCH ERROR:", error);

    return sendJSON(res, 502, {
      success: false,
      error: "Unable to read Channels Google Sheet"
    });
  }
}
