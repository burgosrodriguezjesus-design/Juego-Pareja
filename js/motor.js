/* ============================================================
   MOTOR · el hilo que une todo
   ------------------------------------------------------------
   Lleva la partida, cambia de pantalla y decide qué toca ahora.
   ============================================================ */
const Motor = (function () {

  const el  = U.el;
  const $   = U.$;

  const escenario = $("#escenario");
  const hud       = $("#hud");
  const hudLugar  = $("#hud-lugar");
  const hudProg   = $("#hud-progreso");
  const velo      = $("#transicion");

  let H = null;          // contenido (HISTORIA)
  let cfg = null;
  let estado = null;
  let pantallaActual = "";
  let vueltaDe = null;   // a dónde volver desde álbum/mapa

  /* ==========================================================
     Partida guardada
     ========================================================== */
  function estadoLimpio() {
    return { capitulo: 0, resueltos: [], fragmentos: {}, prologoVisto: false, terminado: false };
  }

  const clave = () => "nh:" + (cfg.partida || "partida");

  function guardar() {
    U.guardado.escribir(clave(), estado);
  }

  function cargar() {
    const s = U.guardado.leer(clave());
    if (!s || typeof s !== "object") return estadoLimpio();
    return Object.assign(estadoLimpio(), s);
  }

  function borrarPartida() {
    U.guardado.borrar(clave());
    estado = estadoLimpio();
  }

  const hayPartida = () => estado.resueltos.length > 0 || estado.prologoVisto;

  /* ==========================================================
     Cambio de pantalla con fundido
     ========================================================== */
  async function cambiar(pintar, escena, semillaId) {
    velo.classList.add("visible");
    await U.esperar(520);

    U.vaciar(escenario);
    escenario.scrollTop = 0;
    if (escena) Escena.pintar(escena, semillaId);

    pintar();

    velo.classList.remove("visible");
    escenario.focus({ preventScroll: true });
  }

  function verHud(visible, lugar, progreso) {
    hud.hidden = !visible;
    escenario.classList.toggle("con-hud", visible);
    if (visible) {
      hudLugar.textContent = lugar || "";
      hudProg.textContent  = progreso || "";
    }
  }

  const progresoTexto = () =>
    `${estado.resueltos.length} de ${H.capitulos.length}`;

  /* ==========================================================
     PORTADA
     ========================================================== */
  function portada() {
    pantallaActual = "portada";
    cambiar(() => {
      verHud(false);

      const continuar = hayPartida();

      escenario.appendChild(
        el("section", { class: "pantalla portada escalonado" },
          el("div", { class: "para" }, "Para " + (cfg.nombreElla || "ti")),
          el("h1", {}, cfg.titulo || "Nuestra Historia"),
          cfg.subtitulo ? el("div", { class: "subtitulo" }, cfg.subtitulo) : null,
          el("div", { class: "adorno" }),
          cfg.dedicatoria ? el("p", { class: "dedicatoria" }, cfg.dedicatoria) : null,
          el("div", { class: "fila-botones" },
            el("button", {
              class: "boton", type: "button",
              onclick: () => { Audio_.activar(); continuar ? seguirDondeIbas() : empezar(); }
            }, continuar ? "Seguir donde lo dejaste" : (cfg.textoEmpezar || "Empezar")),

            continuar ? el("button", {
              class: "boton boton--texto", type: "button",
              onclick: () => {
                if (confirm("¿Empezar otra vez desde el principio?\nSe borrará lo que llevas.")) {
                  borrarPartida();
                  empezar();
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
    if (estado.resueltos.length >= H.capitulos.length) return candadoFinal();
    if (!estado.prologoVisto) return prologo();
    mapaViaje();
  }

  function empezar() {
    estado = estadoLimpio();
    guardar();
    prologo();
  }

  /* ==========================================================
     PRÓLOGO
     ========================================================== */
  function prologo() {
    pantallaActual = "prologo";
    const p = H.prologo || {};

    cambiar(async () => {
      verHud(false);
      Audio_.poner(p.musica);

      const caja  = el("div", { class: "narracion" });
      const pie   = el("div", { class: "fila-botones", estilo: { opacity: "0", transition: "opacity .8s ease" } });
      const seguir = el("div", { class: "pista-seguir" }, "toca para ir más rápido");

      escenario.appendChild(el("section", { class: "pantalla" }, caja, seguir, pie));

      const promesa = Dialogo.escribir(caja, p.lineas || [], { velocidad: 36, pausa: 520 });
      Dialogo.permitirSaltar(promesa);
      await promesa;

      seguir.remove();
      pie.appendChild(el("button", {
        class: "boton", type: "button",
        onclick: () => { estado.prologoVisto = true; guardar(); abrirCapitulo(0); }
      }, p.boton || "Seguir"));
      requestAnimationFrame(() => { pie.style.opacity = "1"; });
    }, p.escena, "prologo");
  }

  /* ==========================================================
     MAPA DEL VIAJE
     ========================================================== */
  function mapaViaje() {
    pantallaActual = "mapa";
    vueltaDe = null;

    const siguiente = H.capitulos.findIndex((c) => !estado.resueltos.includes(c.id));
    const todosHechos = siguiente === -1;

    cambiar(() => {
      verHud(true, "El viaje", progresoTexto());
      Audio_.poner("");

      const paradas = el("div", { class: "paradas escalonado" },
        H.capitulos.map((c, i) => {
          const hecho   = estado.resueltos.includes(c.id);
          const actual  = i === siguiente;
          const abierto = hecho || actual;

          const n = el("button", {
            class: "parada" +
                   (hecho ? " parada--hecha" : "") +
                   (actual ? " parada--actual" : "") +
                   (abierto ? "" : " parada--bloqueada"),
            type: "button",
            disabled: !abierto,
            onclick: () => abierto && abrirCapitulo(i)
          },
            el("span", { class: "punto" }, hecho ? "✓" : (actual ? "◆" : "·")),
            el("span", { class: "info" },
              el("span", { class: "nombre" }, abierto ? c.titulo : "todavía no"),
              abierto && c.lugar ? el("span", { class: "sitio" }, c.lugar) : null),
            hecho && estado.fragmentos[c.id]
              ? el("span", { class: "marca" }, estado.fragmentos[c.id]) : null
          );
          return n;
        })
      );

      const letras = H.capitulos.map((c) => estado.resueltos.includes(c.id) ? (estado.fragmentos[c.id] || "?") : "");

      escenario.appendChild(
        el("section", { class: "pantalla" },
          el("div", { class: "mapa-titulo" },
            el("h2", {}, todosHechos ? "Ya está todo" : "El viaje"),
            el("p", {}, todosHechos
              ? "Has abierto todos los recuerdos."
              : "Toca el sitio al que quieras volver.")),

          paradas,

          el("div", { class: "clave-parcial" },
            el("div", { class: "etiqueta" }, "Lo que llevas"),
            el("div", { class: "casillas" },
              letras.map((L) => el("div", { class: "casilla" + (L ? " llena" : "") }, L || "·")))),

          todosHechos
            ? el("div", { class: "fila-botones" },
                el("button", { class: "boton", type: "button", onclick: candadoFinal }, "Ir al final"))
            : null
        )
      );
    }, { tipo: "cielo", momento: "noche", clima: "estrellas" }, "mapa");
  }

  /* ==========================================================
     CAPÍTULO · 1) presentación
     ========================================================== */
  function abrirCapitulo(i) {
    const c = H.capitulos[i];
    if (!c) return candadoFinal();
    estado.capitulo = i;
    guardar();

    pantallaActual = "capitulo";

    cambiar(async () => {
      verHud(true, c.lugar || c.titulo, "Capítulo " + (i + 1) + " de " + H.capitulos.length);
      Audio_.poner(c.musica);

      const cab = el("div", { class: "cap-cabecera" },
        el("div", { class: "cap-numero" }, "Capítulo " + (i + 1)),
        el("h2", {}, c.titulo),
        c.lugar ? el("div", { class: "cap-lugar" }, c.lugar) : null,
        c.fecha ? el("div", { class: "sello", estilo: { marginTop: "14px" } }, c.fecha) : null);

      const caja  = el("div", { class: "narracion", estilo: { minHeight: "26vh" } });
      const pie   = el("div", { class: "fila-botones", estilo: { opacity: "0", transition: "opacity .8s ease" } });
      const seguir = el("div", { class: "pista-seguir" }, "toca para ir más rápido");

      escenario.appendChild(el("section", { class: "pantalla" }, cab, caja, seguir, pie));

      const promesa = Dialogo.escribir(caja, c.intro || [], { velocidad: 32, pausa: 460 });
      Dialogo.permitirSaltar(promesa);
      await promesa;

      seguir.remove();
      pie.appendChild(el("button", {
        class: "boton", type: "button",
        onclick: () => acertijoDe(i)
      }, estado.resueltos.includes(c.id) ? "Ver el recuerdo" : "Continuar"));
      requestAnimationFrame(() => { pie.style.opacity = "1"; });
    }, c.escena, c.id);
  }

  /* ==========================================================
     CAPÍTULO · 2) el acertijo
     ========================================================== */
  function acertijoDe(i) {
    const c = H.capitulos[i];

    // si ya lo resolvió antes, va directa al recuerdo
    if (estado.resueltos.includes(c.id)) return recuerdoDe(i, false);

    pantallaActual = "acertijo";
    const a = c.acertijo || {};
    const listaPistas = a.pistas || [];

    let fallos = 0;
    let pistasDadas = 0;
    let resuelto = false;

    const zonaPistas = el("div", { class: "pistas" });
    const zonaAyuda  = el("div", { class: "ayuda-fila" });

    function darPista(automatica) {
      if (pistasDadas >= listaPistas.length) {
        if (!automatica) U.avisar("Ya no me quedan más pistas");
        return;
      }
      const txt = listaPistas[pistasDadas++];
      zonaPistas.appendChild(el("div", { class: "pista" },
        el("span", { class: "ico" }, "✦"),
        el("span", {}, txt)));
      repintarAyuda();
    }

    function rendirse() {
      if (resuelto) return;
      resuelto = true;
      zonaPistas.appendChild(el("div", { class: "pista" },
        el("span", { class: "ico" }, "♡"),
        el("span", {}, Acertijos.solucion(a))));
      U.vaciar(zonaAyuda).appendChild(
        el("button", { class: "boton", type: "button", onclick: () => superar(i, true) }, "Seguir"));
    }

    function repintarAyuda() {
      U.vaciar(zonaAyuda);
      if (resuelto) return;
      if (pistasDadas < listaPistas.length) {
        zonaAyuda.appendChild(el("button", {
          class: "boton boton--fantasma", type: "button", onclick: () => darPista(false)
        }, pistasDadas === 0 ? "Dame una pista" : "Otra pista"));
      }
      if (cfg.permitirRendirse && fallos >= (cfg.fallosParaRendirse || 6)) {
        zonaAyuda.appendChild(el("button", {
          class: "boton boton--texto", type: "button", onclick: rendirse
        }, "No me acuerdo, dímelo tú"));
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
        const cada = cfg.fallosParaPista || 2;
        if (fallos % cada === 0) darPista(true);
        repintarAyuda();
      }
    };

    cambiar(() => {
      verHud(true, c.lugar || c.titulo, "Capítulo " + (i + 1) + " de " + H.capitulos.length);

      const cuerpo = Acertijos.crear(a, api);

      escenario.appendChild(
        el("section", { class: "pantalla acertijo escalonado" },
          el("div", { class: "sello" }, c.lugar || c.titulo),
          el("h3", { class: "pregunta" }, a.pregunta || "…"),
          a.subtitulo ? el("div", { class: "subpregunta" }, a.subtitulo) : null,
          cuerpo,
          zonaPistas,
          zonaAyuda
        )
      );
      repintarAyuda();
    }, c.escena, c.id);
  }

  const FRASES_FALLO = [
    "No es eso… piensa otra vez",
    "Casi",
    "Uy, no",
    "Frío, frío",
    "Esa no es",
    "Prueba otra cosa"
  ];
  const fraseDeFallo = (n) => FRASES_FALLO[Math.min(n - 1, FRASES_FALLO.length - 1)];

  /* ==========================================================
     CAPÍTULO · 3) el recuerdo
     ========================================================== */
  function superar(i, rendida) {
    const c = H.capitulos[i];
    if (!estado.resueltos.includes(c.id)) {
      estado.resueltos.push(c.id);
      if (c.fragmento) estado.fragmentos[c.id] = String(c.fragmento);
      guardar();
    }
    recuerdoDe(i, !rendida);
  }

  function recuerdoDe(i, celebrar) {
    const c = H.capitulos[i];
    const r = c.recuerdo || {};
    const letra = estado.fragmentos[c.id];
    pantallaActual = "recuerdo";

    cambiar(() => {
      verHud(true, c.lugar || c.titulo, progresoTexto());
      Audio_.poner(c.musica);
      if (celebrar) { Audio_.sfx.abrir(); U.celebrar(20); }

      const ultimo = estado.resueltos.length >= H.capitulos.length;

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
            el("button", {
              class: "boton", type: "button",
              onclick: () => ultimo ? candadoFinal() : mapaViaje()
            }, ultimo ? "Ya están todas" : "Seguir el viaje"))
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

    let fallos = 0;
    let abierto = false;

    const letras = H.capitulos
      .map((c) => estado.fragmentos[c.id])
      .filter(Boolean);

    cambiar(() => {
      verHud(true, "El final", progresoTexto());
      Audio_.poner(f.musica);

      const campo = el("input", {
        type: "text", class: "campo-texto",
        placeholder: "la palabra",
        autocomplete: "off", autocapitalize: "characters", spellcheck: "false",
        "aria-label": "Palabra final"
      });

      const zonaPistas = el("div", { class: "pistas" });

      function probar() {
        if (abierto) return;
        const v = campo.value.trim();
        if (!v) { campo.focus(); return; }
        if (U.acierta(v, [claveBuena])) {
          abierto = true;
          campo.disabled = true;
          Audio_.sfx.abrir();
          U.celebrar(50);
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

          el("div", { class: "cuerpo" },
            campo,
            el("div", { class: "fila-botones" },
              el("button", { class: "boton", type: "button", onclick: probar }, "Abrir"))),

          zonaPistas
        )
      );

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

    cambiar(async () => {
      verHud(true, "", "fin");
      Audio_.poner(f.musica);

      const caja = el("div", { class: "carta" });
      const pie  = el("div", { class: "fila-botones", estilo: { opacity: "0", transition: "opacity 1s ease" } });
      const seguir = el("div", { class: "pista-seguir" }, "toca para ir más rápido");

      escenario.appendChild(
        el("section", { class: "pantalla" },
          el("div", { class: "sello" }, f.titulo || "Para ti"),
          caja,
          seguir,
          pie)
      );

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
        pie.appendChild(el("button", {
          class: "boton", type: "button",
          onclick: (e) => { e.target.remove(); abrirRegalo(); }
        }, regalo.boton || "Hay algo más"));
      }
      pie.appendChild(el("button", {
        class: "boton boton--fantasma", type: "button",
        onclick: () => { vueltaDe = "carta"; verAlbum(); }
      }, "Ver los recuerdos"));

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
    if (seccion) {
      seccion.appendChild(caja);
      caja.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /* ==========================================================
     ÁLBUM
     ========================================================== */
  function verAlbum() {
    const desde = vueltaDe || pantallaActual;
    pantallaActual = "album";
    cambiar(() => {
      verHud(true, "Recuerdos", progresoTexto());
      escenario.appendChild(
        Album.pantalla(H.capitulos, estado.resueltos, () => {
          vueltaDe = null;
          if (desde === "carta") cartaFinal();
          else if (estado.terminado) cartaFinal();
          else mapaViaje();
        })
      );
    }, { tipo: "cielo", momento: "noche", clima: "estrellas" }, "album");
  }

  /* ==========================================================
     Comprobación del contenido
     ========================================================== */
  function revisarContenido(h) {
    const fallos = [];
    if (!h || typeof h !== "object") return ["No se ha podido leer el archivo contenido/historia.js"];
    if (!Array.isArray(h.capitulos) || !h.capitulos.length) fallos.push("No hay ningún capítulo en la lista 'capitulos'.");

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

    // la clave final debe cuadrar con las letras
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
    escenario.appendChild(
      el("div", { class: "panico" },
        el("h2", {}, "Hay algo que revisar en el contenido"),
        el("p", {}, "El juego no ha arrancado por esto:"),
        el("code", {}, fallos.join("\n")),
        el("p", { estilo: { marginTop: "16px", fontSize: ".9rem", opacity: ".75" } },
          "Todo esto se arregla en el archivo contenido/historia.js. Nadie más va a ver este mensaje."))
    );
  }

  /* ==========================================================
     Arranque
     ========================================================== */
  function iniciar(contenido) {
    H = contenido;
    cfg = Object.assign({
      partida: "partida", permitirRendirse: true, fallosParaPista: 2, fallosParaRendirse: 6
    }, (contenido && contenido.config) || {});

    const fallos = revisarContenido(H);
    if (fallos.length) { panico(fallos); return; }

    estado = cargar();

    U.$("#btn-mapa").addEventListener("click", () => {
      if (pantallaActual === "mapa") return;
      vueltaDe = null;
      mapaViaje();
    });
    U.$("#btn-album").addEventListener("click", () => {
      if (pantallaActual === "album") return;
      vueltaDe = pantallaActual;
      verAlbum();
    });

    portada();
  }

  return { iniciar, borrarPartida, get estado() { return estado; } };
})();
