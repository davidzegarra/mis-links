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

//
// 📏 AJUSTE DE PANTALLA
//
function resize(){

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

//
// 🧠 INICIALIZAR MATRIX
//
function setupMatrix(){

  columns = Math.floor(canvas.width / fontSize);

  // 🌧️ distribución aleatoria inicial (evita línea horizontal)
  drops = new Array(columns).fill(0).map(() =>
    Math.random() * (canvas.height / fontSize)
  );
}

//
// 🔥 INICIAR TODO
//
resize();
setupMatrix();

window.addEventListener("resize", () => {
  resize();
  setupMatrix();
});

//
// 🎨 DIBUJO MATRIX
//
function draw(){

  // fondo con rastro suave
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ff99";
  ctx.font = fontSize + "px monospace";

  for(let i = 0; i < columns; i++){

    const text = chars[Math.floor(Math.random() * chars.length)];

    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.fillText(text, x, y);

    // reinicio de caída
    if(y > canvas.height){
      drops[i] = 0;
    }

    drops[i]++;
  }
}

//
// ⚡ LOOP PRINCIPAL
//
setInterval(draw, 33);
