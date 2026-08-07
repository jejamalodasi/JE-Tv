// ======================================
// JE TV v3.0
// app.js PART 1
// ======================================


const API = {
  playlist: "/api/playlist",
  banner: "/api/banner",
  premium: "/api/premium",
  notice: "/api/notice",
  version: "/api/version"
};


let channels = [];
let premiumChannels = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];


// Elements

const channelBox = document.getElementById("channels");
const searchBox = document.getElementById("search");
const bannerBox = document.getElementById("banner");


// ================================
// LOAD PLAYLIST
// ================================

async function loadPlaylist(){

try{

const res = await fetch(API.playlist);

const data = await res.json();

console.log(data);


channels = data.channels || [];


if(!channels.length){

channelBox.innerHTML =
"Channel Not Found";

return;

}


showChannels(channels);


}catch(err){

console.log(err);

channelBox.innerHTML =
"Playlist Error";

}

}



// ================================
// SHOW CHANNELS
// ================================


function showChannels(list){


channelBox.innerHTML="";


list.forEach(ch=>{


let card=document.createElement("div");


card.className="channel";


card.innerHTML=`

<img src="${ch.Logo}"
onerror="this.src='https://placehold.co/100x100'">


<h3>${ch.Name}</h3>

<p>${ch.Group || ""}</p>

`;



card.onclick=()=>{

playChannel(ch);

};



channelBox.appendChild(card);


});


}



// ================================
// SEARCH
// ================================


if(searchBox){

searchBox.addEventListener("input",()=>{


let text =
searchBox.value.toLowerCase();


let result =
channels.filter(ch=>

ch.Name.toLowerCase()
.includes(text)

);



showChannels(result);


});


}



// START

loadPlaylist();

// ======================================
// PLAYER SYSTEM
// ======================================


const playerModal =
document.getElementById("playerModal");

const player =
document.getElementById("player");

const playerTitle =
document.getElementById("playerTitle");

const closePlayer =
document.getElementById("closePlayer");

let hls = null;


function playChannel(ch){


if(!playerModal) return;


playerModal.classList.remove("hide");


playerTitle.innerText =
ch.Name;


if(hls){

hls.destroy();

hls=null;

}



if(window.Hls && Hls.isSupported()){


hls = new Hls();

hls.loadSource(ch.URL);

hls.attachMedia(player);


}else{


player.src = ch.URL;


}


player.play();


}



if(closePlayer){

closePlayer.onclick=()=>{


player.pause();


if(hls){

hls.destroy();

hls=null;

}


playerModal.classList.add("hide");


};

}



// ======================================
// CATEGORY
// ======================================


const categoryBox =
document.getElementById("categories");


function loadCategories(){


if(!categoryBox) return;


categoryBox.innerHTML="";


let all =
document.createElement("button");


all.innerText="All";


all.onclick=()=>{

showChannels(channels);

};


categoryBox.appendChild(all);



let groups =
[...new Set(
channels.map(c=>c.Group)
)];



groups.forEach(group=>{


let btn =
document.createElement("button");


btn.innerText=group;


btn.onclick=()=>{


showChannels(

channels.filter(
c=>c.Group===group
)

);


};


categoryBox.appendChild(btn);



});


}



loadCategories();



// ======================================
// BANNER
// ======================================


async function loadBanner(){


try{


let res =
await fetch(API.banner);


let data =
await res.json();


if(data.banners &&
data.banners.length){


bannerBox.innerHTML = `

<img src="${data.banners[0].Image}">

`;


}


}catch(e){

console.log(e);

}


}



loadBanner();

// ======================================
// PREMIUM SYSTEM
// ======================================


const premiumBtn =
document.getElementById("premiumBtn");


const premiumBox =
document.getElementById("premiumBox");


const passwordInput =
document.getElementById("premiumPassword");


const unlockBtn =
document.getElementById("unlockPremium");



async function loadPremium(){


try{


let res =
await fetch(API.premium);


let data =
await res.json();


premiumChannels =
data.premium || [];


}catch(e){

console.log(e);

}


}



if(premiumBtn){

premiumBtn.onclick=()=>{

premiumBox.classList.remove("hide");

};

}



if(unlockBtn){

unlockBtn.onclick=()=>{


let pass =
passwordInput.value;



let result =
premiumChannels.filter(
c=>c.Password===pass
);



if(result.length){


showChannels(result);


premiumBox.classList.add("hide");


}else{


alert("Wrong Password");


}



};


}




// ======================================
// NOTICE
// ======================================


async function loadNotice(){


try{


let res =
await fetch(API.notice);


let data =
await res.json();


let n =
data.notice?.[0];


if(n && n.Enable==="TRUE"){


alert(
n.Title+"\n\n"+n.Message
);


}



}catch(e){

console.log(e);

}


}



// ======================================
// FAVORITES
// ======================================


function saveFavorite(ch){


favorites.push(ch);


localStorage.setItem(
"favorites",
JSON.stringify(favorites)
);


}



// START FINAL

loadPremium();

loadNotice();
