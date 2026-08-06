export default async function handler(req,res){

const password=req.query.password;


const csvUrl=
"https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1507668387&single=true&output=csv";


try{

const response=await fetch(csvUrl);

const csv=await response.text();

const rows=csv.trim().split("\n");

const headers=rows[0].split(",");


const channels=rows.slice(1).map(row=>{

const values=row.split(",");

let obj={};

headers.forEach((h,i)=>{
obj[h.trim()]=values[i]?.trim() || "";
});

return obj;

});


const access=channels.filter(
item=>item.Password===password
);


res.setHeader("Access-Control-Allow-Origin","*");


if(access.length){

res.status(200).json({
success:true,
channels:access
});

}else{

res.status(401).json({
success:false,
message:"Wrong Password"
});

}


}catch(e){

res.status(500).json({
error:e.message
});

}

}
