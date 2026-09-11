/* ============================================================
   JUGADOR · moverse en primera persona
   ------------------------------------------------------------
   En ordenador: WASD o flechas, ratón para mirar, mayúsculas
   para correr, E para interactuar.
   En móvil: palanca flotante a la izquierda para andar, arrastrar
   a la derecha para mirar, y un botón para interactuar.
   ============================================================ */
const Jugador = (function () {

  const ALTURA_OJOS = 1.66;
  const VEL_ANDAR   = 5.4;
  const VEL_CORRER  = 9.6;
  const RADIO       = .42;

  function crear(camara, opciones) {
    const o = Object.assign({ altura: () => 0, choques: [], limite: 240, lienzo: null }, opciones);

    const estado = {
      x: 0, z: 0, y: 0,
      giro: 0,            // horizontal
      alza: 0,            // vertical
      vx: 0, vz: 0,
      recorrido: 0,
      corriendo: false,
      bloqueado: false,   // mientras hay un acertijo abierto
      raton: false
    };

    const teclas = Object.create(null);
    const euler = new THREE.Euler(0, 0, 0, "YXZ");

    /* ---------- teclado ---------- */
    const MAPA = {
      KeyW: "arriba", ArrowUp: "arriba", KeyS: "abajo", ArrowDown: "abajo",
      KeyA: "izq", ArrowLeft: "izq", KeyD: "der", ArrowRight: "der"
    };

    function alPulsar(e) {
      const t = MAPA[e.code];
      if (t) { teclas[t] = true; if (!estado.bloqueado) e.preventDefault(); }
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") estado.corriendo = true;
    }
    function alSoltar(e) {
      const t = MAPA[e.code];
      if (t) teclas[t] = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") estado.corriendo = false;
    }
    function soltarTodo() {
      for (const k in teclas) teclas[k] = false;
      estado.corriendo = false;
    }

    window.addEventListener("keydown", alPulsar);
    window.addEventListener("keyup", alSoltar);
    window.addEventListener("blur", soltarTodo);

    /* ---------- ratón con puntero capturado ---------- */
    function pedirRaton() {
      if (!o.lienzo || estado.bloqueado) return;
      if (o.lienzo.requestPointerLock) o.lienzo.requestPointerLock();
    }
    function soltarRaton() {
      if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    }
    function cambioRaton() {
      estado.raton = document.pointerLockElement === o.lienzo;
      if (!estado.raton) soltarTodo();
      if (o.alCambiarRaton) o.alCambiarRaton(estado.raton);
    }
    function moverRaton(e) {
      if (!estado.raton || estado.bloqueado) return;
      estado.giro -= e.movementX * .0022;
      estado.alza  = U.limitar(estado.alza - e.movementY * .0022, -1.35, 1.35);
    }
    document.addEventListener("pointerlockchange", cambioRaton);
    document.addEventListener("mousemove", moverRaton);

    /* ---------- mandos táctiles ---------- */
    const tactil = { mover: null, vista: null, dx: 0, dz: 0 };
    let palanca = null, palancaBola = null;

    function conectarTactil(capa, base, bola) {
      palanca = base; palancaBola = bola;

      capa.addEventListener("pointerdown", (e) => {
        if (estado.bloqueado) return;
        if (e.pointerType === "mouse") return;
        const izquierda = e.clientX < window.innerWidth * .46;
        if (izquierda && tactil.mover === null) {
          tactil.mover = { id: e.pointerId, x0: e.clientX, y0: e.clientY };
          if (palanca) {
            palanca.style.left = e.clientX + "px";
            palanca.style.top = e.clientY + "px";
            palanca.classList.add("visible");
          }
          capa.setPointerCapture(e.pointerId);
        } else if (!izquierda && tactil.vista === null) {
          tactil.vista = { id: e.pointerId, x: e.clientX, y: e.clientY };
          capa.setPointerCapture(e.pointerId);
        }
      });

      capa.addEventListener("pointermove", (e) => {
        if (estado.bloqueado) return;
        if (tactil.mover && e.pointerId === tactil.mover.id) {
          const dx = e.clientX - tactil.mover.x0;
          const dy = e.clientY - tactil.mover.y0;
          const r = 58;
          const d = Math.min(1, Math.hypot(dx, dy) / r);
          const a = Math.atan2(dy, dx);
          tactil.dx = Math.cos(a) * d;
          tactil.dz = Math.sin(a) * d;
          if (palancaBola) {
            palancaBola.style.transform =
              `translate(${Math.cos(a) * d * r}px, ${Math.sin(a) * d * r}px)`;
          }
        } else if (tactil.vista && e.pointerId === tactil.vista.id) {
          estado.giro -= (e.clientX - tactil.vista.x) * .0055;
          estado.alza  = U.limitar(estado.alza - (e.clientY - tactil.vista.y) * .0048, -1.3, 1.3);
          tactil.vista.x = e.clientX;
          tactil.vista.y = e.clientY;
        }
      });

      const fin = (e) => {
        if (tactil.mover && e.pointerId === tactil.mover.id) {
          tactil.mover = null; tactil.dx = 0; tactil.dz = 0;
          if (palanca) palanca.classList.remove("visible");
          if (palancaBola) palancaBola.style.transform = "";
        }
        if (tactil.vista && e.pointerId === tactil.vista.id) tactil.vista = null;
      };
      capa.addEventListener("pointerup", fin);
      capa.addEventListener("pointercancel", fin);
    }

    /* ---------- movimiento ---------- */
    function chocaCon(x, z) {
      for (const c of o.choques) {
        const d = Math.hypot(x - c.x, z - c.z);
        if (d < c.r + RADIO) return c;
      }
      return null;
    }

    /** Intenta ir a (nx,nz); si choca, resbala por el obstáculo. */
    function intentarMover(nx, nz) {
      const c = chocaCon(nx, nz);
      if (!c) { estado.x = nx; estado.z = nz; return; }
      // empujar hacia fuera del obstáculo y dejar deslizar en paralelo
      const ax = nx - c.x, az = nz - c.z;
      const d = Math.hypot(ax, az) || .0001;
      const fuera = (c.r + RADIO) / d;
      const px = c.x + ax * fuera, pz = c.z + az * fuera;
      if (!chocaCon(px, pz)) { estado.x = px; estado.z = pz; }
    }

    /**
     * Si un fotograma tarda mucho (móvil justito, pestaña que vuelve),
     * el movimiento se parte en pasos pequeños. Así la velocidad no
     * depende de la potencia del aparato y nadie atraviesa una pared.
     */
    function actualizar(dtTotal) {
      let resto = Math.min(.25, dtTotal);
      while (resto > 0) {
        const paso = Math.min(.034, resto);
        unPaso(paso);
        resto -= paso;
      }
      pintarCamara();
    }

    function unPaso(dt) {
      let ex = 0, ez = 0;
      if (!estado.bloqueado) {
        if (teclas.arriba) ez -= 1;
        if (teclas.abajo)  ez += 1;
        if (teclas.izq)    ex -= 1;
        if (teclas.der)    ex += 1;
        ex += tactil.dx;
        ez += tactil.dz;
      }
      const m = Math.hypot(ex, ez);
      if (m > 1) { ex /= m; ez /= m; }

      const objetivo = estado.corriendo ? VEL_CORRER : VEL_ANDAR;
      const sin = Math.sin(estado.giro), cos = Math.cos(estado.giro);
      // Con giro = y, la cámara mira hacia (-sen y, -cos y) y su derecha
      // es (cos y, -sen y). El mando da ex = derecha y ez = -adelante.
      const dvx = ( ex * cos + ez * sin) * objetivo;
      const dvz = (-ex * sin + ez * cos) * objetivo;

      // aceleración y frenada suaves
      const k = 1 - Math.pow(.0009, dt);
      estado.vx += (dvx - estado.vx) * k;
      estado.vz += (dvz - estado.vz) * k;

      const paso = Math.hypot(estado.vx, estado.vz) * dt;
      if (paso > .0006) {
        intentarMover(estado.x + estado.vx * dt, estado.z + estado.vz * dt);
        estado.recorrido += paso;
      }

      // no dejar salir del mundo
      const dCentro = Math.hypot(estado.x, estado.z);
      if (dCentro > o.limite) {
        estado.x *= o.limite / dCentro;
        estado.z *= o.limite / dCentro;
        estado.vx *= .3; estado.vz *= .3;
      }

      // pegarse al suelo con un poco de suavizado
      const suelo = o.altura(estado.x, estado.z);
      estado.y += (suelo - estado.y) * Math.min(1, dt * 14);
    }

    function pintarCamara() {
      // balanceo al andar
      const vel = Math.hypot(estado.vx, estado.vz);
      const bamboleo = Math.sin(estado.recorrido * 4.4) * .055 * U.limitar(vel / VEL_ANDAR, 0, 1.2);
      const ladeo = Math.cos(estado.recorrido * 2.2) * .012 * U.limitar(vel / VEL_ANDAR, 0, 1.2);

      camara.position.set(estado.x, estado.y + ALTURA_OJOS + bamboleo, estado.z);
      euler.set(estado.alza, estado.giro, ladeo);
      camara.quaternion.setFromEuler(euler);
    }

    /* ---------- API ---------- */
    return {
      estado,
      actualizar,
      conectarTactil,
      pedirRaton,
      soltarRaton,
      colocar(x, z, mirandoA) {
        estado.x = x; estado.z = z;
        estado.vx = estado.vz = 0;
        estado.y = o.altura(x, z);
        // mirar hacia el punto: y = atan2(-dx, -dz)
        if (mirandoA) estado.giro = Math.atan2(x - mirandoA.x, z - mirandoA.z);
        estado.alza = 0;
        actualizar(.016);
      },
      bloquear(v) {
        estado.bloqueado = v;
        if (v) { soltarTodo(); tactil.dx = tactil.dz = 0; tactil.mover = tactil.vista = null;
                 if (palanca) palanca.classList.remove("visible"); soltarRaton(); }
      },
      get corriendo() { return estado.corriendo; },
      get enMarcha() { return Math.hypot(estado.vx, estado.vz) > .6; },
      destruir() {
        window.removeEventListener("keydown", alPulsar);
        window.removeEventListener("keyup", alSoltar);
        window.removeEventListener("blur", soltarTodo);
        document.removeEventListener("pointerlockchange", cambioRaton);
        document.removeEventListener("mousemove", moverRaton);
      },
      ALTURA_OJOS
    };
  }

  return { crear, ALTURA_OJOS };
})();
