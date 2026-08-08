const API = {
  playlist: "/api/playlist",
  config: "/api/config",
  search: "/api/search",
  banner: "/api/banner",
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
let bannerTimer = null;

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

async function apiGet(url) {
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

async function loadBanners() {
  const bannerBox = document.getElementById("banner");

  if (!bannerBox) return;

  try {

    const data = await apiGet(API.banner);

    const banners = Array.isArray(data.data)
      ? data.data
      : [];

    if (!banners.length) {
      bannerBox.innerHTML = "";
      return;
    }

    /*
     * Google Sheet column names can vary.
     */
    const getValue = (row, names) => {

      for (const name of names) {

        if (
          row[name] !== undefined &&
          String(row[name]).trim() !== ""
        ) {
          return String(row[name]).trim();
        }

      }

      return "";
    };

    const validBanners = banners
      .map(row => {

        const image = getValue(row, [
          "Image",
          "image",
          "Image_URL",
          "image_url",
          "Banner",
          "banner",
          "Banner_URL",
          "banner_url",
          "URL",
          "url"
        ]);

        const title = getValue(row, [
          "Title",
          "title",
          "Name",
          "name"
        ]);

        const link = getValue(row, [
          "Link",
          "link",
          "URL",
          "url",
          "Target",
          "target"
        ]);

        const enabled = getValue(row, [
          "Enabled",
          "enabled",
          "Active",
          "active",
          "Status",
          "status"
        ]);

        return {
          image,
          title,
          link,
          enabled
        };

      })
      .filter(item => {

        if (!item.image) return false;

        if (!item.enabled) return true;

        return ![
          "false",
          "0",
          "no",
          "off",
          "disabled"
        ].includes(
          item.enabled.toLowerCase()
        );
      });

    if (!validBanners.length) {

      bannerBox.innerHTML = "";

      return;
    }

    /*
     * For now show first active banner.
     */
    const banner = validBanners[0];

    const image = escapeHtml(banner.image);
    const title = escapeHtml(banner.title);

    const content = `
      <div class="banner-container">

        ${
          banner.link
            ? `
              <a
                class="banner-link"
                href="${escapeHtml(banner.link)}"
              >
            `
            : ""
        }

          <img
            src="${image}"
            alt="${title || "JE TV Banner"}"
            loading="eager"
            onerror="this.parentElement?.parentElement?.remove?.()"
          >

          ${
            title
              ? `
                <div class="banner-content">
                  ${title}
                </div>
              `
              : ""
          }

        ${
          banner.link
            ? "</a>"
            : ""
        }

      </div>
    `;

    bannerBox.innerHTML = content;

  } catch (error) {

    console.warn(
      "Banner loading failed:",
      error
    );

    bannerBox.innerHTML = "";
  }
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

    await loadBanners();
    
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
  try {
    if (currentHls) {
      currentHls.destroy();
      currentHls = null;
    }
  } catch (error) {
    console.warn("HLS destroy error:", error);
  }

  player.pause();
  player.removeAttribute("src");
  player.removeAttribute("poster");
  player.load();
}

function showPlayerError(message) {
  let errorBox = document.getElementById("playerError");

  if (!errorBox) {
    errorBox = document.createElement("div");
    errorBox.id = "playerError";
    errorBox.className = "player-error";

    player.parentElement.appendChild(errorBox);
  }

  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function hidePlayerError() {
  const errorBox = document.getElementById("playerError");

  if (errorBox) {
    errorBox.style.display = "none";
  }
}

async function playChannel(channel) {

  stopPlayer();
  hidePlayerError();

  playerModal.classList.remove("hide");
  playerTitle.textContent = channel.Name;

  /*
   * IMPORTANT:
   * Do not force desktop/fullscreen mode.
   */
  document.body.classList.add("player-open");

  const source = `/api/stream?url=${encodeURIComponent(channel.URL)}`;

  if (!channel.URL) {
    showPlayerError("এই channel-এর stream URL পাওয়া যায়নি।");
    return;
  }

  /*
   * HLS.js first.
   * This is especially important for Android Chrome.
   */
  if (window.Hls && Hls.isSupported()) {

    currentHls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,

      backBufferLength: 30,

      manifestLoadingMaxRetry: 3,
      manifestLoadingRetryDelay: 1000,

      levelLoadingMaxRetry: 3,
      levelLoadingRetryDelay: 1000,

      fragLoadingMaxRetry: 5,
      fragLoadingRetryDelay: 1000,

      maxBufferLength: 30,
      maxMaxBufferLength: 60
    });

    currentHls.attachMedia(player);

    currentHls.on(
      Hls.Events.MEDIA_ATTACHED,
      () => {

        currentHls.loadSource(source);

      }
    );

    currentHls.on(
      Hls.Events.MANIFEST_PARSED,
      () => {

        player.play()
          .then(() => {
            hidePlayerError();
          })
          .catch(error => {

            console.warn(
              "Autoplay blocked:",
              error
            );

            /*
             * Browser autoplay policy may block
             * playback until user interaction.
             */
            showPlayerError(
              "▶️ Play চাপুন"
            );
          });
      }
    );

    currentHls.on(
      Hls.Events.ERROR,
      (event, data) => {

        console.warn(
          "HLS error:",
          data
        );

        if (!data.fatal) {
          return;
        }

        switch (data.type) {

          case Hls.ErrorTypes.NETWORK_ERROR:

            showPlayerError(
              "Stream connection সমস্যা। আবার চেষ্টা করছি..."
            );

            try {
              currentHls.startLoad();
            } catch {
              // Ignore
            }

            break;

          case Hls.ErrorTypes.MEDIA_ERROR:

            showPlayerError(
              "Video format সমস্যা। আবার চেষ্টা করছি..."
            );

            try {
              currentHls.recoverMediaError();
            } catch {
              // Ignore
            }

            break;

          default:

            showPlayerError(
              "এই channel এখন play করা যাচ্ছে না।"
            );

            try {
              currentHls.destroy();
            } catch {
              // Ignore
            }

            currentHls = null;
        }
      }
    );

    return;
  }

  /*
   * Safari / browsers with native HLS.
   */
  if (
    player.canPlayType(
      "application/vnd.apple.mpegurl"
    )
  ) {

    player.src = source;

    player.addEventListener(
      "loadedmetadata",
      () => {

        player.play()
          .catch(() => {
            showPlayerError("▶️ Play চাপুন");
          });

      },
      { once: true }
    );

    player.addEventListener(
      "error",
      () => {

        showPlayerError(
          "Stream চালানো যাচ্ছে না।"
        );

      },
      { once: true }
    );

    return;
  }

  showPlayerError(
    "এই browser HLS video support করে না।"
  );
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

  document.body.classList.remove("player-open");

  hidePlayerError();
}

closePlayer.onclick = closePlayerModal;
playerModal.onclick = e => { if (e.target === playerModal) closePlayerModal(); };
document.onkeydown = e => { if (e.key === "Escape") closePlayerModal(); };
searchBox.oninput = applyView;

start();
