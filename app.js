const API = {
  playlist: "/api/playlist",
  config: "/api/config",
  search: "/api/search",
};

const channelsBox = document.getElementById("channels");
const categoryBox = document.getElementById("categories");
const searchBox = document.getElementById("search");
const playerModal = document.getElementById("playerModal");
const player = document.getElementById("player");
const playerTitle = document.getElementById("playerTitle");
const closePlayer = document.getElementById("closePlayer");

let channels = [];
let currentCategory = "All";
let currentHls = null;
let refreshTimer = null;

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

async function apiGet(url) {
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

async function loadChannels({ initial = false } = {}) {
  try {
    const data = await apiGet(API.playlist);
    const next = data.channels || [];
    const oldIds = new Set(channels.map(c => `${c.id}|${c.URL}`));
    const newIds = new Set(next.map(c => `${c.id}|${c.URL}`));

    channels = next;
    buildCategories();
    applyView();

    // A small visual indication that the app is reading the live Sheet.
    document.title = `JE TV • ${channels.length} channels`;

    if (!initial && (oldIds.size !== newIds.size ||
      [...oldIds].some(x => !newIds.has(x)))) {
      console.info("JE TV: Google Sheet changes detected automatically.");
    }
  } catch (error) {
    console.warn("Live Sheet refresh failed:", error);
    if (initial) channelsBox.innerHTML = "<div class='state'>Unable to load live channels.</div>";
  }
}

async function start() {
  try {
    const config = await apiGet(API.config);
    const interval = Math.max(Number(config.refresh_interval_ms || 30000), 10000);

    await loadChannels({ initial: true });

    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => loadChannels(), interval);
  } catch {
    await loadChannels({ initial: true });
    refreshTimer = setInterval(() => loadChannels(), 30000);
  }
}

function buildCategories() {
  const groups = ["All", ...new Set(channels.map(c => c.Group).filter(Boolean))];
  categoryBox.innerHTML = "";

  for (const group of groups) {
    const button = document.createElement("button");
    button.textContent = group;
    button.classList.toggle("active", group === currentCategory);
    button.onclick = () => {
      currentCategory = group;
      document.querySelectorAll("#categories button").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      applyView();
    };
    categoryBox.appendChild(button);
  }
}

function applyView() {
  const keyword = searchBox.value.trim().toLowerCase();
  let list = currentCategory === "All"
    ? channels
    : channels.filter(c => c.Group === currentCategory);

  if (keyword) {
    list = list.filter(c =>
      [c.Name, c.Group, c.Language, c.Country].filter(Boolean)
        .some(v => String(v).toLowerCase().includes(keyword))
    );
  }

  renderChannels(list);
}

function renderChannels(list) {
  channelsBox.innerHTML = "";
  if (!list.length) {
    channelsBox.innerHTML = "<div class='state'>No channels found.</div>";
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const channel of list) {
    const card = document.createElement("button");
    card.className = "channel";
    card.type = "button";
    card.innerHTML = `
      <img src="${escapeHtml(channel.Logo || "https://placehold.co/160x160?text=TV")}" alt="" loading="lazy">
      <span>${escapeHtml(channel.Name)}</span>
      <small>${escapeHtml(channel.Group)}</small>
    `;
    card.onclick = () => playChannel(channel);
    fragment.appendChild(card);
  }

  channelsBox.appendChild(fragment);
}

function stopPlayer() {
  player.pause();
  player.removeAttribute("src");
  player.load();
  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }
}

function playChannel(channel) {
  stopPlayer();
  playerModal.classList.remove("hide");
  playerTitle.textContent = channel.Name;
  const url = `/api/stream?url=${encodeURIComponent(channel.URL)}`;

  if (window.Hls?.isSupported()) {
    currentHls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 30 });
    currentHls.loadSource(url);
    currentHls.attachMedia(player);
    currentHls.on(Hls.Events.MANIFEST_PARSED, () => player.play().catch(() => {}));
  } else if (player.canPlayType("application/vnd.apple.mpegurl")) {
    player.src = url;
    player.play().catch(() => {});
  }
}

function closePlayerModal() {
  stopPlayer();
  playerModal.classList.add("hide");
}

closePlayer.onclick = closePlayerModal;
playerModal.onclick = e => { if (e.target === playerModal) closePlayerModal(); };
document.onkeydown = e => { if (e.key === "Escape") closePlayerModal(); };
searchBox.oninput = applyView;

start();
