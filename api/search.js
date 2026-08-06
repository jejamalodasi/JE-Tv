export default async function handler(req,res){

const q=(req.query.q || "").toLowerCase();


const url=
"https://raw.githubusercontent.com/jejamalodasi/JE-Tv/main/playlist.json";


try{

const response=await fetch(url);

const data=await response.json();


const result=data.filter(item=>
JSON.stringify(item)
.toLowerCase()
.includes(q)
);


res.setHeader("Access-Control-Allow-Origin","*");


res.status(200).json({
success:true,
result:result
});


}catch(e){

res.status(500).json({
error:e.message
});

}

}
