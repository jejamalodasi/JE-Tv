// ========= API =========

const API = {
  playlist: "/api/playlist",
  banner: "/api/banner",
  notice: "/api/notice",
  version: "/api/version",
  premium: "/api/premium",
  config: "/api/config"
};

// ========= DOM =========

const channelsBox = document.getElementById("channels");
const bannerBox = document.getElementById("banner");
const categoryBox = document.getElementById("categories");
const searchBox = document.getElementById("search");

const playerModal = document.getElementById("playerModal");
const player = document.getElementById("player");
const playerTitle = document.getElementById("playerTitle");
const closePlayer = document.getElementById("closePlayer");

// ========= DATA =========

let channels = [];
let banners = [];
let currentCategory = "All";

// ========= INIT =========

window.onload = async () => {

    await loadPlaylist();

    await loadBanner();

};

// ========= PLAYLIST =========

async function loadPlaylist(){

    try{

        const res = await fetch(API.playlist);

        const json = await res.json();

        channels = json.channels || json.data || [];

        renderChannels(channels);

        buildCategories();

    }catch(e){

        channelsBox.innerHTML="<h2>Playlist Load Error</h2>";

        console.log(e);

    }

}

// ========= BANNER =========

async function loadBanner(){

    try{

        const res = await fetch(API.banner);

        const json = await res.json();

        banners = json.banners || json.data || [];

        renderBanner();

    }catch(e){

        console.log(e);

    }

}
