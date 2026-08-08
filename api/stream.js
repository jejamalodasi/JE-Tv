import {
  absoluteUrl,
  getQuery,
  handleOptions,
  sendError,
  setCommonHeaders,
  validHttpUrl
} from "./_utils.js";

import {
  getChannels
} from "./sheet.js";

async function getAllowedHosts() {
  const channels = await getChannels();
  const hosts = new Set();

  for (const channel of channels) {
    const url =
      channel.URL ??
      channel.url ??
      channel.Stream ??
      channel.stream;

    if (!validHttpUrl(url)) continue;

    try {
      hosts.add(new URL(url).hostname);
    } catch {}
  }

  return hosts;
}

function proxyUrl(url) {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

function rewriteManifest(text, baseUrl) {
  const lines = text.split(/\r?\n/);

  return lines
    .map((line) => {
      let result = line;

      result = result.replace(
        /URI="([^"]+)"/gi,
        (match, uri) => {
          const absolute = absoluteUrl(uri, baseUrl);

          if (!absolute) return match;

          return `URI="${proxyUrl(absolute)}"`;
        }
      );

      const trimmed = result.trim();

      if (
        trimmed &&
        !trimmed.startsWith("#")
      ) {
        const absolute = absoluteUrl(
          trimmed,
          baseUrl
        );

        if (absolute) {
          return proxyUrl(absolute);
        }
      }

      return result;
    })
    .join("\n");
}

function isHlsManifest(url, contentType) {
  const type = String(
    contentType || ""
  ).toLowerCase();

  const pathname = new URL(url)
    .pathname
    .toLowerCase();

  return (
    type.includes("mpegurl") ||
    type.includes("m3u8") ||
    pathname.endsWith(".m3u8")
  );
}

async function streamResponse(
  response,
  res
) {
  const contentType =
    response.headers.get("content-type") ||
    "application/octet-stream";

  const contentLength =
    response.headers.get("content-length");

  const contentRange =
    response.headers.get("content-range");

  const acceptRanges =
    response.headers.get("accept-ranges");

  res.statusCode = response.status;

  res.setHeader(
    "Content-Type",
    contentType
  );

  if (contentLength) {
    res.setHeader(
      "Content-Length",
      contentLength
    );
  }

  if (contentRange) {
    res.setHeader(
      "Content-Range",
      contentRange
    );
  }

  if (acceptRanges) {
    res.setHeader(
      "Accept-Ranges",
      acceptRanges
    );
  }

  if (!response.body) {
    return res.end();
  }

  const reader =
    response.body.getReader();

  try {
    while (true) {
      const {
        done,
        value
      } = await reader.read();

      if (done) break;

      if (value) {
        res.write(
          Buffer.from(value)
        );
      }
    }
  } finally {
    reader.releaseLock();
  }

  return res.end();
}

export default async function handler(
  req,
  res
) {
  if (
    handleOptions(req, res)
  ) {
    return;
  }

  if (
    req.method !== "GET" &&
    req.method !== "HEAD"
  ) {
    return sendError(
      res,
      405,
      "Method not allowed"
    );
  }

  const rawUrl =
    getQuery(req, "url");

  if (
    !validHttpUrl(rawUrl)
  ) {
    return sendError(
      res,
      400,
      "A valid stream URL is required"
    );
  }

  try {
    const target =
      new URL(rawUrl);

    const allowedHosts =
      await getAllowedHosts();

    if (
      !allowedHosts.has(
        target.hostname
      )
    ) {
      return sendError(
        res,
        403,
        "Stream host is not approved by the Channels sheet"
      );
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (JE-TV)",
      "Accept":
        "application/vnd.apple.mpegurl,application/x-mpegURL,video/*,*/*"
    };

    if (req.headers.range) {
      headers.Range =
        req.headers.range;
    }

    const response =
      await fetch(
        target.toString(),
        {
          method:
            req.method === "HEAD"
              ? "HEAD"
              : "GET",

          headers,

          redirect:
            "follow",

          cache:
            "no-store"
        }
      );

    if (!response.ok) {
      return sendError(
        res,
        502,
        `Upstream stream returned ${response.status}`
      );
    }

    const finalUrl =
      response.url ||
      target.toString();

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    const manifest =
      isHlsManifest(
        finalUrl,
        contentType
      );

    setCommonHeaders(
      res,
      {
        cache:
          manifest
            ? "no-store"
            : "no-cache"
      }
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    if (manifest) {
      const text =
        await response.text();

      const rewritten =
        rewriteManifest(
          text,
          finalUrl
        );

      res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl"
      );

      res.setHeader(
        "Cache-Control",
        "no-store, max-age=0"
      );

      return res
        .status(200)
        .send(rewritten);
    }

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    return streamResponse(
      response,
      res
    );

  } catch (error) {
    console.error(
      "JE TV stream proxy error:",
      error
    );

    return sendError(
      res,
      502,
      "Unable to proxy stream"
    );
  }
}
