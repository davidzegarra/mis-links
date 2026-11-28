
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


// ==============================================
// SDZO SYSTEM 2.0
// MÓDULO DE NAVEGACIÓN Y SERVICIOS
// ==============================================


// ==============================================
// 01. ELEMENTOS DE LA NUEVA INTERFAZ
// ==============================================

const sdzoSidebar = $("sidebar");

const sdzoMobileMenu = $("mobileMenu");

const sdzoPages = document.querySelectorAll(
  ".page-section"
);

const sdzoServiceDetails = $("serviceDetails");

const sdzoArticles = document.querySelectorAll(
  ".service-detail"
);


// ==============================================
// 02. INFORMACIÓN DETALLADA DE LOS SERVICIOS
//
// Aquí podremos incorporar nuevas actividades,
// fotografías y descripciones posteriormente.
// ==============================================

const sdzoServices = {

  "mantenimiento": {

    image: "mantenimiento.webp",

    alt: "Mantenimiento de ordenadores y portátiles",

    items: [

      "Limpieza preventiva de equipos informáticos.",

      "Revisión del funcionamiento del ordenador.",

      "Diagnóstico básico de problemas de hardware y software.",

      "Optimización del rendimiento del sistema.",

      "Asesoramiento para el cuidado del equipo."

    ],

    mode: "Presencial, según las necesidades del equipo."

  },


  "redes": {

    image: "redes.webp",

    alt: "Cableado Ethernet y conectividad",

    items: [

      "Configuración de routers y redes Wi-Fi.",

      "Instalación de cableado Ethernet.",

      "Crimpado de conectores RJ45.",

      "Configuración de conexiones de red local.",

      "Diagnóstico de problemas de conectividad."

    ],

    mode: "Presencial o remota, según la configuración."

  },


  "optimizacion": {

    image: "optimizacion.webp",

    alt: "Actualización de memoria RAM y discos SSD",

    items: [

      "Evaluación de componentes compatibles.",

      "Ampliación de memoria RAM.",

      "Sustitución de discos HDD por SSD.",

      "Asesoramiento para actualizar componentes.",

      "Orientación para mejorar el rendimiento del equipo."

    ],

    mode: "Asesoramiento presencial o remoto."

  },


  "software": {

    image: "software.webp",

    alt: "Instalación de aplicaciones informáticas",

    items: [

      "Instalación de programas y aplicaciones.",

      "Configuración de software.",

      "Instalación de antivirus.",

      "Instalación y actualización de controladores.",

      "Uso de software debidamente licenciado."

    ],

    mode: "Presencial o remota."

  },


  "impresoras": {

    image: "impresoras.webp",

    alt: "Configuración de impresoras y periféricos",

    items: [

      "Instalación de impresoras locales.",

      "Configuración de impresoras inalámbricas.",

      "Configuración de impresoras compartidas en red.",

      "Instalación de controladores de impresión.",

      "Configuración básica de periféricos."

    ],

    mode: "Presencial o remota, según el dispositivo."

  },


  "soporte-remoto": {

    image: "soporte-remoto.webp",

    alt: "Asistencia informática mediante acceso remoto",

    items: [

      "Asistencia técnica a distancia.",

      "Instalación de aplicaciones.",

      "Configuración de programas.",

      "Orientación sobre problemas informáticos.",

      "Conexiones remotas autorizadas por el usuario."

    ],

    mode: "Remota mediante conexión a Internet."

  },


  "automatizacion": {

    image: "automatizacion.webp",

    alt: "Automatización e integración de información",

    items: [

      "Automatización mediante Google Apps Script.",

      "Integración de hojas de cálculo con Firebase.",

      "Sincronización de información.",

      "Organización de procesos administrativos.",

      "Desarrollo de prototipos de automatización."

    ],

    mode: "Remota, según el alcance del proyecto."

  },


  "dashboard": {

    image: "dashboard.webp",

    alt: "Dashboard web de resultados e indicadores",

    items: [

      "Visualización de resultados.",

      "Diseño de paneles de indicadores.",

      "Seguimiento de actividades y productividad.",

      "Organización de información estadística.",

      "Desarrollo de dashboards web."

    ],

    mode: "Remota, según el alcance del proyecto."

  },


  "ofimatica": {

    image: "ofimatica.webp",

    alt: "Ofimática y gestión de hojas de cálculo",

    items: [

      "Manejo de Microsoft Office.",

      "Elaboración y organización de documentos.",

      "Gestión de hojas de cálculo.",

      "Organización de información administrativa.",

      "Uso de herramientas digitales de productividad."

    ],

    mode: "Presencial o remota."

  },


  "inteligencia-artificial": {

    image: "inteligencia-artificial.webp",

    alt: "Inteligencia artificial aplicada a proyectos",

    items: [

      "Asistencia en proyectos mediante IA.",

      "Organización y planificación de trabajos.",

      "Elaboración y mejora de instrucciones para IA.",

      "Uso de herramientas de productividad.",

      "Apoyo en la estructuración de información."

    ],

    mode: "Presencial o remota."

  },


  "diseno": {

    image: "diseno.webp",

    alt: "Diseño gráfico digital",

    items: [

      "Diseño de tarjetas de presentación.",

      "Diseño de materiales publicitarios.",

      "Edición básica e intermedia de imágenes.",

      "Uso de CorelDRAW y herramientas gráficas.",

      "Preparación de contenido visual digital."

    ],

    mode: "Remota. Nivel intermedio."

  },


  "video": {

    image: "video.webp",

    alt: "Edición de vídeos y contenido audiovisual",

    items: [

      "Edición y organización de clips de vídeo.",

      "Incorporación de textos y transiciones.",

      "Preparación de contenidos multimedia.",

      "Edición de vídeos para redes sociales."

    ],

    mode: "Remota. Nivel intermedio."

  },


  "ciberseguridad": {

    image: "ciberseguridad.webp",

    alt: "Protección digital y seguridad informática",

    items: [

      "Asesoramiento en seguridad informática.",

      "Buenas prácticas de protección de información.",

      "Orientación sobre contraseñas seguras.",

      "Prevención de riesgos digitales.",

      "Asesoramiento sobre protección de dispositivos.",

      "Concienciación sobre amenazas informáticas."

    ],

    mode: "Asesoramiento presencial o remoto."

  }

};


// ==============================================
// 03. CONSTRUIR LAS FICHAS DE SERVICIOS
//
// Creamos el contenido mediante elementos DOM,
// evitando insertar código HTML externo.
// ==============================================

function prepareServiceDetails(){

  for(const article of sdzoArticles){

    const info = sdzoServices[article.id];

    if(!info){
      continue;
    }

    const image = document.createElement("img");

    image.src = "img/" + info.image;

    image.alt = info.alt;

    image.width = 640;

    image.height = 360;

    image.loading = "lazy";

    image.decoding = "async";

    image.style.marginTop = "20px";


    // Mostrar fotografía después del enlace de regreso.

    const backLink = article.querySelector("a");

    if(backLink){

      backLink.after(image);

    }else{

      article.prepend(image);

    }


    // Título de actividades.

    const title = document.createElement("h3");

    title.textContent = "¿Qué incluye?";

    article.append(title);


    // Lista de actividades del servicio.

    const list = document.createElement("ul");

    for(const item of info.items){

      const li = document.createElement("li");

      li.textContent = item;

      list.append(li);

    }

    article.append(list);


    // Modalidad de asistencia.

    const modeTitle = document.createElement("h3");

    modeTitle.textContent = "Modalidad de asistencia";

    const modeText = document.createElement("p");

    modeText.textContent = info.mode;

    article.append(modeTitle, modeText);


    // Enlace hacia la sección de contacto.

    const contact = document.createElement("a");

    contact.href = "#contacto";

    contact.className = "btn-primary";

    contact.textContent = "Más información";

    contact.style.color = "#06180f";

    article.append(contact);

  }

}


// ==============================================
// 04. ABRIR Y CERRAR MENÚ EN TELÉFONOS
// ==============================================

function closeMobileMenu(){

  sdzoSidebar.classList.remove("open");

  sdzoMobileMenu.setAttribute(
    "aria-expanded",
    "false"
  );

}


sdzoMobileMenu.addEventListener("click", () => {

  const opened = sdzoSidebar.classList.toggle(
    "open"
  );

  sdzoMobileMenu.setAttribute(
    "aria-expanded",
    String(opened)
  );

});


// Cerrar menú al pulsar fuera del mismo.

document.addEventListener("click", event => {

  if(window.innerWidth > 680){
    return;
  }

  if(

    sdzoSidebar.classList.contains("open") &&

    !sdzoSidebar.contains(event.target) &&

    !sdzoMobileMenu.contains(event.target)

  ){

    closeMobileMenu();

  }

});


// Cerrar menú al presionar Escape.

document.addEventListener("keydown", event => {

  if(event.key === "Escape"){

    closeMobileMenu();

  }

});


// ==============================================
// 05. RESALTAR OPCIÓN SELECCIONADA
// ==============================================

function updateActiveMenu(route){

  const links = sdzoSidebar.querySelectorAll(
    'a[href^="#"]'
  );

  for(const link of links){

    const selected =

      link.getAttribute("href") === "#" + route ||

      (
        route === "servicios" &&
        link.getAttribute("href") === "#inicio"
      );

    link.classList.toggle("active", selected);

    if(selected){

      link.setAttribute("aria-current", "page");

      const parent = link.closest("details");

      if(parent){

        parent.open = true;

      }

    }else{

      link.removeAttribute("aria-current");

    }

  }

}


// ==============================================
// 06. ABRIR FICHA INDIVIDUAL DE SERVICIO
// ==============================================

function openService(route){

  sdzoServiceDetails.hidden = false;

  for(const article of sdzoArticles){

    article.hidden = article.id !== route;

  }

}


// ==============================================
// 07. NAVEGACIÓN DINÁMICA
//
// Utilizamos el identificador de la URL (#)
// para conocer qué sección desea ver el usuario.
// ==============================================

function navigate(){

  let route = window.location.hash.slice(1);

  if(!route){

    route = "inicio";

  }


  // Ocultar todas las secciones generales.

  for(const page of sdzoPages){

    page.hidden = true;

  }


  // Ocultar fichas individuales.

  sdzoServiceDetails.hidden = true;

  for(const article of sdzoArticles){

    article.hidden = true;

  }


  // Mostrar la sección solicitada.

  if(
    Object.prototype.hasOwnProperty.call(
      sdzoServices,
      route
    )
  ){

    openService(route);

  }else if(route === "servicios"){

    $("inicio").hidden = false;

  }else{

    const section = $(route);

    if(
      section &&
      section.classList.contains("page-section")
    ){

      section.hidden = false;

    }else{

      route = "inicio";

      $("inicio").hidden = false;

    }

  }


  // Actualizar el menú seleccionado.

  updateActiveMenu(route);


  // Cerrar menú móvil.

  closeMobileMenu();


  // Ajustar el desplazamiento.

  requestAnimationFrame(() => {

    if(route === "servicios"){

      $("servicios").scrollIntoView({

        behavior: "auto",

        block: "start"

      });

    }else{

      window.scrollTo({

        top: 0,

        behavior: "instant"

      });

    }

  });

}


// ==============================================
// 08. DETECTAR CAMBIOS DE NAVEGACIÓN
// ==============================================

window.addEventListener(
  "hashchange",
  navigate
);


// Permitir volver a seleccionar el enlace actual.

document.addEventListener("click", event => {

  const link = event.target.closest('a[href^="#"]');

  if(!link){
    return;
  }

  const href = link.getAttribute("href");

  // No interferir con las carpetas protegidas.

  if(href === "#"){
    return;
  }

  if(href === window.location.hash){

    event.preventDefault();

    navigate();

  }

});


// ==============================================
// 09. CONTROL DE IMÁGENES NO DISPONIBLES
//
// Evita mostrar imágenes rotas mientras estamos
// preparando los archivos WebP.
// ==============================================

function prepareImageFallbacks(){

  const images = document.querySelectorAll(

    '.main img[src^="img/"]'

  );

  for(const image of images){

    const handleError = () => {

      image.style.visibility = "hidden";

    };

    image.addEventListener(
      "error",
      handleError
    );

    if(
      image.complete &&
      image.naturalWidth === 0
    ){

      handleError();

    }

  }

}


// ==============================================
// 10. INICIAR NUEVA INTERFAZ SDZO V2
// ==============================================

prepareServiceDetails();

prepareImageFallbacks();

navigate();


// ==============================================
// FIN DEL MÓDULO SDZO SYSTEM 2.0
// ==============================================


