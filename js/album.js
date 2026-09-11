/* ============================================================
   ÁLBUM · los recuerdos que ya ha desbloqueado
   ============================================================ */
const Album = (function () {

  const el = U.el;

  function ficha(cap) {
    const r = cap.recuerdo || {};
    return el("article", { class: "album-ficha" },
      r.foto ? U.foto(r.foto, r.titulo || cap.titulo) : null,
      cap.lugar ? el("div", { class: "lugar" }, cap.lugar) : null,
      el("h4", {}, r.titulo || cap.titulo),
      r.texto ? el("p", {}, r.texto) : null,
      r.cita ? el("div", { class: "cita" }, r.cita) : null
    );
  }

  /** Devuelve la pantalla del álbum. `volver` es la función del botón de salida. */
  function pantalla(capitulos, resueltos, volver) {
    const abiertos = capitulos.filter((c) => resueltos.includes(c.id));

    return el("section", { class: "pantalla pantalla--ancha" },
      el("div", { class: "mapa-titulo" },
        el("h2", {}, "Nuestros recuerdos"),
        el("p", {}, abiertos.length
          ? `Has abierto ${abiertos.length} de ${capitulos.length}.`
          : "Todavía no has abierto ninguno.")),

      abiertos.length
        ? el("div", { class: "album-rejilla escalonado" }, abiertos.map(ficha))
        : el("div", { class: "album-vacio" }, "Aquí se irá guardando todo lo que encuentres."),

      el("div", { class: "fila-botones" },
        el("button", { class: "boton boton--fantasma", type: "button", onclick: volver }, "Volver"))
    );
  }

  return { pantalla, ficha };
})();
