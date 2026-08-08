import {
  getConfig
} from "./sheet.js";

import {
  handleOptions,
  sendError,
  setCommonHeaders
} from "./_utils.js";

function numberValue(
  value,
  fallback
) {

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
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

  try {

    const rows =
      await getConfig();

    const config = {};

    for (
      const row of rows
    ) {

      const key =
        row.key ??
        row.Key ??
        row.name ??
        row.Name;

      const value =
        row.value ??
        row.Value ??
        row.setting ??
        row.Setting;

      if (key) {

        config[
          String(key).trim()
        ] = value;
      }
    }

    config.refresh_interval_ms =
      numberValue(
        config.refresh_interval_ms ??
        config.refreshIntervalMs,
        30000
      );

    setCommonHeaders(
      res,
      {
        cache: "no-store"
      }
    );

    return res
      .status(200)
      .json({
        success: true,
        ...config
      });

  } catch (error) {

    console.error(
      error
    );

    return sendError(
      res,
      502,
      "Unable to read config sheet"
    );
  }
}আমি 
