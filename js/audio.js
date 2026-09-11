/* ============================================================
   AUDIO · música de fondo con fundidos + efectos sencillos
   ------------------------------------------------------------
   Los navegadores no dejan sonar nada hasta que la persona toca
   la pantalla. Por eso todo se activa en el primer clic.
   ============================================================ */
const Audio_ = (function () {

  const pista       = document.getElementById("pista-musica");
  const btn         = document.getElementById("btn-musica");
  const ico         = document.getElementById("ico-musica");

  let activado      = false;   // ya hubo interacción del usuario
  let silenciado    = false;   // el usuario ha apagado la música
  let actual        = "";      // ruta que suena ahora
  let pendiente     = "";      // ruta que quiere sonar antes del primer clic
  let volumenTecho  = 0.55;
  let fundido       = null;
  let ctx           = null;    // WebAudio para efectos

  /* ---------- fundidos ---------- */
  function fundirA(destino, ms, alAcabar) {
    clearInterval(fundido);
    const desde = pista.volume;
    const pasos = Math.max(1, Math.round(ms / 50));
    let i = 0;
    fundido = setInterval(() => {
      i++;
      pista.volume = U.limitar(desde + (destino - desde) * (i / pasos), 0, 1);
      if (i >= pasos) {
        clearInterval(fundido);
        if (alAcabar) alAcabar();
      }
    }, 50);
  }

  /* ---------- reproducción ---------- */
  function intentarSonar() {
    const p = pista.play();
    if (p && p.catch) p.catch(() => { /* el navegador aún no deja; no pasa nada */ });
  }

  /**
   * Pone una canción. Si ya está sonando la misma, no hace nada.
   * Si no hay ruta, baja el volumen y para.
   */
  function poner(ruta) {
    if (!activado) { pendiente = ruta || ""; return; }
    if (!ruta) { parar(); return; }
    if (ruta === actual && !pista.paused) return;

    const arrancar = () => {
      actual = ruta;
      pista.src = ruta;
      pista.volume = 0;
      pista.load();
      if (!silenciado) { intentarSonar(); fundirA(volumenTecho, 1400); }
    };

    if (!pista.paused && actual) fundirA(0, 700, arrancar);
    else arrancar();
  }

  function parar() {
    fundirA(0, 700, () => { pista.pause(); actual = ""; });
  }

  function silenciar(v) {
    silenciado = v;
    if (btn) btn.setAttribute("aria-pressed", String(!v));
    if (ico) ico.textContent = v ? "♪̸" : "♪";
    if (v) fundirA(0, 400, () => pista.pause());
    else if (actual) { intentarSonar(); fundirA(volumenTecho, 900); }
    U.guardado.escribir("nh-musica-off", v);
  }

  function alternar() { silenciar(!silenciado); }

  /** Baja el volumen un rato (por ejemplo mientras suena un audio del acertijo). */
  function agachar(v) {
    if (silenciado || !actual) return;
    fundirA(v ? volumenTecho * 0.25 : volumenTecho, 500);
  }

  /* ---------- efectos ---------- */
  function tono(frec, dur, tipo, vol) {
    if (silenciado || !activado) return;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gan = ctx.createGain();
      osc.type = tipo || "sine";
      osc.frequency.value = frec;
      gan.gain.setValueAtTime(0, ctx.currentTime);
      gan.gain.linearRampToValueAtTime(vol || 0.06, ctx.currentTime + 0.02);
      gan.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gan).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.05);
    } catch (e) { /* sin sonido, seguimos */ }
  }

  const sfx = {
    toque()   { tono(520, .08, "sine", .035); },
    bien()    { tono(660, .16, "sine", .06); setTimeout(() => tono(880, .3, "sine", .05), 130); },
    mal()     { tono(190, .22, "triangle", .045); },
    abrir()   { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tono(f, .45, "sine", .05), i * 150)); },
    letra()   { tono(1200, .09, "sine", .03); }
  };

  /* ---------- arranque ---------- */
  function activar() {
    if (activado) return;
    activado = true;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {}
    if (pendiente) { const r = pendiente; pendiente = ""; poner(r); }
  }

  function iniciar() {
    if (U.guardado.leer("nh-musica-off") === true) silenciado = true;
    silenciar(silenciado);
    if (btn) btn.addEventListener("click", alternar);
    ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
      window.addEventListener(ev, activar, { once: true, passive: true })
    );
  }

  return { iniciar, poner, parar, silenciar, alternar, agachar, activar, sfx,
           get silenciado() { return silenciado; } };
})();
