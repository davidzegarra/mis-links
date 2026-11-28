
/* =========================================================
   SDZO SYSTEM 2.1
   ARCHIVO: app.js

   INDICE DE MODULOS:

   01. Seguridad AES-256-GCM
   02. Funciones auxiliares
   03. Descifrado de enlaces
   04. Menu de carpetas privadas
   05. Ventana de autenticacion
   06. Verificacion de contraseña
   07. Noticias de ciberseguridad
   08. Animacion Matrix
   09. Navegacion y servicios
   10. Fichas individuales
   11. Menu para telefonos moviles
   12. Navegacion dinamica
   13. Control de imagenes
   14. Carrusel inteligente de ocho portadas

   IMPORTANTE:
   Los comentarios explican la funcion de cada bloque.
   No afectan el funcionamiento de JavaScript.
   ========================================================= */


/* =========================================================
   01. SEGURIDAD AES-256-GCM

   Enlaces cifrados mediante AES de 256 bits.
   PBKDF2-SHA256 con 600000 iteraciones.

   NO modificar los valores salt, iv o data.
   La contraseña no se almacena en este codigo.

   El cifrado protege los enlaces, pero los permisos de
   acceso a las carpetas deben gestionarse en Google Drive.
   ========================================================= */

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


/* =========================================================
   02. FUNCIONES AUXILIARES
   ========================================================= */

// Permite localizar elementos HTML mediante su ID.
// Ejemplo: $("matrix") busca el elemento id="matrix".

const $ = id => document.getElementById(id);


// Convertir informacion Base64 en bytes.

const bytes = b64 =>
    Uint8Array.from(atob(b64), c => c.charCodeAt(0));


/* =========================================================
   03. DESCIFRADO DE ENLACES AES-256
   ========================================================= */

async function decryptLink(record, password) {

    // Importar la contraseña para generar la clave.

    const base = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );


    // Generar la clave AES mediante PBKDF2.

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: bytes(record.salt),
            iterations: encryptedLinks.iterations,
            hash: "SHA-256"
        },
        base,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["decrypt"]
    );


    // Descifrar el enlace protegido.

    const plain = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: bytes(record.iv)
        },
        key,
        bytes(record.data)
    );


    // Convertir el resultado en una direccion URL.

    const url = new URL(
        new TextDecoder().decode(plain)
    );


    // Comprobar que sea un enlace de Google Drive.

    if (
        url.origin !== "https://drive.google.com" ||
        !url.pathname.startsWith("/drive/")
    ) {
        throw new Error("Enlace no válido");
    }

    return url.href;

}


/* =========================================================
   04. MENU DE CARPETAS PRIVADAS

   Muestra u oculta los enlaces de Programas 1 y 2.
   ========================================================= */

function toggleLinks() {

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


/* =========================================================
   05. VENTANA DE AUTENTICACION
   ========================================================= */

const dialog = $("accessDialog");

let selected = null;
let request = 0;


// Detectar cual de las carpetas desea abrir el usuario.

for (
    const button of document.querySelectorAll("[data-folder]")
) {

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


// Mostrar u ocultar la contraseña.

$("showPassword").addEventListener("change", () => {

    $("password").type =
        $("showPassword").checked
            ? "text"
            : "password";

});


// Cancelar el acceso a una carpeta.

$("cancel").addEventListener("click", () => {

    dialog.close();

});


// Limpiar los datos cuando se cierre la ventana.

dialog.addEventListener("close", () => {

    request++;

    selected = null;

    $("password").value = "";

    $("unlock").disabled = false;

});


/* =========================================================
   06. VERIFICACION DE CONTRASEÑA

   Si la contraseña es correcta, abre Google Drive.
   Si es incorrecta, muestra un mensaje de error.
   ========================================================= */

$("accessForm").addEventListener("submit", async e => {

    e.preventDefault();

    if (!selected || $("unlock").disabled) {
        return;
    }


    // Web Crypto necesita un contexto seguro HTTPS.

    if (!globalThis.crypto?.subtle) {

        $("accessStatus").textContent =
            "Abre la web mediante HTTPS.";

        return;

    }


    const token = ++request;

    const record = encryptedLinks[selected];

    const password = $("password").value;


    $("unlock").disabled = true;

    $("accessStatus").textContent = "Verificando…";


    try {

        const url = await decryptLink(
            record,
            password
        );


        // Evitar completar una solicitud cancelada.

        if (token !== request || !dialog.open) {
            return;
        }


        $("password").value = "";


        // Abrir Google Drive en la misma pestaña.

        window.location.assign(url);

        dialog.close();


    } catch (error) {

        if (token === request && dialog.open) {

            $("accessStatus").textContent =
                "Contraseña incorrecta o código cifrado inválido.";

            $("password").select();

        }

    } finally {

        if (token === request) {

            $("unlock").disabled = false;

        }

    }

});


/* =========================================================
   07. NOTICIAS DE CIBERSEGURIDAD

   Fuente actual: BleepingComputer.
   Servicio intermediario: RSS2JSON.

   NOTA:
   Para cambiar la cantidad de noticias, modificar
   el numero 5 dentro de data.items.slice(0,5).

   Las noticias en español y sus fotografias se
   incorporaran en una etapa posterior.
   ========================================================= */

async function loadNews() {

    const box = $("newsBox");

    box.textContent = "Cargando noticias…";


    try {

        const url =
            "https://api.rss2json.com/v1/api.json?rss_url=https://www.bleepingcomputer.com/feed/";


        const res = await fetch(url);


        if (!res.ok) {

            throw new Error("HTTP");

        }


        const data = await res.json();


        if (!Array.isArray(data.items)) {

            throw new Error("RSS");

        }


        const nodes = [];


        // Cantidad de noticias que apareceran.

        for (const item of data.items.slice(0, 5)) {

            const div = document.createElement("div");

            div.className = "video";


            // Insertar texto sin ejecutar HTML externo.

            div.append(
                document.createTextNode(
                    "🔥 " + String(item.title || "")
                ),
                document.createElement("br")
            );


            try {

                const url = new URL(item.link);


                // Permitir solamente enlaces HTTPS.

                if (url.protocol === "https:") {

                    const a = document.createElement("a");

                    a.href = url.href;

                    a.target = "_blank";

                    a.rel = "noopener noreferrer";

                    a.textContent = "Leer más";

                    div.append(a);

                }

            } catch {}


            nodes.push(div);

        }


        box.replaceChildren(...nodes);


    } catch {

        box.textContent =
            "Error cargando noticias 🔴";

    }

}


// Boton para actualizar las noticias.

$("refreshNews").addEventListener(
    "click",
    loadNews
);


// Cargar noticias al ingresar a la pagina.

loadNews();


/* =========================================================
   08. ANIMACION MATRIX ORIGINAL

   IMPORTANTE:
   Se conserva la animacion original.

   fontSize = tamaño de los numeros binarios.
   #00ff99 = color verde de los binarios.
   0.08 = efecto de rastro de los numeros.
   33 ms = intervalo de actualizacion.

   El fondo degradado se configura en style.css.
   ========================================================= */

const canvas = $("matrix");

const ctx = canvas.getContext("2d");

const fontSize = 16;

let columns = 0;

let drops = [];


// Ajustar la animacion al tamaño de la pantalla.

function resize() {

    canvas.width = window.innerWidth;

    canvas.height = window.innerHeight;

    columns = Math.floor(
        canvas.width / fontSize
    );

    drops = Array.from(
        { length: columns },
        () => Math.random() * canvas.height / fontSize
    );

}


// Dibujar los numeros binarios.

function draw() {

    ctx.fillStyle = "rgba(0,0,0,0.08)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.font = fontSize + "px monospace";

    ctx.fillStyle = "#00ff99";


    for (let i = 0; i < columns; i++) {

        const y = drops[i] * fontSize;


        ctx.fillText(
            Math.random() < .5 ? "0" : "1",
            i * fontSize,
            y
        );


        if (y > canvas.height) {

            drops[i] = 0;

        }


        drops[i]++;

    }

}


// Iniciar la lluvia Matrix.

if (ctx) {

    resize();

    window.addEventListener(
        "resize",
        resize
    );

    setInterval(draw, 33);

}


/* =========================================================
   09. NAVEGACION Y SERVICIOS

   Localizar los componentes principales de la pagina.
   Estos identificadores deben coincidir con index.html.
   ========================================================= */

const sdzoSidebar = $("sidebar");

const sdzoMobileMenu = $("mobileMenu");

const sdzoPages = document.querySelectorAll(
    ".page-section"
);

const sdzoServiceDetails = $("serviceDetails");

const sdzoArticles = document.querySelectorAll(
    ".service-detail"
);


/* =========================================================
   CATALOGO DE LOS 13 SERVICIOS

   INSTRUCCIONES:

   image = nombre de la fotografia en la carpeta img.

   alt = descripcion alternativa de la fotografia.

   items = lista de actividades de cada servicio.

   mode = modalidad de asistencia.

   Para agregar una actividad, escribirla entre comillas
   y separarla mediante una coma.
   ========================================================= */

const sdzoServices = {


    // SERVICIO 01: MANTENIMIENTO INFORMATICO

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


    // SERVICIO 02: REDES Y CONECTIVIDAD

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


    // SERVICIO 03: OPTIMIZACION DE EQUIPOS

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


    // SERVICIO 04: INSTALACION DE SOFTWARE

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


    // SERVICIO 05: IMPRESORAS Y PERIFERICOS

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


    // SERVICIO 06: SOPORTE REMOTO

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


    // SERVICIO 07: AUTOMATIZACION DE PROCESOS

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


    // SERVICIO 08: DASHBOARDS WEB

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


    // SERVICIO 09: OFIMATICA

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


    // SERVICIO 10: INTELIGENCIA ARTIFICIAL

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


    // SERVICIO 11: DISEÑO GRAFICO

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


    // SERVICIO 12: EDICION AUDIOVISUAL

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


    // SERVICIO 13: CIBERSEGURIDAD

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


/* =========================================================
   10. CONSTRUIR FICHAS INDIVIDUALES DE SERVICIOS

   Genera automaticamente las fotografias, actividades,
   modalidades y botones de informacion de cada servicio.
   ========================================================= */

function prepareServiceDetails() {

    for (const article of sdzoArticles) {

        const info = sdzoServices[article.id];


        if (!info) {

            continue;

        }


        // Crear la fotografia de cada servicio.

        const image = document.createElement("img");

        image.src = "img/" + info.image;

        image.alt = info.alt;

        image.width = 640;

        image.height = 360;

        image.loading = "lazy";

        image.decoding = "async";

        image.style.marginTop = "20px";


        // Ubicar la fotografia despues del enlace Volver.

        const backLink = article.querySelector("a");


        if (backLink) {

            backLink.after(image);

        } else {

            article.prepend(image);

        }


        // Crear el titulo de actividades.

        const title = document.createElement("h3");

        title.textContent = "¿Qué incluye?";

        article.append(title);


        // Crear la lista de actividades.

        const list = document.createElement("ul");


        for (const item of info.items) {

            const li = document.createElement("li");

            li.textContent = item;

            list.append(li);

        }


        article.append(list);


        // Mostrar la modalidad de asistencia.

        const modeTitle = document.createElement("h3");

        modeTitle.textContent = "Modalidad de asistencia";


        const modeText = document.createElement("p");

        modeText.textContent = info.mode;


        article.append(modeTitle, modeText);


        // Crear el boton de informacion.

        const contact = document.createElement("a");

        contact.href = "#contacto";

        contact.className = "btn-primary";

        contact.textContent = "Más información";

        contact.style.color = "#06180f";


        article.append(contact);

    }

}


/* =========================================================
   11. MENU PARA TELEFONOS MOVILES

   El menu permanece oculto en pantallas pequeñas
   hasta que el visitante pulse el boton correspondiente.

   680 = ancho maximo considerado para este menu.
   ========================================================= */

function closeMobileMenu() {

    sdzoSidebar.classList.remove("open");

    sdzoMobileMenu.setAttribute(
        "aria-expanded",
        "false"
    );

}


// Abrir o cerrar el menu.

sdzoMobileMenu.addEventListener("click", () => {

    const opened = sdzoSidebar.classList.toggle(
        "open"
    );

    sdzoMobileMenu.setAttribute(
        "aria-expanded",
        String(opened)
    );

});


// Cerrar el menu al pulsar fuera del mismo.

document.addEventListener("click", event => {

    if (window.innerWidth > 680) {

        return;

    }


    if (

        sdzoSidebar.classList.contains("open") &&

        !sdzoSidebar.contains(event.target) &&

        !sdzoMobileMenu.contains(event.target)

    ) {

        closeMobileMenu();

    }

});


// Cerrar el menu con la tecla Escape.

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeMobileMenu();

    }

});


/* =========================================================
   12. NAVEGACION DINAMICA

   La pagina utiliza rutas con el simbolo #.

   Ejemplos:

   #inicio
   #mantenimiento
   #redes
   #diseno
   #ciberseguridad
   #proyectos

   El menu lateral permanece visible mientras cambia
   el contenido principal.
   ========================================================= */


// Resaltar la opcion seleccionada en el menu lateral.

function updateActiveMenu(route) {

    const links = sdzoSidebar.querySelectorAll(
        'a[href^="#"]'
    );


    for (const link of links) {

        const selected =

            link.getAttribute("href") === "#" + route ||

            (
                route === "servicios" &&
                link.getAttribute("href") === "#inicio"
            );


        link.classList.toggle(
            "active",
            selected
        );


        if (selected) {

            link.setAttribute(
                "aria-current",
                "page"
            );


            // Abrir el submenu relacionado.

            const parent = link.closest("details");


            if (parent) {

                parent.open = true;

            }

        } else {

            link.removeAttribute("aria-current");

        }

    }

}


// Mostrar la ficha del servicio solicitado.

function openService(route) {

    sdzoServiceDetails.hidden = false;


    for (const article of sdzoArticles) {

        article.hidden = article.id !== route;

    }

}


// Funcion principal de navegacion.

function navigate() {

    let route = window.location.hash.slice(1);


    // Mostrar Inicio cuando no exista una ruta.

    if (!route) {

        route = "inicio";

    }


    // Ocultar todas las secciones generales.

    for (const page of sdzoPages) {

        page.hidden = true;

    }


    // Ocultar fichas individuales.

    sdzoServiceDetails.hidden = true;


    for (const article of sdzoArticles) {

        article.hidden = true;

    }


    // Mostrar la seccion solicitada.

    if (

        Object.prototype.hasOwnProperty.call(
            sdzoServices,
            route
        )

    ) {

        openService(route);

    } else if (route === "servicios") {

        $("inicio").hidden = false;

    } else {

        const section = $(route);


        if (

            section &&

            section.classList.contains("page-section")

        ) {

            section.hidden = false;

        } else {

            // Regresar al inicio si no existe la ruta.

            route = "inicio";

            $("inicio").hidden = false;

        }

    }


    // Actualizar la opcion activa del menu.

    updateActiveMenu(route);


    // Cerrar el menu si se esta utilizando un movil.

    closeMobileMenu();


    // Ajustar la posicion de desplazamiento.

    requestAnimationFrame(() => {

        if (route === "servicios") {

            $("servicios").scrollIntoView({

                behavior: "auto",

                block: "start"

            });

        } else {

            window.scrollTo({

                top: 0,

                behavior: "instant"

            });

        }

    });

}


// Detectar cambios en la direccion de la pagina.

window.addEventListener(
    "hashchange",
    navigate
);


// Permitir volver a seleccionar un enlace activo.

document.addEventListener("click", event => {

    const link = event.target.closest(
        'a[href^="#"]'
    );


    if (!link) {

        return;

    }


    const href = link.getAttribute("href");


    // No interferir con las carpetas privadas.

    if (href === "#") {

        return;

    }


    if (href === window.location.hash) {

        event.preventDefault();

        navigate();

    }

});


/* =========================================================
   13. CONTROL DE IMAGENES NO DISPONIBLES

   Evita mostrar el simbolo de imagen rota cuando
   un archivo WebP no se encuentra en GitHub.
   ========================================================= */

function prepareImageFallbacks() {

    const images = document.querySelectorAll(

        '.main img[src^="img/"]'

    );


    for (const image of images) {

        const handleError = () => {

            image.style.visibility = "hidden";

        };


        image.addEventListener(
            "error",
            handleError
        );


        if (

            image.complete &&

            image.naturalWidth === 0

        ) {

            handleError();

        }

    }

}


/* =========================================================
   INICIAR LA INTERFAZ PRINCIPAL DE SDZO SYSTEM
   ========================================================= */

prepareServiceDetails();

prepareImageFallbacks();

navigate();


/* =========================================================
   14. CARRUSEL INTELIGENTE DE OCHO PORTADAS

   SDZO SYSTEM 2.1

   FUNCIONES:

   - Cambio automatico de fotografias.
   - Titulos blancos y verdes.
   - Descripciones independientes.
   - Botones con enlaces dinamicos.
   - Fotografias clicables.
   - Ocho indicadores de navegacion.
   - Flechas anterior y siguiente.
   - Pausa y reanudacion.
   - Control de errores de imagen.
   - Respeto de preferencias de movimiento reducido.

   Los textos NO estan incrustados en las fotografias.
   Se generan mediante JavaScript sobre la imagen.
   ========================================================= */

(function () {


    /* -----------------------------------------------------
       14.01. LOCALIZAR LOS ELEMENTOS DE LA PORTADA
       ----------------------------------------------------- */

    const hero = document.querySelector(".hero");

    if (!hero) return;


    const heroImage = hero.querySelector("img");

    const heroLabel = hero.querySelector(".hero-label");

    const heroTitle = hero.querySelector("h1");

    const heroDescription = hero.querySelector(
        ".hero-content p"
    );

    const heroButtons = hero.querySelectorAll(
        ".hero-buttons a"
    );


    // Detener este modulo si falta un elemento necesario.

    if (

        !heroImage ||

        !heroLabel ||

        !heroTitle ||

        !heroDescription ||

        heroButtons.length < 2

    ) {

        return;

    }


    /* -----------------------------------------------------
       14.02. CONFIGURACION DE LAS OCHO PORTADAS

       INSTRUCCIONES PARA FUTURAS MODIFICACIONES:

       src = direccion de la fotografia.

       alt = descripcion de la fotografia.

       label = texto pequeño superior.

       titleWhite = primera linea del titulo en blanco.

       titleGreen = segunda linea en verde neon.

       description = descripcion del servicio.

       button = texto del boton principal.

       link = destino del boton principal y fotografia.

       secondButton = texto del boton secundario.

       secondLink = destino del boton secundario.

       IMPORTANTE:
       Los destinos deben coincidir con los ID de las
       secciones existentes en index.html.
       ----------------------------------------------------- */

    const slides = [


        // =================================================
        // PORTADA 01: PRESENTACION GENERAL
        // =================================================

        {

            src: "img/portada-01.webp",

            alt: "Estación de trabajo tecnológica",

            label:
                "TECNOLOGÍA · SEGURIDAD · INNOVACIÓN",

            titleWhite:
                "Tu tecnología,",

            titleGreen:
                "nuestras soluciones.",

            description:
                "Soporte informático, diseño, automatización, soluciones digitales y seguridad informática.",

            button:
                "Explorar servicios",

            link:
                "#servicios",

            secondButton:
                "Conocer SDZO",

            secondLink:
                "#sobre-mi"

        },


        // =================================================
        // PORTADA 02: MANTENIMIENTO INFORMATICO
        // =================================================

        {

            src: "img/portada-02.webp",

            alt: "Mantenimiento preventivo de portátiles",

            label:
                "SOPORTE Y MANTENIMIENTO INFORMÁTICO",

            titleWhite:
                "Cuida tus equipos,",

            titleGreen:
                "mejora su rendimiento.",

            description:
                "Limpieza preventiva, diagnóstico y optimización de ordenadores y portátiles.",

            button:
                "Ver mantenimiento",

            link:
                "#mantenimiento",

            secondButton:
                "Optimización de equipos",

            secondLink:
                "#optimizacion"

        },


        // =================================================
        // PORTADA 03: REDES Y CONECTIVIDAD
        // =================================================

        {

            src: "img/portada-03.webp",

            alt: "Routers, cableado Ethernet y conectores RJ45",

            label:
                "REDES Y CONECTIVIDAD",

            titleWhite:
                "Conexiones eficientes,",

            titleGreen:
                "tecnología sin barreras.",

            description:
                "Configuración de routers, redes Wi-Fi, cableado Ethernet y conectividad de dispositivos.",

            button:
                "Explorar redes",

            link:
                "#redes",

            secondButton:
                "Impresoras en red",

            secondLink:
                "#impresoras"

        },


        // =================================================
        // PORTADA 04: AUTOMATIZACION Y DASHBOARDS
        // =================================================

        {

            src: "img/portada-04.webp",

            alt: "Automatización y paneles de indicadores",

            label:
                "AUTOMATIZACIÓN Y DASHBOARDS",

            titleWhite:
                "Automatiza procesos,",

            titleGreen:
                "transforma tus datos.",

            description:
                "Integración de información, automatización de tareas y visualización de indicadores.",

            button:
                "Automatización",

            link:
                "#automatizacion",

            secondButton:
                "Dashboards web",

            secondLink:
                "#dashboard"

        },


        // =================================================
        // PORTADA 05: DISEÑO GRAFICO
        // =================================================

        {

            src: "img/portada-05.webp",

            alt: "Estación de diseño gráfico y creatividad digital",

            label:
                "DISEÑO GRÁFICO",

            titleWhite:
                "Transforma tus ideas",

            titleGreen:
                "en diseños visuales.",

            description:
                "Tarjetas de presentación, materiales publicitarios, edición de imágenes y creatividad digital.",

            button:
                "Explorar diseño gráfico",

            link:
                "#diseno",

            secondButton:
                "Conocer SDZO",

            secondLink:
                "#sobre-mi"

        },


        // =================================================
        // PORTADA 06: EDICION AUDIOVISUAL
        // =================================================

        {

            src: "img/portada-06.webp",

            alt: "Estación de edición de videos",

            label:
                "EDICIÓN AUDIOVISUAL",

            titleWhite:
                "Da vida a tus ideas,",

            titleGreen:
                "crea contenido multimedia.",

            description:
                "Edición de videos, transiciones y contenido audiovisual para plataformas digitales.",

            button:
                "Ver edición audiovisual",

            link:
                "#video",

            secondButton:
                "Diseño gráfico",

            secondLink:
                "#diseno"

        },


        // =================================================
        // PORTADA 07: CIBERSEGURIDAD E IA
        // =================================================

        {

            src: "img/portada-07.webp",

            alt: "Protección de sistemas y seguridad informática",

            label:
                "CIBERSEGURIDAD E INTELIGENCIA ARTIFICIAL",

            titleWhite:
                "Protege tu información,",

            titleGreen:
                "aprovecha la innovación.",

            description:
                "Seguridad informática, prevención de riesgos digitales e inteligencia artificial aplicada.",

            button:
                "Ciberseguridad",

            link:
                "#ciberseguridad",

            secondButton:
                "Inteligencia artificial",

            secondLink:
                "#inteligencia-artificial"

        },


        // =================================================
        // PORTADA 08: VIDEOS Y TUTORIALES
        //
        // El destino principal se activara cuando
        // creemos esta nueva seccion en index.html.
        // =================================================

        {

            src: "img/portada-08.webp",

            alt: "Creación de contenido tecnológico",

            label:
                "VIDEOS Y TUTORIALES",

            titleWhite:
                "Descubre, aprende",

            titleGreen:
                "y experimenta.",

            description:
                "Unboxing, reviews, tutoriales, ciberseguridad y demostraciones de proyectos tecnológicos.",

            button:
                "Explorar videos",

            link:
                "#videos-tutoriales",

            secondButton:
                "Ver proyectos",

            secondLink:
                "#proyectos"

        }

    ];


    /* -----------------------------------------------------
       14.03. VELOCIDAD DEL CARRUSEL

       INSTRUCCIONES:

       3000 = 3 segundos.
       5000 = 5 segundos.
       7000 = 7 segundos.
       10000 = 10 segundos.

       Actualmente cambia cada siete segundos.
       ----------------------------------------------------- */

    const interval = 7000;


    let currentIndex = 0;

    let desiredIndex = 0;

    let timer = null;

    let requestNumber = 0;


    // Detectar preferencias de accesibilidad.

    const reducedMotion = window.matchMedia(

        "(prefers-reduced-motion: reduce)"

    ).matches;


    let paused = reducedMotion;


    /* -----------------------------------------------------
       14.04. CREAR CONTROLES DEL CARRUSEL
       ----------------------------------------------------- */

    const controls = document.createElement("div");

    controls.className = "hero-controls";

    controls.setAttribute(
        "role",
        "group"
    );

    controls.setAttribute(
        "aria-label",
        "Controles del carrusel"
    );


    // Funcion auxiliar para crear botones accesibles.

    function createButton(text, label) {

        const button = document.createElement("button");

        button.type = "button";

        button.textContent = text;

        button.setAttribute(
            "aria-label",
            label
        );

        return button;

    }


    // Boton para retroceder.

    const previous = createButton(
        "❮",
        "Portada anterior"
    );


    // Boton para avanzar.

    const next = createButton(
        "❯",
        "Portada siguiente"
    );


    // Boton para detener o reanudar.

    const pause = createButton(
        "Ⅱ",
        "Pausar carrusel"
    );


    controls.append(previous);


    /* -----------------------------------------------------
       14.05. INDICADORES DE LAS PORTADAS

       Se genera automaticamente un indicador
       por cada fotografia del arreglo slides.

       No es necesario crear los ocho puntos manualmente.
       ----------------------------------------------------- */

    const dots = slides.map(function (_, index) {

        const dot = createButton(

            "",

            "Mostrar portada " + (index + 1)

        );


        dot.className = "hero-dot";


        dot.addEventListener("click", function () {

            showSlide(index);

            restartTimer();

        });


        controls.append(dot);

        return dot;

    });


    controls.append(next, pause);

    hero.append(controls);


    /* -----------------------------------------------------
       14.06. HACER CLICABLE LA FOTOGRAFIA

       La fotografia tendra el mismo destino que
       el boton principal de cada portada.

       Su tamaño y posicion se controlan desde style.css.
       ----------------------------------------------------- */

    const imageLink = document.createElement("a");

    imageLink.className = "hero-image-link";

    imageLink.hidden = true;

    hero.append(imageLink);


    /* -----------------------------------------------------
       14.07. ACTUALIZAR LOS INDICADORES

       El punto verde representa la portada visible.
       ----------------------------------------------------- */

    function updateDots() {

        dots.forEach(function (dot, index) {

            const active = index === currentIndex;


            dot.classList.toggle(
                "active",
                active
            );


            dot.setAttribute(

                "aria-pressed",

                String(active)

            );

        });

    }


    /* -----------------------------------------------------
       14.08. ACTUALIZAR TEXTOS Y ENLACES

       Cada fotografia tiene su propio contenido.

       Los colores de los titulos pueden modificarse aqui:

       #ffffff = blanco.
       #00ff99 = verde neon.
       ----------------------------------------------------- */


    // Comprobar que una ruta exista y pueda abrirse.

    function routeExists(href) {

        if (!href || !href.startsWith("#")) {

            return false;

        }

        const route = href.slice(1);

        const destination = document.getElementById(route);

        if (!destination) {

            return false;

        }

        return (

            route === "servicios" ||

            destination.classList.contains("page-section") ||

            Object.prototype.hasOwnProperty.call(
                sdzoServices,
                route
            )

        );

    }


    // Configurar un boton y verificar su destino.

    function configureLink(element, text, href) {

        element.textContent = text;


        if (routeExists(href)) {

            element.setAttribute("href", href);

            element.removeAttribute("aria-disabled");

        } else {

            element.removeAttribute("href");

            element.setAttribute(
                "aria-disabled",
                "true"
            );

            element.textContent = "Próximamente";

        }

    }


    function updateContent(slide) {


        // Texto superior de la portada.

        heroLabel.textContent = slide.label;


        // Primera linea: titulo blanco.

        const whiteTitle = document.createElement("span");

        whiteTitle.textContent = slide.titleWhite;

        whiteTitle.style.color = "#ffffff";

        whiteTitle.style.display = "block";


        // Segunda linea: titulo verde neon.

        const greenTitle = document.createElement("span");

        greenTitle.textContent = slide.titleGreen;

        greenTitle.style.color = "#00ff99";

        greenTitle.style.display = "block";


        // Sustituir el titulo anterior.

        heroTitle.replaceChildren(

            whiteTitle,

            greenTitle

        );


        // Cambiar descripcion.

        heroDescription.textContent = slide.description;


        // Cambiar texto y destino de los dos botones.

        configureLink(

            heroButtons[0],

            slide.button,

            slide.link

        );


        configureLink(

            heroButtons[1],

            slide.secondButton,

            slide.secondLink

        );


        // Cambiar destino de la fotografia completa.

        if (routeExists(slide.link)) {

            imageLink.href = slide.link;

            imageLink.setAttribute(

                "aria-label",

                slide.button

            );

            imageLink.hidden = false;

        } else {

            // Evitar navegar hacia una seccion inexistente.

            imageLink.removeAttribute("href");

            imageLink.hidden = true;

        }

    }


    /* -----------------------------------------------------
       14.09. MOSTRAR LA PORTADA SELECCIONADA

       Primero carga la nueva fotografia.
       Despues actualiza imagen, textos y botones.

       Si una imagen no existe, conserva la anterior.
       ----------------------------------------------------- */

    function showSlide(index, immediate = false) {


        // Permitir volver a la primera portada
        // despues de llegar a la ultima.

        const target =

            (index + slides.length) % slides.length;


        desiredIndex = target;

        const selected = slides[target];


        // Identificador para evitar conflictos entre
        // cambios rapidos solicitados por el usuario.

        const request = ++requestNumber;


        // Precargar solamente la fotografia solicitada.

        const preload = new Image();


        preload.onload = function () {

            if (request !== requestNumber) return;


            function applySlide() {

                if (request !== requestNumber) return;


                heroImage.src = selected.src;

                heroImage.alt = selected.alt;

                heroImage.style.visibility = "visible";


                currentIndex = target;


                // Cambiar imagen y contenido conjuntamente.

                updateContent(selected);

                updateDots();


                heroImage.style.opacity = "1";

            }


            // Aplicar sin animacion cuando corresponda.

            if (immediate || reducedMotion) {

                applySlide();

            } else {

                // Transicion suave de 350 milisegundos.

                heroImage.style.opacity = "0";

                setTimeout(applySlide, 350);

            }

        };


        // Si falla la carga, mantener la portada anterior.

        preload.onerror = function () {

            if (request === requestNumber) {

                heroImage.style.opacity = "1";

                console.warn(

                    "SDZO: No se pudo cargar " +

                    selected.src

                );

                // Conservar desiredIndex permite continuar
                // hacia la siguiente imagen en otro ciclo.

            }

        };


        preload.src = selected.src;

    }


    /* -----------------------------------------------------
       14.10. TEMPORIZADOR AUTOMATICO

       El carrusel se detiene cuando:

       - El usuario pulsa Pausa.
       - Se cambia de pestaña.
       - Se abandona la pagina de inicio.
       - Se navega con el teclado dentro del carrusel.
       ----------------------------------------------------- */

    function stopTimer() {

        clearInterval(timer);

        timer = null;

    }


    function restartTimer() {

        stopTimer();


        if (

            paused ||

            document.hidden ||

            !hero.getClientRects().length ||

            hero.matches(":focus-within")

        ) {

            return;

        }


        timer = setInterval(function () {


            if (hero.getClientRects().length) {

                showSlide(desiredIndex + 1);

            } else {

                stopTimer();

            }


        }, interval);

    }


    /* -----------------------------------------------------
       14.11. FLECHAS DE NAVEGACION
       ----------------------------------------------------- */


    // Retroceder una portada.

    previous.addEventListener("click", function () {

        showSlide(desiredIndex - 1);

        restartTimer();

    });


    // Avanzar una portada.

    next.addEventListener("click", function () {

        showSlide(desiredIndex + 1);

        restartTimer();

    });


    /* -----------------------------------------------------
       14.12. BOTON DE PAUSA Y REPRODUCCION
       ----------------------------------------------------- */

    function updatePauseButton() {

        pause.textContent = paused ? "▶" : "Ⅱ";


        pause.setAttribute(

            "aria-label",

            paused

                ? "Reanudar carrusel"

                : "Pausar carrusel"

        );


        pause.setAttribute(

            "aria-pressed",

            String(paused)

        );

    }


    pause.addEventListener("click", function () {

        paused = !paused;


        updatePauseButton();


        // Retirar el foco al reanudar el carrusel.

        if (!paused) {

            pause.blur();

        }


        restartTimer();

    });


    // Pausar mientras se navega dentro del carrusel.

    hero.addEventListener(
        "focusin",
        stopTimer
    );


    hero.addEventListener("focusout", function () {

        requestAnimationFrame(restartTimer);

    });


    /* -----------------------------------------------------
       14.13. CONTROL DE VISIBILIDAD

       Evita mantener el carrusel ejecutandose cuando
       el visitante se encuentra en otra seccion.
       ----------------------------------------------------- */

    document.addEventListener(

        "visibilitychange",

        restartTimer

    );


    window.addEventListener("hashchange", function () {

        requestAnimationFrame(restartTimer);

    });


    /* -----------------------------------------------------
       14.14. INICIAR EL CARRUSEL INTELIGENTE
       ----------------------------------------------------- */

    updateDots();

    updatePauseButton();

    showSlide(0, true);

    restartTimer();


})();


/* =========================================================
   FIN DEL ARCHIVO APP.JS

   SDZO SYSTEM 2.1

   PROXIMAS ETAPAS:

   - Mejorar fotografias de los servicios.
   - Rediseñar fichas individuales.
   - Ampliar perfil profesional.
   - Mejorar portafolio de proyectos.
   - Incorporar articulos de ciberseguridad.
   - Mejorar Cyber News.
   - Crear Videos y tutoriales.
   - Integrar YouTube y TikTok.
   - Optimizar SEO.
   - Realizar pruebas finales.

   ========================================================= */
