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

// =================================
// SEARCH
// =================================

searchBox.addEventListener("input", () => {

  const keyword = searchBox.value.toLowerCase().trim();

  if (keyword === "") {
    showChannels(allChannels);
    return;
  }

  const result = allChannels.filter(ch =>
    (ch.Name || "").toLowerCase().includes(keyword)
  );

  showChannels(result);

});


// =================================
// CATEGORIES
// =================================

function createCategories() {

  categoryBox.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "All";
  allBtn.className = "active";

  allBtn.onclick = () => {
    showChannels(allChannels);
  };

  categoryBox.appendChild(allBtn);

  const groups = [...new Set(
    allChannels.map(ch => ch.Group).filter(Boolean)
  )];

  groups.forEach(group => {

    const btn = document.createElement("button");

    btn.textContent = group;

    btn.onclick = () => {

      document
        .querySelectorAll("#categories button")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      showChannels(
        allChannels.filter(ch => ch.Group === group)
      );

    };

    categoryBox.appendChild(btn);

  });

}


// =================================
// PLAYER
// =================================

let hls = null;

function playChannel(channel){

  playerModal.classList.remove("hide");

  playerTitle.textContent = channel.Name;

  if(hls){
    hls.destroy();
    hls = null;
  }

  if(
    Hls.isSupported() &&
    channel.URL &&
    channel.URL.includes(".m3u8")
  ){

    hls = new Hls();

    hls.loadSource(channel.URL);

    hls.attachMedia(player);

  }else{

    player.src = channel.URL;

  }

  player.play();

}


// =================================
// CLOSE PLAYER
// =================================

closePlayer.onclick = ()=>{

  if(hls){

    hls.destroy();

    hls = null;

  }

  player.pause();

  player.removeAttribute("src");

  player.load();

  playerModal.classList.add("hide");

};
