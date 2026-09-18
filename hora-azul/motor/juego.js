/* ============================================================
   JUEGO · el hilo que une todo
   ============================================================ */
import * as THREE from '../vendor/three.module.js';
import { Render, CALIDAD } from './render.js';
import { Jugador } from './jugador.js';
import { Escenario } from '../mundo/escenario.js';
import { crearAcertijo, solucion, normalizar, el } from './acertijos.js';
import { LUGARES, NOSOTROS, PORTADA, FINAL } from '../contenido/historia.js';

const GUARDADO = 'hora-azul-v3';
const TACTIL = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

export class Juego {
  constructor() {
    this.lienzo = document.getElementById('lienzo');
    this.render = new Render(this.lienzo);
    this.camara = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 600);
    this.reloj = new THREE.Clock();
    this.t = 0;
    this.estado = this.cargar();
    this.ui = {};
    this._cablearUI();
    addEventListener('resize', () => this.render.redimensionar());
  }

  /* ---------------- partida ---------------- */
  cargar() {
    try {
      const s = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
      if (s && typeof s === 'object') return Object.assign(this.limpio(), s);
    } catch (e) {}
    return this.limpio();
  }
  limpio() { return { lugar: 0, hechos: [], cristales: [], ajustes: {
    calidad: TACTIL ? CALIDAD.MEDIA : CALIDAD.ALTA, sensibilidad: 1, velocidad: 1,
    texto: 1, balanceo: true, volumen: 0.6 } }; }
  guardar() { try { localStorage.setItem(GUARDADO, JSON.stringify(this.estado)); } catch (e) {} }
  borrar() { try { localStorage.removeItem(GUARDADO); } catch (e) {} this.estado = this.limpio(); }

  /* ---------------- interfaz ---------------- */
  _cablearUI() {
    const g = (id) => document.getElementById(id);
    this.ui = { cabecera:g('cabecera'), titulo:g('titulo'), subtitulo:g('subtitulo'),
      objetivo:g('objetivo'), objetivoTxt:g('objetivo-txt'), progreso:g('progreso'),
      mira:g('mira'), cartel:g('cartel'), cartelTxt:g('cartel-txt'), cartelAcc:g('cartel-acc'),
      panel:g('panel'), panelCaja:g('panel-caja'), aviso:g('aviso'),
      mandos:g('mandos'), palanca:g('palanca'), bola:g('bola'),
      btnTocar:g('btn-tocar'), btnFoto:g('btn-foto'), pista:g('btn-pista'),
      controles:g('controles'), raton:g('aviso-raton') };

    if (TACTIL) document.body.classList.add('tactil');

    this.ui.pista.onclick = () => this.darPista(false);
    this.ui.btnTocar.onclick = (e) => { e.preventDefault(); this.interactuar(); };
    this.ui.btnFoto.onclick = (e) => { e.preventDefault(); this.fotografiar(); };
    this.ui.raton.onclick = () => this.jugador?.pedirRaton();
    this.lienzo.onclick = () => { if (!TACTIL && !this.panelAbierto) this.jugador?.pedirRaton(); };

    addEventListener('keydown', (e) => {
      if (this.panelAbierto) { if (e.code === 'Escape') this.cerrarPanel(); return; }
      if (e.code === 'KeyE') this.interactuar();
      if (e.code === 'KeyF') this.fotografiar();
      if (e.code === 'KeyH') this.darPista(false);
      if (e.code === 'Escape') this.pausa();
    });
    document.addEventListener('pointerlockchange', () => this._verRaton());
  }

  _verRaton() {
    this.ui.raton.hidden = TACTIL || !this.enJuego || this.panelAbierto ||
                           document.pointerLockElement === this.lienzo;
  }

  /* ---------------- ciclo ---------------- */
  arrancar() {
    this.enJuego = false;
    this.portada();
    const bucle = () => {
      requestAnimationFrame(bucle);
      const dt = Math.min(0.25, this.reloj.getDelta());
      this.t += dt;
      if (this.escenario && this.jugador) {
        this.jugador.actualizar(dt);
        this.escenario.actualizar(dt, this.t, this.camara);
        this._mirarCerca();
        this.render.pintar();
      }
    };
    bucle();
  }

  /* ---------------- pantallas ---------------- */
  portada() {
    const hay = this.estado.hechos.length > 0;
    this.abrirPanel(el('div', { clase:'p-portada' },
      el('p', { clase:'p-kicker' }, `Para ${NOSOTROS.ella}, de ${NOSOTROS.el} · ${FINAL.fecha}`),
      el('h2', {}, PORTADA.titulo),
      el('p', { clase:'p-lede' }, PORTADA.entradilla),
      el('p', { clase:'p-small' }, TACTIL
        ? 'Palanca a la izquierda para andar, arrastra a la derecha para mirar.'
        : 'Camina con WASD, mira con el ratón y toca con E.'),
      el('div', { clase:'p-acciones' },
        el('button', { clase:'ac-ok', onclick:() => this.irA(hay ? this.estado.lugar : 0) },
          hay ? 'Seguir donde lo dejaste' : 'Empezar la aventura'),
        hay ? el('button', { clase:'ac-suave', onclick:() => {
          if (confirm('¿Empezar otra vez? Se borra lo que llevas.')) { this.borrar(); this.irA(0); }
        } }, 'Empezar de nuevo') : null)
    ), { cerrable:false });
  }

  irA(i) {
    if (i >= LUGARES.length) return this.final();
    this.cerrarPanel(true);
    this.estado.lugar = i;
    this.guardar();
    this.cargarLugar(LUGARES[i]);
  }

  cargarLugar(datos) {
    this.escenario?.destruir();
    this.escenario = new Escenario(datos, this.render);
    this.render.montar(this.escenario.escena, this.camara);

    this.jugador?.destruir();
    this.jugador = new Jugador(this.camara, {
      choques: this.escenario.choques,
      suelo: () => 0,
      limite: (datos.suelo?.tam ?? 80) / 2 - 2
    });
    const aj = this.estado.ajustes;
    this.jugador.sensibilidad = aj.sensibilidad;
    this.jugador.velocidadAjuste = aj.velocidad;
    this.jugador.balanceo = aj.balanceo;
    this.jugador.conectarRaton(this.lienzo);
    this.jugador.conectarTactil(this.ui.mandos, this.ui.palanca, this.ui.bola);
    this.jugador.colocar(datos.aparicion[0], datos.aparicion[1], [0, 0, -1]);

    this.lugar = datos;
    this.enJuego = true;
    this.paso = 0;              // dónde va dentro del acertijo
    this.mochila = [];
    this.pistasDadas = 0;
    this.fallos = 0;
    this._prepararInteracciones();
    this._pintarHud();
    this.mostrarAviso(datos.intro + (TACTIL
      ? ' Usa la palanca para andar y el botón para tocar.'
      : ' WASD para andar, ratón para mirar, E para tocar.'), 7000);
    this._verRaton();
  }

  /* ---------------- interacciones del mundo ---------------- */
  _prepararInteracciones() {
    const a = this.lugar.acertijo;
    this.puntos = [];
    const P = (o) => this.puntos.push(o);

    if (a.tipo === 'recoger') {
      for (const r of a.recoge) P({ ...r, clase:'recoger', accion:'recoger' });
      P({ ...a.usaEn, clase:'usar', accion:'usar' });
      if (a.despues) P({ ...a.despues, clase:'despues', accion:'panel', acertijo:a.despues, oculto:true });
    } else if (a.tipo === 'encuadre') {
      P({ ...a.camara, clase:'recoger', accion:'recoger', id:'camara' });
      a.encuadres.forEach((e, i) => P({ id:'marca'+i, nombre:e.nombre, pos:e.marca,
        clase:'marca', accion:'encuadre', indice:i, oculto:true }));
      P({ ...a.volverA, clase:'volver', accion:'terminar', oculto:true });
    } else if (a.tipo === 'colocar') {
      for (let i = 0; i < a.lamparas; i++) {
        const an = (i / a.lamparas) * Math.PI * 2 - Math.PI / 2;
        P({ id:'lampara'+i, nombre:`la lámpara ${i+1}`, indice:i, clase:'lampara', accion:'lampara',
            pos:[Math.cos(an) * a.radio, 0, Math.sin(an) * a.radio] });
      }
    } else {
      P({ id:'principal', nombre:a.nombre, pos:a.pos, clase:'panel', accion:'panel', acertijo:a });
    }
    this._pintarPuntos();
  }

  _pintarPuntos() {
    this.marcas?.forEach(m => this.escenario.escena.remove(m));
    this.marcas = [];
    const geoAlto = new THREE.CylinderGeometry(0.07, 0.14, 11, 8, 1, true);
    for (const p of this.puntos) {
      if (p.oculto && !p.visible) continue;
      if (p.hecho) continue;
      const g = new THREE.Group();
      const nucleo = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.17, 0),
        new THREE.MeshStandardMaterial({ color:'#ffe6b8', emissive:'#ffb454', emissiveIntensity:4, roughness:.3 }));
      nucleo.position.y = 1.05;
      g.add(nucleo);
      const haz = new THREE.Mesh(geoAlto, new THREE.MeshBasicMaterial({
        color:'#ffcf8a', transparent:true, opacity:0.055, side:THREE.DoubleSide,
        depthWrite:false, blending:THREE.AdditiveBlending, fog:false }));
      haz.position.y = 5.5;
      g.add(haz);
      g.position.set(p.pos[0], p.pos[1] ?? 0, p.pos[2]);
      g.userData.nucleo = nucleo;
      this.escenario.escena.add(g);
      this.marcas.push(g);
      p._marca = g;
    }
  }

  _mirarCerca() {
    if (this.panelAbierto) { this.ui.cartel.hidden = true; this.ui.btnTocar.hidden = true;
                             this.ui.btnFoto.hidden = true; return; }
    let cerca = null, dmin = 1e9;
    for (const p of this.puntos) {
      if (p.hecho || (p.oculto && !p.visible)) continue;
      const d = Math.hypot(this.camara.position.x - p.pos[0], this.camara.position.z - p.pos[2]);
      if (d < 2.6 && d < dmin) { dmin = d; cerca = p; }
      if (p._marca) p._marca.userData.nucleo.rotation.y += 0.02;
    }
    this.cerca = cerca;
    const esFoto = cerca?.accion === 'encuadre';
    this.ui.cartel.hidden = !cerca;
    this.ui.mira.classList.toggle('activa', !!cerca);
    if (cerca) {
      this.ui.cartelTxt.textContent = cerca.nombre;
      this.ui.cartelAcc.innerHTML = TACTIL
        ? (esFoto ? 'pulsa el botón de foto' : 'pulsa el botón')
        : (esFoto ? 'pulsa <b>F</b>' : 'pulsa <b>E</b>');
    }
    this.ui.btnTocar.hidden = !cerca || esFoto;
    this.ui.btnFoto.hidden = !esFoto;
  }

  interactuar() {
    const p = this.cerca;
    if (!p || this.panelAbierto || p.accion === 'encuadre') return;
    const a = this.lugar.acertijo;

    if (p.accion === 'recoger') {
      this.mochila.push(p.id);
      p.hecho = true;
      this.mostrarAviso(`Has cogido: ${p.nombre}`);
      if (a.tipo === 'encuadre') a.encuadres.forEach((_, i) => {
        const m = this.puntos.find(x => x.id === 'marca'+i); if (m) m.visible = true; });
      this._pintarPuntos(); this._pintarHud();

    } else if (p.accion === 'usar') {
      const faltan = (p.necesita || []).filter(n => !this.mochila.includes(n));
      if (faltan.length) { this.mostrarAviso('Todavía te falta algo.'); return; }
      p.hecho = true;
      this.mostrarAviso(p.alHacerlo || 'Listo.');
      const d = this.puntos.find(x => x.clase === 'despues');
      if (d) { d.visible = true; }
      this._pintarPuntos();
      if (!d) this.resuelto();

    } else if (p.accion === 'panel') {
      this.abrirAcertijo(p.acertijo, p);

    } else if (p.accion === 'lampara') {
      const esperado = this.colocadas?.length ?? 0;
      if (p.indice !== esperado) { this.fallar('Esa no es la que toca ahora.'); return; }
      (this.colocadas ||= []).push(p.indice);
      p.hecho = true;
      this._pintarPuntos();
      this.mostrarAviso(`Cristal ${p.indice + 1} de ${a.lamparas}.`);
      if (this.colocadas.length === a.lamparas) this.resuelto();

    } else if (p.accion === 'terminar') {
      this.resuelto();
    }
  }

  fotografiar() {
    const p = this.cerca;
    if (!p || p.accion !== 'encuadre' || this.panelAbierto) return;
    const a = this.lugar.acertijo;
    const e = a.encuadres[p.indice];
    // ¿está mirando hacia donde debe?
    const dir = new THREE.Vector3();
    this.camara.getWorldDirection(dir);
    const hacia = new THREE.Vector3(e.mira[0] - this.camara.position.x, 0,
                                    e.mira[2] - this.camara.position.z).normalize();
    const alineado = dir.setY(0).normalize().dot(hacia);
    if (alineado < 0.93) { this.fallar('No es ese encuadre. Mira hacia ' + e.nombre + '.'); return; }
    p.hecho = true;
    this._pintarPuntos();
    this.mostrarAviso(a.alAcertar || 'Encuadre recuperado.');
    const quedan = a.encuadres.filter((_, i) => !this.puntos.find(x => x.id === 'marca'+i)?.hecho);
    if (!quedan.length) {
      const v = this.puntos.find(x => x.clase === 'volver');
      if (v) { v.visible = true; this._pintarPuntos(); this.mostrarAviso('Vuelve a vuestro banco.'); }
    }
    this._pintarHud();
  }

  /* ---------------- acertijos de panel ---------------- */
  abrirAcertijo(a, punto) {
    let resuelto = false;
    const zonaPistas = el('div', { clase:'ac-pistas' });
    const api = {
      resuelto: () => resuelto,
      acierto: () => { if (resuelto) return; resuelto = true;
        if (punto) punto.hecho = true;
        this.cerrarPanel(true);
        this.mostrarAviso(a.alAcertar || 'Bien.');
        if (a.despues) { setTimeout(() => this.abrirAcertijo(a.despues, null), 900); }
        else this.resuelto();
      },
      fallo: (txt) => { this.fallos++;
        this.mostrarAviso(txt || ['No es eso…', 'Casi', 'Prueba otra vez'][Math.min(this.fallos-1, 2)], 2200);
        if (this.fallos % 2 === 0) this.darPista(true, zonaPistas);
      }
    };
    this.abrirPanel(el('div', {},
      el('p', { clase:'p-kicker' }, this.lugar.titulo),
      el('h3', {}, a.pregunta || this.lugar.objetivo),
      crearAcertijo(a, api),
      zonaPistas,
      el('div', { clase:'ac-botones' },
        el('button', { clase:'ac-suave', onclick:() => this.darPista(false, zonaPistas) }, 'Una pista'),
        el('button', { clase:'ac-suave', onclick:() => this.cerrarPanel() }, 'Volver'))
    ));
    this._zonaPistas = zonaPistas;
  }

  darPista(auto, zona) {
    const p = this.lugar?.pistas || [];
    zona = zona || this._zonaPistas;
    if (this.pistasDadas >= p.length) {
      if (!auto) this.mostrarAviso('Ya no me quedan más pistas.');
      return;
    }
    const txt = p[this.pistasDadas++];
    const nodo = el('div', { clase:'ac-pista' }, `Ayuda ${this.pistasDadas} de ${p.length} · ${txt}`);
    if (zona && this.panelAbierto) zona.appendChild(nodo);
    else this.mostrarAviso(`Ayuda ${this.pistasDadas} de ${p.length} · ${txt}`, 7000);
  }

  fallar(txt) { this.fallos++; this.mostrarAviso(txt, 2600); }

  /* ---------------- resolver un lugar ---------------- */
  resuelto() {
    const id = this.lugar.id;
    if (!this.estado.hechos.includes(id)) {
      this.estado.hechos.push(id);
      if (id !== 'final') this.estado.cristales.push(id);
      this.guardar();
    }
    const ultimo = this.estado.lugar >= LUGARES.length - 1;
    setTimeout(() => this.abrirPanel(el('div', {},
      el('p', { clase:'p-kicker' }, 'Recuerdo recuperado'),
      el('h3', {}, this.lugar.titulo),
      el('p', { clase:'p-lede p-recuerdo' }, this.lugar.recuerdo),
      el('div', { clase:'p-acciones' },
        el('button', { clase:'ac-ok', onclick:() => ultimo ? this.final() : this.irA(this.estado.lugar + 1) },
          ultimo ? 'Abrir la carta' : 'Seguir'))
    ), { cerrable:false }), 700);
  }

  final() {
    this.enJuego = false;
    this.abrirPanel(el('div', { clase:'p-final' },
      el('p', { clase:'p-kicker' }, FINAL.titulo),
      el('p', { clase:'p-carta' }, FINAL.texto),
      el('p', { clase:'p-firma' }, FINAL.firma),
      el('p', { clase:'p-small' }, FINAL.fecha)
    ), { cerrable:false });
  }

  /* ---------------- paneles y avisos ---------------- */
  abrirPanel(nodo, o = {}) {
    this.panelAbierto = true;
    this.jugador?.bloquear(true);
    this.ui.panelCaja.replaceChildren(nodo);
    this.ui.panel.hidden = false;
    this.ui.panel.dataset.cerrable = o.cerrable === false ? 'no' : 'si';
    this._verRaton();
  }
  /**
   * @param forzar  cierra aunque el panel esté marcado como no cerrable.
   *   Los paneles de portada, recuerdo y final no se cierran con Esc, pero el
   *   propio juego sí tiene que poder quitarlos al cambiar de pantalla.
   */
  cerrarPanel(forzar = false) {
    if (!forzar && this.ui.panel.dataset.cerrable === 'no') return;
    this.panelAbierto = false;
    this.ui.panel.hidden = true;
    this.jugador?.bloquear(false);
    this._verRaton();
  }
  pausa() {
    const aj = this.estado.ajustes;
    const fila = (etq, control) => el('label', { clase:'aj-fila' }, el('span', {}, etq), control);
    const rango = (v, min, max, step, alCambiar) => el('input', { type:'range', min, max, step, value:v,
      oninput:(e) => { alCambiar(parseFloat(e.target.value)); this.guardar(); } });
    this.abrirPanel(el('div', {},
      el('h3', {}, 'Pausa'),
      el('div', { clase:'aj' },
        fila('Sensibilidad', rango(aj.sensibilidad, 0.3, 2, 0.1, v => { aj.sensibilidad = v; this.jugador.sensibilidad = v; })),
        fila('Velocidad al caminar', rango(aj.velocidad, 0.5, 1.6, 0.1, v => { aj.velocidad = v; this.jugador.velocidadAjuste = v; })),
        fila('Tamaño del texto', rango(aj.texto, 0.85, 1.4, 0.05, v => { aj.texto = v; document.documentElement.style.setProperty('--escala', v); })),
        fila('Calidad gráfica', el('select', { onchange:(e) => {
          aj.calidad = Number(e.target.value); this.render.ponerCalidad(aj.calidad); this.guardar(); } },
          el('option', { value:2, selected:aj.calidad===2 }, 'Alta'),
          el('option', { value:1, selected:aj.calidad===1 }, 'Media'),
          el('option', { value:0, selected:aj.calidad===0 }, 'Ligera'))),
        fila('Movimiento de cámara', el('input', { type:'checkbox', checked:aj.balanceo,
          onchange:(e) => { aj.balanceo = e.target.checked; this.jugador.balanceo = aj.balanceo; this.guardar(); } }))),
      el('div', { clase:'p-acciones' },
        el('button', { clase:'ac-ok', onclick:() => this.cerrarPanel() }, 'Continuar'),
        el('button', { clase:'ac-suave', onclick:() => {
          if (confirm('¿Borrar la partida? Se pierde lo que llevas.')) { this.borrar(); location.reload(); }
        } }, 'Borrar partida'))
    ));
  }

  mostrarAviso(txt, ms = 4000) {
    this.ui.aviso.textContent = txt;
    this.ui.aviso.hidden = false;
    clearTimeout(this._tAviso);
    this._tAviso = setTimeout(() => { this.ui.aviso.hidden = true; }, ms);
  }

  _pintarHud() {
    const L = this.lugar;
    this.ui.titulo.textContent = L.titulo;
    this.ui.subtitulo.textContent = L.subtitulo;
    this.ui.objetivoTxt.textContent = L.objetivo;
    this.ui.progreso.textContent =
      `${this.estado.cristales.length} de ${LUGARES.length - 1} cristales` +
      (this.mochila.length ? ` · ${this.mochila.length} en la mochila` : '');
    this.ui.cabecera.hidden = false;
    this.ui.objetivo.hidden = false;
  }
}
