//
// ================================
// 📡 CARGAR NOTICIAS (API REAL)
// ================================
// Trae noticias de ciberseguridad desde BleepingComputer

async function loadNews(){

try{

  const url = "https://api.rss2json.com/v1/api.json?rss_url=https://www.bleepingcomputer.com/feed/";

  const res = await fetch(url);
  const data = await res.json();

  let html = "";

  if(!data || !data.items) return;

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

  document.getElementById("newsBox").innerHTML =
    "Error cargando noticias 🔴";

}
}


// ================================
// 📂 MOSTRAR / OCULTAR LINKS
// ================================
// Abre y cierra el menú lateral

function toggleLinks(){

  const menu = document.getElementById("linksMenu");

  if(menu.style.display === "block"){
    menu.style.display = "none";
  }else{
    menu.style.display = "block";
  }
}


// 🚀 AUTO EJECUTAR NOTICIAS
loadNews();


// ================================
// 🌧️ MATRIX BINARIO ESTABLE (FINAL)
// ================================
// Fondo tipo Matrix sin errores y compatible con GitHub Pages

const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const chars = "01";
const fontSize = 16;

let columns;
let drops = [];

let mouseX = 0;

document.addEventListener("mousemove", e=>{
  mouseX = e.clientX;
});

function initMatrix(){

  // 🔥 IMPORTANTE: forzar render primero
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 🔥 esperar un frame REAL del navegador
  requestAnimationFrame(() => {

    columns = Math.floor(canvas.width / fontSize);

    drops = new Array(columns).fill(0).map(() =>
      Math.random() * (canvas.height / fontSize)
    );

  });
}

function draw(){

  ctx.fillStyle = "black";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.font = fontSize + "px monospace";

  for(let i = 0; i < columns; i++){

    const text = chars[Math.floor(Math.random()*chars.length)];

    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.fillStyle = (Math.abs(mouseX - x) < 100)
      ? "#ffffff"
      : "#00ff99";

    ctx.fillText(text, x, y);

    if(y > canvas.height){
      drops[i] = 0;
    }

    drops[i]++;
  }
}

// 🚀 inicialización segura
initMatrix();
window.addEventListener("resize", initMatrix);

setInterval(draw, 33);
