/* ============================================================
   DIÁLOGO · texto que se escribe solo
   ------------------------------------------------------------
   Se puede saltar tocando la pantalla: nadie debería tener que
   esperar si no quiere.
   ============================================================ */
const Dialogo = (function () {

  let saltando = false;
  let activo   = false;

  /**
   * Escribe una lista de líneas dentro de `caja`, una detrás de otra.
   * Devuelve una promesa que se resuelve al terminar.
   *
   *   opciones.velocidad   ms por letra           (por defecto 34)
   *   opciones.pausa       ms entre líneas        (por defecto 420)
   *   opciones.clase       clase de cada línea    (por defecto "linea")
   *   opciones.sonido      pitidito al escribir   (por defecto false)
   */
  function escribir(caja, lineas, opciones) {
    const o = Object.assign({ velocidad: 34, pausa: 420, clase: "linea", sonido: false }, opciones || {});
    saltando = false;
    activo   = true;

    return new Promise(async (resolver) => {
      for (let i = 0; i < lineas.length; i++) {
        const texto = lineas[i];

        // línea vacía = respiro
        if (!texto || !String(texto).trim()) {
          caja.appendChild(U.el("div", { class: o.clase + " vacia puesta" }));
          if (!saltando) await U.esperar(o.pausa * .5);
          continue;
        }

        const linea = U.el("div", { class: o.clase });
        caja.appendChild(linea);
        // deja que el navegador aplique la clase antes del fundido
        requestAnimationFrame(() => linea.classList.add("puesta"));

        if (saltando) {
          linea.textContent = texto;
          continue;
        }

        const cursor = U.el("span", { class: "cursor" });
        linea.appendChild(cursor);
        const nodo = document.createTextNode("");
        linea.insertBefore(nodo, cursor);

        for (let j = 0; j < texto.length; j++) {
          if (saltando) { nodo.textContent = texto; break; }
          nodo.textContent += texto[j];
          if (o.sonido && texto[j] !== " " && j % 3 === 0) Audio_.sfx.letra();
          // las pausas naturales duran un poco más
          const c = texto[j];
          let espera = o.velocidad;
          if (c === "," || c === ";") espera = o.velocidad * 7;
          else if (c === "." || c === "?" || c === "!" || c === ":") espera = o.velocidad * 12;
          await U.esperar(espera);
        }
        cursor.remove();
        if (!saltando) await U.esperar(o.pausa);
      }
      activo = false;
      resolver();
    });
  }

  /** Marca que hay que terminar ya. */
  function saltar() { if (activo) saltando = true; }

  /** Deja la pantalla preparada para saltar al tocar en cualquier sitio. */
  function permitirSaltar(hasta) {
    const mano = (e) => {
      // no robar el clic a un botón o a un campo
      if (e.target.closest("button,input,select,a,label,audio")) return;
      saltar();
    };
    document.addEventListener("pointerdown", mano);
    document.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter" || e.key === "Escape") saltar();
    });
    if (hasta) hasta.then(() => document.removeEventListener("pointerdown", mano));
  }

  return { escribir, saltar, permitirSaltar, get activo() { return activo; } };
})();
