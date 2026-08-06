export default async function handler(req,res){

const csvUrl=
"https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1135955112&single=true&output=csv";


try{

const response=await fetch(csvUrl);

const csv=await response.text();

const rows=csv.trim().split("\n");

const headers=rows[0].split(",");

let result={};


const values=rows[1].split(",");


headers.forEach((h,i)=>{

result[h.trim()]=values[i]?.trim() || "";

});


res.setHeader("Access-Control-Allow-Origin","*");

res.status(200).json(result);


}catch(e){

res.status(500).json({
error:e.message
});

}

}
