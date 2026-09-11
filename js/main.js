/* ============================================================
   MAIN · arranque
   ============================================================ */
(function () {

  function arrancar() {
    // Altura real en móviles (la barra del navegador se mueve)
    const alto = () => document.documentElement.style.setProperty("--alto", window.innerHeight + "px");
    alto();
    window.addEventListener("resize", alto);

    // Evita el zoom por doble toque sin bloquear el pellizco
    let ultimo = 0;
    document.addEventListener("touchend", (e) => {
      const ahora = Date.now();
      if (ahora - ultimo < 300) e.preventDefault();
      ultimo = ahora;
    }, { passive: false });

    Escena.iniciar();
    Audio_.iniciar();

    if (typeof HISTORIA === "undefined") {
      document.getElementById("escenario").innerHTML =
        '<div class="panico"><h2>Falta el contenido</h2>' +
        '<p>No se ha podido cargar <code>contenido/historia.js</code>. ' +
        'Comprueba que el archivo existe y que no tiene errores de sintaxis ' +
        '(una coma de más, una comilla sin cerrar…).</p></div>';
      return;
    }

    Motor.iniciar(HISTORIA);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
