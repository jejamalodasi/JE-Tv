const API = "https://je-tv.vercel.app/api";

const player = document.getElementById("player");
const playerModal = document.getElementById("playerModal");
const closePlayer = document.getElementById("closePlayer");
const channelsBox = document.getElementById("channels");
const loading = document.getElementById("loading");

let allChannels = [];

function showLoading() {
  loading.style.display = "block";
}

function hideLoading() {
  loading.style.display = "none";
}

async function loadChannels() {

  showLoading();

  try {

    const res = await fetch(API + "/playlist");

    const json = await res.json();

    allChannels = json.channels || [];

    renderChannels(allChannels);

  } catch (e) {

    channelsBox.innerHTML =
      "<h2>Playlist Load Failed</h2>";

    console.log(e);

  }

  hideLoading();

}

function renderChannels(list) {

  channelsBox.innerHTML = "";

  list.forEach(ch => {

    const card = document.createElement("div");

    card.className = "channel";

    card.innerHTML = `
      <img src="${ch.Logo}" onerror="this.src='https://placehold.co/120x120?text=TV'">
      <h3>${ch.Name}</h3>
    `;

    card.onclick = () => playChannel(ch);

    channelsBox.appendChild(card);

  });

}

function playChannel(ch) {

  playerModal.classList.remove("hide");

  document.getElementById("playerTitle").innerText =
    ch.Name;

  if (Hls.isSupported() && ch.URL.includes(".m3u8")) {

    const hls = new Hls();

    hls.loadSource(ch.URL);

    hls.attachMedia(player);

  } else {

    player.src = ch.URL;

  }

  player.play();

}

closePlayer.onclick = () => {

  player.pause();

  player.src = "";

  playerModal.classList.add("hide");

};

loadChannels();
