/* ============================================================
   ACERTIJOS · un constructor por cada tipo de prueba
   ------------------------------------------------------------
   Cada constructor recibe (a, api) y devuelve el nodo interactivo.
     a   = el objeto "acertijo" del archivo de contenido
     api = { acierto(), fallo(), bloqueado }
   ============================================================ */
const Acertijos = (function () {

  const el = U.el;

  /* ----------------------------------------------------------
     Envoltorio común: sacude la caja al fallar
     ---------------------------------------------------------- */
  function sacudir(nodo) {
    nodo.classList.remove("sacudir");
    void nodo.offsetWidth;
    nodo.classList.add("sacudir");
  }

  /* ==========================================================
     1 · TEXTO LIBRE
     ========================================================== */
  function texto(a, api) {
    const campo = el("input", {
      type: "text",
      class: "campo-texto",
      placeholder: a.placeholder || "escribe aquí",
      autocomplete: "off",
      autocapitalize: "off",
      autocorrect: "off",
      spellcheck: "false",
      "aria-label": a.pregunta || "Respuesta"
    });

    const comprobar = () => {
      if (api.bloqueado()) return;
      const v = campo.value.trim();
      if (!v) { campo.focus(); return; }
      if (U.acierta(v, a.respuestas)) {
        campo.disabled = true;
        api.acierto();
      } else {
        sacudir(caja);
        campo.select();
        api.fallo();
      }
    };

    campo.addEventListener("keydown", (e) => { if (e.key === "Enter") comprobar(); });

    const caja = el("div", { class: "cuerpo" },
      a.imagen ? el("img", { class: "imagen-apoyo", src: a.imagen, alt: "",
                             onerror: function () { this.remove(); } }) : null,
      a.audio ? el("audio", { class: "audio-pista", controls: true, src: a.audio,
                              onplay: () => Audio_.agachar(true),
                              onpause: () => Audio_.agachar(false),
                              onended: () => Audio_.agachar(false) }) : null,
      campo,
      el("div", { class: "fila-botones" },
        el("button", { class: "boton", type: "button", onclick: comprobar }, "Comprobar"))
    );

    setTimeout(() => { if (window.innerWidth > 760) campo.focus(); }, 650);
    return caja;
  }

  /* ==========================================================
     2 · OPCIÓN MÚLTIPLE
     ========================================================== */
  function opcion(a, api) {
    const correcta = Number(a.correcta) - 1;     // en el contenido se cuenta desde 1
    const botones = [];

    const caja = el("div", { class: "cuerpo opciones" },
      (a.opciones || []).map((txt, i) => {
        const b = el("button", { class: "opcion", type: "button" }, txt);
        b.addEventListener("click", () => {
          if (api.bloqueado() || b.disabled) return;
          if (i === correcta) {
            b.classList.add("bien");
            botones.forEach((x) => { x.disabled = true; });
            api.acierto();
          } else {
            b.classList.add("mal");
            b.disabled = true;
            sacudir(b);
            api.fallo();
          }
        });
        botones.push(b);
        return b;
      })
    );
    return caja;
  }

  /* ==========================================================
     3 · FECHA
     ========================================================== */
  function fecha(a, api) {
    const r = a.respuesta || {};
    const pideAnio = r.anio !== undefined && r.anio !== null && r.anio !== "";
    const hoy = new Date().getFullYear();
    const desde = a.anioDesde || (hoy - 15);
    const hasta = a.anioHasta || (hoy + 1);

    const selDia = el("select", { "aria-label": "Día" },
      el("option", { value: "" }, "—"),
      Array.from({ length: 31 }, (_, i) => el("option", { value: i + 1 }, i + 1)));

    const selMes = el("select", { "aria-label": "Mes" },
      el("option", { value: "" }, "—"),
      U.MESES.map((m, i) => el("option", { value: i + 1 }, m)));

    const selAnio = pideAnio ? el("select", { "aria-label": "Año" },
      el("option", { value: "" }, "—"),
      Array.from({ length: hasta - desde + 1 }, (_, i) => el("option", { value: hasta - i }, hasta - i))) : null;

    const comprobar = () => {
      if (api.bloqueado()) return;
      const d = Number(selDia.value), m = Number(selMes.value);
      const y = pideAnio ? Number(selAnio.value) : null;
      if (!d || !m || (pideAnio && !y)) { U.avisar("Faltan datos por elegir"); return; }
      const bien = d === Number(r.dia) && m === Number(r.mes) && (!pideAnio || y === Number(r.anio));
      if (bien) {
        [selDia, selMes, selAnio].forEach((s) => s && (s.disabled = true));
        api.acierto();
      } else {
        sacudir(caja);
        api.fallo();
      }
    };

    const campo = (etq, sel) => el("div", { class: "fecha-campo" },
      el("label", {}, etq), sel);

    const caja = el("div", { class: "cuerpo" },
      el("div", { class: "fecha-campos" },
        campo("Día", selDia),
        campo("Mes", selMes),
        pideAnio ? campo("Año", selAnio) : null),
      el("div", { class: "fila-botones" },
        el("button", { class: "boton", type: "button", onclick: comprobar }, "Comprobar"))
    );
    return caja;
  }

  /* ==========================================================
     4 · CÓDIGO (cerradura numérica)
     ========================================================== */
  function codigo(a, api) {
    const largo = Number(a.longitud) || String(a.respuesta || "").length || 4;
    let valor = "";

    const digitos = Array.from({ length: largo }, () => el("div", { class: "codigo-digito" }, ""));
    const visor = el("div", { class: "codigo-visor" }, digitos);

    function pintar() {
      digitos.forEach((d, i) => {
        d.textContent = valor[i] || "";
        d.classList.toggle("lleno", !!valor[i]);
      });
    }

    function meter(n) {
      if (api.bloqueado() || valor.length >= largo) return;
      valor += n;
      Audio_.sfx.toque();
      pintar();
      if (valor.length === largo) setTimeout(comprobar, 320);
    }

    function borrar() {
      valor = valor.slice(0, -1);
      pintar();
    }

    function comprobar() {
      if (api.bloqueado()) return;
      if (valor === String(a.respuesta)) {
        api.acierto();
      } else {
        sacudir(visor);
        api.fallo();
        setTimeout(() => { valor = ""; pintar(); }, 420);
      }
    }

    const teclado = el("div", { class: "teclado" },
      [1,2,3,4,5,6,7,8,9].map((n) =>
        el("button", { class: "tecla", type: "button", onclick: () => meter(String(n)) }, String(n))),
      el("button", { class: "tecla tecla--accion", type: "button", onclick: borrar, "aria-label": "Borrar" }, "←"),
      el("button", { class: "tecla", type: "button", onclick: () => meter("0") }, "0"),
      el("button", { class: "tecla tecla--accion", type: "button", onclick: comprobar, "aria-label": "Comprobar" }, "✓")
    );

    const teclas = (e) => {
      if (!document.body.contains(visor)) { window.removeEventListener("keydown", teclas); return; }
      if (/^[0-9]$/.test(e.key)) meter(e.key);
      else if (e.key === "Backspace") borrar();
      else if (e.key === "Enter") comprobar();
    };
    window.addEventListener("keydown", teclas);

    return el("div", { class: "cuerpo" }, visor, teclado);
  }

  /* ==========================================================
     5 · ORDENAR
     ========================================================== */
  function orden(a, api) {
    const correcto = (a.elementos || []).map((e) => (typeof e === "string" ? e : e.texto));
    const mezclado = U.barajarDistinto(correcto);
    const elegidos = [];
    const nodos = new Map();

    function pintarNumeros() {
      nodos.forEach((nodo, txt) => {
        const pos = elegidos.indexOf(txt);
        nodo.classList.toggle("elegido", pos >= 0);
        nodo.querySelector(".numero").textContent = pos >= 0 ? (pos + 1) : "";
      });
      botonComprobar.disabled = elegidos.length !== correcto.length;
    }

    function tocar(txt) {
      if (api.bloqueado()) return;
      const i = elegidos.indexOf(txt);
      if (i >= 0) elegidos.splice(i, 1);
      else elegidos.push(txt);
      Audio_.sfx.toque();
      pintarNumeros();
    }

    function comprobar() {
      if (api.bloqueado()) return;
      const bien = elegidos.every((t, i) => t === correcto[i]);
      if (bien) {
        nodos.forEach((n) => n.classList.add("bien"));
        api.acierto();
      } else {
        // marca en verde las que sí están en su sitio: se aprende más así
        elegidos.forEach((t, i) => {
          const n = nodos.get(t);
          n.classList.remove("bien", "mal");
          n.classList.add(t === correcto[i] ? "bien" : "mal");
        });
        sacudir(lista);
        api.fallo();
        setTimeout(() => {
          nodos.forEach((n) => n.classList.remove("bien", "mal"));
          elegidos.length = 0;
          pintarNumeros();
        }, 1500);
      }
    }

    const lista = el("div", { class: "lista-orden" },
      mezclado.map((txt) => {
        const n = el("button", { class: "trozo", type: "button", onclick: () => tocar(txt) },
          el("span", { class: "numero" }, ""),
          el("span", { class: "texto" }, txt));
        nodos.set(txt, n);
        return n;
      })
    );

    const botonComprobar = el("button", { class: "boton", type: "button", disabled: true, onclick: comprobar }, "Comprobar");

    const caja = el("div", { class: "cuerpo" },
      lista,
      el("div", { class: "fila-botones" },
        botonComprobar,
        el("button", { class: "boton boton--texto", type: "button",
                       onclick: () => { elegidos.length = 0; pintarNumeros(); } }, "Empezar de nuevo"))
    );
    return caja;
  }

  /* ==========================================================
     6 · RELACIONAR (unir dos columnas)
     ========================================================== */
  function relacionar(a, api) {
    const parejas = a.parejas || [];
    const izq = parejas.map((p, i) => ({ txt: p.a, i }));
    const der = U.barajarDistinto(parejas.map((p, i) => ({ txt: p.b, i })));
    let activa = null;
    let hechas = 0;

    function hacerFicha(dato, lado) {
      const n = el("button", { class: "ficha-rel", type: "button" }, dato.txt);
      n.addEventListener("click", () => {
        if (api.bloqueado() || n.classList.contains("unida")) return;
        Audio_.sfx.toque();

        if (!activa) { activa = { n, dato, lado }; n.classList.add("activa"); return; }
        if (activa.n === n) { n.classList.remove("activa"); activa = null; return; }
        if (activa.lado === lado) {                 // cambiar de selección en la misma columna
          activa.n.classList.remove("activa");
          activa = { n, dato, lado };
          n.classList.add("activa");
          return;
        }

        const otra = activa;
        activa = null;
        otra.n.classList.remove("activa");

        if (otra.dato.i === dato.i) {
          const marca = "✓";
          [otra.n, n].forEach((x) => { x.classList.add("unida"); x.dataset.marca = marca; });
          hechas++;
          Audio_.sfx.toque();
          if (hechas === parejas.length) api.acierto();
        } else {
          [otra.n, n].forEach((x) => {
            x.classList.add("error");
            setTimeout(() => x.classList.remove("error"), 480);
          });
          api.fallo();
        }
      });
      return n;
    }

    return el("div", { class: "cuerpo relacionar" },
      el("div", { class: "columna" }, izq.map((d) => hacerFicha(d, "i"))),
      el("div", { class: "columna" }, der.map((d) => hacerFicha(d, "d")))
    );
  }

  /* ==========================================================
     7 · PAREJAS (juego de memoria)
     ========================================================== */
  function parejas(a, api) {
    const lista = a.parejas || [];
    const cartas = U.barajar(lista.flatMap((p, i) => ([
      { txt: p.a, i }, { txt: p.b, i }
    ])));

    let vueltas = [];
    let esperando = false;
    let hechas = 0;
    let intentos = 0;

    const marcador = el("div", { class: "marcador" }, "");
    const actualizarMarcador = () =>
      marcador.textContent = `${hechas} de ${lista.length} · ${intentos} ${intentos === 1 ? "intento" : "intentos"}`;

    function hacerCarta(dato) {
      const n = el("button", { class: "carta", type: "button", "aria-label": "Carta boca abajo" },
        el("span", { class: "cara reverso" }, "❦"),
        el("span", { class: "cara frente" }, dato.txt));

      n.addEventListener("click", () => {
        if (api.bloqueado() || esperando) return;
        if (n.classList.contains("vuelta") || n.classList.contains("hecha")) return;

        n.classList.add("vuelta");
        n.setAttribute("aria-label", dato.txt);
        Audio_.sfx.toque();
        vueltas.push({ n, dato });

        if (vueltas.length < 2) return;

        intentos++;
        const [x, y] = vueltas;
        vueltas = [];

        if (x.dato.i === y.dato.i) {
          hechas++;
          [x.n, y.n].forEach((c) => c.classList.add("hecha"));
          actualizarMarcador();
          if (hechas === lista.length) setTimeout(() => api.acierto(), 420);
        } else {
          esperando = true;
          [x.n, y.n].forEach((c) => c.classList.add("fallo"));
          actualizarMarcador();
          setTimeout(() => {
            [x.n, y.n].forEach((c) => {
              c.classList.remove("vuelta", "fallo");
              c.setAttribute("aria-label", "Carta boca abajo");
            });
            esperando = false;
          }, 950);
        }
      });
      return n;
    }

    actualizarMarcador();
    return el("div", { class: "cuerpo" },
      el("div", { class: "tablero-parejas" }, cartas.map(hacerCarta)),
      marcador
    );
  }

  /* ==========================================================
     8 · MAPA (encontrar un punto en una imagen)
     ========================================================== */
  function mapa(a, api) {
    const zona = Object.assign({ x: .5, y: .5, r: .09 }, a.zona || {});
    const img = el("img", { src: a.imagen, alt: "Imagen del acertijo" });
    const marca = el("div", { class: "marca-mapa", hidden: true });

    const zonaMapa = el("div", { class: "zona-mapa" }, img, marca);

    zonaMapa.addEventListener("click", (e) => {
      if (api.bloqueado()) return;
      const c = zonaMapa.getBoundingClientRect();
      const px = (e.clientX - c.left) / c.width;
      const py = (e.clientY - c.top) / c.height;

      marca.hidden = false;
      marca.style.left = (px * 100) + "%";
      marca.style.top  = (py * 100) + "%";
      marca.classList.remove("bien", "mal");

      const d = Math.hypot(px - zona.x, py - zona.y);
      if (d <= zona.r) {
        marca.classList.add("bien");
        api.acierto();
      } else {
        marca.classList.add("mal");
        api.fallo();
      }
    });

    img.addEventListener("error", () => {
      zonaMapa.replaceWith(el("p", { class: "pista" },
        "(Falta la imagen de este acertijo: " + a.imagen + ")"));
    });

    return el("div", { class: "cuerpo" },
      zonaMapa,
      el("p", { class: "subpregunta", estilo: { marginTop: "14px" } }, "toca el sitio exacto")
    );
  }

  /* ==========================================================
     9 · PUZZLE (rompecabezas deslizante)
     ========================================================== */
  function puzzle(a, api) {
    const n = U.limitar(Number(a.tamano) || 3, 2, 4);
    const total = n * n;
    const hueco = total - 1;                 // la pieza que falta
    let estado = Array.from({ length: total }, (_, i) => i);
    let movimientos = 0;
    let resuelto = false;

    const tablero = el("div", { class: "tablero-puzzle",
      estilo: { gridTemplateColumns: `repeat(${n},1fr)` } });
    const marcador = el("div", { class: "marcador" }, "");

    function vecinos(i) {
      const f = Math.floor(i / n), c = i % n;
      const v = [];
      if (f > 0)     v.push(i - n);
      if (f < n - 1) v.push(i + n);
      if (c > 0)     v.push(i - 1);
      if (c < n - 1) v.push(i + 1);
      return v;
    }

    /* Se desordena haciendo movimientos válidos: así siempre tiene solución. */
    function revolver() {
      let pos = estado.indexOf(hueco);
      let previo = -1;
      for (let k = 0; k < total * 26; k++) {
        const opciones = vecinos(pos).filter((x) => x !== previo);
        const destino = opciones[Math.floor(Math.random() * opciones.length)];
        [estado[pos], estado[destino]] = [estado[destino], estado[pos]];
        previo = pos;
        pos = destino;
      }
      if (estaResuelto()) revolver();
    }

    const estaResuelto = () => estado.every((v, i) => v === i);

    function pintar() {
      U.vaciar(tablero);
      estado.forEach((pieza, casilla) => {
        const esHueco = pieza === hueco;
        const f = Math.floor(pieza / n), c = pieza % n;
        const b = el("button", {
          class: "pieza" + (esHueco ? " hueca" : ""),
          type: "button",
          "aria-label": esHueco ? "Hueco" : "Pieza " + (pieza + 1),
          estilo: {
            "--n": n,
            backgroundImage: a.imagen ? `url("${a.imagen}")` : "none",
            backgroundPosition: n > 1 ? `${(c / (n - 1)) * 100}% ${(f / (n - 1)) * 100}%` : "center"
          }
        }, a.imagen ? null : (esHueco ? "" : String(pieza + 1)));

        b.addEventListener("click", () => mover(casilla));
        tablero.appendChild(b);
      });
      marcador.textContent = resuelto
        ? "¡Completo!"
        : `${movimientos} ${movimientos === 1 ? "movimiento" : "movimientos"}`;
    }

    function mover(casilla) {
      if (api.bloqueado() || resuelto) return;
      const vacio = estado.indexOf(hueco);
      if (!vecinos(casilla).includes(vacio)) return;
      [estado[casilla], estado[vacio]] = [estado[vacio], estado[casilla]];
      movimientos++;
      Audio_.sfx.toque();
      pintar();
      if (estaResuelto()) {
        resuelto = true;
        tablero.classList.add("resuelto");
        pintar();
        setTimeout(() => api.acierto(), 450);
      }
    }

    revolver();
    pintar();

    return el("div", { class: "cuerpo" },
      tablero,
      marcador,
      el("p", { class: "subpregunta", estilo: { marginTop: "12px" } },
        "toca una pieza que esté al lado del hueco")
    );
  }

  /* ==========================================================
     Registro y utilidades públicas
     ========================================================== */
  const TIPOS = { texto, opcion, fecha, codigo, orden, relacionar, parejas, mapa, puzzle };

  function crear(a, api) {
    const f = TIPOS[a && a.tipo];
    if (!f) {
      return el("div", { class: "cuerpo" },
        el("p", { class: "pista" }, "Tipo de acertijo desconocido: \"" + (a && a.tipo) + "\""),
        el("div", { class: "fila-botones" },
          el("button", { class: "boton", type: "button", onclick: () => api.acierto() }, "Continuar")));
    }
    return f(a, api);
  }

  /** Texto con la solución, para cuando alguien se rinde. */
  function solucion(a) {
    switch (a.tipo) {
      case "texto":
        return "La respuesta era: " + (Array.isArray(a.respuestas) ? a.respuestas[0] : a.respuestas);
      case "opcion":
        return "La respuesta era: " + (a.opciones || [])[Number(a.correcta) - 1];
      case "fecha": {
        const r = a.respuesta || {};
        const mes = U.MESES[Number(r.mes) - 1] || r.mes;
        return "La fecha era: " + r.dia + " de " + mes + (r.anio ? " de " + r.anio : "");
      }
      case "codigo":
        return "El código era: " + a.respuesta;
      case "orden":
        return "El orden era: " + (a.elementos || [])
          .map((e, i) => (i + 1) + ". " + (typeof e === "string" ? e : e.texto)).join("  ·  ");
      case "relacionar":
      case "parejas":
        return "Iban juntas: " + (a.parejas || []).map((p) => p.a + " → " + p.b).join("  ·  ");
      default:
        return "Esta vez te la doy por buena.";
    }
  }

  return { crear, solucion, TIPOS };
})();
