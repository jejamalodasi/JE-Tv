import { handleOptions, setCommonHeaders } from "./_utils.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  setCommonHeaders(res, { cache: "no-store" });
  return res.status(200).json({
    success: true,
    service: "JE TV API",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
