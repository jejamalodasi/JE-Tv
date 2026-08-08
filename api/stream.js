import {
  absoluteUrl,
  getQuery,
  handleOptions,
  sendError,
  setCommonHeaders,
  validHttpUrl,
} from "./_utils.js";

import { getChannels } from "./sheet.js";

function proxyUrl(url) {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

async function getAllowedHosts() {
  const channels = await getChannels();

  const hosts = new Set();

  for (const channel of channels) {
    if (!validHttpUrl(channel.URL)) continue;

    try {
      hosts.add(new URL(channel.URL).hostname);
    } catch {
      // Ignore invalid URL
    }
  }

  return hosts;
}

function rewriteManifest(text, baseUrl) {
  return text
    .split(/\r?\n/)
    .map((line) => {

      // EXT-X-KEY / EXT-X-MEDIA / EXT-X-MAP etc.
      line = line.replace(
        /URI="([^"]+)"/g,
        (match, uri) => {
          const absolute = absoluteUrl(uri, baseUrl);

          if (!absolute) {
            return match;
          }

          return `URI="${proxyUrl(absolute)}"`;
        }
      );

      // HLS playlist / segment URL
      if (
        line.trim() &&
        !line.startsWith("#")
      ) {
        const absolute = absoluteUrl(
          line.trim(),
          baseUrl
        );

        if (absolute) {
          return proxyUrl(absolute);
        }
      }

      return line;
    })
    .join("\n");
}

export default async function handler(req, res) {

  if (handleOptions(req, res)) {
    return;
  }

  const rawUrl = getQuery(req, "url");

  if (!validHttpUrl(rawUrl)) {
    return sendError(
      res,
      400,
      "A valid http/https stream URL is required"
    );
  }

  try {

    const target = new URL(rawUrl);

    /*
     * IMPORTANT:
     * Approved hosts now come directly from
     * Google Sheets Channels data.
     */
    const allowedHosts = await getAllowedHosts();

    if (!allowedHosts.has(target.hostname)) {

      return sendError(
        res,
        403,
        "Stream host is not in the approved Google Sheets playlist"
      );
    }

    const response = await fetch(
      target.toString(),
      {
        method: "GET",

        headers: {
          "User-Agent":
            "JE-TV-Stream-Proxy/2.0",

          Accept:
            "application/vnd.apple.mpegurl,application/x-mpegURL,video/*,*/*",
        },

        redirect: "follow",

        cache: "no-store",
      }
    );

    if (!response.ok) {

      return sendError(
        res,
        502,
        `Upstream stream returned ${response.status}`
      );
    }

    /*
     * Use the final URL after redirects as the
     * base URL for relative HLS segments.
     */
    const finalUrl =
      response.url ||
      target.toString();

    const contentType =
      response.headers.get("content-type") || "";

    const isManifest =
      contentType.toLowerCase().includes("mpegurl") ||
      contentType.toLowerCase().includes("vnd.apple.mpegurl") ||
      target.pathname.toLowerCase().endsWith(".m3u8");

    setCommonHeaders(res, {
      cache: isManifest
        ? "no-store"
        : "public, max-age=10",
    });

    /*
     * CORS
     */
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Range,Content-Type,Accept,Origin"
    );

    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length,Content-Range,Accept-Ranges,Content-Type"
    );

    if (isManifest) {

      const text =
        await response.text();

      const rewritten =
        rewriteManifest(
          text,
          finalUrl
        );

      res.status(200);

      res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl"
      );

      res.setHeader(
        "Cache-Control",
        "no-store, max-age=0"
      );

      return res.send(rewritten);
    }

    /*
     * Video segments / TS / AAC / etc.
     */
    const buffer =
      Buffer.from(
        await response.arrayBuffer()
      );

    res.status(200);

    res.setHeader(
      "Content-Type",
      contentType ||
        "application/octet-stream"
    );

    return res.send(buffer);

  } catch (error) {

    console.error(
      "JE TV STREAM ERROR:",
      error
    );

    return sendError(
      res,
      502,
      error.message ||
        "Unable to proxy stream"
    );
  }
}
