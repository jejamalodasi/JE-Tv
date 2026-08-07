// =================================
// JE TV v2.0
// APP CORE
// =================================


const PLAYLIST_API =
"https://je-tv.vercel.app/api/playlist";

const BANNER_API =
"https://je-tv.vercel.app/api/banner";

const PREMIUM_API =
"https://je-tv.vercel.app/api/premium";

const NOTICE_API =
"https://je-tv.vercel.app/api/notice";



const channelsBox =
document.getElementById("channels");


const searchBox =
document.getElementById("search");


const bannerBox =
document.getElementById("banner");


const categoryBox =
document.getElementById("categories");


const player =
document.getElementById("player");


const playerModal =
document.getElementById("playerModal");


const playerTitle =
document.getElementById("playerTitle");


const closePlayer =
document.getElementById("closePlayer");



let allChannels = [];

let premiumChannels = [];

let favorites =
JSON.parse(localStorage.getItem("favorites")) || [];



// =================================
// LOAD PLAYLIST
// =================================


async function loadPlaylist(){

try{


let res =
await fetch(PLAYLIST_API);


let data =
await res.json();


allChannels =
data.channels || [];


showChannels(allChannels);


createCategories();



}catch(error){


console.log(
"Playlist Error:",
error
);


channelsBox.innerHTML =
"Playlist Load Error";


}


}



// =================================
// SHOW CHANNELS
// =================================


function showChannels(list){


channelsBox.innerHTML="";


list.forEach(channel=>{


let card =
document.createElement("div");


card.className="channel";


card.innerHTML = `

<img src="${channel.Logo || ''}"
onerror="this.src='https://placehold.co/100x100'">


<h3>
${channel.Name}
</h3>


`;



card.onclick = ()=>{

playChannel(channel);

};



channelsBox.appendChild(card);



});


}
