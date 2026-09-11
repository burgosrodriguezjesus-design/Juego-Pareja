/* ============================================================
   MOTOR · el hilo que une todo
   ------------------------------------------------------------
   Lleva la partida y decide qué toca ahora.

   Hay dos formas de jugar y el motor elige sola:
     · Si el aparato puede con 3D, los capítulos se recorren
       andando por el mundo y los acertijos salen encima.
     · Si no puede, se juega con las pantallas dibujadas en 2D.
   Todo lo demás (acertijos, recuerdos, álbum, final) es igual
   en los dos casos.
   ============================================================ */
const Motor = (function () {

  const el = U.el;
  const $  = U.$;

  const escenario = $("#escenario");
  const hud       = $("#hud");
  const hudLugar  = $("#hud-lugar");
  const hudProg   = $("#hud-progreso");
  const velo      = $("#transicion");
  const capaMundo = $("#capa-mundo");
  const lienzo3d  = $("#lienzo3d");
  const brujula   = $("#brujula");
  const mira      = $("#mira");
  const cartel    = $("#cartel-objeto");
  const btnTocar  = $("#btn-tocar");
  const avisoRaton= $("#aviso-raton");

  let H = null, cfg = null, estado = null;
  let pantallaActual = "";
  let vueltaDe = null;
  let modo3d = false;
  let enMundo = false;
  let mundoListo = false;
  let relojBrujula = null;
  let musicaZona = -1;
  const esTactil = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;

  /* ==========================================================
     Partida guardada
     ========================================================== */
  function estadoLimpio() {
    return { capitulo: 0, resueltos: [], fragmentos: {}, prologoVisto: false,
             terminado: false, vioControles: false };
  }
  const clave = () => "nh:" + (cfg.partida || "partida");
  const guardar = () => U.guardado.escribir(clave(), estado);
  function cargar() {
    const s = U.guardado.leer(clave());
    return (!s || typeof s !== "object") ? estadoLimpio() : Object.assign(estadoLimpio(), s);
  }
  function borrarPartida() { U.guardado.borrar(clave()); estado = estadoLimpio(); }
  const hayPartida = () => estado.resueltos.length > 0 || estado.prologoVisto;
  const progresoTexto = () => `${estado.resueltos.length} de ${H.capitulos.length}`;

  /* ==========================================================
     Pantallas 2D (portada, prólogo, y todo si no hay 3D)
     ========================================================== */
  async function cambiar(pintar, escena, semillaId) {
    velo.classList.add("visible");
    await U.esperar(520);

    salirDelMundo();
    U.vaciar(escenario);
    escenario.scrollTop = 0;
    escenario.style.display = "";
    if (escena) Escena.pintar(escena, semillaId);
    pintar();

    velo.classList.remove("visible");
    escenario.focus({ preventScroll: true });
  }

  /* ==========================================================
     Paneles: contenido 2D encima del mundo 3D
     ========================================================== */
  function abrirPanel(pintar) {
    document.body.classList.add("con-panel");
    escenario.style.display = "";
    Mundo.bloquear(true);
    ocultarCartel();
    // El aviso del ratón ocupa toda la pantalla; si se queda puesto se
    // traga los clics del panel que hay debajo.
    comprobarRaton();
    U.vaciar(escenario);
    escenario.scrollTop = 0;
    pintar();
    escenario.focus({ preventScroll: true });
  }

  function cerrarPanel() {
    document.body.classList.remove("con-panel");
    U.vaciar(escenario);
    comprobarRaton();
  }

  /** Muestra contenido: panel si estamos en el mundo, pantalla entera si no. */
  function mostrar(pintar, escena, semillaId) {
    if (enMundo) abrirPanel(pintar);
    else cambiar(pintar, escena, semillaId);
  }

  function verHud(visible, lugar, progreso) {
    hud.hidden = !visible;
    escenario.classList.toggle("con-hud", visible);
    if (visible) {
      hudLugar.textContent = lugar || "";
      hudProg.textContent  = progreso || "";
    }
  }

  /* ==========================================================
     EL MUNDO
     ========================================================== */
  function entrarAlMundo(destino) {
    pantallaActual = "mundo";
    enMundo = true;
    cerrarPanel();
    escenario.style.display = "none";

    document.body.classList.add("explorando");
    if (esTactil) document.body.classList.add("tactil");
    Escena.pausar(true);          // el lienzo 2D queda tapado: que no gaste
    lienzo3d.classList.add("visible");
    capaMundo.hidden = false;
    mira.classList.add("visible");
    brujula.classList.add("visible");

    Mundo.actualizarEstado(estado);
    Mundo.arrancar();
    Mundo.bloquear(false);

    if (destino === "claro" || destino == null) Mundo.alClaro();
    else Mundo.alSitio(destino);

    verHud(true, "", progresoTexto());
    musicaZona = -2;
    if (!relojBrujula) relojBrujula = setInterval(latido, 120);
    if (!esTactil) comprobarRaton();
  }

  function salirDelMundo() {
    if (!enMundo) return;
    enMundo = false;
    Escena.pausar(false);
    document.body.classList.remove("explorando", "con-panel");
    lienzo3d.classList.remove("visible");
    capaMundo.hidden = true;
    avisoRaton.hidden = true;
    if (relojBrujula) { clearInterval(relojBrujula); relojBrujula = null; }
    Mundo.bloquear(true);
    Mundo.parar();
  }

  /** Cada poco: brújula, música de la zona y aviso del ratón. */
  function latido() {
    const g = Mundo.guia();
    if (g) {
      $("#brujula-flecha").style.transform = `rotate(${g.ang}rad)`;
      $("#brujula-texto").textContent = g.titulo;
      $("#brujula-dist").textContent = Math.round(g.dist) + " m";
    }
    // la canción de cada sitio empieza al entrar en él
    const z = Mundo.zonaActual();
    if (z !== musicaZona) {
      musicaZona = z;
      const cap = z >= 0 ? H.capitulos[z] : null;
      Audio_.poner(cap ? (cap.musica || "") : ((H.final && H.final.musica) || ""));
      verHud(true, cap ? (cap.lugar || cap.titulo) : "El claro", progresoTexto());
    }
  }

  function comprobarRaton() {
    if (esTactil) return;
    const hayPanel = document.body.classList.contains("con-panel");
    avisoRaton.hidden = !enMundo || hayPanel || document.pointerLockElement === lienzo3d;
  }

  function ocultarCartel() {
    cartel.hidden = true;
    btnTocar.hidden = true;
    mira.classList.remove("cerca");
  }

  /** Cuando te pones delante de un ancla. */
  function alAcercarse(datos) {
    if (!datos || document.body.classList.contains("con-panel")) return ocultarCartel();

    const zn = datos.zona;
    let titulo, accion, activa = true;

    if (datos.esFinal) {
      if (datos.hecho)                 { titulo = "El claro"; accion = "volver a leer la carta"; }
      else if (Mundo.hayObjetivo)      { titulo = "El claro";
                                         accion = "aquí acaba el viaje, pero todavía no"; activa = false; }
      else                             { titulo = "Una última cosa"; accion = "abrir"; }
    } else {
      const cap = zn.cap;
      if (datos.hecho)                 { titulo = cap.recuerdo && cap.recuerdo.titulo || cap.titulo;
                                         accion = "volver a verlo"; }
      else if (zn.i === Mundo.objetivo){ titulo = cap.titulo; accion = "acercarte"; }
      else                             { titulo = "Todavía no"; accion = "aquí hay algo, pero aún no"; activa = false; }
    }

    $("#cartel-titulo").textContent = titulo;
    $("#cartel-accion").innerHTML = activa
      ? (esTactil ? accion : "pulsa <b>E</b> para " + accion)
      : accion;
    cartel.hidden = false;
    btnTocar.hidden = !activa;
    mira.classList.toggle("cerca", activa);
  }

  /** Cuando pulsas E o el botón. */
  function alInteractuar(datos) {
    if (!datos || document.body.classList.contains("con-panel")) return;
    Audio_.sfx.toque();

    if (datos.esFinal) {
      if (datos.hecho) return cartaFinal();
      if (Mundo.hayObjetivo) { U.avisar("Todavía falta algún recuerdo"); return; }
      return candadoFinal();
    }
    const zn = datos.zona;
    if (datos.hecho) return recuerdoDe(zn.i, false);
    if (zn.i !== Mundo.objetivo) { U.avisar("Este sitio todavía no te toca"); return; }
    presentarCapitulo(zn.i);
  }

  /* ==========================================================
     PORTADA
     ========================================================== */
  function portada() {
    pantallaActual = "portada";
    cambiar(() => {
      verHud(false);
      Audio_.poner((H.prologo && H.prologo.musica) || "");
      const continuar = hayPartida();

      escenario.appendChild(
        el("section", { class: "pantalla portada escalonado" },
          el("div", { class: "para" }, "Para " + (cfg.nombreElla || "ti")),
          el("h1", {}, cfg.titulo || "Nuestra Historia"),
          cfg.subtitulo ? el("div", { class: "subtitulo" }, cfg.subtitulo) : null,
          el("div", { class: "adorno" }),
          cfg.dedicatoria ? el("p", { class: "dedicatoria" }, cfg.dedicatoria) : null,
          el("div", { class: "fila-botones" },
            el("button", { class: "boton", type: "button",
              onclick: () => { Audio_.activar(); continuar ? seguirDondeIbas() : empezar(); }
            }, continuar ? "Seguir donde lo dejaste" : (cfg.textoEmpezar || "Empezar")),
            continuar ? el("button", { class: "boton boton--texto", type: "button",
              onclick: () => {
                if (confirm("¿Empezar otra vez desde el principio?\nSe borrará lo que llevas.")) {
                  borrarPartida(); empezar();
                }
              }
            }, "Empezar de nuevo") : null
          )
        )
      );
    }, (H.prologo && H.prologo.escena) || { tipo: "cielo", momento: "noche", clima: "estrellas" }, "portada");
  }

  function seguirDondeIbas() {
    if (estado.terminado) return cartaFinal();
    if (!estado.prologoVisto) return prologo();
    if (modo3d) return entrarAlMundo("claro");
    if (estado.resueltos.length >= H.capitulos.length) return candadoFinal();
    mapaViaje();
  }

  function empezar() { estado = estadoLimpio(); guardar(); prologo(); }

  /* ==========================================================
     PRÓLOGO
     ========================================================== */
  function prologo() {
    pantallaActual = "prologo";
    const p = H.prologo || {};

    cambiar(async () => {
      verHud(false);
      Audio_.poner(p.musica);

      const caja = el("div", { class: "narracion" });
      const pie  = el("div", { class: "fila-botones", estilo: { opacity: "0", transition: "opacity .8s ease" } });
      const seguir = el("div", { class: "pista-seguir" }, "toca para ir más rápido");
      escenario.appendChild(el("section", { class: "pantalla" }, caja, seguir, pie));

      const promesa = Dialogo.escribir(caja, p.lineas || [], { velocidad: 36, pausa: 520 });
      Dialogo.permitirSaltar(promesa);
      await promesa;

      seguir.remove();
      pie.appendChild(el("button", { class: "boton", type: "button",
        onclick: () => {
          estado.prologoVisto = true; guardar();
          if (modo3d) primerosPasos(); else abrirCapitulo(0);
        }
      }, p.boton || "Seguir"));
      requestAnimationFrame(() => { pie.style.opacity = "1"; });
    }, p.escena, "prologo");
  }

  /* ==========================================================
     Explicación de los mandos, una sola vez
     ========================================================== */
  function primerosPasos() {
    if (estado.vioControles) return entrarAlMundo("claro");

    cambiar(() => {
      verHud(false);
      Audio_.poner("");
      escenario.appendChild(
        el("section", { class: "pantalla escalonado" },
          el("div", { class: "sello" }, "antes de empezar"),
          el("div", { class: "tarjeta" },
            el("h2", { class: "centrado", estilo: { marginBottom: "18px" } }, "Vas a poder andar"),
            el("p", { class: "centrado", estilo: { color: "var(--tinta-suave)" } },
              "Los sitios existen de verdad y puedes ir a donde quieras. " +
              "El que te toca está señalado con una columna de luz: se ve desde lejos, " +
              "así que no hay forma de perderse."),
            el("div", { estilo: { marginTop: "22px", lineHeight: "2.2", textAlign: "center",
                                  color: "var(--tinta-suave)", fontSize: ".95rem" } },
              esTactil
                ? el("div", { html:
                    "<b>Palanca izquierda</b> para andar<br>" +
                    "<b>Arrastra a la derecha</b> para mirar<br>" +
                    "<b>El botón dorado</b> cuando tengas algo delante" })
                : el("div", { html:
                    "<b>W A S D</b> o las flechas para andar<br>" +
                    "<b>Mueve el ratón</b> para mirar<br>" +
                    "<b>Mayúsculas</b> para correr · <b>E</b> para acercarte a algo<br>" +
                    "<b>Esc</b> para soltar el ratón" })
            )
          ),
          el("div", { class: "fila-botones" },
            el("button", { class: "boton", type: "button",
              onclick: () => { estado.vioControles = true; guardar(); entrarAlMundo("claro"); }
            }, "Entrar"))
        )
      );
    }, { tipo: "cielo", momento: "noche", clima: "estrellas" }, "controles");
  }

  /* ==========================================================
     MAPA DEL VIAJE
     ========================================================== */
  function mapaViaje() {
    const eraMundo = enMundo;
    pantallaActual = eraMundo ? "mapa-panel" : "mapa";
    vueltaDe = null;

    const siguiente = H.capitulos.findIndex((c) => !estado.resueltos.includes(c.id));
    const todosHechos = siguiente === -1;

    const pintar = () => {
      verHud(true, "El viaje", progresoTexto());
      if (!eraMundo) Audio_.poner("");

      const paradas = el("div", { class: "paradas escalonado" },
        H.capitulos.map((c, i) => {
          const hecho  = estado.resueltos.includes(c.id);
          const actual = i === siguiente;
          const abierto = hecho || actual;
          return el("button", {
            class: "parada" + (hecho ? " parada--hecha" : "") + (actual ? " parada--actual" : "") +
                   (abierto ? "" : " parada--bloqueada"),
            type: "button", disabled: !abierto,
            onclick: () => {
              if (!abierto) return;
              if (eraMundo) { entrarAlMundo(i); }     // te deja a la entrada del sitio
              else abrirCapitulo(i);
            }
          },
            el("span", { class: "punto" }, hecho ? "✓" : (actual ? "◆" : "·")),
            el("span", { class: "info" },
              el("span", { class: "nombre" }, abierto ? c.titulo : "todavía no"),
              abierto && c.lugar ? el("span", { class: "sitio" }, c.lugar) : null),
            hecho && estado.fragmentos[c.id]
              ? el("span", { class: "marca" }, estado.fragmentos[c.id]) : null
          );
        })
      );

      const letras = H.capitulos.map((c) =>
        estado.resueltos.includes(c.id) ? (estado.fragmentos[c.id] || "?") : "");

      escenario.appendChild(
        el("section", { class: "pantalla" },
          el("div", { class: "mapa-titulo" },
            el("h2", {}, todosHechos ? "Ya está todo" : "El viaje"),
            el("p", {}, todosHechos
              ? (eraMundo ? "Vuelve al claro del centro." : "Has abierto todos los recuerdos.")
              : (eraMundo ? "Toca un sitio para ir directa." : "Toca el sitio al que quieras volver."))),
          paradas,
          el("div", { class: "clave-parcial" },
            el("div", { class: "etiqueta" }, "Lo que llevas"),
            el("div", { class: "casillas" },
              letras.map((L) => el("div", { class: "casilla" + (L ? " llena" : "") }, L || "·")))),
          el("div", { class: "fila-botones" },
            eraMundo
              ? el("button", { class: "boton boton--fantasma", type: "button",
                               onclick: () => volverAlMundo() }, "Volver al mundo")
              : (todosHechos
                  ? el("button", { class: "boton", type: "button", onclick: candadoFinal }, "Ir al final")
                  : null))
        )
      );
    };

    if (eraMundo) abrirPanel(pintar);
    else cambiar(pintar, { tipo: "cielo", momento: "noche", clima: "estrellas" }, "mapa");
  }

  /** Cierra el panel y devuelve el control del mundo. */
  function volverAlMundo() {
    pantallaActual = "mundo";
    cerrarPanel();
    escenario.style.display = "none";
    Mundo.bloquear(false);
    Mundo.actualizarEstado(estado);
    verHud(true, "", progresoTexto());
    musicaZona = -2;
    comprobarRaton();
  }

  /* ==========================================================
     CAPÍTULO · presentación
     ========================================================== */
  function abrirCapitulo(i) {          // solo en modo 2D
    const c = H.capitulos[i];
    if (!c) return candadoFinal();
    estado.capitulo = i; guardar();
    pantallaActual = "capitulo";

    cambiar(async () => {
      verHud(true, c.lugar || c.titulo, "Capítulo " + (i + 1) + " de " + H.capitulos.length);
      Audio_.poner(c.musica);
      escenario.appendChild(await cabeceraCapitulo(i, () => acertijoDe(i)));
    }, c.escena, c.id);
  }

  /** En 3D: la presentación del capítulo sale como panel al tocar el ancla. */
  function presentarCapitulo(i) {
    const c = H.capitulos[i];
    estado.capitulo = i; guardar();
    pantallaActual = "capitulo-panel";
    abrirPanel(async () => {
      verHud(true, c.lugar || c.titulo, "Capítulo " + (i + 1) + " de " + H.capitulos.length);
      escenario.appendChild(await cabeceraCapitulo(i, () => acertijoDe(i)));
    });
  }

  async function cabeceraCapitulo(i, seguirA) {
    const c = H.capitulos[i];
    const cab = el("div", { class: "cap-cabecera" },
      el("div", { class: "cap-numero" }, "Capítulo " + (i + 1)),
      el("h2", {}, c.titulo),
      c.lugar ? el("div", { class: "cap-lugar" }, c.lugar) : null,
      c.fecha ? el("div", { class: "sello", estilo: { marginTop: "14px" } }, c.fecha) : null);

    const caja = el("div", { class: "narracion", estilo: { minHeight: "22vh" } });
    const pie  = el("div", { class: "fila-botones", estilo: { opacity: "0", transition: "opacity .8s ease" } });
    const seguir = el("div", { class: "pista-seguir" }, "toca para ir más rápido");
    const seccion = el("section", { class: "pantalla" }, cab, caja, seguir, pie);

    // se escribe después de estar en pantalla
    setTimeout(async () => {
      const promesa = Dialogo.escribir(caja, c.intro || [], { velocidad: 32, pausa: 460 });
      Dialogo.permitirSaltar(promesa);
      await promesa;
      seguir.remove();
      pie.appendChild(el("button", { class: "boton", type: "button", onclick: seguirA }, "Continuar"));
      requestAnimationFrame(() => { pie.style.opacity = "1"; });
    }, 60);

    return seccion;
  }

  /* ==========================================================
     CAPÍTULO · el acertijo
     ========================================================== */
  function acertijoDe(i) {
    const c = H.capitulos[i];
    if (estado.resueltos.includes(c.id)) return recuerdoDe(i, false);

    pantallaActual = "acertijo";
    const a = c.acertijo || {};
    const listaPistas = a.pistas || [];
    let fallos = 0, pistasDadas = 0, resuelto = false;

    const zonaPistas = el("div", { class: "pistas" });
    const zonaAyuda  = el("div", { class: "ayuda-fila" });

    function darPista(automatica) {
      if (pistasDadas >= listaPistas.length) {
        if (!automatica) U.avisar("Ya no me quedan más pistas");
        return;
      }
      zonaPistas.appendChild(el("div", { class: "pista" },
        el("span", { class: "ico" }, "✦"), el("span", {}, listaPistas[pistasDadas++])));
      repintarAyuda();
    }

    function rendirse() {
      if (resuelto) return;
      resuelto = true;
      zonaPistas.appendChild(el("div", { class: "pista" },
        el("span", { class: "ico" }, "♡"), el("span", {}, Acertijos.solucion(a))));
      U.vaciar(zonaAyuda).appendChild(
        el("button", { class: "boton", type: "button", onclick: () => superar(i, true) }, "Seguir"));
    }

    function repintarAyuda() {
      U.vaciar(zonaAyuda);
      if (resuelto) return;
      if (pistasDadas < listaPistas.length) {
        zonaAyuda.appendChild(el("button", { class: "boton boton--fantasma", type: "button",
          onclick: () => darPista(false) }, pistasDadas === 0 ? "Dame una pista" : "Otra pista"));
      }
      if (cfg.permitirRendirse && fallos >= (cfg.fallosParaRendirse || 6)) {
        zonaAyuda.appendChild(el("button", { class: "boton boton--texto", type: "button",
          onclick: rendirse }, "No me acuerdo, dímelo tú"));
      }
    }

    const api = {
      bloqueado: () => resuelto,
      acierto() {
        if (resuelto) return;
        resuelto = true;
        Audio_.sfx.bien();
        U.celebrar(28);
        setTimeout(() => superar(i, false), 900);
      },
      fallo() {
        fallos++;
        Audio_.sfx.mal();
        U.avisar(fraseDeFallo(fallos), "mal");
        if (fallos % (cfg.fallosParaPista || 2) === 0) darPista(true);
        repintarAyuda();
      }
    };

    mostrar(() => {
      verHud(true, c.lugar || c.titulo, "Capítulo " + (i + 1) + " de " + H.capitulos.length);
      escenario.appendChild(
        el("section", { class: "pantalla acertijo escalonado" },
          el("div", { class: "sello" }, c.lugar || c.titulo),
          el("h3", { class: "pregunta" }, a.pregunta || "…"),
          a.subtitulo ? el("div", { class: "subpregunta" }, a.subtitulo) : null,
          Acertijos.crear(a, api),
          zonaPistas, zonaAyuda));
      repintarAyuda();
    }, c.escena, c.id);
  }

  const FRASES_FALLO = ["No es eso… piensa otra vez", "Casi", "Uy, no",
                        "Frío, frío", "Esa no es", "Prueba otra cosa"];
  const fraseDeFallo = (n) => FRASES_FALLO[Math.min(n - 1, FRASES_FALLO.length - 1)];

  /* ==========================================================
     CAPÍTULO · el recuerdo
     ========================================================== */
  function superar(i, rendida) {
    const c = H.capitulos[i];
    if (!estado.resueltos.includes(c.id)) {
      estado.resueltos.push(c.id);
      if (c.fragmento) estado.fragmentos[c.id] = String(c.fragmento);
      guardar();
      if (modo3d) Mundo.actualizarEstado(estado);
    }
    recuerdoDe(i, !rendida);
  }

  function recuerdoDe(i, celebrar) {
    const c = H.capitulos[i];
    const r = c.recuerdo || {};
    const letra = estado.fragmentos[c.id];
    pantallaActual = "recuerdo";
    const ultimo = estado.resueltos.length >= H.capitulos.length;

    mostrar(() => {
      verHud(true, c.lugar || c.titulo, progresoTexto());
      if (!enMundo) Audio_.poner(c.musica);
      if (celebrar) { Audio_.sfx.abrir(); U.celebrar(20); }

      escenario.appendChild(
        el("section", { class: "pantalla recuerdo escalonado" },
          el("div", { class: "insignia" }, "Recuerdo desbloqueado"),
          el("h3", {}, r.titulo || c.titulo),
          r.texto ? el("p", { class: "cuerpo" }, r.texto) : null,
          r.cita ? el("div", { class: "cita" }, r.cita) : null,
          r.foto ? U.foto(r.foto, r.titulo || c.titulo, "marco--polaroid") : null,
          letra ? el("div", { class: "fragmento" },
            el("div", { class: "etiqueta" }, "Te llevas esta letra"),
            el("div", { class: "letra" }, letra)) : null,
          el("div", { class: "fila-botones" },
            el("button", { class: "boton", type: "button",
              onclick: () => {
                if (enMundo) volverAlMundo();
                else if (ultimo) candadoFinal();
                else mapaViaje();
              }
            }, enMundo ? "Seguir andando" : (ultimo ? "Ya están todas" : "Seguir el viaje")),
            enMundo && ultimo
              ? el("div", { class: "pista-seguir", estilo: { width: "100%", marginTop: "6px" } },
                  "vuelve al claro del centro")
              : null)
        )
      );
    }, c.escena, c.id);
  }

  /* ==========================================================
     CANDADO FINAL
     ========================================================== */
  function candadoFinal() {
    pantallaActual = "candado";
    const f = H.final || {};
    const claveBuena = String(f.clave || "");
    let fallos = 0, abierto = false;
    const letras = H.capitulos.map((c) => estado.fragmentos[c.id]).filter(Boolean);

    mostrar(() => {
      verHud(true, "El final", progresoTexto());
      if (!enMundo) Audio_.poner(f.musica);

      const campo = el("input", { type: "text", class: "campo-texto", placeholder: "la palabra",
        autocomplete: "off", autocapitalize: "characters", spellcheck: "false",
        "aria-label": "Palabra final" });
      const zonaPistas = el("div", { class: "pistas" });

      function probar() {
        if (abierto) return;
        const v = campo.value.trim();
        if (!v) { campo.focus(); return; }
        if (U.acierta(v, [claveBuena])) {
          abierto = true; campo.disabled = true;
          Audio_.sfx.abrir(); U.celebrar(50);
          setTimeout(cartaFinal, 1100);
        } else {
          fallos++;
          Audio_.sfx.mal();
          U.avisar("Esa no es… vuelve a mirar las letras", "mal");
          campo.select();
          const caja = U.$(".candado");
          if (caja) { caja.classList.remove("sacudir"); void caja.offsetWidth; caja.classList.add("sacudir"); }
          if (fallos === 2 && f.pistaClave) {
            zonaPistas.appendChild(el("div", { class: "pista" },
              el("span", { class: "ico" }, "✦"), el("span", {}, f.pistaClave)));
          }
          if (fallos >= 4) {
            zonaPistas.appendChild(el("div", { class: "pista" },
              el("span", { class: "ico" }, "♡"),
              el("span", {}, "Tiene " + claveBuena.length + " letras y empieza por “" + claveBuena[0] + "”.")));
          }
        }
      }
      campo.addEventListener("keydown", (e) => { if (e.key === "Enter") probar(); });

      escenario.appendChild(
        el("section", { class: "pantalla candado escalonado" },
          el("div", { class: "sello" }, "última puerta"),
          el("h2", {}, f.tituloCandado || "Una última cosa"),
          el("div", { class: "narracion", estilo: { minHeight: "auto", fontSize: "1.2rem" } },
            (f.textoCandado || []).map((t) => el("div", { class: "linea puesta" }, t))),
          el("div", { class: "letras-ganadas" },
            letras.map((L) => el("div", { class: "letra-ganada" }, L))),
          el("div", { class: "cuerpo" }, campo,
            el("div", { class: "fila-botones" },
              el("button", { class: "boton", type: "button", onclick: probar }, "Abrir"))),
          zonaPistas));

      setTimeout(() => { if (window.innerWidth > 760) campo.focus(); }, 700);
    }, f.escena, "final");
  }

  /* ==========================================================
     CARTA FINAL
     ========================================================== */
  function cartaFinal() {
    pantallaActual = "carta";
    const f = H.final || {};
    estado.terminado = true;
    guardar();
    if (modo3d && mundoListo) Mundo.actualizarEstado(estado);

    mostrar(async () => {
      verHud(true, "", "fin");
      Audio_.poner(f.musica);

      const caja = el("div", { class: "carta" });
      const pie  = el("div", { class: "fila-botones", estilo: { opacity: "0", transition: "opacity 1s ease" } });
      const seguir = el("div", { class: "pista-seguir" }, "toca para ir más rápido");
      escenario.appendChild(
        el("section", { class: "pantalla" },
          el("div", { class: "sello" }, f.titulo || "Para ti"), caja, seguir, pie));

      const promesa = Dialogo.escribir(caja, f.carta || [], { velocidad: 42, pausa: 620 });
      Dialogo.permitirSaltar(promesa);
      await promesa;
      seguir.remove();

      if (f.firma) {
        const fi = el("div", { class: "linea firma" }, f.firma);
        caja.appendChild(fi);
        requestAnimationFrame(() => fi.classList.add("puesta"));
      }
      if (f.foto) {
        const m = U.foto(f.foto, "Nosotros", "marco--polaroid");
        if (m) { m.classList.add("carta-foto"); caja.appendChild(m); }
      }
      U.celebrar(40);

      const regalo = f.regalo || {};
      if (regalo.mostrar) {
        pie.appendChild(el("button", { class: "boton", type: "button",
          onclick: (e) => { e.target.remove(); abrirRegalo(); } }, regalo.boton || "Hay algo más"));
      }
      pie.appendChild(el("button", { class: "boton boton--fantasma", type: "button",
        onclick: () => { vueltaDe = "carta"; verAlbum(); } }, "Ver los recuerdos"));
      if (enMundo) {
        pie.appendChild(el("button", { class: "boton boton--texto", type: "button",
          onclick: volverAlMundo }, "Volver al mundo"));
      }
      requestAnimationFrame(() => { pie.style.opacity = "1"; });
    }, f.escena, "final");
  }

  function abrirRegalo() {
    const g = (H.final || {}).regalo || {};
    Audio_.sfx.abrir();
    U.celebrar(60);
    const caja = el("div", { class: "regalo" },
      el("h3", {}, g.titulo || "Tu regalo"),
      g.texto ? el("p", {}, g.texto) : null,
      g.foto ? U.foto(g.foto, g.titulo || "Regalo", "marco--polaroid") : null);
    const seccion = U.$(".pantalla");
    if (seccion) { seccion.appendChild(caja); caja.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }

  /* ==========================================================
     ÁLBUM
     ========================================================== */
  function verAlbum() {
    const eraMundo = enMundo;
    const desde = vueltaDe || pantallaActual;
    pantallaActual = "album";

    const pintar = () => {
      verHud(true, "Recuerdos", progresoTexto());
      escenario.appendChild(
        Album.pantalla(H.capitulos, estado.resueltos, () => {
          vueltaDe = null;
          if (eraMundo) volverAlMundo();
          else if (desde === "carta" || estado.terminado) cartaFinal();
          else mapaViaje();
        }));
    };

    if (eraMundo) abrirPanel(pintar);
    else cambiar(pintar, { tipo: "cielo", momento: "noche", clima: "estrellas" }, "album");
  }

  /* ==========================================================
     Comprobación del contenido
     ========================================================== */
  function revisarContenido(h) {
    const fallos = [];
    if (!h || typeof h !== "object") return ["No se ha podido leer contenido/historia.js"];
    if (!Array.isArray(h.capitulos) || !h.capitulos.length)
      fallos.push("No hay ningún capítulo en la lista 'capitulos'.");

    const ids = new Set();
    (h.capitulos || []).forEach((c, i) => {
      const n = "Capítulo " + (i + 1) + (c && c.titulo ? " (" + c.titulo + ")" : "");
      if (!c.id) fallos.push(n + ": le falta el 'id'.");
      else if (ids.has(c.id)) fallos.push(n + ": el id '" + c.id + "' está repetido.");
      else ids.add(c.id);

      const a = c.acertijo;
      if (!a || !a.tipo) { fallos.push(n + ": le falta el acertijo."); return; }
      if (!Acertijos.TIPOS[a.tipo]) fallos.push(n + ": el tipo de acertijo '" + a.tipo + "' no existe.");
      if (a.tipo === "texto" && !(a.respuestas && a.respuestas.length))
        fallos.push(n + ": el acertijo de texto no tiene 'respuestas'.");
      if (a.tipo === "opcion") {
        const k = Number(a.correcta);
        if (!a.opciones || !a.opciones.length) fallos.push(n + ": faltan las 'opciones'.");
        else if (!k || k < 1 || k > a.opciones.length)
          fallos.push(n + ": 'correcta' debe ser un número entre 1 y " + a.opciones.length + ".");
      }
      if (a.tipo === "fecha" && !(a.respuesta && a.respuesta.dia && a.respuesta.mes))
        fallos.push(n + ": la fecha necesita al menos 'dia' y 'mes'.");
      if (a.tipo === "codigo") {
        if (!a.respuesta) fallos.push(n + ": el código no tiene 'respuesta'.");
        else if (a.longitud && String(a.respuesta).length !== Number(a.longitud))
          fallos.push(n + ": el código '" + a.respuesta + "' no tiene " + a.longitud + " cifras.");
      }
      if (a.tipo === "orden" && !(a.elementos && a.elementos.length > 1))
        fallos.push(n + ": para ordenar hacen falta al menos dos 'elementos'.");
      if ((a.tipo === "relacionar" || a.tipo === "parejas") && !(a.parejas && a.parejas.length > 1))
        fallos.push(n + ": hacen falta al menos dos 'parejas'.");
      if (a.tipo === "mapa" && !a.imagen)
        fallos.push(n + ": el acertijo de mapa necesita una 'imagen'.");
    });

    const f = h.final || {};
    const letras = (h.capitulos || []).map((c) => c.fragmento || "").join("");
    if (f.clave && letras && U.normalizar(letras) !== U.normalizar(f.clave)) {
      fallos.push("Las letras de los capítulos forman \"" + letras +
                  "\" pero la clave final es \"" + f.clave + "\". Tienen que coincidir.");
    }
    return fallos;
  }

  function panico(fallos) {
    U.vaciar(escenario);
    hud.hidden = true;
    escenario.style.display = "";
    escenario.appendChild(
      el("div", { class: "panico" },
        el("h2", {}, "Hay algo que revisar en el contenido"),
        el("p", {}, "El juego no ha arrancado por esto:"),
        el("code", {}, fallos.join("\n")),
        el("p", { estilo: { marginTop: "16px", fontSize: ".9rem", opacity: ".75" } },
          "Todo esto se arregla en contenido/historia.js. Nadie más va a ver este mensaje.")));
  }

  /* ==========================================================
     Arranque
     ========================================================== */
  function iniciar(contenido) {
    H = contenido;
    cfg = Object.assign({ partida: "partida", permitirRendirse: true,
                          fallosParaPista: 2, fallosParaRendirse: 6, mundo3d: true },
                        (contenido && contenido.config) || {});

    const fallos = revisarContenido(H);
    if (fallos.length) { panico(fallos); return; }

    estado = cargar();

    // ¿3D?
    modo3d = cfg.mundo3d !== false && Mundo.disponible();
    if (modo3d) {
      try {
        Mundo.calidad(esTactil ? 0 : 1);
        Mundo.iniciar(lienzo3d);
        Mundo.construir(H, estado);
        Mundo.alAcercarse(alAcercarse);
        Mundo.alInteractuar(alInteractuar);
        Mundo.conectarTactil($("#mandos"), $("#palanca"), $("#palanca-bola"));
        mundoListo = true;
      } catch (e) {
        console.warn("No se ha podido montar el mundo 3D, se juega en 2D:", e);
        modo3d = false;
        Mundo.parar();
      }
    }

    // botones de la barra
    $("#btn-mapa").addEventListener("click", () => {
      if (pantallaActual === "mapa" || pantallaActual === "mapa-panel") return;
      vueltaDe = null; mapaViaje();
    });
    $("#btn-album").addEventListener("click", () => {
      if (pantallaActual === "album") return;
      vueltaDe = enMundo ? null : pantallaActual;
      verAlbum();
    });

    // teclas y botones del mundo
    window.addEventListener("keydown", (e) => {
      if (!enMundo) return;
      if (e.code === "KeyE" && !document.body.classList.contains("con-panel")) Mundo.interactuar();
      if (e.code === "Escape" && document.body.classList.contains("con-panel")) {
        // salir de un panel informativo (no de un acertijo a medias)
        if (pantallaActual === "mapa-panel" || pantallaActual === "album") volverAlMundo();
      }
    });
    btnTocar.addEventListener("click", (e) => { e.preventDefault(); Mundo.interactuar(); });
    avisoRaton.addEventListener("click", () => { Audio_.activar(); Mundo.pedirRaton(); });
    lienzo3d.addEventListener("click", () => {
      if (enMundo && !esTactil && !document.body.classList.contains("con-panel")) Mundo.pedirRaton();
    });
    document.addEventListener("pointerlockchange", comprobarRaton);
    document.addEventListener("visibilitychange", () => Mundo.pausar(document.hidden));

    portada();
  }

  return { iniciar, borrarPartida, get estado() { return estado; }, get modo3d() { return modo3d; } };
})();
