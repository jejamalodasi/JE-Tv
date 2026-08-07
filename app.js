const BANNER_API =
"https://je-tv.vercel.app/api/banner";

const bannerBox =
document.getElementById("banner");

const categoryBox =
document.getElementById("categories");
const API =
"https://je-tv.vercel.app/api/playlist";


const channelsBox =
document.getElementById("channels");


const search =
document.getElementById("search");


const player =
document.getElementById("player");


const playerModal =
document.getElementById("playerModal");


const closePlayer =
document.getElementById("closePlayer");


const playerTitle =
document.getElementById("playerTitle");


let channels = [];


// Load Playlist

async function loadChannels(){

try{


let res =
await fetch(API);


let data =
await res.json();


channels =
data.channels || [];


showChannels(channels);


}catch(error){


channelsBox.innerHTML =
"Playlist Load Error";


console.log(error);


}


}



// Show Channels

function showChannels(list){


channelsBox.innerHTML="";


list.forEach(ch=>{


let div =
document.createElement("div");


div.className="channel";


div.innerHTML=`

<img src="${ch.Logo}"
onerror="this.src='https://placehold.co/100x100'">

<h3>${ch.Name}</h3>

`;


div.onclick=()=>playChannel(ch);


channelsBox.appendChild(div);


});


}



// Search

search.addEventListener("input",()=>{


let text =
search.value.toLowerCase();


let result =
channels.filter(ch=>

ch.Name.toLowerCase()
.includes(text)

);


showChannels(result);


});




// Play Channel

function playChannel(ch){


playerModal.classList.remove("hide");


playerTitle.innerText =
ch.Name;



if(
Hls.isSupported() &&
ch.URL.includes(".m3u8")
){


let hls = new Hls({

    liveSyncDurationCount: 2,

    maxBufferLength: 5,

    maxMaxBufferLength: 10,

    enableWorker: true,

    lowLatencyMode: true

});


hls.loadSource(ch.URL);

hls.attachMedia(player);


hls.on(Hls.Events.MANIFEST_PARSED, function(){

    player.play();

});

else{


player.src =
ch.URL;


}



player.play();


}




// Close Player

closePlayer.onclick=()=>{


player.pause();

player.src="";


playerModal.classList.add("hide");


};




async function loadBanner(){

try{

const res =
await fetch(BANNER_API);

const data =
await res.json();


if(data.success){

bannerBox.innerHTML="";


data.banners.forEach(item=>{


let img =
document.createElement("img");


img.src =
item.Image;


img.onclick=()=>{

if(item.Link){

window.open(item.Link,"_blank");

}

};


bannerBox.appendChild(img);


});


}


}catch(e){

console.log("Banner Error",e);

}

}


function loadCategories(){


let groups =
[
...new Set(
channels.map(ch=>ch.Group)
)
];


groups.forEach(group=>{


let btn =
document.createElement("button");


btn.innerText =
group;


btn.onclick=()=>{


let filtered =
channels.filter(
ch=>ch.Group===group
);


showChannels(filtered);


};


categoryBox.appendChild(btn);


});


}
loadChannels();
loadBanner();
