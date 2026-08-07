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
