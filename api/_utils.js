export function setCommonHeaders(res, { cache = "no-store" } = {}) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", cache);
  res.setHeader("X-Content-Type-Options", "nosniff");
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    setCommonHeaders(res);
    res.status(204).end();
    return true;
  }
  return false;
}

export function sendError(res, status, message) {
  setCommonHeaders(res);
  return res.status(status).json({
    success: false,
    error: message,
  });
}

export function parseCsvLine(line) {
  const out = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && quoted && next === '"') {
      value += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(value.trim());
      value = "";
    } else {
      value += ch;
    }
  }

  out.push(value.trim());
  return out;
}

export function csvToObjects(csv) {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, i) => [header, values[i] || ""])
    );
  });
}

export function getQuery(req, key, fallback = "") {
  const value = req.query?.[key];
  return Array.isArray(value) ? value[0] : (value ?? fallback);
}

export function validHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function absoluteUrl(value, base) {
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}
