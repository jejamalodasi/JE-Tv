export default async function handler(req,res){

const url =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1391882960&single=true&output=csv";


try{

const response =
await fetch(url);


const csv =
await response.text();


const rows =
csv.split("\n").slice(1);


const banners =
rows.map(row=>{

let data =
row.split(",");

return {

Title:data[0],

Image:data[1],

Link:data[2]

};

});


res.status(200).json({

success:true,

banners

});


}catch(e){


res.status(500).json({

success:false,

error:e.message

});


}


}
