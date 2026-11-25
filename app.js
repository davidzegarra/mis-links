
// ==============================================
// 🔐 SDZO SYSTEM - SEGURIDAD AES-256-GCM
// PBKDF2-SHA256 - 600000 ITERACIONES
// ==============================================

// Enlaces cifrados.
// La contraseña NO se almacena en este código.

const encryptedLinks = {
  "version": 1,
  "iterations": 600000,
  "programas1": {
    "salt": "fMZfBBWLmG3s6w9mlh8MwA==",
    "iv": "jkAWxJsHgua6wb7w",
    "data": "GLNW/vWkVRbVE11mfy7hEyUtvMe7913evps//OMS2pVrgTNZAvFhkRV7/UW78j0wTMeqSu6HbjtP9aCSebqXPrVdvmVyPG1+Mos0yqcYAi190z+jSxfivfWbpmprWcAmgcPqohrZ9A=="
  },
  "programas2": {
    "salt": "HPYQk8ozbP0o7/5DY2LTDw==",
    "iv": "QChTHs+REYBhXvpc",
    "data": "t9C3GeyM9Ct0L5KTToMyFuXozdTk//s9JDhwfjazvBW56NYImgFFw/iIKZVyr60owLBHsseFP5phbOMYk//SDtrGwRf5WMnESNu2lIBnF+Ch2FgdoCs4SqxSKFkfIdeEM+f0cKZfng=="
  }
};


// ==============================================
// ⚙️ FUNCIONES AUXILIARES
// ==============================================

const $ = id => document.getElementById(id);

const bytes = b64 =>
  Uint8Array.from(atob(b64), c => c.charCodeAt(0));


// ==============================================
// 🔓 DESCIFRADO AES-256
// ==============================================

async function decryptLink(record, password){

  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name:"PBKDF2",
      salt:bytes(record.salt),
      iterations:encryptedLinks.iterations,
      hash:"SHA-256"
    },
    base,
    {
      name:"AES-GCM",
      length:256
    },
    false,
    ["decrypt"]
  );

  const plain = await crypto.subtle.decrypt(
    {
      name:"AES-GCM",
      iv:bytes(record.iv)
    },
    key,
    bytes(record.data)
  );

  const url = new URL(
    new TextDecoder().decode(plain)
  );

  // Verificar que sea un enlace válido de Drive.

  if(
    url.origin !== "https://drive.google.com" ||
    !url.pathname.startsWith("/drive/")
  ){
    throw new Error("Enlace no válido");
  }

  return url.href;

}


// ==============================================
// 📂 MOSTRAR Y OCULTAR MENÚ DE ENLACES
// ==============================================

function toggleLinks(){

  const menu = $("linksMenu");

  menu.hidden = !menu.hidden;

  $("linksToggle").setAttribute(
    "aria-expanded",
    String(!menu.hidden)
  );

}

$("linksToggle").addEventListener("click", e => {

  e.preventDefault();

  toggleLinks();

});


// ==============================================
// 🔐 VENTANA DE AUTENTICACIÓN
// ==============================================

const dialog = $("accessDialog");

let selected = null;
let request = 0;

for(
  const button of document.querySelectorAll("[data-folder]")
){

  button.addEventListener("click", () => {

    selected = button.dataset.folder;

    $("folderName").textContent =
      selected === "programas1"
      ? "Programas 1"
      : "Programas 2";

    $("accessForm").reset();

    $("password").type = "password";

    $("accessStatus").textContent = "";

    dialog.showModal();

  });

}


// ==============================================
// 👁️ MOSTRAR U OCULTAR CONTRASEÑA
// ==============================================

$("showPassword").addEventListener("change", () => {

  $("password").type =
    $("showPassword").checked
    ? "text"
    : "password";

});


// ==============================================
// ❌ CANCELAR ACCESO
// ==============================================

$("cancel").addEventListener("click", () => {

  dialog.close();

});

dialog.addEventListener("close", () => {

  request++;

  selected = null;

  $("password").value = "";

  $("unlock").disabled = false;

});


// ==============================================
// 🔑 VERIFICAR CONTRASEÑA
// ==============================================

$("accessForm").addEventListener("submit", async e => {

  e.preventDefault();

  if(!selected || $("unlock").disabled){
    return;
  }

  if(!globalThis.crypto?.subtle){

    $("accessStatus").textContent =
      "Abre la web mediante HTTPS.";

    return;

  }

  const token = ++request;

  const record = encryptedLinks[selected];

  const password = $("password").value;

  $("unlock").disabled = true;

  $("accessStatus").textContent =
    "Verificando…";

  try{

    const url = await decryptLink(record, password);

    if(token !== request || !dialog.open){
      return;
    }

    $("password").value = "";

    // Abrir Google Drive en la misma pestaña.

    window.location.assign(url);

    dialog.close();

  }catch(error){

    if(token === request && dialog.open){

      $("accessStatus").textContent =
        "Contraseña incorrecta o código cifrado inválido.";

      $("password").select();

    }

  }finally{

    if(token === request){

      $("unlock").disabled = false;

    }

  }

});


// ==============================================
// 📡 CARGAR NOTICIAS DE CIBERSEGURIDAD
// ==============================================

async function loadNews(){

  const box = $("newsBox");

  box.textContent = "Cargando noticias…";

  try{

    const url =
      "https://api.rss2json.com/v1/api.json?rss_url=https://www.bleepingcomputer.com/feed/";

    const res = await fetch(url);

    if(!res.ok){
      throw new Error("HTTP");
    }

    const data = await res.json();

    if(!Array.isArray(data.items)){
      throw new Error("RSS");
    }

    const nodes = [];

    for(const item of data.items.slice(0,5)){

      const div = document.createElement("div");

      div.className = "video";

      div.append(
        document.createTextNode(
          "🔥 " + String(item.title || "")
        ),
        document.createElement("br")
      );

      try{

        const url = new URL(item.link);

        if(url.protocol === "https:"){

          const a = document.createElement("a");

          a.href = url.href;

          a.target = "_blank";

          a.rel = "noopener noreferrer";

          a.textContent = "Leer más";

          div.append(a);

        }

      }catch{}

      nodes.push(div);

    }

    box.replaceChildren(...nodes);

  }catch{

    box.textContent =
      "Error cargando noticias 🔴";

  }

}


// ==============================================
// 🔄 ACTUALIZACIÓN DE NOTICIAS
// ==============================================

$("refreshNews").addEventListener("click", loadNews);

loadNews();


// ==============================================
// 🌧️ FONDO MATRIX BINARIO
// ==============================================

const canvas = $("matrix");

const ctx = canvas.getContext("2d");

const fontSize = 16;

let columns = 0;

let drops = [];


// Ajustar el fondo al tamaño de la pantalla.

function resize(){

  canvas.width = window.innerWidth;

  canvas.height = window.innerHeight;

  columns = Math.floor(canvas.width / fontSize);

  drops = Array.from(
    {length:columns},
    () => Math.random() * canvas.height / fontSize
  );

}


// Dibujar los números binarios.

function draw(){

  ctx.fillStyle = "rgba(0,0,0,0.08)";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.font = fontSize + "px monospace";

  ctx.fillStyle = "#00ff99";

  for(let i = 0; i < columns; i++){

    const y = drops[i] * fontSize;

    ctx.fillText(
      Math.random() < .5 ? "0" : "1",
      i * fontSize,
      y
    );

    if(y > canvas.height){

      drops[i] = 0;

    }

    drops[i]++;

  }

}


// ==============================================
// 🚀 INICIAR MATRIX
// ==============================================

if(ctx){

  resize();

  window.addEventListener("resize", resize);

  setInterval(draw,33);

}
