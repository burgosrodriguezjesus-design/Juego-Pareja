/* ============================================================
   JUGADOR · caminar en primera persona
   ------------------------------------------------------------
   Sustituye al controlador de Rapier. Rapier ocupaba 2,18 MB
   del paquete (el 79 % de la descarga) para hacer esto: mover
   una cápsula que choca con cajas y sube escalones pequeños.
   Aquí son unas 150 líneas y el resultado es el mismo.

   Escritorio: WASD o flechas, ratón para mirar, Mayús correr,
               E interactuar, F fotografiar.
   Móvil:      palanca a la izquierda, arrastrar a la derecha
               para mirar, botones para tocar y fotografiar.
   ============================================================ */
import * as THREE from '../vendor/three.module.js';

const ALTURA_OJOS = 1.62;
const RADIO       = 0.34;
const VEL_ANDAR   = 3.1;
const VEL_CORRER  = 5.6;
const ESCALON     = 0.42;   // altura que sube sin saltar
const GRAVEDAD    = 22;

export class Jugador {
  /**
   * @param camara  la cámara que se mueve
   * @param opc.choques   lista de { min:[x,y,z], max:[x,y,z] } en coordenadas del mundo
   * @param opc.suelo     función (x,z) -> altura del suelo
   * @param opc.limite    radio del mundo, para no salirse
   */
  constructor(camara, opc = {}) {
    this.camara = camara;
    this.choques = opc.choques || [];
    this.suelo = opc.suelo || (() => 0);
    this.limite = opc.limite ?? 90;

    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector3();
    this.giro = 0;
    this.alza = 0;
    this.enSuelo = true;
    this.recorrido = 0;
    this.corriendo = false;
    this.bloqueado = false;
    this.sensibilidad = 1;
    this.velocidadAjuste = 1;
    this.balanceo = true;

    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._teclas = Object.create(null);
    this._tactil = { mover: null, vista: null, dx: 0, dz: 0 };
    this._conectarTeclado();
  }

  /* ---------------- teclado y ratón ---------------- */
  _conectarTeclado() {
    const MAPA = { KeyW:'arriba', ArrowUp:'arriba', KeyS:'abajo', ArrowDown:'abajo',
                   KeyA:'izq', ArrowLeft:'izq', KeyD:'der', ArrowRight:'der' };
    this._alPulsar = (e) => {
      if (this.bloqueado) return;
      const t = MAPA[e.code];
      if (t) { this._teclas[t] = true; e.preventDefault(); }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.corriendo = true;
    };
    this._alSoltar = (e) => {
      const t = MAPA[e.code];
      if (t) this._teclas[t] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.corriendo = false;
    };
    this._soltarTodo = () => { for (const k in this._teclas) this._teclas[k] = false; this.corriendo = false; };
    addEventListener('keydown', this._alPulsar);
    addEventListener('keyup', this._alSoltar);
    addEventListener('blur', this._soltarTodo);
  }

  conectarRaton(lienzo) {
    this.lienzo = lienzo;
    this._moverRaton = (e) => {
      if (this.bloqueado || document.pointerLockElement !== lienzo) return;
      this.giro -= e.movementX * 0.0022 * this.sensibilidad;
      this.alza = clamp(this.alza - e.movementY * 0.0022 * this.sensibilidad, -1.35, 1.35);
    };
    document.addEventListener('mousemove', this._moverRaton);
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== lienzo) this._soltarTodo();
      if (this.alCambiarRaton) this.alCambiarRaton(document.pointerLockElement === lienzo);
    });
  }

  pedirRaton() { if (!this.bloqueado && this.lienzo?.requestPointerLock) this.lienzo.requestPointerLock(); }
  soltarRaton() { if (document.pointerLockElement) document.exitPointerLock?.(); }

  /* ---------------- táctil ---------------- */
  conectarTactil(capa, palanca, bola) {
    this._palanca = palanca; this._bola = bola;
    const t = this._tactil;

    capa.addEventListener('pointerdown', (e) => {
      if (this.bloqueado || e.pointerType === 'mouse') return;
      const izq = e.clientX < innerWidth * 0.46;
      if (izq && t.mover === null) {
        t.mover = { id: e.pointerId, x0: e.clientX, y0: e.clientY };
        if (palanca) { palanca.style.left = e.clientX + 'px'; palanca.style.top = e.clientY + 'px';
                       palanca.classList.add('visible'); }
        capa.setPointerCapture(e.pointerId);
      } else if (!izq && t.vista === null) {
        t.vista = { id: e.pointerId, x: e.clientX, y: e.clientY };
        capa.setPointerCapture(e.pointerId);
      }
    });

    capa.addEventListener('pointermove', (e) => {
      if (this.bloqueado) return;
      if (t.mover && e.pointerId === t.mover.id) {
        const dx = e.clientX - t.mover.x0, dy = e.clientY - t.mover.y0, r = 56;
        const d = Math.min(1, Math.hypot(dx, dy) / r), a = Math.atan2(dy, dx);
        t.dx = Math.cos(a) * d; t.dz = Math.sin(a) * d;
        if (bola) bola.style.transform = `translate(${Math.cos(a)*d*r}px, ${Math.sin(a)*d*r}px)`;
      } else if (t.vista && e.pointerId === t.vista.id) {
        this.giro -= (e.clientX - t.vista.x) * 0.005 * this.sensibilidad;
        this.alza = clamp(this.alza - (e.clientY - t.vista.y) * 0.0045 * this.sensibilidad, -1.3, 1.3);
        t.vista.x = e.clientX; t.vista.y = e.clientY;
      }
    });

    const fin = (e) => {
      if (t.mover && e.pointerId === t.mover.id) {
        t.mover = null; t.dx = 0; t.dz = 0;
        palanca?.classList.remove('visible');
        if (bola) bola.style.transform = '';
      }
      if (t.vista && e.pointerId === t.vista.id) t.vista = null;
    };
    capa.addEventListener('pointerup', fin);
    capa.addEventListener('pointercancel', fin);
  }

  /* ---------------- colisión ---------------- */
  /** ¿La cápsula del jugador en (x,z) a altura y toca alguna caja? */
  _choca(x, y, z) {
    for (const c of this.choques) {
      if (y + 1.7 < c.min[1] || y + 0.05 > c.max[1]) continue;        // fuera en vertical
      const cx = clamp(x, c.min[0], c.max[0]);
      const cz = clamp(z, c.min[2], c.max[2]);
      if ((x - cx) ** 2 + (z - cz) ** 2 < RADIO * RADIO) return c;
    }
    return null;
  }

  /** Mueve en un eje y, si choca, se queda donde estaba. Así se desliza por las paredes. */
  _intentar(dx, dz) {
    const y = this.pos.y;
    if (dx) { const nx = this.pos.x + dx; if (!this._choca(nx, y, this.pos.z)) this.pos.x = nx; }
    if (dz) { const nz = this.pos.z + dz; if (!this._choca(this.pos.x, y, nz)) this.pos.z = nz; }
  }

  /** Altura del suelo contando las cajas que se pueden pisar. */
  _alturaEn(x, z, yRef) {
    let h = this.suelo(x, z);
    for (const c of this.choques) {
      if (x < c.min[0] - RADIO || x > c.max[0] + RADIO) continue;
      if (z < c.min[2] - RADIO || z > c.max[2] + RADIO) continue;
      if (c.max[1] > h && c.max[1] <= yRef + ESCALON) h = c.max[1];
    }
    return h;
  }

  /* ---------------- ciclo ---------------- */
  actualizar(dtTotal) {
    // pasos pequeños: la velocidad no depende de los fotogramas
    let resto = Math.min(0.25, dtTotal);
    while (resto > 0) { const p = Math.min(1 / 60, resto); this._paso(p); resto -= p; }
    this._pintarCamara();
  }

  _paso(dt) {
    let ex = 0, ez = 0;
    if (!this.bloqueado) {
      if (this._teclas.arriba) ez -= 1;
      if (this._teclas.abajo)  ez += 1;
      if (this._teclas.izq)    ex -= 1;
      if (this._teclas.der)    ex += 1;
      ex += this._tactil.dx; ez += this._tactil.dz;
    }
    const m = Math.hypot(ex, ez);
    if (m > 1) { ex /= m; ez /= m; }

    const vel = (this.corriendo ? VEL_CORRER : VEL_ANDAR) * this.velocidadAjuste;
    const sin = Math.sin(this.giro), cos = Math.cos(this.giro);
    // mirando a (-sen, -cos); la derecha es (cos, -sen)
    const objX = ( ex * cos + ez * sin) * vel;
    const objZ = (-ex * sin + ez * cos) * vel;

    const k = 1 - Math.pow(0.0001, dt);
    this.vel.x += (objX - this.vel.x) * k;
    this.vel.z += (objZ - this.vel.z) * k;

    const paso = Math.hypot(this.vel.x, this.vel.z) * dt;
    if (paso > 0.0004) { this._intentar(this.vel.x * dt, this.vel.z * dt); this.recorrido += paso; }

    // no salirse del mundo
    const d = Math.hypot(this.pos.x, this.pos.z);
    if (d > this.limite) { this.pos.x *= this.limite / d; this.pos.z *= this.limite / d; }

    // gravedad y suelo
    const suelo = this._alturaEn(this.pos.x, this.pos.z, this.pos.y);
    if (this.pos.y <= suelo + 0.02) {
      this.pos.y = suelo; this.vel.y = 0; this.enSuelo = true;
    } else {
      this.vel.y -= GRAVEDAD * dt;
      this.pos.y += this.vel.y * dt;
      if (this.pos.y < suelo) { this.pos.y = suelo; this.vel.y = 0; this.enSuelo = true; }
      else this.enSuelo = false;
    }
  }

  _pintarCamara() {
    const v = Math.hypot(this.vel.x, this.vel.z);
    const f = this.balanceo ? clamp(v / VEL_ANDAR, 0, 1.2) : 0;
    const sube = Math.sin(this.recorrido * 4.2) * 0.035 * f;
    const lado = Math.cos(this.recorrido * 2.1) * 0.008 * f;
    this.camara.position.set(this.pos.x, this.pos.y + ALTURA_OJOS + sube, this.pos.z);
    this._euler.set(this.alza, this.giro, lado);
    this.camara.quaternion.setFromEuler(this._euler);
  }

  colocar(x, z, mirandoA) {
    this.pos.set(x, this.suelo(x, z), z);
    this.vel.set(0, 0, 0);
    if (mirandoA) this.giro = Math.atan2(x - mirandoA[0], z - mirandoA[2]);
    this.alza = 0;
    this._pintarCamara();
  }

  bloquear(v) {
    this.bloqueado = v;
    if (v) { this._soltarTodo(); this._tactil.dx = this._tactil.dz = 0;
             this._tactil.mover = this._tactil.vista = null;
             this._palanca?.classList.remove('visible'); this.soltarRaton(); }
  }

  get enMarcha() { return Math.hypot(this.vel.x, this.vel.z) > 0.4; }

  destruir() {
    removeEventListener('keydown', this._alPulsar);
    removeEventListener('keyup', this._alSoltar);
    removeEventListener('blur', this._soltarTodo);
    if (this._moverRaton) document.removeEventListener('mousemove', this._moverRaton);
  }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
