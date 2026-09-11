/* ============================================================
   UTIL · ayudas generales
   ============================================================ */
const U = (function () {

  /* ---------- DOM ---------- */
  const $  = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));

  /**
   * Crea un elemento.
   *   el("div", {class:"x", onclick:fn}, "texto", otroNodo)
   * Las propiedades que empiezan por "on" se registran como eventos.
   * Usa `html` para meter HTML literal (solo con contenido nuestro).
   */
  function el(etiqueta, props, ...hijos) {
    const n = document.createElement(etiqueta);
    for (const k in (props || {})) {
      const v = props[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === "class")      n.className = v;
      else if (k === "html")  n.innerHTML = v;
      else if (k === "estilo") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") {
        n.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === "dataset") {
        Object.assign(n.dataset, v);
      } else if (v === true) {
        n.setAttribute(k, "");
      } else {
        n.setAttribute(k, v);
      }
    }
    for (const h of hijos.flat()) {
      if (h === null || h === undefined || h === false) continue;
      n.appendChild(typeof h === "object" ? h : document.createTextNode(String(h)));
    }
    return n;
  }

  const vaciar = (n) => { while (n && n.firstChild) n.removeChild(n.firstChild); return n; };

  /* ---------- Texto ---------- */

  /**
   * Normaliza una respuesta para poder compararla sin castigar a nadie:
   * quita acentos, mayúsculas, signos, artículos y espacios de más.
   */
  function normalizar(txt) {
    return String(txt == null ? "" : txt)
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")   // acentos
      .replace(/[^a-z0-9ñ\s]/gi, " ")                     // signos
      .replace(/\s+/g, " ")
      .trim();
  }

  const ARTICULOS = ["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al"];

  /** Versión aún más permisiva: además quita artículos sueltos. */
  function normalizarFuerte(txt) {
    return normalizar(txt)
      .split(" ")
      .filter((p) => p && !ARTICULOS.includes(p))
      .join(" ");
  }

  /** ¿La respuesta dada coincide con alguna de las válidas? */
  function acierta(dada, validas) {
    const lista = Array.isArray(validas) ? validas : [validas];
    const a1 = normalizar(dada);
    const a2 = normalizarFuerte(dada);
    if (!a1) return false;
    return lista.some((v) => {
      const b1 = normalizar(v);
      const b2 = normalizarFuerte(v);
      return (b1 && (a1 === b1 || a2 === b1)) || (b2 && (a1 === b2 || a2 === b2));
    });
  }

  /* ---------- Números y listas ---------- */
  const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

  function barajar(lista, rnd) {
    const a = lista.slice();
    const r = rnd || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Baraja garantizando que el resultado no quede igual que el original. */
  function barajarDistinto(lista) {
    if (lista.length < 2) return lista.slice();
    let a, intentos = 0;
    do { a = barajar(lista); intentos++; }
    while (intentos < 30 && a.every((v, i) => v === lista[i]));
    return a;
  }

  /** Generador pseudoaleatorio con semilla: la misma escena se dibuja igual siempre. */
  function semilla(txt) {
    let h = 1779033703 ^ String(txt).length;
    for (let i = 0; i < String(txt).length; i++) {
      h = Math.imul(h ^ String(txt).charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  /* ---------- Tiempo ---------- */
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  const MESES = ["enero","febrero","marzo","abril","mayo","junio",
                 "julio","agosto","septiembre","octubre","noviembre","diciembre"];

  /* ---------- Almacenamiento (tolerante a fallos) ---------- */
  const guardado = {
    leer(clave) {
      try {
        const s = window.localStorage.getItem(clave);
        return s ? JSON.parse(s) : null;
      } catch (e) { return null; }
    },
    escribir(clave, valor) {
      try {
        window.localStorage.setItem(clave, JSON.stringify(valor));
        return true;
      } catch (e) { return false; }
    },
    borrar(clave) {
      try { window.localStorage.removeItem(clave); } catch (e) {}
    }
  };

  /* ---------- Avisos ---------- */
  function avisar(texto, tipo) {
    const caja = $("#avisos");
    if (!caja) return;
    const n = el("div", { class: "aviso" + (tipo ? " aviso--" + tipo : "") }, texto);
    caja.appendChild(n);
    setTimeout(() => {
      n.classList.add("saliendo");
      setTimeout(() => n.remove(), 400);
    }, 2600);
  }

  /* ---------- Celebración ---------- */
  const SIMBOLOS = ["❤", "✦", "❥", "✧", "♥", "✿"];

  function celebrar(cantidad) {
    const capa = $("#celebracion");
    if (!capa) return;
    const n = cantidad || 26;
    for (let i = 0; i < n; i++) {
      const s = el("span", { class: "chispa" }, SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)]);
      const dur = 2.4 + Math.random() * 2.2;
      s.style.left = Math.random() * 100 + "vw";
      s.style.bottom = "-40px";
      s.style.fontSize = (13 + Math.random() * 22) + "px";
      s.style.color = Math.random() > .45 ? "#e79a9a" : "#e8c07d";
      s.style.opacity = .75 + Math.random() * .25;
      s.style.animationDuration = dur + "s";
      s.style.animationDelay = (Math.random() * .9) + "s";
      s.style.setProperty("--giro", (Math.random() * 720 - 360) + "deg");
      capa.appendChild(s);
      setTimeout(() => s.remove(), (dur + 1.2) * 1000);
    }
  }

  /* ---------- Imágenes ---------- */
  /** Devuelve un <img> que se esconde solo si la foto no existe todavía. */
  function foto(ruta, alt, clase) {
    if (!ruta) return null;
    const img = el("img", { src: ruta, alt: alt || "", loading: "lazy" });
    const marco = el("figure", { class: "marco " + (clase || ""), estilo: { margin: "0" } }, img);
    img.addEventListener("error", () => marco.remove());
    return marco;
  }

  function existeFoto(ruta) {
    return new Promise((res) => {
      if (!ruta) return res(false);
      const i = new Image();
      i.onload = () => res(true);
      i.onerror = () => res(false);
      i.src = ruta;
    });
  }

  return { $, $$, el, vaciar, normalizar, normalizarFuerte, acierta, limitar,
           barajar, barajarDistinto, semilla, esperar, MESES, guardado,
           avisar, celebrar, foto, existeFoto };
})();
