export default async function handler(req, res) {
  const config = {
    app_name: "JE TV",
    app_version: "1.0.0",
    maintenance: false,
    force_update: false,
    telegram: "https://t.me/yourchannel",
    support: "https://facebook.com/yourpage"
  };

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json(config);
}
