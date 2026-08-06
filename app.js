const api =
"https://je-tv.vercel.app/api/playlist";


fetch(api)
.then(res=>res.json())
.then(data=>{


let box=document.getElementById("channels");


data.forEach(ch=>{


let div=document.createElement("div");

div.className="channel";

div.innerHTML=ch.Name || ch.name;


div.onclick=()=>{

document.getElementById("player").src =
ch.URL || ch.url;

};


box.appendChild(div);


});


});
