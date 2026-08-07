// =================================
// JE TV v3.0 APP
// PART 1 - CORE + PLAYLIST
// =================================


const API = {

playlist:
"/api/playlist",

banner:
"/api/banner",

premium:
"/api/premium",

notice:
"/api/notice"

};


const channelsBox =
document.getElementById("channels");


let allChannels = [];


// ===============================
// LOAD PLAYLIST
// ===============================

async function loadPlaylist(){

try{


const res =
await fetch(API.playlist);


const data =
await res.json();


console.log("Playlist:",data);



allChannels =
data.channels || data.playlist || [];



if(allChannels.length === 0){

channelsBox.innerHTML =
"❌ No Channel Found";

return;

}



showChannels(allChannels);



}
catch(error){


console.log(error);


channelsBox.innerHTML =
"❌ Playlist Loading Error";


}


}



// ===============================
// SHOW CHANNELS
// ===============================

function showChannels(list){


channelsBox.innerHTML="";


list.forEach(ch=>{


const card =
document.createElement("div");


card.className="channel";


card.innerHTML=`

<img src="${ch.Logo || ch.logo || ''}"
onerror="this.src='https://placehold.co/100x100'">


<h3>
${ch.Name || ch.name || "Unknown"}
</h3>


`;



channelsBox.appendChild(card);



});


}



// START

loadPlaylist();
