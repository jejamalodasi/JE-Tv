export default async function handler(req, res) {
  const url =
    "https://raw.githubusercontent.com/jejamalodasi/JE-Tv/main/playlist.json";

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

    res.status(200).json({
      success: true,
      channels: data,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}
