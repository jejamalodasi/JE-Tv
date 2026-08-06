export default async function handler(req, res) {

  const csvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1391882960&single=true&output=csv";

  try {

    const response = await fetch(csvUrl);
    const csv = await response.text();

    const rows = csv.split("\n");

    const headers = rows[0]
      .split(",")
      .map(h => h.trim());

    const banners = rows.slice(1)
      .filter(row => row.trim() !== "")
      .map(row => {

        const values = row.split(",");

        let item = {};

        headers.forEach((header, index) => {
          item[header] = values[index]?.trim() || "";
        });

        return item;

      });


    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Cache-Control",
      "s-maxage=300"
    );


    res.status(200).json({
      success:true,
      banners:banners
    });


  } catch(error){

    res.status(500).json({
      success:false,
      error:error.message
    });

  }

}
