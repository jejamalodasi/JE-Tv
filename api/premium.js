export default async function handler(req,res){

const url =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvgLEkW-YX8pMUEWwZcCGqwfbX5ZuGrDAZ7xTs4oiOZY8Im0DMDXo1ahLnQE4NQ/pub?gid=1507668387&single=true&output=csv";


try{

const response = await fetch(url);

const csv = await response.text();


const rows =
csv.split("\n").slice(1);


const premium =
rows.map(row=>{

let data=row.split(",");


return {

Name:data[0],

Group:data[1],

Logo:data[2],

URL:data[3],

Password:data[4]

};


});


res.status(200).json({

success:true,

premium

});


}

catch(e){

res.status(500).json({

success:false,

error:e.message

});

}

}
