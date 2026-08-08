export function getQuery(req, key) {

  const value =
    req.query?.[key];

  return Array.isArray(value)
    ? value[0]
    : value;
}

export function validHttpUrl(value) {

  try {

    const url =
      new URL(
        String(value)
      );

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );

  } catch {

    return false;
  }
}

export function absoluteUrl(
  value,
  base
) {

  try {

    return new URL(
      value,
      base
    ).toString();

  } catch {

    return null;
  }
}

export function handleOptions(
  req,
  res
) {

  if (
    req.method ===
    "OPTIONS"
  ) {

    res
      .status(204)
      .end();

    return true;
  }

  return false;
}

export function setCommonHeaders(
  res,
  options = {}
) {

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
    "Origin,Accept,Content-Type,Range"
  );

  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length,Content-Range,Accept-Ranges,Content-Type"
  );

  if (options.cache) {

    res.setHeader(
      "Cache-Control",
      options.cache
    );
  }
}

export function sendError(
  res,
  status,
  message
) {

  setCommonHeaders(
    res,
    {
      cache: "no-store"
    }
  );

  return res
    .status(status)
    .json({
      success: false,
      error: message
    });
}

export async function fetchCsv(
  url
) {

  const response =
    await fetch(
      url,
      {
        cache: "no-store",

        headers: {
          Accept:
            "text/csv,text/plain,*/*"
        }
      }
    );

  if (!response.ok) {

    throw new Error(
      `Google Sheet returned ${response.status}`
    );
  }

  return response.text();
}

export function parseCsv(
  text
) {

  const rows = [];

  let row = [];

  let cell = "";

  let quoted = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const ch =
      text[i];

    const next =
      text[i + 1];

    if (
      ch === '"' &&
      quoted &&
      next === '"'
    ) {

      cell += '"';

      i++;

      continue;
    }

    if (
      ch === '"'
    ) {

      quoted =
        !quoted;

      continue;
    }

    if (
      ch === "," &&
      !quoted
    ) {

      row.push(cell);

      cell = "";

      continue;
    }

    if (
      (
        ch === "\n" ||
        ch === "\r"
      ) &&
      !quoted
    ) {

      if (
        ch === "\r" &&
        next === "\n"
      ) {
        i++;
      }

      row.push(cell);

      cell = "";

      if (
        row.some(
          value =>
            String(value)
              .trim() !== ""
        )
      ) {

        rows.push(row);
      }

      row = [];

      continue;
    }

    cell += ch;
  }

  if (
    cell.length ||
    row.length
  ) {

    row.push(cell);

    if (
      row.some(
        value =>
          String(value)
            .trim() !== ""
      )
    ) {

      rows.push(row);
    }
  }

  if (!rows.length) {
    return [];
  }

  const headers =
    rows
      .shift()
      .map(
        header =>
          String(header)
            .trim()
            .replace(
              /^\uFEFF/,
              ""
            )
      );

  return rows.map(
    values =>
      Object.fromEntries(
        headers.map(
          (header, index) =>
            [
              header,
              String(
                values[index] ?? ""
              ).trim()
            ]
        )
      )
  );
}
