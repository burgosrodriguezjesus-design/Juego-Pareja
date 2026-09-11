/* ============================================================
   PIEZAS · las cosas de las que está hecho el mundo
   ------------------------------------------------------------
   Todo se construye con cinco formas básicas. Cada objeto que se
   coloca no se dibuja por separado: se apunta en un lote y al
   final se agrupa todo lo que comparte forma y color en un solo
   dibujo. Así un bosque de doscientos árboles cuesta lo mismo
   que un árbol, y el juego va fino también en un móvil.
   ============================================================ */
const Piezas = (function () {

  let G = null;   // geometrías compartidas
  let sombraTex = null;

  function geometrias() {
    if (G) return G;
    G = {
      caja:      new THREE.BoxGeometry(1, 1, 1),
      cilindro:  new THREE.CylinderGeometry(.5, .5, 1, 10),
      cono:      new THREE.ConeGeometry(.5, 1, 10),
      piramide:  new THREE.ConeGeometry(.72, 1, 4),
      esfera:    new THREE.SphereGeometry(.5, 10, 7),
      roca:      new THREE.IcosahedronGeometry(.5, 0),
      tronco:    new THREE.CylinderGeometry(.34, .5, 1, 7),
      plano:     new THREE.PlaneGeometry(1, 1)
    };
    G.plano.rotateX(-Math.PI / 2);
    return G;
  }

  /** Mancha redonda y difuminada que hace de sombra en el suelo. */
  function texturaSombra() {
    if (sombraTex) return sombraTex;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(0,0,0,.5)");
    g.addColorStop(.55, "rgba(0,0,0,.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    sombraTex = new THREE.CanvasTexture(c);
    return sombraTex;
  }

  /* ==========================================================
     Constructor: acumula piezas y al final las agrupa
     ========================================================== */
  function constructor() {
    const lotes = new Map();      // clave -> { geo, color, brilla, matrices[] }
    const choques = [];           // { x, z, r }
    const sombras = [];           // { x, y, z, r }
    const luces = [];             // { x, y, z, color, fuerza, alcance }
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const eje = new THREE.Vector3(0, 1, 0);
    const pos = new THREE.Vector3();
    const esc = new THREE.Vector3();

    return {
      /**
       * Coloca una pieza.
       *   forma  · caja | cilindro | cono | piramide | esfera | roca | tronco | plano
       *   color  · "#rrggbb"
       *   o      · { x, y, z, ancho, alto, fondo, giro, inclina, brilla }
       *           y es la BASE de la pieza, no su centro.
       */
      pieza(forma, color, o) {
        const geo   = geometrias()[forma];
        if (!geo) return;
        const ancho = o.ancho != null ? o.ancho : 1;
        const alto  = o.alto  != null ? o.alto  : 1;
        const fondo = o.fondo != null ? o.fondo : ancho;
        const centrado = o.centrado === true;

        pos.set(o.x || 0, (o.y || 0) + (centrado ? 0 : alto / 2), o.z || 0);
        esc.set(ancho, alto, fondo);
        q.setFromAxisAngle(eje, o.giro || 0);
        if (o.inclina) {
          const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), o.inclina);
          q.multiply(q2);
        }
        m.compose(pos, q, esc);

        const clave = forma + "|" + color + "|" + (o.brilla ? "b" : "n");
        let lote = lotes.get(clave);
        if (!lote) { lote = { geo, color, brilla: !!o.brilla, matrices: [] }; lotes.set(clave, lote); }
        lote.matrices.push(m.clone());
      },

      /** Marca una zona por la que no se puede pasar. */
      choque(x, z, r) { choques.push({ x, z, r }); },

      /** Pone una sombra difuminada en el suelo. */
      sombra(x, y, z, r) { sombras.push({ x, y, z, r }); },

      /** Pide una luz de verdad (úsalas con cuentagotas). */
      luz(x, y, z, color, fuerza, alcance) { luces.push({ x, y, z, color, fuerza, alcance }); },

      get choques() { return choques; },
      get luces()   { return luces; },

      /** Junta todo en un grupo listo para meter en la escena. */
      montar() {
        const grupo = new THREE.Group();

        lotes.forEach((lote) => {
          const mat = new THREE.MeshLambertMaterial({
            color: lote.color,
            flatShading: true,
            emissive: lote.brilla ? new THREE.Color(lote.color).multiplyScalar(.8) : 0x000000
          });
          const malla = new THREE.InstancedMesh(lote.geo, mat, lote.matrices.length);
          lote.matrices.forEach((mm, i) => malla.setMatrixAt(i, mm));
          malla.instanceMatrix.needsUpdate = true;
          malla.frustumCulled = false;
          grupo.add(malla);
        });

        if (sombras.length) {
          const mat = new THREE.MeshBasicMaterial({
            map: texturaSombra(), transparent: true, depthWrite: false,
            opacity: .85, polygonOffset: true, polygonOffsetFactor: -2
          });
          const malla = new THREE.InstancedMesh(geometrias().plano, mat, sombras.length);
          const mm = new THREE.Matrix4();
          sombras.forEach((s, i) => {
            mm.compose(new THREE.Vector3(s.x, s.y + .06, s.z),
                       new THREE.Quaternion(),
                       new THREE.Vector3(s.r * 2, 1, s.r * 2));
            malla.setMatrixAt(i, mm);
          });
          malla.instanceMatrix.needsUpdate = true;
          malla.renderOrder = -1;
          malla.frustumCulled = false;
          grupo.add(malla);
        }

        return grupo;
      }
    };
  }

  /* ==========================================================
     Objetos del mundo
     Todos reciben (c, x, z, suelo, tam, pal, rnd)
     ========================================================== */

  function arbol(c, x, z, suelo, tam, pal, rnd) {
    const tronco = tam * .42;
    c.pieza("tronco", pal.tronco, { x, y: suelo, z, ancho: tam * .13, alto: tronco, fondo: tam * .13 });
    const copa = pal.hoja;
    c.pieza("esfera", copa, { x, y: suelo + tronco * .78, z, ancho: tam * .62, alto: tam * .62, fondo: tam * .62 });
    c.pieza("esfera", copa, { x: x - tam * .18, y: suelo + tronco * .62, z: z + tam * .1,
                              ancho: tam * .44, alto: tam * .44, fondo: tam * .44 });
    c.pieza("esfera", copa, { x: x + tam * .2, y: suelo + tronco * .68, z: z - tam * .08,
                              ancho: tam * .46, alto: tam * .46, fondo: tam * .46 });
    c.choque(x, z, tam * .11);
    c.sombra(x, suelo, z, tam * .38);
  }

  function pino(c, x, z, suelo, tam, pal, rnd) {
    c.pieza("cilindro", pal.tronco, { x, y: suelo, z, ancho: tam * .09, alto: tam * .3, fondo: tam * .09 });
    for (let i = 0; i < 3; i++) {
      const y = suelo + tam * (.22 + i * .21);
      const an = tam * (.52 - i * .13);
      c.pieza("cono", pal.hoja, { x, y, z, ancho: an, alto: tam * .38, fondo: an });
    }
    c.choque(x, z, tam * .09);
    c.sombra(x, suelo, z, tam * .28);
  }

  function palmera(c, x, z, suelo, tam, pal, rnd) {
    // Tronco: muchos tramos cortos y solapados. Con pocos y anchos se veían
    // los escalones entre uno y otro.
    const pasos = 9;
    const alto = tam * .66;
    const curva = (rnd() - .5) * tam * .3;
    for (let i = 0; i < pasos; i++) {
      const t = i / (pasos - 1);
      c.pieza("cilindro", pal.tronco, {
        x: x + curva * t * t, y: suelo + alto * t * .97, z,
        ancho: tam * (.085 - t * .028), alto: alto / pasos * 1.5,
        fondo: tam * (.085 - t * .028)
      });
    }
    // Hojas: penachos finos que caen, no tablones
    const cx = x + curva, cy = suelo + alto;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * .2;
      const largo = tam * (.46 + rnd() * .16);
      for (let j = 0; j < 3; j++) {
        const t = (j + .5) / 3;
        c.pieza("caja", pal.hoja, {
          x: cx + Math.cos(a) * largo * t,
          y: cy - tam * .015 - t * t * tam * .2,
          z: z + Math.sin(a) * largo * t,
          ancho: largo / 3 * 1.25, alto: tam * .022,
          fondo: tam * (.11 - t * .06), giro: a, inclina: .1 + t * .3
        });
      }
    }
    c.pieza("esfera", pal.hoja, { x: cx, y: cy - tam * .05, z, ancho: tam * .13, alto: tam * .11, fondo: tam * .13 });
    c.choque(x, z, tam * .1);
    c.sombra(cx, suelo, z, tam * .3);
  }

  function arbusto(c, x, z, suelo, tam, pal, rnd) {
    c.pieza("esfera", pal.hoja, { x, y: suelo, z, ancho: tam, alto: tam * .8, fondo: tam });
    c.pieza("esfera", pal.hoja, { x: x + tam * .3, y: suelo, z: z + tam * .2,
                                  ancho: tam * .7, alto: tam * .6, fondo: tam * .7 });
    c.sombra(x, suelo, z, tam * .55);
  }

  function roca(c, x, z, suelo, tam, pal, rnd) {
    c.pieza("roca", pal.roca, {
      x, y: suelo - tam * .12, z, ancho: tam, alto: tam * (.7 + rnd() * .5), fondo: tam * .9,
      giro: rnd() * 6.28
    });
    c.choque(x, z, tam * .45);
    c.sombra(x, suelo, z, tam * .5);
  }

  function edificio(c, x, z, suelo, an, alto, fondo, pal, rnd, luces) {
    c.pieza("caja", pal.muro, { x, y: suelo, z, ancho: an, alto, fondo });
    // ventanas en las cuatro caras
    if (luces > 0) {
      const filas = Math.max(1, Math.floor(alto / 3.2));
      const cols  = Math.max(1, Math.floor(an / 2.6));
      for (let cara = 0; cara < 4; cara++) {
        const ang = cara * Math.PI / 2;
        const prof = (cara % 2 === 0 ? fondo : an) / 2 + .06;
        const anchoCara = (cara % 2 === 0 ? an : fondo);
        const nc = Math.max(1, Math.floor(anchoCara / 2.6));
        for (let i = 0; i < nc; i++) {
          for (let j = 0; j < filas; j++) {
            if (rnd() > luces) continue;
            const dx = (i - (nc - 1) / 2) * (anchoCara / nc) * .8;
            const px = x + Math.sin(ang) * prof + Math.cos(ang) * dx;
            const pz = z + Math.cos(ang) * prof - Math.sin(ang) * dx;
            c.pieza("caja", pal.ventana, {
              x: px, y: suelo + 1.6 + j * 3.2, z: pz,
              ancho: 1.0, alto: 1.3, fondo: .12, giro: ang, brilla: true
            });
          }
        }
      }
    }
    c.choque(x, z, Math.max(an, fondo) * .62);
  }

  function casa(c, x, z, suelo, tam, pal, rnd, luces) {
    const an = tam, alto = tam * (.7 + rnd() * .4), fondo = tam * .85;
    c.pieza("caja", pal.muro, { x, y: suelo, z, ancho: an, alto, fondo });
    c.pieza("piramide", pal.tejado, { x, y: suelo + alto, z,
                                      ancho: an * 1.22, alto: tam * .5, fondo: fondo * 1.22, giro: Math.PI / 4 });
    if (luces > 0 && rnd() > .3) {
      c.pieza("caja", pal.ventana, { x, y: suelo + alto * .42, z: z + fondo / 2 + .05,
                                     ancho: tam * .26, alto: tam * .24, fondo: .1, brilla: true });
    }
    c.pieza("caja", pal.puerta, { x: x + tam * .26, y: suelo, z: z + fondo / 2 + .04,
                                  ancho: tam * .2, alto: tam * .4, fondo: .1 });
    c.choque(x, z, Math.max(an, fondo) * .62);
    c.sombra(x, suelo, z, tam * .7);
  }

  function farola(c, x, z, suelo, alto, pal, deNoche) {
    c.pieza("cilindro", pal.metal, { x, y: suelo, z, ancho: .16, alto, fondo: .16 });
    c.pieza("esfera", deNoche ? pal.luz : pal.metal, {
      x, y: suelo + alto - .1, z, ancho: .5, alto: .5, fondo: .5, brilla: deNoche
    });
    c.choque(x, z, .3);
    if (deNoche) c.luz(x, suelo + alto, z, pal.luz, 1.1, 16);
  }

  function banco(c, x, z, suelo, giro, pal) {
    const s = Math.sin(giro), co = Math.cos(giro);
    c.pieza("caja", pal.madera, { x, y: suelo + .42, z, ancho: 1.9, alto: .1, fondo: .55, giro });
    c.pieza("caja", pal.madera, { x: x - s * .24, y: suelo + .6, z: z - co * .24,
                                  ancho: 1.9, alto: .5, fondo: .1, giro });
    for (const d of [-.75, .75]) {
      c.pieza("caja", pal.metal, { x: x + co * d, y: suelo, z: z - s * d, ancho: .1, alto: .45, fondo: .5, giro });
    }
    c.choque(x, z, .8);
    c.sombra(x, suelo, z, 1.1);
  }

  function coche(c, x, z, suelo, giro, color, pal) {
    c.pieza("caja", color, { x, y: suelo + .34, z, ancho: 1.9, alto: .62, fondo: 4.2, giro });
    c.pieza("caja", color, { x, y: suelo + .94, z, ancho: 1.7, alto: .56, fondo: 2.2, giro });
    c.pieza("caja", pal.cristal, { x, y: suelo + .98, z, ancho: 1.74, alto: .4, fondo: 2.0, giro });
    const r = [[.85, 1.4], [-.85, 1.4], [.85, -1.4], [-.85, -1.4]];
    for (const [dx, dz] of r) {
      const px = x + Math.cos(giro) * dx + Math.sin(giro) * dz;
      const pz = z - Math.sin(giro) * dx + Math.cos(giro) * dz;
      c.pieza("cilindro", "#15161a", { x: px, y: suelo + .34, z: pz,
                                       ancho: .68, alto: .34, fondo: .68, giro, inclina: Math.PI / 2, centrado: true });
    }
    c.choque(x, z, 2.1);
    c.sombra(x, suelo, z, 2.2);
  }

  function poste(c, x, z, suelo, alto, pal) {
    c.pieza("cilindro", pal.madera, { x, y: suelo, z, ancho: .3, alto, fondo: .3 });
    c.pieza("caja", pal.madera, { x, y: suelo + alto * .86, z, ancho: 2.6, alto: .16, fondo: .16 });
    c.choque(x, z, .4);
  }

  function valla(c, x1, z1, x2, z2, suelo, pal) {
    const largo = Math.hypot(x2 - x1, z2 - z1);
    const giro = Math.atan2(x2 - x1, z2 - z1);
    const n = Math.max(2, Math.round(largo / 2.4));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      c.pieza("caja", pal.madera, { x: x1 + (x2 - x1) * t, y: suelo, z: z1 + (z2 - z1) * t,
                                    ancho: .12, alto: 1.1, fondo: .12, giro });
    }
    for (const h of [.5, .92]) {
      c.pieza("caja", pal.madera, { x: (x1 + x2) / 2, y: suelo + h, z: (z1 + z2) / 2,
                                    ancho: .07, alto: .09, fondo: largo, giro });
    }
  }

  function sombrilla(c, x, z, suelo, pal, rnd) {
    c.pieza("cilindro", pal.madera, { x, y: suelo, z, ancho: .12, alto: 2.3, fondo: .12 });
    c.pieza("cono", pal.tela, { x, y: suelo + 1.9, z, ancho: 3.0, alto: .7, fondo: 3.0 });
    c.sombra(x, suelo, z, 1.5);
  }

  function barca(c, x, z, agua, giro, pal) {
    c.pieza("caja", pal.madera, { x, y: agua - .18, z, ancho: 1.5, alto: .45, fondo: 4.0, giro });
    c.pieza("caja", pal.tela,   { x, y: agua + .24, z, ancho: 1.1, alto: .08, fondo: 3.2, giro });
    c.choque(x, z, 2.0);
  }

  function torre(c, x, z, suelo, alto, pal, deNoche) {
    c.pieza("caja", pal.muro, { x, y: suelo, z, ancho: 3.4, alto, fondo: 3.4 });
    c.pieza("piramide", pal.tejado, { x, y: suelo + alto, z, ancho: 4.6, alto: 4.2, fondo: 4.6, giro: Math.PI / 4 });
    c.pieza("caja", deNoche ? pal.luz : pal.ventana, {
      x, y: suelo + alto * .82, z: z + 1.75, ancho: .9, alto: 1.2, fondo: .1, brilla: deNoche });
    c.choque(x, z, 2.6);
    c.sombra(x, suelo, z, 2.6);
  }

  /* Interior: mesa, sillas, tazas */
  function mesa(c, x, z, suelo, pal) {
    c.pieza("cilindro", pal.madera, { x, y: suelo + .72, z, ancho: 1.5, alto: .09, fondo: 1.5 });
    c.pieza("cilindro", pal.metal,  { x, y: suelo, z, ancho: .16, alto: .72, fondo: .16 });
    c.pieza("cilindro", pal.metal,  { x, y: suelo, z, ancho: .7, alto: .06, fondo: .7 });
    c.choque(x, z, .85);
    c.sombra(x, suelo, z, .9);
  }

  function silla(c, x, z, suelo, giro, pal) {
    c.pieza("caja", pal.madera, { x, y: suelo + .45, z, ancho: .5, alto: .07, fondo: .5, giro });
    c.pieza("caja", pal.madera, { x: x - Math.sin(giro) * .22, y: suelo + .5, z: z - Math.cos(giro) * .22,
                                  ancho: .5, alto: .55, fondo: .07, giro });
    for (const [dx, dz] of [[.2,.2],[-.2,.2],[.2,-.2],[-.2,-.2]]) {
      c.pieza("caja", pal.metal, { x: x + dx, y: suelo, z: z + dz, ancho: .05, alto: .45, fondo: .05 });
    }
    c.choque(x, z, .45);
  }

  function taza(c, x, z, suelo, pal) {
    c.pieza("cilindro", "#f2ece1", { x, y: suelo, z, ancho: .16, alto: .13, fondo: .16 });
  }

  return {
    geometrias, constructor,
    arbol, pino, palmera, arbusto, roca, edificio, casa, farola, banco,
    coche, poste, valla, sombrilla, barca, torre, mesa, silla, taza
  };
})();
