const api = "https://je-tv.vercel.app/api/playlist";

fetch(api)
.then(res => res.json())
.then(data => {

const channels = data.channels;

const box = document.getElementById("channels");

channels.forEach(ch => {

let div = document.createElement("div");

div.className = "channel";

div.innerHTML = `
<img src="${ch.Logo}" width="60"><br>
<b>${ch.Name}</b>
`;

div.onclick = () => {

const player = document.getElementById("player");

player.src = ch.URL;
player.play();

};

box.appendChild(div);

});

})
.catch(err => {

console.log(err);

});
