export default async function handler(req,res){

res.setHeader(
"Access-Control-Allow-Origin",
"*"
);


const url=req.query.url;


if(!url){

return res.status(400).send(
"Missing URL"
);

}


try{


const response = await fetch(url,{

headers:{

"User-Agent":
"Mozilla/5.0"

}

});


if(!response.ok){

return res.status(response.status)
.send("Stream Error");

}


const type =
response.headers.get("content-type") || "";


/*
 HLS Playlist
*/

if(
type.includes("mpegurl") ||
url.includes(".m3u8")
){


let text =
await response.text();


const base =
url.substring(
0,
url.lastIndexOf("/") + 1
);



text =
text
.split("\n")
.map(line=>{


line=line.trim();



if(
line &&
!line.startsWith("#")
){


let link=line;


if(!line.startsWith("http")){

link=base+line;

}



return "/api/stream?url="
+
encodeURIComponent(link);


}



return line;



})
.join("\n");



res.setHeader(
"Content-Type",
"application/vnd.apple.mpegurl"
);



return res.send(text);


}



/*
 Video Segment
*/


const buffer =
Buffer.from(
await response.arrayBuffer()
);


res.setHeader(
"Content-Type",
type ||
"video/mp2t"
);


return res.send(buffer);



}
catch(e){


return res.status(500)
.json({

error:e.message

});


}


}
