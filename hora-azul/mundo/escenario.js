/* ============================================================
   ESCENARIO · monta un lugar a partir de su descripción
   ============================================================ */
import * as THREE from '../vendor/three.module.js';
import { Constructor, construir, PREFABS } from './piezas.js';
import { prepararSol, LUZ } from '../motor/render.js';

export class Escenario {
  constructor(datos, render) {
    this.datos = datos;
    this.render = render;
    this.escena = new THREE.Scene();
    this.animados = [];
    this.interactivos = [];

    const cielo = datos.cielo;
    this.entorno = render.entorno(cielo);
    this.escena.environment = this.entorno;
    this.escena.background = new THREE.Color(cielo.medio);
    this.escena.fog = new THREE.FogExp2(cielo.medio, 0.012);

    this._cielo(cielo);
    this._luces(cielo);

    const c = new Constructor(datos.materiales, this.entorno, render.calidad >= 2);
    this.c = c;
    c.suelo(datos.suelo || {});
    construir(c, datos.piezas || []);
    if (datos.noria) this._noria(c, datos.noria);
    if (datos.coche) this._coche(c, datos.coche);
    this.escena.add(c.grupo);

    // luces prácticas (máximo razonable para no disparar el coste)
    for (const l of c.luces.slice(0, 8)) {
      const p = new THREE.PointLight(new THREE.Color(l.color), l.fuerza, l.alcance, 2);
      p.position.set(...l.pos);
      this.escena.add(p);
    }

    this.choques = c.choques;
  }

  _cielo(pal) {
    const g = new THREE.SphereGeometry(400, 32, 20);
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { a:{value:new THREE.Color(pal.alto)}, m:{value:new THREE.Color(pal.medio)},
                  b:{value:new THREE.Color(pal.bajo)} },
      vertexShader: `varying vec3 vP; void main(){ vP=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 a; uniform vec3 m; uniform vec3 b; varying vec3 vP;
        void main(){ float h=normalize(vP).y; float t=clamp((h+0.12)/0.6,0.0,1.0);
          vec3 c=mix(b,m,smoothstep(0.0,0.55,t)); c=mix(c,a,smoothstep(0.42,1.0,t));
          gl_FragColor=vec4(c,1.0); }`
    });
    const s = new THREE.Mesh(g, m);
    s.renderOrder = -1000;
    s.frustumCulled = false;
    this.escena.add(s);
    this.domoCielo = s;

    // estrellas
    const n = 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.9 + 0.05);
      pos[i*3] = 360 * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = Math.abs(360 * Math.cos(ph)) * 0.8 + 20;
      pos[i*3+2] = 360 * Math.sin(ph) * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const est = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false }));
    est.renderOrder = -999;
    est.frustumCulled = false;
    this.escena.add(est);
    this.estrellas = est;
  }

  _luces(pal) {
    const sol = new THREE.DirectionalLight(new THREE.Color(pal.bajo).lerp(new THREE.Color('#ffffff'), 0.4), LUZ.sol);
    sol.position.set(-24, 30, 18);
    prepararSol(sol);
    this.escena.add(sol);
    this.sol = sol;
    this.escena.add(new THREE.HemisphereLight(new THREE.Color(pal.medio), new THREE.Color(pal.bajo), LUZ.cielo));
    this.escena.add(new THREE.AmbientLight(new THREE.Color(pal.alto), LUZ.ambiente));
  }

  /** La noria: aros, radios, cabinas y bombillas. Gira despacio. */
  _noria(c, o) {
    const g = new THREE.Group();
    const [x, y, z] = o.pos, R = o.radio;
    const met = c.material('metal', { metal: 0.85, rugosidad: 0.35 });
    for (const dz of [-0.5, 0.5]) {
      const aro = new THREE.Mesh(new THREE.TorusGeometry(R, 0.12, 12, 48), met);
      aro.position.z = dz; aro.castShadow = true;
      g.add(aro);
    }
    const nr = 18;
    for (let i = 0; i < nr; i++) {
      const a = (i / nr) * Math.PI * 2;
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, R, 6), met);
      r.position.set(Math.cos(a) * R/2, Math.sin(a) * R/2, 0);
      r.rotation.z = a - Math.PI/2;
      g.add(r);
    }
    const buje = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 16), met);
    buje.rotation.x = Math.PI/2; buje.castShadow = true;
    g.add(buje);
    for (let i = 0; i < o.cabinas; i++) {
      const a = (i / o.cabinas) * Math.PI * 2;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.1),
        c.material(i % 2 ? 'toldo' : 'azulado'));
      cab.position.set(Math.cos(a) * R, Math.sin(a) * R - 0.8, 0);
      cab.castShadow = true;
      g.add(cab);
    }
    for (let i = 0; i < o.bombillas; i++) {
      const a = (i / o.bombillas) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8),
        c.material('bombilla', { brilla: 3.5 }));
      b.position.set(Math.cos(a) * (R + 0.3), Math.sin(a) * (R + 0.3), 0);
      g.add(b);
    }
    g.position.set(x, y, z);
    this.escena.add(g);
    this.animados.push({ obj: g, gira: 0.06 });
    c.choque([x-1, 0, z-1], [x+1, y, z+1]);
  }

  /** El Ibiza. No es un modelo de coche, es su silueta reconocible. */
  _coche(c, o) {
    const g = new THREE.Group();
    const cuerpo = c.material(o.color, { metal: 0.5, rugosidad: 0.35 });
    const crist = c.material('cristal', { metal: 0.1, rugosidad: 0.1, alfa: 0.55 });
    const rueda = c.material('#14161a', { rugosidad: 0.9 });

    const m1 = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.72, 4.1), cuerpo);
    m1.position.y = 0.62; m1.castShadow = true; g.add(m1);
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.62, 2.3), cuerpo);
    m2.position.set(0, 1.28, -0.15); m2.castShadow = true; g.add(m2);
    const v = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.46, 2.2), crist);
    v.position.set(0, 1.3, -0.15); g.add(v);
    for (const [dx, dz] of [[0.86,1.3],[-0.86,1.3],[0.86,-1.35],[-0.86,-1.35]]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16), rueda);
      r.rotation.z = Math.PI/2; r.position.set(dx, 0.33, dz); r.castShadow = true;
      g.add(r);
    }
    for (const dx of [0.55, -0.55]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08),
        c.material('bombilla', { brilla: 3.5 }));
      f.position.set(dx, 0.78, 2.06); g.add(f);
    }
    g.position.set(...(o.pos.length === 3 ? o.pos : [o.pos[0], 0, o.pos[1]]));
    g.rotation.y = o.giro || 0;
    this.escena.add(g);
    this.coche = g;
    const [cx, , cz] = g.position;
    c.choque([cx-1.1, 0, cz-2.2], [cx+1.1, 1.7, cz+2.2]);
  }

  /** Altura del suelo. Los ocho lugares son planos; las cajas las pisa el jugador. */
  alturaSuelo() { return 0; }

  actualizar(dt, t, camara) {
    for (const a of this.animados) if (a.gira) a.obj.rotation.z += a.gira * dt;
    this.domoCielo.position.copy(camara.position);
    this.estrellas.position.copy(camara.position);
    this.sol.target.position.copy(camara.position);
    this.sol.target.updateMatrixWorld();
    // los objetos por recoger flotan
    this.escena.traverse(o => {
      if (o.userData.flota) {
        o.position.y = o.userData.flota.base + Math.sin(t * 1.8 + o.userData.flota.fase) * 0.07;
        o.rotation.y += dt * 0.8;
      }
    });
  }

  destruir() {
    this.escena.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
    this.entorno?.dispose?.();
  }
}
