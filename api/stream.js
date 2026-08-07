export default async function handler(req,res){

const url=req.query.url;


if(!url){

return res.status(400).send("Missing URL");

}


try{


const response = await fetch(url);


res.setHeader(
"Content-Type",
"application/vnd.apple.mpegurl"
);


res.setHeader(
"Access-Control-Allow-Origin",
"*"
);


const data = await response.text();


res.send(data);


}catch(error){


res.status(500).send(error.message);


}

}
