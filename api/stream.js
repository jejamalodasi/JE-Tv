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

  const channels =
    await getChannels();

  const hosts =
    new Set();

  for (
    const channel of channels
  ) {

    const url =
      channel.URL ??
      channel.url ??
      channel.Stream ??
      channel.stream;

    if (
      !validHttpUrl(url)
    ) {
      continue;
    }

    try {

      hosts.add(
        new URL(url).hostname
      );

    } catch {}
  }

  return hosts;
}

function proxyUrl(
  url
) {

  return `/api/stream?url=${
    encodeURIComponent(url)
  }`;
}

function rewriteManifest(
  text,
  baseUrl
) {

  return text
    .split(/\r?\n/)
    .map(line => {

      line =
        line.replace(
          /URI="([^"]+)"/g,
          (
            match,
            uri
          ) => {

            const absolute =
              absoluteUrl(
                uri,
                baseUrl
              );

            return absolute
              ? `URI="${proxyUrl(
                  absolute
                )}"`
              : match;
          }
        );

      if (
        line.trim() &&
        !line
          .trim()
          .startsWith("#")
      ) {

        const absolute =
          absoluteUrl(
            line.trim(),
            baseUrl
          );

        return absolute
          ? proxyUrl(
              absolute
            )
          : line;
      }

      return line;

    })
    .join("\n");
}

export default async function handler(
  req,
  res
) {

  if (
    handleOptions(
      req,
      res
    )
  ) {
    return;
  }

  const rawUrl =
    getQuery(
      req,
      "url"
    );

  if (
    !validHttpUrl(
      rawUrl
    )
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

    const response =
      await fetch(
        target.toString(),
        {

          headers: {

            "User-Agent":
              "JE-TV-Stream-Proxy/3.0",

            Accept:
              "application/vnd.apple.mpegurl,application/x-mpegURL,video/*,*/*"

          },

          redirect:
            "follow",

          cache:
            "no-store"
        }
      );

    if (
      !response.ok
    ) {

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

    const isManifest =
      contentType
        .toLowerCase()
        .includes("mpegurl") ||

      contentType
        .toLowerCase()
        .includes("m3u8") ||

      target.pathname
        .toLowerCase()
        .endsWith(".m3u8");

    setCommonHeaders(
      res,
      {
        cache:
          isManifest
            ? "no-store"
            : "public, max-age=5"
      }
    );

    if (
      isManifest
    ) {

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
        .send(
          rewritten
        );
    }

    const buffer =
      Buffer.from(
        await response.arrayBuffer()
      );

    res.setHeader(
      "Content-Type",
      contentType ||
      "application/octet-stream"
    );

    return res
      .status(200)
      .send(
        buffer
      );

  } catch (error) {

    console.error(
      "Stream proxy error:",
      error
    );

    return sendError(
      res,
      502,
      "Unable to proxy stream"
    );
  }
}
