import {
  absoluteUrl,
  getQuery,
  handleOptions,
  sendError,
  setCommonHeaders,
  validHttpUrl,
} from "./_utils.js";

const PLAYLIST_URL =
  process.env.PLAYLIST_URL ||
  "https://raw.githubusercontent.com/jejamalodasi/JE-Tv/main/playlist.json";

async function getAllowedHosts() {
  const response = await fetch(PLAYLIST_URL);
  if (!response.ok) throw new Error("Playlist unavailable");

  const data = await response.json();
  const channels = Array.isArray(data) ? data : (data.channels || []);

  return new Set(
    channels
      .map((channel) => channel.URL)
      .filter(validHttpUrl)
      .map((url) => new URL(url).hostname)
  );
}

function proxyUrl(url) {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

function rewriteManifest(text, baseUrl) {
  const lines = text.split(/\r?\n/);

  return lines
    .map((line) => {
      // Rewrite URI="..." attributes used by EXT-X-KEY, EXT-X-MEDIA, etc.
      line = line.replace(/URI="([^"]+)"/g, (match, uri) => {
        const absolute = absoluteUrl(uri, baseUrl);
        return absolute ? `URI="${proxyUrl(absolute)}"` : match;
      });

      // Rewrite media/segment lines.
      if (line && !line.startsWith("#")) {
        const absolute = absoluteUrl(line.trim(), baseUrl);
        return absolute ? proxyUrl(absolute) : line;
      }

      return line;
    })
    .join("\n");
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const rawUrl = getQuery(req, "url");
  if (!validHttpUrl(rawUrl)) {
    return sendError(res, 400, "A valid http/https stream URL is required");
  }

  try {
    const target = new URL(rawUrl);
    const allowedHosts = await getAllowedHosts();

    if (!allowedHosts.has(target.hostname)) {
      return sendError(res, 403, "Stream host is not in the approved playlist");
    }

    const response = await fetch(target.toString(), {
      headers: {
        "User-Agent": "JE-TV-Stream-Proxy/1.0",
        Accept: "*/*",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return sendError(res, 502, `Upstream stream returned ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const isManifest =
      contentType.includes("mpegurl") ||
      target.pathname.endsWith(".m3u8");

    setCommonHeaders(res, {
      cache: isManifest ? "no-store" : "public, max-age=30",
    });

    res.setHeader(
      "Content-Type",
      isManifest ? "application/vnd.apple.mpegurl" : contentType || "application/octet-stream"
    );

    if (isManifest) {
      const text = await response.text();
      return res.status(200).send(rewriteManifest(text, response.url || target.toString()));
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (error) {
    return sendError(res, 502, "Unable to proxy stream");
  }
}
