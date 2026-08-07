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
// ========= RENDER CHANNELS =========

function renderChannels(list){

    channelsBox.innerHTML="";

    if(list.length===0){

        channelsBox.innerHTML="<h2>No Channels Found</h2>";

        return;

    }

    list.forEach(ch=>{

        const card=document.createElement("div");

        card.className="channel";

        card.innerHTML=`
            <img src="${ch.Logo}" onerror="this.src='https://placehold.co/100x100?text=TV'">
            <h3>${ch.Name}</h3>
        `;

        card.onclick=()=>{
    console.log(ch);
    playChannel(ch);
};

        channelsBox.appendChild(card);

    });

}

// ========= RENDER BANNER =========

function renderBanner(){

    if(banners.length===0){

        bannerBox.innerHTML="No Banner";

        return;

    }

    let index=0;

    bannerBox.innerHTML=`
        <img id="bannerImage"
        src="${banners[0].Image}"
        style="width:100%;height:100%;object-fit:cover;">
    `;

    setInterval(()=>{

        index++;

        if(index>=banners.length){

            index=0;

        }

        document.getElementById("bannerImage").src=banners[index].Image;

    },5000);

}

// ========= CATEGORY =========

function buildCategories(){

    categoryBox.innerHTML="";

    const groups=["All",...new Set(channels.map(c=>c.Group))];

    groups.forEach(group=>{

        const btn=document.createElement("button");

        btn.innerText=group;

        if(group==="All"){

            btn.classList.add("active");

        }

        btn.onclick=()=>{

            currentCategory=group;

            document.querySelectorAll("#categories button").forEach(b=>b.classList.remove("active"));

            btn.classList.add("active");

            if(group==="All"){

                renderChannels(channels);

            }else{

                renderChannels(

                    channels.filter(c=>c.Group===group)

                );

            }

        };

        categoryBox.appendChild(btn);

    });

    }
// ========= PLAY CHANNEL =========

function playChannel(ch){

    console.log("PLAY:", ch);

    playerModal.classList.remove("hide");

    playerTitle.innerText = ch.Name;

    let url = ch.URL;


    if(window.currentHls){

        window.currentHls.destroy();

        window.currentHls = null;

    }


    player.pause();

    player.src="";


    if(Hls.isSupported()){


        const hls = new Hls({

            enableWorker:true,

            lowLatencyMode:true

        });


        window.currentHls = hls;


        hls.loadSource(url);


        hls.attachMedia(player);


        hls.on(Hls.Events.MANIFEST_PARSED,()=>{

            player.play();

        });


        hls.on(Hls.Events.ERROR,(event,data)=>{

            console.log("HLS ERROR",data);

        });


    }

    else if(player.canPlayType('application/vnd.apple.mpegurl')){


        player.src=url;

        player.muted = true;

player.play().catch(err=>{
    console.log("Play blocked:",err);
});


    }

    else{


        alert("HLS not supported");


    }


}

// ========= CLOSE PLAYER =========

closePlayer.onclick = ()=>{

    player.pause();

    player.removeAttribute("src");

    player.load();

    if(window.currentHls){
        window.currentHls.destroy();
        window.currentHls = null;
    }

    playerModal.classList.add("hide");

};

// ========= SEARCH =========

searchBox.addEventListener("input",()=>{

    const keyword = searchBox.value.toLowerCase();

    const result = channels.filter(c=>{

        return (c.Name || "").toLowerCase().includes(keyword);

    });

    renderChannels(result);

});
