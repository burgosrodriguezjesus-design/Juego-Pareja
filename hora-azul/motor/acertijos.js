/* ============================================================
   ACERTIJOS
   ------------------------------------------------------------
   Cada tipo devuelve un nodo de interfaz y avisa cuando está
   resuelto. Ninguno castiga: fallar solo cuesta intentarlo otra
   vez, nunca volver atrás.
   ============================================================ */

const el = (t, props = {}, ...hijos) => {
  const n = document.createElement(t);
  for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'clase') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos.flat()) if (h != null && h !== false)
    n.appendChild(typeof h === 'object' ? h : document.createTextNode(String(h)));
  return n;
};

/** Compara sin castigar: sin tildes, sin mayúsculas, sin signos. */
export const normalizar = (t) => String(t ?? '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9ñ\s]/gi, ' ').replace(/\s+/g, ' ').trim();

const barajar = (a) => { const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; }
  return b; };

/* ============================================================
   1 · FRASE · escribe lo que dijiste
   El corazón del prólogo. Acepta cualquier respuesta que
   contenga alguna de las piezas clave: da igual cómo lo escriba.
   ============================================================ */
function frase(a, api) {
  const campo = el('input', { type:'text', clase:'ac-campo', placeholder:'escríbelo',
    autocomplete:'off', autocapitalize:'off', autocorrect:'off', spellcheck:'false' });
  const comprobar = () => {
    if (api.resuelto()) return;
    const v = normalizar(campo.value);
    if (!v) { campo.focus(); return; }
    const bien = a.claves.some(grupo => grupo.every(k => v.includes(normalizar(k))));
    if (bien) { campo.disabled = true; api.acierto(); }
    else { api.fallo(); campo.select(); }
  };
  campo.addEventListener('keydown', e => { if (e.key === 'Enter') comprobar(); });
  setTimeout(() => { if (innerWidth > 760) campo.focus(); }, 500);
  return el('div', { clase:'ac-cuerpo' },
    a.subpregunta ? el('p', { clase:'ac-sub' }, a.subpregunta) : null,
    campo,
    el('div', { clase:'ac-botones' }, el('button', { clase:'ac-ok', onclick:comprobar }, 'Comprobar')));
}

/* ============================================================
   2 · ELEGIR · escoge N entre muchos
   ============================================================ */
function elegir(a, api) {
  const elegidas = new Set();
  const botones = new Map();
  const pintar = () => {
    botones.forEach((b, t) => b.classList.toggle('elegida', elegidas.has(t)));
    ok.disabled = elegidas.size !== a.cuantos;
    cuenta.textContent = `${elegidas.size} de ${a.cuantos}`;
  };
  const tocar = (t) => {
    if (api.resuelto()) return;
    if (elegidas.has(t)) elegidas.delete(t);
    else if (elegidas.size < a.cuantos) elegidas.add(t);
    pintar();
  };
  const comprobar = () => {
    if (api.resuelto()) return;
    const bien = a.correctas.length === elegidas.size &&
                 a.correctas.every(c => [...elegidas].some(e => normalizar(e) === normalizar(c)));
    if (bien) { botones.forEach(b => b.disabled = true); api.acierto(); }
    else { api.fallo(); elegidas.clear(); pintar(); }
  };
  const rejilla = el('div', { clase:'ac-rejilla' }, barajar(a.opciones).map(t => {
    const b = el('button', { clase:'ac-opcion', onclick:() => tocar(t) }, t);
    botones.set(t, b); return b;
  }));
  const cuenta = el('span', { clase:'ac-cuenta' });
  const ok = el('button', { clase:'ac-ok', disabled:true, onclick:comprobar }, 'Servir');
  pintar();
  return el('div', { clase:'ac-cuerpo' }, rejilla,
    el('div', { clase:'ac-botones' }, cuenta, ok));
}

/* ============================================================
   3 · ORDENAR · ponlo en su orden  (o elige una, con modo)
   ============================================================ */
function ordenar(a, api) {
  if (a.modo === 'elegirUna') {
    const botones = a.elementos.map((t, i) =>
      el('button', { clase:'ac-opcion ac-ancha', onclick:() => {
        if (api.resuelto()) return;
        if (i === a.correcta) { botones.forEach(b => b.disabled = true);
                                botones[i].classList.add('bien'); api.acierto(); }
        else { botones[i].classList.add('mal'); botones[i].disabled = true; api.fallo(); }
      } }, t));
    return el('div', { clase:'ac-cuerpo ac-columna' }, botones);
  }

  const orden = [];
  const nodos = new Map();
  const pintar = () => {
    nodos.forEach((n, t) => {
      const p = orden.indexOf(t);
      n.classList.toggle('elegida', p >= 0);
      n.querySelector('.ac-num').textContent = p >= 0 ? p + 1 : '';
    });
    ok.disabled = orden.length !== a.elementos.length;
  };
  const tocar = (t) => {
    if (api.resuelto()) return;
    const i = orden.indexOf(t);
    if (i >= 0) orden.splice(i, 1); else orden.push(t);
    pintar();
  };
  const comprobar = () => {
    if (api.resuelto()) return;
    if (orden.every((t, i) => t === a.elementos[i])) { nodos.forEach(n => n.classList.add('bien')); api.acierto(); }
    else {
      orden.forEach((t, i) => nodos.get(t).classList.add(t === a.elementos[i] ? 'bien' : 'mal'));
      api.fallo();
      setTimeout(() => { nodos.forEach(n => n.classList.remove('bien','mal')); orden.length = 0; pintar(); }, 1400);
    }
  };
  const lista = el('div', { clase:'ac-columna' }, barajar(a.elementos).map(t => {
    const n = el('button', { clase:'ac-fila', onclick:() => tocar(t) },
      el('span', { clase:'ac-num' }), el('span', {}, t));
    nodos.set(t, n); return n;
  }));
  const ok = el('button', { clase:'ac-ok', disabled:true, onclick:comprobar }, 'Comprobar');
  return el('div', { clase:'ac-cuerpo' }, lista, el('div', { clase:'ac-botones' }, ok));
}

/* ============================================================
   4 · SECUENCIA · repite el orden
   ============================================================ */
function secuencia(a, api) {
  const dadas = [];
  const pintar = () => { marca.textContent = dadas.map(i => a.campanas[i].nombre).join(' · ') || '—'; };
  const tocar = (i) => {
    if (api.resuelto()) return;
    dadas.push(i);
    botones[i].classList.add('sonando');
    setTimeout(() => botones[i].classList.remove('sonando'), 260);
    pintar();
    if (dadas.length === a.correcta.length) {
      const bien = dadas.every((v, k) => v === a.correcta[k]);
      setTimeout(() => {
        if (bien) { botones.forEach(b => b.disabled = true); api.acierto(); }
        else { api.fallo(); dadas.length = 0; pintar(); }
      }, 420);
    } else if (dadas.length > a.correcta.length) { dadas.length = 0; pintar(); }
  };
  const botones = a.campanas.map((c, i) =>
    el('button', { clase:'ac-campana', style:`--c:${c.color}`, onclick:() => tocar(i) }, c.nombre));
  const marca = el('div', { clase:'ac-cuenta' });
  pintar();
  return el('div', { clase:'ac-cuerpo' },
    el('div', { clase:'ac-rejilla' }, botones),
    el('div', { clase:'ac-botones' }, marca,
      el('button', { clase:'ac-suave', onclick:() => { dadas.length = 0; pintar(); } }, 'Empezar de nuevo')));
}

/* ============================================================
   5 · MEDIDOR · párala en su punto
   ============================================================ */
function medidor(a, api) {
  const aguja = el('b');
  const zona = el('i', { style:`left:${a.zona[0]*100}%;width:${(a.zona[1]-a.zona[0])*100}%` });
  const barra = el('div', { clase:'ac-barra' }, zona, aguja);

  // La aguja se calcula a partir del reloj, no acumulando por fotograma.
  // Así va exactamente a la misma velocidad con 144 fps que con 15, y no
  // se desvía aunque el navegador se salte fotogramas. Antes acumulaba
  // (v += velocidad * dt) y en un aparato lento se arrastraba.
  const periodo = 2 / a.velocidad;        // segundos en ir de 0 a 1 y volver
  let t0 = performance.now();
  let vivo = true, v = 0;

  const paso = () => {
    if (!vivo) return;
    const t = ((performance.now() - t0) / 1000) % periodo;
    const x = t / (periodo / 2);
    v = x <= 1 ? x : 2 - x;               // onda triangular entre 0 y 1
    aguja.style.left = (v * 100) + '%';
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);

  const parar = () => {
    if (api.resuelto() || !vivo) return;
    vivo = false;
    if (v >= a.zona[0] && v <= a.zona[1]) api.acierto();
    else {
      api.fallo(a.alFallar);
      // vuelve a empezar, pero desde un punto al azar: si siempre
      // arrancara de cero, en un aparato lento no daría tiempo a llegar
      setTimeout(() => {
        vivo = true;
        t0 = performance.now() - Math.random() * periodo * 1000;
        requestAnimationFrame(paso);
      }, 800);
    }
  };

  return el('div', { clase:'ac-cuerpo' }, barra,
    el('div', { clase:'ac-botones' }, el('button', { clase:'ac-ok', onclick:parar }, 'Parar')));
}

/* ============================================================
   Registro
   ============================================================ */
export const TIPOS = { frase, elegir, ordenar, secuencia, medidor };

export function crearAcertijo(a, api) {
  const f = TIPOS[a.tipo];
  if (!f) return el('div', { clase:'ac-cuerpo' },
    el('p', {}, `(tipo de acertijo sin implementar: ${a.tipo})`),
    el('div', { clase:'ac-botones' }, el('button', { clase:'ac-ok', onclick:() => api.acierto() }, 'Continuar')));
  return f(a, api);
}

/** La solución, para cuando alguien se rinde. */
export function solucion(a) {
  switch (a.tipo) {
    case 'frase':     return `Era: «${a.claves[0].join(' ')}…»`;
    case 'elegir':    return 'Eran: ' + a.correctas.join(' y ');
    case 'ordenar':   return a.modo === 'elegirUna'
                        ? 'Era: ' + a.elementos[a.correcta]
                        : 'El orden era: ' + a.elementos.map((t,i)=>`${i+1}. ${t}`).join('  ·  ');
    case 'secuencia': return 'El orden era: ' + a.correcta.map(i => a.campanas[i].nombre).join(' · ');
    case 'medidor':   return 'Había que pararla en la zona clara.';
    default:          return 'Esta te la doy por buena.';
  }
}

export { el };
