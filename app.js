// ================================
// 📡 FUNCIÓN: CARGAR NOTICIAS
// ================================
// Esta función trae noticias desde una API externa (BleepingComputer)
// y las muestra en tu página web

async function loadNews(){

try{

// 🌐 URL de la API de noticias (RSS convertido a JSON)
const url = "https://api.rss2json.com/v1/api.json?rss_url=https://www.bleepingcomputer.com/feed/";

// 📥 Pedimos los datos a la API
const res = await fetch(url);

// 🔄 Convertimos la respuesta en formato JSON (datos legibles)
const data = await res.json();

// 📦 Variable donde guardaremos el HTML que se va a mostrar en pantalla
let html = "";

// ⚠️ SEGURIDAD: si la API no devuelve datos, detenemos la función
if(!data || !data.items) return;

// 🔁 Recorremos las primeras 5 noticias
data.items.slice(0,5).forEach(item=>{

// 🧱 Construimos el diseño HTML de cada noticia
html += `
<div class="video">

🔥 ${item.title}<br> 
<!-- 🔥 muestra el título de la noticia -->

<a href="${item.link}" target="_blank">Leer más</a>
<!-- 🔗 link para abrir la noticia en otra pestaña -->

</div>
`;
});

// 🖥️ Mostramos todo el contenido en el div con id "newsBox"
document.getElementById("newsBox").innerHTML = html;

}catch(e){

// ❌ Si algo falla (internet, API, etc)
document.getElementById("newsBox").innerHTML = "Error cargando noticias 🔴";

}
}

// ================================
// 📂 FUNCIÓN: MOSTRAR / OCULTAR LINKS
// ================================
// Esta función abre y cierra el menú de links del sidebar

function toggleLinks(){

// 🔍 buscamos el menú en el HTML
const menu = document.getElementById("linksMenu");

// 🔄 si está visible lo ocultamos, si está oculto lo mostramos
if(menu.style.display === "block"){
menu.style.display = "none";
}else{
menu.style.display = "block";
}
}

// 🚀 Al cargar la página ejecuta las noticias automáticamente
loadNews();

// 🌧️ MATRIX BINARIO HD SIN PERDER CALIDAD

const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

// 🎯 Ajuste a resolución real de pantalla (EVITA BORROSIDAD)
function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

// 🔢 caracteres binarios
const chars = "01";

// 📏 tamaño de letra
const fontSize = 16;

// columnas
let columns = Math.floor(window.innerWidth / fontSize);

// gotas
let drops = new Array(columns).fill(0).map(() => {
  return Math.random() * (window.innerHeight / fontSize);
});

function draw(){
  // fondo con rastro suave
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ff99";
  ctx.font = fontSize + "px monospace";

  for(let i = 0; i < drops.length; i++){

    const text = chars[Math.floor(Math.random() * chars.length)];

    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if(drops[i] * fontSize > window.innerHeight && Math.random() > 0.975){
      drops[i] = 0;
    }

    drops[i]++;
  }
}

setInterval(draw, 33);
