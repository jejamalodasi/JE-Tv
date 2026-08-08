import {
  fetchCsv,
  parseCsv
} from "./_utils.js";

const BASE =
  process.env.GOOGLE_SHEETS_BASE_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub";

const SHEETS = {

  channels:
    process.env.CHANNELS_CSV_URL ||
    `${BASE}?gid=342955480&single=true&output=csv`,

  premium:
    process.env.PREMIUM_CSV_URL ||
    `${BASE}?gid=1507668387&single=true&output=csv`,

  config:
    process.env.CONFIG_CSV_URL ||
    `${BASE}?gid=1362623748&single=true&output=csv`,

  banners:
    process.env.BANNERS_CSV_URL ||
    `${BASE}?gid=1391882960&single=true&output=csv`,

  notice:
    process.env.NOTICE_CSV_URL ||
    `${BASE}?gid=1907649251&single=true&output=csv`,

  version:
    process.env.VERSION_CSV_URL ||
    `${BASE}?gid=1135955112&single=true&output=csv`
};

async function getSheet(
  name
) {

  const csv =
    await fetchCsv(
      SHEETS[name]
    );

  return parseCsv(csv);
}

export async function getChannels() {
  return getSheet("channels");
}

export async function getPremium() {
  return getSheet("premium");
}

export async function getConfig() {
  return getSheet("config");
}

export async function getBanners() {
  return getSheet("banners");
}

export async function getNotice() {
  return getSheet("notice");
}

export async function getVersion() {
  return getSheet("version");
}
