/* =====================================
   JE TV v3.0 FINAL APP.JS
===================================== */


const API = {

playlist:"/api/playlist",
banner:"/api/banner",
premium:"/api/premium",
notice:"/api/notice",
version:"/api/version"

};



let channels = [];

let premiumChannels = [];

let favorites =
JSON.parse(localStorage.getItem("favorites")) || [];

let recent =
JSON.parse(localStorage.getItem("recent")) || [];



const channelBox =
document.getElementById("channels");

const bannerBox =
document.getElementById("banner");

const search =
document.getElementById("search");

const categories =
document.getElementById("categories");



/* ==========================
 LOAD PLAYLIST
========================== */


async function loadPlaylist(){

try{


let res =
await fetch(API.playlist);


let data =
await res.json();



channels =
data.channels || [];



showChannels(channels);

createCategories();



}catch(e){

console.log(e);

channelBox.innerHTML =
"Playlist Error";

}


}




/* ==========================
 CHANNEL CARD
========================== */


function showChannels(list){


channelBox.innerHTML="";


list.forEach(ch=>{


let div =
document.createElement("div");


div.className="channel";


div.innerHTML=`

<img src="${ch.Logo}"
onerror="this.src='https://placehold.co/100'">

<h3>${ch.Name}</h3>

<p>${ch.Group || ""}</p>

`;



div.onclick=()=>{


playChannel(ch);


addRecent(ch);


};



channelBox.appendChild(div);


});


}




/* ==========================
 SEARCH
========================== */


search.addEventListener("input",()=>{


let value =
search.value.toLowerCase();



let result =
channels.filter(c=>

c.Name.toLowerCase()
.includes(value)

);



showChannels(result);


});





/* ==========================
 CATEGORY
========================== */


function createCategories(){


categories.innerHTML="";


let groups =
[...new Set(
channels.map(c=>c.Group)
)];



groups.forEach(g=>{


let btn =
document.createElement("button");


btn.innerText=g;


btn.onclick=()=>{


showChannels(

channels.filter(
c=>c.Group==g
)

);


};


categories.appendChild(btn);


});


}






/* ==========================
 PLAYER
========================== */


let hls;


function playChannel(ch){


let modal =
document.getElementById("playerModal");


let video =
document.getElementById("player");


let title =
document.getElementById("playerTitle");



modal.classList.remove("hide");


title.innerText =
ch.Name;



if(hls){

hls.destroy();

}



if(
window.Hls &&
Hls.isSupported()
){


hls =
new Hls();


hls.loadSource(ch.URL);


hls.attachMedia(video);


}else{


video.src =
ch.URL;


}



video.play();


}




document
.getElementById("closePlayer")
.onclick=()=>{


let video =
document.getElementById("player");


video.pause();


if(hls)
hls.destroy();



document
.getElementById("playerModal")
.classList.add("hide");


};






/* ==========================
 BANNER
========================== */


async function loadBanner(){


try{


let res =
await fetch(API.banner);


let data =
await res.json();



if(data.banners){


bannerBox.innerHTML =
`
<img src="${data.banners[0].Image}">
`;

}


}catch(e){}


}






/* ==========================
 PREMIUM
========================== */


async function loadPremium(){


try{


let res =
await fetch(API.premium);


let data =
await res.json();



premiumChannels =
data.channels ||
data.premium ||
[];



}catch(e){}


}



document
.getElementById("premiumBtn")
.onclick=()=>{


document
.getElementById("premiumBox")
.classList.remove("hide");


};




document
.getElementById("unlockPremium")
.onclick=()=>{


let pass =
document.getElementById("premiumPassword").value;



let result =
premiumChannels.filter(
c=>c.Password==pass
);



if(result.length){


showChannels(result);


document
.getElementById("premiumBox")
.classList.add("hide");


}else{


alert("Wrong Password");


}


};







/* ==========================
 NOTICE
========================== */


async function loadNotice(){


try{


let res =
await fetch(API.notice);


let data =
await res.json();



if(data.notice){


alert(data.notice);


}



}catch(e){}



}





/* ==========================
 FAVORITE + RECENT
========================== */


function addRecent(ch){


recent.unshift(ch);


recent =
recent.slice(0,20);


localStorage.setItem(
"recent",
JSON.stringify(recent)
);


}






/* START */

loadPlaylist();

loadBanner();

loadPremium();

loadNotice();
