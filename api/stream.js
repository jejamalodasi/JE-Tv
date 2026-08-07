export default async function handler(req, res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,OPTIONS"
    );


    if(req.method === "OPTIONS"){

        return res.status(200).end();

    }


    const target = req.query.url;


    if(!target){

        return res.status(400).json({

            error:"Missing stream url"

        });

    }


    try{


        const response = await fetch(target,{

            headers:{

                "User-Agent":
                "Mozilla/5.0"

            }

        });


        if(!response.ok){

            return res.status(response.status).send(
                "Stream unavailable"
            );

        }


        const contentType =
        response.headers.get("content-type") || "";


        const body =
        await response.text();
// Rewrite HLS playlist

if(
    contentType.includes("mpegurl") ||
    target.includes(".m3u8")
){

    const base =
    target.substring(
        0,
        target.lastIndexOf("/") + 1
    );


    const rewritten =
    body
    .split("\n")
    .map(line=>{


        line=line.trim();


        if(
            line &&
            !line.startsWith("#")
        ){

            let segmentUrl =
            line;


            if(!line.startsWith("http")){

                segmentUrl =
                base + line;

            }


            return "/api/stream?url="
            +
            encodeURIComponent(segmentUrl);

        }


        return line;


    })
    .join("\n");


    res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl"
    );


    return res.status(200).send(rewritten);

}

        res.setHeader(
            "Content-Type",
            contentType.includes("mpegurl")
            ?
            "application/vnd.apple.mpegurl"
            :
            contentType
        );


        res.status(200).send(body);



    }catch(error){


        res.status(500).json({

            error:error.message

        });


    }


}
