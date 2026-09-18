/* ============================================================
   PIEZAS · con esto se construyen los ocho lugares
   ------------------------------------------------------------
   Un escenario no se programa: se describe. Cada sitio del
   archivo de contenido es una lista de piezas y prefabricados,
   y este módulo las convierte en geometría, colisiones y luces.
   ============================================================ */
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/jsm/geometries/RoundedBoxGeometry.js';

/* ------------------------------------------------------------
   Constructor
   ------------------------------------------------------------ */
export class Constructor {
  constructor(paleta, entorno, calidadAlta = true) {
    this.pal = paleta;
    this.entorno = entorno;
    this.fino = calidadAlta;
    this.grupo = new THREE.Group();
    this.choques = [];      // { min:[x,y,z], max:[x,y,z] }
    this.luces = [];        // { pos, color, fuerza, alcance }
    this._mats = new Map();
    this._geos = new Map();
  }

  color(c) { return this.pal[c] || c; }

  material(c, o = {}) {
    const clave = `${c}|${o.rugosidad ?? .85}|${o.metal ?? 0}|${o.brilla ?? 0}|${o.plano ? 1 : 0}|${o.alfa ?? 1}`;
    if (this._mats.has(clave)) return this._mats.get(clave);
    const col = this.color(c);
    const m = new THREE.MeshStandardMaterial({
      color: col,
      roughness: o.rugosidad ?? 0.85,
      metalness: o.metal ?? 0.0,
      flatShading: !!o.plano,
      envMap: this.entorno || null,
      envMapIntensity: o.entorno ?? 1.0,
      emissive: o.brilla ? new THREE.Color(o.brillaColor || col) : 0x000000,
      // 3.5 deja las bombillas por encima del umbral 2.40 del bloom
      emissiveIntensity: o.brilla ? (o.brilla === true ? 3.5 : o.brilla) : 1,
      transparent: (o.alfa ?? 1) < 1,
      opacity: o.alfa ?? 1
    });
    this._mats.set(clave, m);
    return m;
  }

  _caja(w, h, d) {
    const clave = `c${w}|${h}|${d}|${this.fino}`;
    if (this._geos.has(clave)) return this._geos.get(clave);
    const g = this.fino
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.05)
      : new THREE.BoxGeometry(w, h, d);
    this._geos.set(clave, g);
    return g;
  }

  /**
   * Caja. `y` es la BASE, no el centro.
   *   caja({ pos:[x,y,z], tam:[an,al,fo], color:'muro', giro, choca, brilla })
   */
  caja(o) {
    const [x, y, z] = o.pos;
    const [w, h, d] = o.tam;
    const m = new THREE.Mesh(this._caja(w, h, d), this.material(o.color, o));
    m.position.set(x, y + h / 2, z);
    if (o.giro) m.rotation.y = o.giro;
    if (o.inclina) m.rotation.z = o.inclina;
    m.castShadow = o.sombra !== false;
    m.receiveShadow = true;
    this.grupo.add(m);
    if (o.choca !== false && !o.giro) this.choque([x - w/2, y, z - d/2], [x + w/2, y + h, z + d/2]);
    else if (o.choca !== false) {           // girada: caja envolvente holgada
      const r = Math.max(w, d) / 2;
      this.choque([x - r, y, z - r], [x + r, y + h, z + r]);
    }
    return m;
  }

  cilindro(o) {
    const [x, y, z] = o.pos;
    const [r1, r2, h] = o.tam;
    const g = new THREE.CylinderGeometry(r1, r2 ?? r1, h, this.fino ? 20 : 10);
    const m = new THREE.Mesh(g, this.material(o.color, o));
    m.position.set(x, y + h / 2, z);
    if (o.inclina) m.rotation.x = o.inclina;
    m.castShadow = o.sombra !== false;
    m.receiveShadow = true;
    this.grupo.add(m);
    if (o.choca) this.choque([x - r1, y, z - r1], [x + r1, y + h, z + r1]);
    return m;
  }

  esfera(o) {
    const [x, y, z] = o.pos;
    const r = o.r ?? 0.3;
    const g = new THREE.SphereGeometry(r, this.fino ? 22 : 10, this.fino ? 16 : 7);
    const m = new THREE.Mesh(g, this.material(o.color, o));
    m.position.set(x, y, z);
    m.castShadow = o.sombra !== false;
    this.grupo.add(m);
    return m;
  }

  choque(min, max) { this.choques.push({ min, max }); }
  luz(pos, color, fuerza, alcance) { this.luces.push({ pos, color, fuerza, alcance }); }

  /* ---------- suelo ---------- */
  suelo({ tam = 90, color = 'suelo', humedo = false } = {}) {
    if (humedo && this.fino) {
      // reflejo tenue: el truco más rentable de una escena nocturna,
      // porque todas las luces aparecen dos veces
      const esp = new ReflectorLigero(tam, this.pal.reflejo || '#2b333c');
      this.grupo.add(esp.malla);
      this._reflector = esp;
      const capa = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam),
        this.material(color, { rugosidad: 0.8, alfa: 0.9 }));
      capa.rotation.x = -Math.PI / 2;
      capa.receiveShadow = true;
      capa.castShadow = false;
      this.grupo.add(capa);
      return capa;
    }
    const s = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), this.material(color, { rugosidad: 0.95 }));
    s.rotation.x = -Math.PI / 2;
    s.receiveShadow = true;
    s.castShadow = false;
    this.grupo.add(s);
    return s;
  }
}

/* Reflector con coste controlado: media resolución y sin recursión. */
class ReflectorLigero {
  constructor(tam, color) {
    this.malla = new THREE.Mesh(
      new THREE.PlaneGeometry(tam, tam),
      new THREE.MeshStandardMaterial({ color, roughness: 0.12, metalness: 0.9 })
    );
    this.malla.rotation.x = -Math.PI / 2;
    this.malla.position.y = -0.02;
    this.malla.receiveShadow = false;
  }
}

/* ============================================================
   Prefabricados
   Cada uno recibe (c, o) con c = Constructor
   ============================================================ */
export const PREFABS = {

  mesa(c, o) {
    const [x, y, z] = o.pos, an = o.an ?? 1.9, fo = o.fo ?? 0.95, alt = o.alt ?? 0.74;
    c.caja({ pos: [x, y + alt, z], tam: [an, 0.08, fo], color: o.color || 'madera' });
    for (const [dx, dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
      c.cilindro({ pos: [x + dx*(an/2-0.12), y, z + dz*(fo/2-0.12)], tam: [0.035, 0.035, alt],
                   color: 'metal', metal: 0.8, rugosidad: 0.4, choca: false });
    }
    c.choque([x-an/2, y, z-fo/2], [x+an/2, y+alt+0.08, z+fo/2]);
  },

  banco(c, o) {
    const [x, y, z] = o.pos, g = o.giro || 0;
    const s = Math.sin(g), co = Math.cos(g);
    c.caja({ pos: [x, y + 0.42, z], tam: [1.8, 0.09, 0.5], color: 'madera', giro: g, choca: false });
    c.caja({ pos: [x - s*0.22, y + 0.5, z - co*0.22], tam: [1.8, 0.5, 0.08], color: 'madera', giro: g, choca: false });
    for (const d of [-0.72, 0.72]) {
      c.caja({ pos: [x + co*d, y, z - s*d], tam: [0.08, 0.42, 0.46], color: 'metal',
               metal: 0.8, rugosidad: 0.4, giro: g, choca: false });
    }
    c.choque([x-0.95, y, z-0.4], [x+0.95, y+0.5, z+0.4]);
  },

  farola(c, o) {
    const [x, y, z] = o.pos, alt = o.alt ?? 4.6;
    c.cilindro({ pos: [x, y, z], tam: [0.32, 0.4, 0.26], color: 'metal', metal: 0.7, rugosidad: 0.5 });
    c.cilindro({ pos: [x, y + 0.26, z], tam: [0.09, 0.11, alt], color: 'metal', metal: 0.7, rugosidad: 0.45 });
    c.esfera({ pos: [x, y + alt + 0.4, z], r: 0.24,
               color: o.encendida ? 'bombilla' : 'metal', brilla: o.encendida ? 4 : 0, sombra: false });
    c.choque([x-0.25, y, z-0.25], [x+0.25, y+alt, z+0.25]);
    if (o.encendida) c.luz([x, y + alt + 0.3, z], c.color('bombilla'), o.fuerza ?? 34, o.alcance ?? 22);
  },

  caseta(c, o) {
    const [x, y, z] = o.pos, an = o.an ?? 6.4, fo = o.fo ?? 4.0, alt = o.alt ?? 3.0, g = o.giro || 0;
    c.caja({ pos: [x, y, z], tam: [an, alt, fo], color: o.color || 'toldo', giro: g });
    c.caja({ pos: [x, y + alt, z], tam: [an + 0.7, 0.2, fo + 1.0], color: 'crema', giro: g, choca: false });
    // toldo a rayas
    const n = o.rayas ?? 9;
    for (let i = 0; i < n; i++) {
      const dx = -an/2 + (i + 0.5) * (an / n);
      c.caja({ pos: [x + Math.cos(g)*dx, y + alt + 0.2, z - Math.sin(g)*dx + Math.cos(g)*(fo/2 + 0.35)],
               tam: [an/n, 0.26, 0.8], color: i % 2 ? 'crema' : 'azulado', giro: g, choca: false });
    }
    if (o.luz !== false) c.luz([x, y + alt - 0.4, z + fo/2 - 0.2], c.color('bombilla'), 16, 13);
  },

  palmera(c, o) {
    const [x, y, z] = o.pos, alt = o.alt ?? 6.5;
    const pasos = 8, curva = o.curva ?? 0.6;
    for (let i = 0; i < pasos; i++) {
      const t = i / (pasos - 1);
      c.cilindro({ pos: [x + curva*t*t, y + alt*0.66*t*0.97, z], color: 'tronco',
                   tam: [alt*(0.055 - t*0.018), alt*(0.05 - t*0.016), alt*0.66/pasos*1.5], choca: false });
    }
    const cx = x + curva, cy = y + alt * 0.66;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      for (let j = 0; j < 3; j++) {
        const t = (j + 0.5) / 3, L = alt * 0.42;
        c.caja({ pos: [cx + Math.cos(a)*L*t, cy - t*t*alt*0.16, z + Math.sin(a)*L*t],
                 tam: [L/3*1.3, 0.03, alt*(0.08 - t*0.04)], color: 'hoja', giro: a,
                 inclina: 0.12 + t*0.3, choca: false, sombra: false });
      }
    }
    c.choque([x-0.3, y, z-0.3], [x+0.3, y+alt*0.66, z+0.3]);
  },

  arbol(c, o) {
    const [x, y, z] = o.pos, alt = o.alt ?? 5;
    c.cilindro({ pos: [x, y, z], tam: [alt*0.05, alt*0.07, alt*0.42], color: 'tronco' });
    c.esfera({ pos: [x, y + alt*0.68, z], r: alt*0.3, color: 'hoja', plano: true });
    c.esfera({ pos: [x - alt*0.18, y + alt*0.55, z + alt*0.1], r: alt*0.21, color: 'hoja', plano: true });
    c.esfera({ pos: [x + alt*0.19, y + alt*0.58, z - alt*0.08], r: alt*0.22, color: 'hoja', plano: true });
    c.choque([x-0.35, y, z-0.35], [x+0.35, y+alt*0.42, z+0.35]);
  },

  /** Guirnalda de bombillas colgando entre dos puntos. */
  guirnalda(c, o) {
    const [x1, y1, z1] = o.de, [x2, y2, z2] = o.a;
    const n = o.n ?? 12, caida = o.caida ?? 0.8;
    for (let i = 0; i <= n; i++) {
      const t = i / n, s = Math.sin(t * Math.PI) * caida;
      c.esfera({ pos: [x1 + (x2-x1)*t, y1 + (y2-y1)*t - s, z1 + (z2-z1)*t],
                 r: 0.075, color: i % 3 === 0 ? 'neon' : 'bombilla', brilla: 3.5, sombra: false });
    }
  },

  /** Pared con un hueco de puerta en el centro. */
  paredConPuerta(c, o) {
    const [x, y, z] = o.pos, an = o.an ?? 10, alt = o.alt ?? 3.6, gr = o.gr ?? 0.35;
    const hueco = o.hueco ?? 1.6, g = o.giro || 0;
    const lado = (an - hueco) / 2;
    const off = (hueco + lado) / 2;
    c.caja({ pos: [x - Math.cos(g)*off, y, z + Math.sin(g)*off], tam: [lado, alt, gr], color: o.color || 'muro', giro: g });
    c.caja({ pos: [x + Math.cos(g)*off, y, z - Math.sin(g)*off], tam: [lado, alt, gr], color: o.color || 'muro', giro: g });
    c.caja({ pos: [x, y + 2.1, z], tam: [hueco, alt - 2.1, gr], color: o.color || 'muro', giro: g });
  },

  /** El objeto que se recoge o se toca: flota y brilla suave. */
  objeto(c, o) {
    const [x, y, z] = o.pos;
    const m = c.caja({ pos: [x - 0.09, y, z - 0.09], tam: [0.18, 0.18, 0.18],
                       color: o.color || 'bombilla', brilla: 2.2, choca: false, sombra: false });
    m.userData.flota = { base: y + 0.09, fase: Math.random() * 6.28 };
    return m;
  }
};

/** Aplica una lista de piezas descritas en el contenido. */
export function construir(c, piezas) {
  for (const p of piezas) {
    if (p.prefab) {
      const f = PREFABS[p.prefab];
      if (f) f(c, p);
      else console.warn('prefab desconocido:', p.prefab);
    } else if (p.forma === 'cilindro') c.cilindro(p);
    else if (p.forma === 'esfera') c.esfera(p);
    else c.caja(p);
  }
  return c;
}
