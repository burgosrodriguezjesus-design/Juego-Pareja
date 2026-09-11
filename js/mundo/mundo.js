/* ============================================================
   MUNDO · el mapa entero y todo lo que hay dentro
   ------------------------------------------------------------
   Los sitios se reparten en círculo alrededor de un claro
   central. Desde el claro se ven todos. Se puede ir andando a
   cualquiera desde el principio: el sitio que toca se señala
   con una columna de luz que se ve desde lejos, así que hay
   libertad para explorar pero no hay forma de perderse.
   ============================================================ */
const Mundo = (function () {

  const RADIO_ANILLO = 150;    // a qué distancia del centro están los sitios
  const RADIO_ZONA   = 40;     // cuánto ocupa cada sitio
  const LADO_TERRENO = 540;
  const LIMITE       = 238;

  let ren = null, escena = null, camara = null, jugador = null;
  let lienzo = null, reloj = null;
  let zonas = [], anclas = [], altura = null;
  let cielo = null, astro = null, estrellas = null, tiempo = null, niebla = null;
  let aguas = [], luzSol = null, luzAmbiente = null;
  let bucleId = null, t = 0, activo = false, pausado = false;
  let anclaFinal = null;
  let objetivo = -1;                 // índice del capítulo que toca
  let cercaDe = null;                // ancla al alcance
  let alInteractuar = null, alAcercarse = null;
  let paletaActual = null;
  let calidad = 1;

  /* ==========================================================
     ¿Se puede usar 3D en este aparato?
     ========================================================== */
  function disponible() {
    if (typeof THREE === "undefined") return false;
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return false;
      const perdido = gl.getExtension("WEBGL_lose_context");
      if (perdido) perdido.loseContext();
      return true;
    } catch (e) { return false; }
  }

  /* ==========================================================
     Contenido de cada tipo de sitio
     ========================================================== */
  function poblar(c, zn, pal, rnd) {
    const cx = zn.x, cz = zn.z, R = zn.radio;
    const suelo = (x, z) => altura(x, z);
    const deNoche = zn.momento === "noche" || zn.momento === "atardecer" || zn.momento === "amanecer";

    // reparte n cosas por el anillo de la zona sin pisar el centro
    function esparcir(n, dentro, fuera, fn) {
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const d = dentro + rnd() * (fuera - dentro);
        const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        fn(x, z, suelo(x, z), i);
      }
    }

    switch (zn.tipo) {

      case "ciudad": {
        // manzanas alrededor de una plaza
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2 + rnd() * .12;
          const d = 15 + rnd() * (R - 6);
          const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
          const an = 7 + rnd() * 9, al = 10 + rnd() * 26, fo = 7 + rnd() * 9;
          Piezas.edificio(c, x, z, suelo(x, z) - 1, an, al, fo, pal, rnd, deNoche ? .55 : 0);
          c.sombra(x, suelo(x, z), z, Math.max(an, fo) * .7);
        }
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const x = cx + Math.cos(a) * 12, z = cz + Math.sin(a) * 12;
          Piezas.farola(c, x, z, suelo(x, z), 5.2, pal, deNoche);
        }
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + .4;
          const x = cx + Math.cos(a) * 9, z = cz + Math.sin(a) * 9;
          Piezas.banco(c, x, z, suelo(x, z), a + Math.PI / 2, pal);
        }
        esparcir(5, 20, R - 4, (x, z, y, i) =>
          Piezas.coche(c, x, z, y, rnd() * 6.28, ["#8a3b3b","#2f4a6b","#3f5a3f","#6b5a3a","#4a3a5a"][i % 5], pal));
        break;
      }

      case "playa": {
        esparcir(9, 14, R - 2, (x, z, y) => { if (y > zn.base - 1) Piezas.palmera(c, x, z, y, 7 + rnd() * 4, pal, rnd); });
        esparcir(5, 12, R * .6, (x, z, y) => { if (y > zn.base) Piezas.sombrilla(c, x, z, y, pal, rnd); });
        esparcir(14, 10, R, (x, z, y) => Piezas.roca(c, x, z, y, 1 + rnd() * 2.4, pal, rnd));
        break;
      }

      case "montana": {
        esparcir(34, 10, R * 1.15, (x, z, y) => Piezas.pino(c, x, z, y, 6 + rnd() * 7, pal, rnd));
        esparcir(22, 6, R * 1.2, (x, z, y) => Piezas.roca(c, x, z, y, 1.6 + rnd() * 4, pal, rnd));
        break;
      }

      case "bosque": {
        esparcir(56, 7, R * 1.1, (x, z, y) =>
          rnd() > .45 ? Piezas.pino(c, x, z, y, 8 + rnd() * 8, pal, rnd)
                      : Piezas.arbol(c, x, z, y, 7 + rnd() * 6, pal, rnd));
        esparcir(20, 6, R, (x, z, y) => Piezas.arbusto(c, x, z, y, 1.2 + rnd() * 1.4, pal, rnd));
        break;
      }

      case "campo": {
        esparcir(12, 12, R * 1.1, (x, z, y) => Piezas.arbol(c, x, z, y, 6 + rnd() * 5, pal, rnd));
        esparcir(26, 8, R, (x, z, y) => Piezas.arbusto(c, x, z, y, .9 + rnd() * 1.1, pal, rnd));
        // una valla que cruza el campo
        const a = rnd() * 6.28;
        Piezas.valla(c, cx + Math.cos(a) * R * .8, cz + Math.sin(a) * R * .8,
                        cx + Math.cos(a + 2.1) * R * .8, cz + Math.sin(a + 2.1) * R * .8,
                        suelo(cx, cz), pal);
        break;
      }

      case "pueblo": {
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + rnd() * .18;
          const d = 14 + rnd() * (R - 10);
          const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
          Piezas.casa(c, x, z, suelo(x, z), 5 + rnd() * 3.5, pal, rnd, deNoche ? 1 : 0);
        }
        Piezas.torre(c, cx + 16, cz - 14, suelo(cx + 16, cz - 14), 15, pal, deNoche);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const x = cx + Math.cos(a) * 10, z = cz + Math.sin(a) * 10;
          Piezas.farola(c, x, z, suelo(x, z), 4.4, pal, deNoche);
        }
        esparcir(7, 18, R, (x, z, y) => Piezas.arbol(c, x, z, y, 5 + rnd() * 3, pal, rnd));
        break;
      }

      case "carretera": {
        // una recta de asfalto que atraviesa la zona
        const a = zn.anguloCamino != null ? zn.anguloCamino : rnd() * 6.28;
        const dx = Math.cos(a), dz = Math.sin(a);
        for (let i = -R; i < R; i += 3.2) {
          const x = cx + dx * i, z = cz + dz * i;
          c.pieza("caja", "#2e2b30", { x, y: suelo(x, z) - .1, z, ancho: 8.4, alto: .2, fondo: 3.4, giro: -a });
          if (Math.floor(i / 3.2) % 3 === 0) {
            c.pieza("caja", "#c9bb8a", { x, y: suelo(x, z) + .02, z, ancho: .3, alto: .12, fondo: 1.8, giro: -a });
          }
        }
        for (let i = -R + 8; i < R; i += 26) {
          const px = cx + dx * i - dz * 7, pz = cz + dz * i + dx * 7;
          Piezas.poste(c, px, pz, suelo(px, pz), 9, pal);
        }
        esparcir(16, 14, R * 1.1, (x, z, y) => Piezas.arbol(c, x, z, y, 5 + rnd() * 4, pal, rnd));
        Piezas.coche(c, cx + dx * 12, cz + dz * 12, suelo(cx + dx * 12, cz + dz * 12), -a, "#8a3b3b", pal);
        break;
      }

      case "parque": {
        esparcir(20, 11, R, (x, z, y) => Piezas.arbol(c, x, z, y, 7 + rnd() * 5, pal, rnd));
        esparcir(16, 8, R, (x, z, y) => Piezas.arbusto(c, x, z, y, 1 + rnd() * 1.3, pal, rnd));
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const x = cx + Math.cos(a) * 13, z = cz + Math.sin(a) * 13;
          Piezas.banco(c, x, z, suelo(x, z), a + Math.PI / 2, pal);
          const fx = cx + Math.cos(a + .5) * 18, fz = cz + Math.sin(a + .5) * 18;
          Piezas.farola(c, fx, fz, suelo(fx, fz), 4.6, pal, deNoche);
        }
        break;
      }

      case "lago": {
        esparcir(26, R * .75, R * 1.2, (x, z, y) => { if (y > zn.base + zn.agua)
          rnd() > .5 ? Piezas.pino(c, x, z, y, 7 + rnd() * 6, pal, rnd)
                     : Piezas.arbol(c, x, z, y, 6 + rnd() * 4, pal, rnd); });
        esparcir(14, R * .68, R * 1.1, (x, z, y) => { if (y > zn.base + zn.agua)
          Piezas.roca(c, x, z, y, 1.2 + rnd() * 2.6, pal, rnd); });
        Piezas.barca(c, cx + 8, cz + 6, zn.base + zn.agua, .6, pal);
        break;
      }

      case "interior": {
        // una casita en la que se entra: paredes, hueco de puerta y ventana
        const y = suelo(cx, cz), an = 15, fo = 13, al = 4.2, gr = .5;
        const muro = (x, z, a, h, giro) =>
          c.pieza("caja", pal.muro, { x, y, z, ancho: a, alto: h, fondo: gr, giro });
        muro(cx, cz - fo / 2, an, al, 0);                              // fondo
        muro(cx - an / 2, cz, fo, al, Math.PI / 2);                    // izquierda
        muro(cx + an / 2, cz, fo, al, Math.PI / 2);                    // derecha
        muro(cx - an / 4 - 1, cz + fo / 2, an / 2 - 2, al, 0);         // frente, a un lado
        muro(cx + an / 4 + 1, cz + fo / 2, an / 2 - 2, al, 0);         // frente, al otro
        c.pieza("caja", pal.muro, { x: cx, y: y + 3.1, z: cz + fo / 2, ancho: 4, alto: al - 3.1, fondo: gr });
        c.pieza("caja", pal.tejado, { x: cx, y: y + al, z: cz, ancho: an + 1.4, alto: .5, fondo: fo + 1.4 });
        c.pieza("caja", pal.ventana, { x: cx - an / 2 + .1, y: y + 1.6, z: cz - 2,
                                       ancho: 3.4, alto: 1.7, fondo: .12, giro: Math.PI / 2, brilla: deNoche });
        // paredes con las que chocar
        c.choque(cx, cz - fo / 2, 1.2); c.choque(cx - an / 2, cz, 1.2); c.choque(cx + an / 2, cz, 1.2);
        for (let i = -an / 2; i <= an / 2; i += 1.6) {
          c.choque(cx + i, cz - fo / 2, .9);
          if (Math.abs(i) > 2.2) c.choque(cx + i, cz + fo / 2, .9);
        }
        for (let i = -fo / 2; i <= fo / 2; i += 1.6) {
          c.choque(cx - an / 2, cz + i, .9); c.choque(cx + an / 2, cz + i, .9);
        }
        Piezas.mesa(c, cx, cz - 2, y, pal);
        Piezas.silla(c, cx - 1.3, cz - 2, y, Math.PI / 2, pal);
        Piezas.silla(c, cx + 1.3, cz - 2, y, -Math.PI / 2, pal);
        Piezas.taza(c, cx - .3, cz - 1.75, y + .81, pal);
        Piezas.taza(c, cx + .3, cz - 2.25, y + .81, pal);
        if (deNoche) c.luz(cx, y + 3.6, cz, pal.luz, 1.3, 18);
        esparcir(8, 20, R, (x, z, yy) => Piezas.arbol(c, x, z, yy, 5 + rnd() * 4, pal, rnd));
        break;
      }

      default: { // cielo y cualquier otro: una loma abierta
        esparcir(9, 14, R, (x, z, y) => Piezas.arbol(c, x, z, y, 6 + rnd() * 5, pal, rnd));
        esparcir(18, 8, R, (x, z, y) => Piezas.arbusto(c, x, z, y, .9 + rnd() * 1.2, pal, rnd));
      }
    }
  }

  /* ==========================================================
     El claro del centro
     ========================================================== */
  function claroCentral(c, pal, rnd) {
    const y = altura(0, 0);
    // círculo de piedras
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.cos(a) * 9, z = Math.sin(a) * 9;
      c.pieza("roca", pal.roca, { x, y: altura(x, z) - .45, z,
                                  ancho: 1.15, alto: 1.5, fondo: 1.15, giro: a });
    }
    // pedestal del centro
    c.pieza("cilindro", pal.roca, { x: 0, y: y, z: 0, ancho: 4.4, alto: .5, fondo: 4.4 });
    c.pieza("cilindro", pal.roca, { x: 0, y: y + .5, z: 0, ancho: 3.2, alto: .5, fondo: 3.2 });
    c.sombra(0, y, 0, 3.2);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + .4;
      const x = Math.cos(a) * 14, z = Math.sin(a) * 14;
      Piezas.banco(c, x, z, altura(x, z), a + Math.PI / 2, pal);
    }
  }

  /* ==========================================================
     Caminos del claro a cada sitio
     ========================================================== */
  function caminos(c, pal) {
    const col = "#" + new THREE.Color(pal.tierra).lerp(new THREE.Color("#b8ac93"), .34).getHexString();
    for (const zn of zonas) {
      const largo = Math.hypot(zn.x, zn.z);
      const dx = zn.x / largo, dz = zn.z / largo;
      const giro = -Math.atan2(dz, dx) + Math.PI / 2;
      for (let d = 17; d < largo - zn.radio * .5; d += 3.1) {
        const serp = Math.sin(d * .045) * 5.5;
        const x = dx * d - dz * serp, z = dz * d + dx * serp;
        c.pieza("caja", col, {
          x, y: altura(x, z) + .03, z, ancho: 2.4, alto: .08, fondo: 2.1, giro
        });
      }
    }
  }

  /* ==========================================================
     Anclas de recuerdo · lo que se toca para abrir el acertijo
     ========================================================== */
  function crearAncla(zn, pal) {
    const g = new THREE.Group();
    const y = altura(zn.x, zn.z);
    g.position.set(zn.x, y, zn.z);

    // pedestal
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.45, .75, 12),
      new THREE.MeshLambertMaterial({ color: pal.roca, flatShading: true })
    );
    ped.position.y = .38;
    g.add(ped);

    // cristal flotante
    const cristal = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.62, 0),
      new THREE.MeshLambertMaterial({ color: "#ffe0a8", emissive: "#e8a84a", flatShading: true })
    );
    cristal.position.y = 2.05;
    g.add(cristal);

    // halo
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: Paisaje.texturaRedonda([
        [0, "rgba(255,224,168,.95)"], [.3, "rgba(255,190,110,.35)"],
        [.6, "rgba(255,190,110,.10)"], [1, "rgba(255,190,110,0)"]
      ]),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    }));
    halo.scale.set(3.4, 3.4, 1);
    halo.position.y = 2.05;
    g.add(halo);

    // columna de luz que se ve desde lejos
    const hazGeo = new THREE.CylinderGeometry(1.5, 2.4, 90, 12, 1, true);
    const hazMat = new THREE.MeshBasicMaterial({
      color: "#ffcf8a", transparent: true, opacity: .16, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
    const haz = new THREE.Mesh(hazGeo, hazMat);
    haz.position.y = 45;
    g.add(haz);

    const luz = new THREE.PointLight(0xffca7a, .8, 20);
    luz.position.y = 2.2;
    g.add(luz);

    g.userData = { cristal, halo, haz, luz, ped };
    return g;
  }

  function pintarAncla(a, modo) {
    // modo: "toca" (la siguiente) · "hecha" · "dormida"
    const d = a.userData;
    if (modo === "hecha") {
      d.cristal.material.color.set("#bfe8d0");
      d.cristal.material.emissive.set("#57a87a");
      d.halo.material.opacity = .38;
      d.haz.visible = false;
      d.luz.color.set(0x8fd6ac); d.luz.intensity = .5;
    } else if (modo === "toca") {
      d.cristal.material.color.set("#ffe0a8");
      d.cristal.material.emissive.set("#e8a84a");
      d.halo.material.opacity = .85;
      d.haz.visible = true;
      d.luz.color.set(0xffca7a); d.luz.intensity = .85;
    } else {
      d.cristal.material.color.set("#6d6a7a");
      d.cristal.material.emissive.set("#2b2838");
      d.halo.material.opacity = .18;
      d.haz.visible = false;
      d.luz.intensity = .12;
    }
    a.userData.modo = modo;
  }

  /* ==========================================================
     Construir el mundo entero
     ========================================================== */
  function construir(H, estado) {
    const caps = H.capitulos;
    const semilla = (H.config && H.config.partida) || "mundo";
    const rnd = U.semilla(semilla + "|mundo");

    // la hora del día del mundo la marca el primer capítulo
    const momentoMundo = (caps[0] && caps[0].escena && caps[0].escena.momento) || "atardecer";
    paletaActual = Paisaje.paleta(momentoMundo);
    const pal = paletaActual;

    // 1 · repartir los sitios en círculo
    zonas = caps.map((cap, i) => {
      const e = cap.escena || {};
      const a = (i / caps.length) * Math.PI * 2 - Math.PI / 2;
      const tipo = Paisaje.RELIEVES[e.tipo] ? e.tipo : "campo";
      return {
        i, id: cap.id, cap,
        tipo, momento: e.momento || momentoMundo, clima: e.clima || "despejado",
        x: Math.cos(a) * RADIO_ANILLO,
        z: Math.sin(a) * RADIO_ANILLO,
        radio: RADIO_ZONA,
        base: (tipo === "montana" ? 3 : tipo === "playa" ? 2 : 0) + (rnd() - .5) * 3,
        agua: Paisaje.NIVEL_AGUA[tipo] != null ? Paisaje.NIVEL_AGUA[tipo] : null,
        anguloCamino: a + Math.PI / 2
      };
    });
    // el claro del centro también aplana el terreno
    zonas.push({ tipo: "cielo", x: 0, z: 0, radio: 26, base: 0, agua: null, central: true });

    altura = Paisaje.fabricarAltura(zonas, semilla);

    // 2 · escena
    escena = new THREE.Scene();
    // La niebla da profundidad, no debe tapar. Empieza lejos y se cierra
    // justo antes del borde del terreno, que así no se ve nunca.
    escena.fog = new THREE.Fog(pal.niebla, 95, 400);

    cielo = Paisaje.crearCielo(pal);
    escena.add(cielo);

    estrellas = Paisaje.crearEstrellas(pal);
    if (estrellas) escena.add(estrellas);

    // 3 · luces
    luzSol = new THREE.DirectionalLight(pal.sol, pal.solFuerza);
    const alt = pal.altura * Math.PI / 2;
    luzSol.position.set(Math.cos(pal.giro) * Math.cos(alt) * 400,
                        Math.sin(alt) * 400,
                        Math.sin(pal.giro) * Math.cos(alt) * 400);
    escena.add(luzSol);

    luzAmbiente = new THREE.HemisphereLight(pal.cieloMedio, pal.hierba, pal.ambienteFuerza);
    escena.add(luzAmbiente);
    escena.add(new THREE.AmbientLight(pal.ambiente, .3));

    astro = Paisaje.crearAstro(pal);
    astro.position.copy(luzSol.position).multiplyScalar(2.2);
    escena.add(astro);

    // 4 · terreno
    const divisiones = calidad >= 1 ? 168 : 112;
    escena.add(Paisaje.crearTerreno(LADO_TERRENO, divisiones, altura, zonas, pal));

    // 5 · agua
    aguas = [];
    zonas.filter((z) => z.agua != null).forEach((zn) => {
      const a = Paisaje.crearAgua(zn, pal);
      aguas.push(a);
      escena.add(a);
    });

    // 6 · todo lo que hay encima
    const c = Piezas.constructor();
    caminos(c, pal);
    claroCentral(c, pal, rnd);
    zonas.filter((z) => !z.central).forEach((zn) => {
      poblar(c, zn, pal, U.semilla(semilla + "|" + zn.id));
      c.choque(zn.x, zn.z, 1.7);            // el pedestal del ancla
    });
    escena.add(c.montar());

    for (const l of c.luces.slice(0, 10)) {
      const luz = new THREE.PointLight(new THREE.Color(l.color), l.fuerza, l.alcance);
      luz.position.set(l.x, l.y, l.z);
      escena.add(luz);
    }

    // 7 · anclas: una en cada sitio, y la del final en el claro
    anclas = zonas.filter((z) => !z.central).map((zn) => {
      const a = crearAncla(zn, pal);
      a.userData.zona = zn;
      escena.add(a);
      return a;
    });

    const zCentro = zonas.find((z) => z.central);
    anclaFinal = crearAncla({ x: 0, z: 0 }, pal);
    anclaFinal.position.y = altura(0, 0) + 1.0;   // encima del pedestal de piedra
    anclaFinal.userData.zona = zCentro;
    anclaFinal.userData.esFinal = true;
    escena.add(anclaFinal);

    // 8 · el tiempo que hace
    const climaMundo = (caps[0] && caps[0].escena && caps[0].escena.clima) || "despejado";
    tiempo = Paisaje.crearTiempo(climaMundo, pal);
    if (tiempo) escena.add(tiempo);
    if (climaMundo === "niebla") { niebla = Paisaje.crearNiebla(pal); escena.add(niebla); }

    // 9 · jugador
    camara = new THREE.PerspectiveCamera(72, 1, .1, 2000);
    jugador = Jugador.crear(camara, { altura, choques: c.choques, limite: LIMITE, lienzo });

    actualizarEstado(estado);
    redimensionar();
  }

  /* ==========================================================
     Estado: qué está hecho y qué toca
     ========================================================== */
  function actualizarEstado(estado) {
    const hechos = (estado && estado.resueltos) || [];
    objetivo = -1;
    anclas.forEach((a) => {
      const zn = a.userData.zona;
      const hecho = hechos.includes(zn.id);
      if (!hecho && objetivo === -1) objetivo = zn.i;
      a.userData.hecho = hecho;
      a.userData.letra = (estado && estado.fragmentos && estado.fragmentos[zn.id]) || "";
    });
    anclas.forEach((a) => {
      const zn = a.userData.zona;
      pintarAncla(a, a.userData.hecho ? "hecha" : (zn.i === objetivo ? "toca" : "dormida"));
    });

    if (anclaFinal) {
      const todoHecho = objetivo === -1;
      anclaFinal.userData.hecho = !!(estado && estado.terminado);
      pintarAncla(anclaFinal,
        anclaFinal.userData.hecho ? "hecha" : (todoHecho ? "toca" : "dormida"));
    }
  }

  /** Todas las anclas, incluida la del final. */
  function todasLasAnclas() {
    return anclaFinal ? anclas.concat([anclaFinal]) : anclas;
  }

  /* ==========================================================
     Bucle
     ========================================================== */
  function fotograma() {
    bucleId = requestAnimationFrame(fotograma);
    if (pausado) return;

    const dt = Math.min(.25, reloj.getDelta());
    t += dt;

    jugador.actualizar(dt);

    // el cielo y las estrellas acompañan a la cámara
    cielo.position.copy(camara.position);
    if (estrellas) estrellas.position.copy(camara.position);
    astro.position.copy(camara.position).add(luzSol.position.clone().multiplyScalar(2.2));
    luzSol.target.position.copy(camara.position);
    luzSol.target.updateMatrixWorld();

    if (tiempo) tiempo.userData.mover(dt, t, camara);
    if (niebla) niebla.userData.mover(dt, t, camara);
    aguas.forEach((a) => a.userData.ondular(t));

    // anclas: girar, flotar y latir
    let masCerca = null, distMin = 1e9;
    for (const a of todasLasAnclas()) {
      const d = a.userData;
      d.cristal.rotation.y += dt * .8;
      d.cristal.rotation.x += dt * .35;
      d.cristal.position.y = 2.05 + Math.sin(t * 1.6 + a.position.x) * .16;
      d.halo.position.y = d.cristal.position.y;
      const dist = Math.hypot(camara.position.x - a.position.x, camara.position.z - a.position.z);
      const latido = .85 + Math.sin(t * 2.1) * .15;
      // cuanto más cerca, más discreto: de cerca el halo deslumbra
      const cerca = U.limitar((dist - 4) / 14, .3, 1);
      if (d.modo === "toca") {
        d.halo.scale.setScalar(3.4 * latido * cerca);
        d.luz.intensity = (.75 + Math.sin(t * 2.1) * .2) * cerca;
        d.haz.rotation.y += dt * .12;
        d.haz.visible = dist > 18;
      } else {
        d.halo.scale.setScalar(3.4 * cerca);
      }
      if (dist < distMin) { distMin = dist; masCerca = a; }
    }

    // ¿hay algo al alcance de la mano?
    const alAlcance = (masCerca && distMin < 4.6) ? masCerca : null;
    if (alAlcance !== cercaDe) {
      cercaDe = alAlcance;
      if (alAcercarse) alAcercarse(cercaDe ? cercaDe.userData : null);
    }

    ren.render(escena, camara);
  }

  /* ==========================================================
     Control desde fuera
     ========================================================== */
  function redimensionar() {
    if (!ren || !camara) return;
    const w = window.innerWidth, h = window.innerHeight;
    ren.setSize(w, h, false);
    ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, calidad >= 1 ? 1.75 : 1));
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }

  function iniciar(elLienzo) {
    lienzo = elLienzo;
    // Gestión de color correcta: los colores se escriben como se ven (sRGB),
    // la luz se calcula en lineal y se convierte de vuelta al pintar. Sin
    // esto todo sale lavado y descolorido.
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;

    ren = new THREE.WebGLRenderer({ canvas: lienzo, antialias: calidad >= 1, powerPreference: "high-performance" });
    ren.setClearColor(0x0d0918, 1);
    ren.outputEncoding = THREE.sRGBEncoding;
    ren.toneMapping = THREE.ACESFilmicToneMapping;
    ren.toneMappingExposure = 1.28;
    reloj = new THREE.Clock();
    window.addEventListener("resize", redimensionar);
  }

  return {
    disponible, iniciar, construir, actualizarEstado, redimensionar,

    arrancar() {
      if (!bucleId) { reloj.getDelta(); bucleId = requestAnimationFrame(fotograma); }
      activo = true;
    },
    parar() {
      if (bucleId) { cancelAnimationFrame(bucleId); bucleId = null; }
      activo = false;
    },
    pausar(v) { pausado = v; if (!v && reloj) reloj.getDelta(); },
    bloquear(v) { if (jugador) jugador.bloquear(v); },

    /** Deja al jugador en el claro central mirando al sitio que toca. */
    alClaro() {
      const zn = zonas.find((z) => z.i === objetivo);
      jugador.colocar(0, 14, zn ? { x: zn.x, z: zn.z } : null);
    },
    /** Deja al jugador a la entrada de un sitio. */
    alSitio(indice) {
      const zn = zonas.find((z) => z.i === indice);
      if (!zn) return this.alClaro();
      const d = Math.hypot(zn.x, zn.z);
      const x = zn.x - (zn.x / d) * (zn.radio * .62);
      const z = zn.z - (zn.z / d) * (zn.radio * .62);
      jugador.colocar(x, z, { x: zn.x, z: zn.z });
    },

    conectarTactil(capa, base, bola) { if (jugador) jugador.conectarTactil(capa, base, bola); },
    pedirRaton() { if (jugador) jugador.pedirRaton(); },

    alAcercarse(fn) { alAcercarse = fn; },
    interactuar() {
      if (cercaDe && alInteractuar) alInteractuar(cercaDe.userData);
    },
    alInteractuar(fn) { alInteractuar = fn; },

    /** Dirección y distancia hasta el sitio que toca, para la brújula. */
    guia() {
      if (!camara) return null;
      let destino, titulo, lugar;
      if (objetivo >= 0) {
        const zn = zonas.find((z) => z.i === objetivo);
        if (!zn) return null;
        destino = zn; titulo = zn.cap.titulo; lugar = zn.cap.lugar || "";
      } else {
        // ya está todo: el final espera en el claro
        destino = { x: 0, z: 0 };
        titulo = "El claro"; lugar = "te espera lo último";
      }
      const dx = destino.x - camara.position.x, dz = destino.z - camara.position.z;
      const dist = Math.hypot(dx, dz);
      // Ángulo del objetivo respecto a hacia dónde mira: 0 es de frente y
      // los positivos van hacia la derecha, que es como gira el CSS.
      const y = jugador.estado.giro;
      const haciaDerecha = dx * Math.cos(y) - dz * Math.sin(y);
      const haciaDelante = -dx * Math.sin(y) - dz * Math.cos(y);
      const ang = Math.atan2(haciaDerecha, haciaDelante);
      return { dist, ang, titulo, lugar };
    },
    /** En qué sitio está el jugador ahora mismo (-1 = por el campo o en el claro). */
    zonaActual() {
      if (!camara) return -1;
      for (const zn of zonas) {
        if (zn.central) continue;
        if (Math.hypot(camara.position.x - zn.x, camara.position.z - zn.z) < zn.radio * 1.25) return zn.i;
      }
      return -1;
    },

    /** Solo para las pruebas automáticas. */
    __zonas() { return zonas; },

    get hayObjetivo() { return objetivo >= 0; },
    get objetivo() { return objetivo; },
    get camara() { return camara; },
    get jugador() { return jugador; },
    calidad(v) { calidad = v; }
  };
})();
