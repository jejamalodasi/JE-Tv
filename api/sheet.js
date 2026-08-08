const SHEETS = {
  channels: process.env.CHANNELS_CSV_URL,
  premium: process.env.PREMIUM_CSV_URL,
  config: process.env.CONFIG_CSV_URL,
  banners: process.env.BANNERS_CSV_URL,
  notice: process.env.NOTICE_CSV_URL,
  version: process.env.VERSION_CSV_URL,
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);

      if (row.some(v => String(v).trim() !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  row.push(cell);

  if (row.some(v => String(v).trim() !== "")) {
    rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((header, index) =>
    String(header)
      .replace(/^\uFEFF/, "")
      .trim() || `column_${index + 1}`
  );

  return rows.slice(1).map(values => {
    const item = {};

    headers.forEach((header, index) => {
      item[header] = String(values[index] ?? "").trim();
    });

    return item;
  });
}

export async function getSheet(type) {
  const url = SHEETS[type];

  if (!url) {
    throw new Error(`Missing ${type.toUpperCase()}_CSV_URL`);
  }

  // Cache busting
  const separator = url.includes("?") ? "&" : "?";
  const finalUrl = `${url}${separator}_refresh=${Date.now()}`;

  const response = await fetch(finalUrl, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "text/csv,text/plain,*/*",
      "User-Agent": "JE-TV/Production"
    }
  });

  if (!response.ok) {
    throw new Error(
      `${type} Google Sheet returned HTTP ${response.status}`
    );
  }

  const text = await response.text();

  if (!text.trim()) {
    return [];
  }

  return parseCSV(text);
}

export function normalizeChannel(row) {
  const enabledValue = String(
    row.Enabled ??
    row.enabled ??
    row.Active ??
    row.active ??
    "TRUE"
  ).trim().toLowerCase();

  const enabled = ![
    "false",
    "0",
    "no",
    "off",
    "disabled"
  ].includes(enabledValue);

  return {
    id: String(
      row.ID ??
      row.id ??
      row.Channel_ID ??
      row.Name ??
      row.name ??
      ""
    ).trim(),

    Name: String(
      row.Name ??
      row.name ??
      row.Channel ??
      row.Title ??
      ""
    ).trim(),

    URL: String(
      row.URL ??
      row.url ??
      row.Stream_URL ??
      row.stream_url ??
      ""
    ).trim(),

    Group: String(
      row.Group ??
      row.group ??
      row.Category ??
      row.category ??
      "Other"
    ).trim() || "Other",

    Logo: String(
      row.Logo ??
      row.logo ??
      row.Logo_URL ??
      row.logo_url ??
      ""
    ).trim(),

    EPG_ID: String(
      row.EPG_ID ??
      row.epg_id ??
      row["EPG ID"] ??
      row.tvg_id ??
      ""
    ).trim(),

    Country: String(
      row.Country ??
      row.country ??
      ""
    ).trim(),

    Language: String(
      row.Language ??
      row.language ??
      ""
    ).trim(),

    Enabled: enabled
  };
}

export async function getChannels() {
  const rows = await getSheet("channels");

  return rows
    .map(normalizeChannel)
    .filter(channel =>
      channel.Enabled &&
      channel.Name &&
      channel.URL
    );
}

export function sendJSON(res, status, data) {
  res.status(status);

  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  res.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  res.setHeader(
    "X-Data-Source",
    "google-sheets"
  );

  return res.json(data);
      }
