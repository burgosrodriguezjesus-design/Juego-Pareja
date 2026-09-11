/* ============================================================
   PAISAJE · el terreno, el cielo y el tiempo que hace
   ============================================================ */
const Paisaje = (function () {

  /* ==========================================================
     Paletas · mismas cuatro horas del día que en las pantallas 2D
     ========================================================== */
  const PALETAS = {
    amanecer: {
      cieloAlto: "#2b2455", cieloMedio: "#8a5f88", cieloBajo: "#f0b184",
      niebla: "#ab7f83", sol: "#ffe8c0", solFuerza: 1.08,
      ambiente: "#55496a", ambienteFuerza: .68, altura: .32, giro: 2.4,
      hierba: "#5f6b4e", tierra: "#6a5748", roca: "#6e6a68",
      tronco: "#4a3b33", hoja: "#4e6046", muro: "#8a7a72", tejado: "#7a4f47",
      ventana: "#ffd9a0", puerta: "#4a3b33", metal: "#5a5a62", madera: "#6b5340",
      tela: "#c98f7e", cristal: "#8fa8bf", luz: "#ffd9a0", agua: "#6f7fa8",
      estrellas: .3
    },
    dia: {
      cieloAlto: "#2e6ba6", cieloMedio: "#68a0c8", cieloBajo: "#bcd8e4",
      niebla: "#a6c3d4", sol: "#fff6dc", solFuerza: 1.3,
      ambiente: "#7f9db4", ambienteFuerza: .8, altura: .78, giro: 1.1,
      hierba: "#6f8a4e", tierra: "#7d6a52", roca: "#8a8886",
      tronco: "#5a4436", hoja: "#4f7342", muro: "#c2b6a8", tejado: "#a25f4e",
      ventana: "#9fc4d8", puerta: "#5a4436", metal: "#7c7d84", madera: "#8a6c4e",
      tela: "#e08d78", cristal: "#a9c6d8", luz: "#fff3cf", agua: "#3f7fae",
      estrellas: 0
    },
    atardecer: {
      cieloAlto: "#241a3e", cieloMedio: "#8e3f60", cieloBajo: "#f0a05e",
      niebla: "#a5654f", sol: "#ffc891", solFuerza: 1.15,
      ambiente: "#5d4450", ambienteFuerza: .62, altura: .17, giro: -1.9,
      hierba: "#5a5c40", tierra: "#6b5340", roca: "#6b625d",
      tronco: "#3f3029", hoja: "#42513b", muro: "#a08272", tejado: "#82443c",
      ventana: "#ffcf8c", puerta: "#3f3029", metal: "#5e5a5c", madera: "#6e5136",
      tela: "#d4806a", cristal: "#8f93ad", luz: "#ffc987", agua: "#7a5570",
      estrellas: .35
    },
    noche: {
      cieloAlto: "#06051a", cieloMedio: "#141338", cieloBajo: "#2a2a5c",
      niebla: "#161634", sol: "#dce6ff", solFuerza: .4,
      ambiente: "#242a4e", ambienteFuerza: .46, altura: .62, giro: .8,
      hierba: "#2b3a33", tierra: "#33302c", roca: "#3a3a40",
      tronco: "#241d1c", hoja: "#233026", muro: "#40404e", tejado: "#33303c",
      ventana: "#ffd9a0", puerta: "#241d1c", metal: "#3a3a44", madera: "#3c3026",
      tela: "#6a5060", cristal: "#3a4560", luz: "#ffd9a0", agua: "#161f4a",
      estrellas: 1
    }
  };

  const paleta = (m) => PALETAS[m] || PALETAS.atardecer;

  const suave = (t) => t * t * (3 - 2 * t);

  /* ==========================================================
     Relieve propio de cada tipo de sitio
     ========================================================== */
  const RELIEVES = {
    montana: (dx, dz, r) => {
      const d = Math.hypot(dx, dz) / r;
      const anillo = Math.max(0, d - .42) / .58;
      return anillo * anillo * 26 * (.6 + .4 * Math.sin(Math.atan2(dz, dx) * 3.7));
    },
    playa: (dx, dz, r) => -(dz / r) * 7 - 1.5,
    lago:  (dx, dz, r) => {
      const d = Math.hypot(dx, dz) / r;
      return d < .62 ? -(1 - d / .62) * 9 : 0;
    },
    bosque:    (dx, dz, r) => Math.sin(dx * .07) * Math.cos(dz * .06) * 2.2,
    campo:     (dx, dz, r) => Math.sin(dx * .045) * Math.cos(dz * .05) * 2.6,
    pueblo:    (dx, dz, r) => Math.sin(dx * .04) * 1.1,
    ciudad:    () => 0,
    parque:    (dx, dz, r) => Math.sin(dx * .05) * Math.sin(dz * .045) * 1.4,
    carretera: (dx, dz, r) => Math.sin(dz * .03) * 1.6,
    interior:  () => 0,
    cielo:     (dx, dz, r) => Math.sin(dx * .05) * Math.cos(dz * .05) * 1.8
  };

  /** Los sitios con agua necesitan una lámina y un nivel. */
  const NIVEL_AGUA = { playa: -2.2, lago: -3.4 };

  /* ==========================================================
     Altura del suelo en cualquier punto del mundo
     ========================================================== */
  function fabricarAltura(zonas, semillaTxt) {
    const rnd = U.semilla(semillaTxt || "mundo");
    const o1 = rnd() * 200, o2 = rnd() * 200, o3 = rnd() * 200;

    return function altura(x, z) {
      // ondulación general: el mundo nunca es plano del todo
      let h = Math.sin((x + o1) * .0125) * Math.cos((z + o2) * .0108) * 6.0
            + Math.sin((x * .029) + (z * .024) + o3) * 2.4
            + Math.sin((x - z) * .0067) * 3.2;

      for (const zn of zonas) {
        const d = Math.hypot(x - zn.x, z - zn.z);
        const fuera = zn.radio * 1.75;
        if (d > fuera) continue;
        // 1 en el centro de la zona, 0 en su borde exterior
        const t = suave(1 - U.limitar((d - zn.radio * .5) / (fuera - zn.radio * .5), 0, 1));
        let hz = zn.base;
        const rel = RELIEVES[zn.tipo];
        if (rel) hz += rel(x - zn.x, z - zn.z, zn.radio);
        h = h * (1 - t) + hz * t;
      }
      return h;
    };
  }

  /* ==========================================================
     Malla del terreno
     ========================================================== */
  function crearTerreno(lado, divisiones, altura, zonas, pal) {
    const geo = new THREE.PlaneGeometry(lado, lado, divisiones, divisiones);
    geo.rotateX(-Math.PI / 2);

    const p = geo.attributes.position;
    const colores = new Float32Array(p.count * 3);
    const cHierba = new THREE.Color(pal.hierba);
    const cTierra = new THREE.Color(pal.tierra);
    const cRoca   = new THREE.Color(pal.roca);
    const cArena  = new THREE.Color(pal.tierra).lerp(new THREE.Color("#d8c49a"), .55);
    const c = new THREE.Color();

    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const y = altura(x, z);
      p.setY(i, y);

      // pendiente: si es fuerte, se ve roca
      const dx = altura(x + 1.5, z) - y;
      const dz = altura(x, z + 1.5) - y;
      const pend = U.limitar(Math.hypot(dx, dz) / 1.5, 0, 1);

      // ¿hay agua cerca de este punto?
      let nivelAgua = null;
      for (const zn of zonas) {
        if (zn.agua == null) continue;
        if (Math.hypot(x - zn.x, z - zn.z) < zn.radio * 2.1) {
          nivelAgua = nivelAgua == null ? zn.agua : Math.max(nivelAgua, zn.agua);
        }
      }

      c.copy(cHierba);
      if (pend > .18) c.lerp(cRoca, U.limitar((pend - .18) / .5, 0, 1));
      if (nivelAgua != null) {
        const sobre = y - nivelAgua;
        if (sobre < 2.6) c.lerp(cArena, U.limitar(1 - sobre / 2.6, 0, 1) * .9);
      }
      // variación suave y de onda larga: da vida sin hacer ruido
      const v = .90 + .20 * ((Math.sin(x * .028) * Math.cos(z * .024)
                            + Math.sin((x + z) * .011)) * .25 + .5);
      colores[i * 3] = c.r * v; colores[i * 3 + 1] = c.g * v; colores[i * 3 + 2] = c.b * v;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: false });
    const malla = new THREE.Mesh(geo, mat);
    malla.frustumCulled = false;
    return malla;
  }

  /* ==========================================================
     Agua
     ========================================================== */
  function crearAgua(zn, pal) {
    // Redonda y del tamaño de su zona. Antes era un cuadrado enorme que
    // asomaba por otras partes del mundo formando manchas raras.
    const geo = new THREE.CircleGeometry(zn.radio * 1.28, 40);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({
      color: pal.agua, transparent: true, opacity: .84, flatShading: true
    });
    const malla = new THREE.Mesh(geo, mat);
    malla.position.set(zn.x, zn.base + zn.agua, zn.z);
    malla.frustumCulled = false;

    const base = geo.attributes.position.array.slice();
    malla.userData.ondular = (t) => {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2];
        p.setY(i, Math.sin(x * .09 + t * 1.1) * .18 + Math.cos(z * .11 + t * .9) * .14);
      }
      p.needsUpdate = true;
      geo.computeVertexNormals();
    };
    return malla;
  }

  /* ==========================================================
     Cielo
     ========================================================== */
  const VS_CIELO = `
    varying vec3 vPos;
    void main(){
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  const FS_CIELO = `
    uniform vec3 cAlto; uniform vec3 cMedio; uniform vec3 cBajo;
    varying vec3 vPos;
    void main(){
      float h = normalize(vPos).y;
      float t = clamp((h + 0.10) / 0.52, 0.0, 1.0);
      vec3 col = mix(cBajo, cMedio, smoothstep(0.0, 0.55, t));
      col = mix(col, cAlto, smoothstep(0.42, 1.0, t));
      gl_FragColor = vec4(col, 1.0);
    }`;

  function crearCielo(pal) {
    const geo = new THREE.SphereGeometry(1200, 24, 16);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VS_CIELO, fragmentShader: FS_CIELO,
      uniforms: {
        cAlto:  { value: new THREE.Color(pal.cieloAlto) },
        cMedio: { value: new THREE.Color(pal.cieloMedio) },
        cBajo:  { value: new THREE.Color(pal.cieloBajo) }
      },
      side: THREE.BackSide, depthWrite: false, fog: false
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = -1000;
    return m;
  }

  function texturaRedonda(paradas) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    paradas.forEach(([p, col]) => g.addColorStop(p, col));
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function crearAstro(pal) {
    const tex = texturaRedonda([
      [0, "rgba(255,255,255,1)"], [.16, pal.sol], [.34, "rgba(255,225,180,.36)"],
      [.62, "rgba(255,215,170,.10)"], [1, "rgba(255,215,170,0)"]
    ]);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
    const s = new THREE.Sprite(mat);
    s.scale.set(340, 340, 1);
    s.renderOrder = -900;
    return s;
  }

  function crearEstrellas(pal) {
    if (pal.estrellas <= 0) return null;
    const n = 900;
    const pos = new Float32Array(n * 3);
    const tam = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // repartidas por la media esfera de arriba
      const u = Math.random(), v = Math.random() * .82 + .06;
      const th = u * Math.PI * 2, ph = Math.acos(1 - 2 * v * .5);
      const r = 1050;
      pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * .85 + 40;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      tam[i] = 3 + Math.random() * 7;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(tam, 1));

    const mat = new THREE.PointsMaterial({
      map: texturaRedonda([[0, "rgba(255,255,255,1)"], [.4, "rgba(255,255,255,.5)"], [1, "rgba(255,255,255,0)"]]),
      size: 7, sizeAttenuation: false, transparent: true, depthWrite: false,
      opacity: pal.estrellas * .9, fog: false
    });
    const p = new THREE.Points(geo, mat);
    p.frustumCulled = false;
    p.renderOrder = -950;
    return p;
  }

  /* ==========================================================
     El tiempo que hace · partículas que siguen al jugador
     ========================================================== */
  const CLIMAS = {
    lluvia:      { n: 1400, caja: [34, 22, 34], tam: 1.1, color: "#cfe0f5", opac: .5,  vy: -22, mezcla: false },
    nieve:       { n: 700,  caja: [34, 22, 34], tam: 1.5, color: "#ffffff", opac: .85, vy: -2.2, mezcla: false },
    petalos:     { n: 420,  caja: [32, 20, 32], tam: 1.9, color: "#f0a8b4", opac: .8,  vy: -1.5, mezcla: false },
    luciernagas: { n: 260,  caja: [30, 9, 30],  tam: 2.4, color: "#ffe9a8", opac: .95, vy: 0,    mezcla: true },
    niebla:      null, estrellas: null, despejado: null
  };

  function crearTiempo(clima, pal) {
    const cfg = CLIMAS[clima];
    if (!cfg) return null;

    const [cx, cy, cz] = cfg.caja;
    const pos = new Float32Array(cfg.n * 3);
    const fase = new Float32Array(cfg.n);
    for (let i = 0; i < cfg.n; i++) {
      pos[i * 3]     = (Math.random() - .5) * cx;
      pos[i * 3 + 1] = Math.random() * cy;
      pos[i * 3 + 2] = (Math.random() - .5) * cz;
      fase[i] = Math.random() * 6.28;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const esGota = clima === "lluvia";
    const tex = esGota
      ? (function () {
          const c = document.createElement("canvas");
          c.width = 8; c.height = 32;
          const x = c.getContext("2d");
          const g = x.createLinearGradient(0, 0, 0, 32);
          g.addColorStop(0, "rgba(255,255,255,0)");
          g.addColorStop(.5, "rgba(255,255,255,.9)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          x.fillStyle = g; x.fillRect(2, 0, 4, 32);
          return new THREE.CanvasTexture(c);
        })()
      : texturaRedonda([[0, "rgba(255,255,255,1)"], [.45, "rgba(255,255,255,.65)"], [1, "rgba(255,255,255,0)"]]);

    const mat = new THREE.PointsMaterial({
      map: tex, color: cfg.color, size: cfg.tam, transparent: true,
      opacity: cfg.opac, depthWrite: false, sizeAttenuation: true, fog: true,
      blending: cfg.mezcla ? THREE.AdditiveBlending : THREE.NormalBlending
    });

    const puntos = new THREE.Points(geo, mat);
    puntos.frustumCulled = false;

    puntos.userData.mover = function (dt, t, camara) {
      const p = geo.attributes.position;
      const a = p.array;
      // la nube de partículas se centra siempre en la cámara
      puntos.position.set(camara.position.x, camara.position.y - cy * .38, camara.position.z);
      for (let i = 0; i < cfg.n; i++) {
        const j = i * 3;
        if (clima === "luciernagas") {
          a[j]     += Math.sin(t * .6 + fase[i]) * dt * .7;
          a[j + 1] += Math.cos(t * .5 + fase[i] * 1.7) * dt * .45;
          a[j + 2] += Math.cos(t * .55 + fase[i] * .9) * dt * .7;
        } else {
          a[j + 1] += cfg.vy * dt;
          if (clima !== "lluvia") {
            a[j]     += Math.sin(t * .8 + fase[i]) * dt * .8;
            a[j + 2] += Math.cos(t * .7 + fase[i]) * dt * .6;
          } else {
            a[j] -= dt * 2.2;
          }
        }
        // al salirse de la caja, vuelve a entrar por el otro lado
        if (a[j + 1] < 0)  a[j + 1] += cy;
        if (a[j + 1] > cy) a[j + 1] -= cy;
        if (a[j] >  cx / 2) a[j] -= cx; else if (a[j] < -cx / 2) a[j] += cx;
        if (a[j + 2] >  cz / 2) a[j + 2] -= cz; else if (a[j + 2] < -cz / 2) a[j + 2] += cz;
      }
      p.needsUpdate = true;
    };
    return puntos;
  }

  /** Bancos de niebla: planchas blandas que se mueven despacio. */
  function crearNiebla(pal) {
    const grupo = new THREE.Group();
    const tex = texturaRedonda([
      [0, "rgba(255,255,255,.5)"], [.45, "rgba(255,255,255,.22)"], [1, "rgba(255,255,255,0)"]
    ]);
    for (let i = 0; i < 26; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex, color: pal.niebla, transparent: true, opacity: .3,
        depthWrite: false, fog: false
      });
      const s = new THREE.Sprite(mat);
      const esc = 40 + Math.random() * 90;
      s.scale.set(esc, esc * .45, 1);
      s.userData = { a: Math.random() * 6.28, r: 40 + Math.random() * 120, v: .02 + Math.random() * .05,
                     y: 2 + Math.random() * 8 };
      grupo.add(s);
    }
    grupo.userData.mover = function (dt, t, camara) {
      grupo.children.forEach((s) => {
        const d = s.userData;
        d.a += d.v * dt;
        s.position.set(camara.position.x + Math.cos(d.a) * d.r,
                       camara.position.y + d.y - 1.6,
                       camara.position.z + Math.sin(d.a) * d.r);
      });
    };
    return grupo;
  }

  return { PALETAS, paleta, RELIEVES, NIVEL_AGUA, fabricarAltura, crearTerreno,
           crearAgua, crearCielo, crearAstro, crearEstrellas, crearTiempo, crearNiebla,
           texturaRedonda };
})();
