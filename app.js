async function loadNews(){
try{
const url = "https://api.rss2json.com/v1/api.json?rss_url=https://www.bleepingcomputer.com/feed/";
const res = await fetch(url);
const data = await res.json();

let html = "";

data.items.slice(0,5).forEach(item=>{
html += `
<div class="video">
🔥 ${item.title}<br>
<a href="${item.link}" target="_blank">Leer más</a>
</div>
`;
});

document.getElementById("newsBox").innerHTML = html;

}catch(e){
document.getElementById("newsBox").innerHTML = "Error cargando noticias 🔴";
}
}

function toggleLinks(){
const menu = document.getElementById("linksMenu");
menu.style.display = menu.style.display === "block" ? "none" : "block";
}

loadNews();
