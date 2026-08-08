const API = {
  playlist: "/api/playlist",
  config: "/api/config",
  banner: "/api/banner",
  search: "/api/search"
};

const channelsBox =
  document.getElementById("channels");

const categoryBox =
  document.getElementById("categories");

const searchBox =
  document.getElementById("search");

const playerModal =
  document.getElementById("playerModal");

const player =
  document.getElementById("player");

const playerTitle =
  document.getElementById("playerTitle");

const closePlayer =
  document.getElementById("closePlayer");

const playerLoading =
  document.getElementById("playerLoading");

const playerError =
  document.getElementById("playerError");

let channels = [];

let currentCategory = "All";

let currentHls = null;

let refreshTimer = null;

let bannerTimer = null;

let banners = [];

let bannerIndex = 0;

/* =========================
   HELPERS
========================= */

function escapeHtml(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function apiGet(url) {

  const response = await fetch(url, {
    cache: "no-store",

    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  return response.json();
}

/* =========================
   CHANNELS
========================= */

function normalizeChannels(data) {

  const list =
    Array.isArray(data)
      ? data
      : (
          data.channels ||
          data.data ||
          []
        );

  return list
    .map((channel, index) => ({

      ...channel,

      id:
        channel.id ??
        channel.ID ??
        channel.Id ??
        String(index),

      Name:
        channel.Name ??
        channel.name ??
        channel.Channel ??
        channel.channel ??
        "Unknown Channel",

      Group:
        channel.Group ??
        channel.group ??
        channel.Category ??
        channel.category ??
        "General",

      Logo:
        channel.Logo ??
        channel.logo ??
        channel.Logo_URL ??
        channel.logo_url ??
        "",

      URL:
        channel.URL ??
        channel.url ??
        channel.Stream ??
        channel.stream ??
        "",

      Language:
        channel.Language ??
        channel.language ??
        "",

      Country:
        channel.Country ??
        channel.country ??
        ""

    }))
    .filter(channel => channel.URL);
}

async function loadChannels({
  initial = false
} = {}) {

  try {

    const data =
      await apiGet(API.playlist);

    const next =
      normalizeChannels(data);

    const oldIds =
      new Set(
        channels.map(
          channel =>
            `${channel.id}|${channel.URL}`
        )
      );

    const newIds =
      new Set(
        next.map(
          channel =>
            `${channel.id}|${channel.URL}`
        )
      );

    channels = next;

    buildCategories();

    applyView();

    document.title =
      `JE TV • ${channels.length} channels`;

    if (
      !initial &&
      (
        oldIds.size !== newIds.size ||
        [...oldIds].some(
          id => !newIds.has(id)
        )
      )
    ) {

      console.info(
        "JE TV: Google Sheets channel data updated."
      );
    }

  } catch (error) {

    console.warn(
      "Channel refresh failed:",
      error
    );

    if (initial) {

      channelsBox.innerHTML =
        `<div class="state">
          Unable to load live channels.
        </div>`;
    }
  }
}

/* =========================
   CATEGORIES
========================= */

function buildCategories() {

  const groups = [
    "All",
    ...new Set(
      channels
        .map(
          channel =>
            String(
              channel.Group || ""
            ).trim()
        )
        .filter(Boolean)
    )
  ];

  if (
    !groups.includes(
      currentCategory
    )
  ) {
    currentCategory = "All";
  }

  categoryBox.innerHTML = "";

  for (const group of groups) {

    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent = group;

    button.classList.toggle(
      "active",
      group === currentCategory
    );

    button.onclick = () => {

      currentCategory = group;

      document
        .querySelectorAll(
          "#categories button"
        )
        .forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );

      button.classList.add("active");

      applyView();
    };

    categoryBox.appendChild(button);
  }
}

/* =========================
   FILTER
========================= */

function applyView() {

  const keyword =
    searchBox.value
      .trim()
      .toLowerCase();

  let list =
    currentCategory === "All"
      ? channels
      : channels.filter(
          channel =>
            channel.Group ===
            currentCategory
        );

  if (keyword) {

    list =
      list.filter(channel =>

        [
          channel.Name,
          channel.Group,
          channel.Language,
          channel.Country
        ]
          .filter(Boolean)
          .some(value =>
            String(value)
              .toLowerCase()
              .includes(keyword)
          )
      );
  }

  renderChannels(list);
}

/* =========================
   CHANNEL UI
========================= */

function renderChannels(list) {

  channelsBox.innerHTML = "";

  if (!list.length) {

    channelsBox.innerHTML =
      `<div class="state">
        No channels found.
      </div>`;

    return;
  }

  const fragment =
    document.createDocumentFragment();

  for (const channel of list) {

    const card =
      document.createElement("button");

    card.className = "channel";

    card.type = "button";

    const logo =
      channel.Logo ||
      "https://placehold.co/320x320/111318/ffffff?text=TV";

    card.innerHTML = `

      <img
        src="${escapeHtml(logo)}"
        alt=""
        loading="lazy"
      >

      <span class="channel-name">
        ${escapeHtml(channel.Name)}
      </span>

      <small class="channel-meta">
        ${escapeHtml(channel.Group)}
      </small>

    `;

    card.onclick =
      () => playChannel(channel);

    fragment.appendChild(card);
  }

  channelsBox.appendChild(fragment);
}

/* =========================
   BANNERS
========================= */

function normalizeBanners(data) {

  const list =
    Array.isArray(data)
      ? data
      : (
          data.banners ||
          data.data ||
          []
        );

  return list
    .map(row => ({

      image:
        row.Image ??
        row.image ??
        row.Image_URL ??
        row.image_url ??
        row.Banner ??
        row.banner ??
        row.Banner_URL ??
        row.banner_url ??
        row.URL ??
        row.url ??
        "",

      title:
        row.Title ??
        row.title ??
        row.Name ??
        row.name ??
        "",

      link:
        row.Link ??
        row.link ??
        row.Target ??
        row.target ??
        "",

      enabled:
        row.Enabled ??
        row.enabled ??
        row.Active ??
        row.active ??
        row.Status ??
        row.status ??
        "true"

    }))
    .filter(banner => {

      if (!banner.image) {
        return false;
      }

      return ![
        "false",
        "0",
        "no",
        "off",
        "disabled"
      ].includes(
        String(
          banner.enabled
        ).toLowerCase()
      );
    });
}

async function loadBanners() {

  try {

    const data =
      await apiGet(API.banner);

    banners =
      normalizeBanners(data);

    bannerIndex = 0;

    renderBanner();

    clearInterval(
      bannerTimer
    );

    if (banners.length > 1) {

      bannerTimer =
        setInterval(() => {

          bannerIndex =
            (
              bannerIndex + 1
            ) % banners.length;

          renderBanner();

        }, 6000);
    }

  } catch (error) {

    console.warn(
      "Banner refresh failed:",
      error
    );

    document.getElementById(
      "banner"
    ).innerHTML = "";
  }
}

function renderBanner() {

  const box =
    document.getElementById(
      "banner"
    );

  if (!box) return;

  if (!banners.length) {

    box.innerHTML = "";

    return;
  }

  const banner =
    banners[
      bannerIndex %
      banners.length
    ];

  const inner = `

    <div class="banner-card">

      <img
        src="${escapeHtml(
          banner.image
        )}"
        alt="${escapeHtml(
          banner.title ||
          "JE TV"
        )}"
        onerror="
          this.closest(
            '.banner-card'
          ).remove()
        "
      >

      ${
        banner.title
          ? `
            <div class="banner-overlay">
              ${escapeHtml(
                banner.title
              )}
            </div>
          `
          : ""
      }

    </div>

  `;

  box.innerHTML =
    banner.link
      ? `
        <a
          href="${escapeHtml(
            banner.link
          )}"
          target="_blank"
          rel="noopener"
        >
          ${inner}
        </a>
      `
      : inner;
}

/* =========================
   PLAYER UI
========================= */

function setPlayerLoading(
  show,
  text = "Connecting..."
) {

  playerLoading.textContent =
    text;

  playerLoading.hidden =
    !show;
}

function showPlayerError(
  message
) {

  playerError.textContent =
    message;

  playerError.hidden =
    false;

  setPlayerLoading(false);
}

function hidePlayerError() {

  playerError.hidden =
    true;
}

/* =========================
   PLAYER CLEANUP
========================= */

function stopPlayer() {

  if (currentHls) {

    try {
      currentHls.stopLoad();
    } catch {}

    try {
      currentHls.detachMedia();
    } catch {}

    try {
      currentHls.destroy();
    } catch {}

    currentHls = null;
  }

  try {

    player.pause();

    player.removeAttribute(
      "src"
    );

    player.load();

  } catch {}
}

/* =========================
   PLAY CHANNEL
========================= */

function playChannel(channel) {

  stopPlayer();

  hidePlayerError();

  setPlayerLoading(
    true,
    "Connecting..."
  );

  playerModal.classList.remove(
    "hide"
  );

  document.body.classList.add(
    "player-open"
  );

  playerTitle.textContent =
    channel.Name ||
    "JE TV";

  if (!channel.URL) {

    showPlayerError(
      "This channel has no stream URL."
    );

    return;
  }

  const source =
    `/api/stream?url=${
      encodeURIComponent(
        channel.URL
      )
    }`;

  /* =========================
     HLS.JS
  ========================= */

  if (
    window.Hls &&
    Hls.isSupported()
  ) {

    const hls =
      new Hls({

        enableWorker: true,

        lowLatencyMode: false,

        backBufferLength: 30,

        maxBufferLength: 30,

        maxMaxBufferLength: 60,

        liveSyncDurationCount: 3,

        liveMaxLatencyDurationCount: 8,

        manifestLoadingMaxRetry: 5,

        manifestLoadingRetryDelay: 1000,

        levelLoadingMaxRetry: 5,

        levelLoadingRetryDelay: 1000,

        fragLoadingMaxRetry: 6,

        fragLoadingRetryDelay: 1000

      });

    currentHls = hls;

    hls.attachMedia(
      player
    );

    hls.on(
      Hls.Events.MEDIA_ATTACHED,
      () => {

        console.info(
          "JE TV: media attached."
        );

        hls.loadSource(
          source
        );
      }
    );

    hls.on(
      Hls.Events.MANIFEST_PARSED,
      () => {

        console.info(
          "JE TV: manifest parsed."
        );

        setPlayerLoading(
          false
        );

        player
          .play()
          .catch(() => {

            showPlayerError(
              "Press Play to start the video."
            );
          });
      }
    );

    hls.on(
      Hls.Events.FRAG_BUFFERED,
      () => {

        setPlayerLoading(
          false
        );

        hidePlayerError();
      }
    );

    hls.on(
      Hls.Events.ERROR,
      (_, data) => {

        console.warn(
          "JE TV HLS error:",
          data
        );

        if (!data.fatal) {
          return;
        }

        if (
          data.type ===
          Hls.ErrorTypes.NETWORK_ERROR
        ) {

          showPlayerError(
            "Stream connection failed. Retrying..."
          );

          try {
            hls.startLoad();
          } catch {}

          return;
        }

        if (
          data.type ===
          Hls.ErrorTypes.MEDIA_ERROR
        ) {

          showPlayerError(
            "Video decoding error. Recovering..."
          );

          try {
            hls.recoverMediaError();
          } catch {}

          return;
        }

        showPlayerError(
          "This channel cannot be played right now."
        );

        try {
          hls.destroy();
        } catch {}

        currentHls = null;
      }
    );

    return;
  }

  /* =========================
     NATIVE HLS
  ========================= */

  if (
    player.canPlayType(
      "application/vnd.apple.mpegurl"
    )
  ) {

    player.src =
      source;

    player.addEventListener(
      "loadedmetadata",
      () => {

        setPlayerLoading(
          false
        );

        player
          .play()
          .catch(() => {

            showPlayerError(
              "Press Play to start the video."
            );
          });

      },
      { once: true }
    );

    player.addEventListener(
      "error",
      () => {

        showPlayerError(
          "Unable to play this stream."
        );

      },
      { once: true }
    );

    return;
  }

  showPlayerError(
    "This browser does not support HLS playback."
  );
}

/* =========================
   CLOSE PLAYER
========================= */

function closePlayerModal() {

  stopPlayer();

  playerModal.classList.add(
    "hide"
  );

  document.body.classList.remove(
    "player-open"
  );

  hidePlayerError();
}

closePlayer.onclick =
  closePlayerModal;

playerModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      playerModal
    ) {
      closePlayerModal();
    }
  }
);

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {
      closePlayerModal();
    }
  }
);

searchBox.addEventListener(
  "input",
  applyView
);

/* =========================
   START
========================= */

async function start() {

  let interval =
    30000;

  try {

    const config =
      await apiGet(
        API.config
      );

    interval =
      Math.max(
        Number(
          config.refresh_interval_ms ||
          30000
        ),
        10000
      );

  } catch {}

  await Promise.allSettled([
    loadChannels({
      initial: true
    }),

    loadBanners()
  ]);

  clearInterval(
    refreshTimer
  );

  refreshTimer =
    setInterval(() => {

      loadChannels();

      loadBanners();

    }, interval);
}

start();
