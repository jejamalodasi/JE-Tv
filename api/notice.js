export default async function handler(req, res) {

const csvUrl =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1907649251&single=true&output=csv";


try {

const response = await fetch(csvUrl);
const csv = await response.text();

const rows = csv.trim().split("\n");

const headers = rows[0].split(",");

const data = rows.slice(1).map(row=>{

const values=row.split(",");

let obj={};

headers.forEach((h,i)=>{
obj[h.trim()]=values[i]?.trim() || "";
});

return obj;

});


res.setHeader("Access-Control-Allow-Origin","*");

res.status(200).json({
success:true,
notice:data
});


}catch(e){

res.status(500).json({
success:false,
error:e.message
});

}

}
