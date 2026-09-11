/* ============================================================
   ESCENA · dibuja el paisaje de cada capítulo
   ------------------------------------------------------------
   Cada escenario se genera con una semilla fija, así que un
   capítulo siempre se ve igual. Si el capítulo tiene una foto
   real, la foto manda y el dibujo queda de apoyo detrás.
   ============================================================ */
const Escena = (function () {

  const lienzo = document.getElementById("lienzo");
  const ctx    = lienzo.getContext("2d");
  const elFoto = document.getElementById("foto-fondo");
  const elVelo = document.getElementById("velo");

  let W = 0, H = 0, DPR = 1;
  let capas = [];          // [{depth, lienzo}]
  let fondo = null;        // cielo ya pintado
  let particulas = [];
  let tipoClima = "despejado";
  let paleta = null;
  let bucle = null;
  let t = 0;
  let paraX = 0, paraY = 0, objX = 0, objY = 0;
  let escenaActual = null;

  /* ==========================================================
     Color
     ========================================================== */
  function aRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function aHex(c) {
    const f = (v) => Math.round(U.limitar(v, 0, 255)).toString(16).padStart(2, "0");
    return "#" + f(c.r) + f(c.g) + f(c.b);
  }
  function mezclar(c1, c2, t) {
    const a = aRgb(c1), b = aRgb(c2);
    return aHex({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
  }
  const oscurecer = (c, t) => mezclar(c, "#000000", t);

  /** Cuánta luz tiene un color (0 negro, 1 blanco). */
  function luminancia(hex) {
    const c = aRgb(hex);
    return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
  }
  const aclarar   = (c, t) => mezclar(c, "#ffffff", t);
  function rgba(hex, a) {
    const c = aRgb(hex);
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }

  /* ==========================================================
     Paletas por momento del día
     ========================================================== */
  const PALETAS = {
    amanecer: {
      cielo: [[0, "#201c42"], [.32, "#5c4a7d"], [.6, "#c4708a"], [.82, "#efa877"], [1, "#f8d9a8"]],
      astro: "#ffe2b0", astroLuz: "#ffc98a", astroX: .72, astroY: .70, astroR: .055,
      niebla: "#e9b18e", silueta: "#2a2140", luz: "#ffd9a0", estrellas: .25, agua: "#8d6f94"
    },
    dia: {
      cielo: [[0, "#22629f"], [.45, "#5795c1"], [.78, "#95c1d6"], [1, "#c4dce3"]],
      astro: "#fff6dc", astroLuz: "#ffeeb8", astroX: .76, astroY: .18, astroR: .045,
      niebla: "#bcd6e2", silueta: "#1c3040", luz: "#fff3cf", estrellas: 0, agua: "#3f7499"
    },
    atardecer: {
      cielo: [[0, "#1d1638"], [.28, "#4b2a57"], [.55, "#9c4360"], [.78, "#d9744f"], [1, "#f5b168"]],
      astro: "#ffca7a", astroLuz: "#ff9d54", astroX: .28, astroY: .68, astroR: .06,
      niebla: "#e39a6b", silueta: "#251a35", luz: "#ffc987", estrellas: .3, agua: "#8a4a58"
    },
    noche: {
      cielo: [[0, "#07061a"], [.42, "#10112f"], [.75, "#1c1c46"], [1, "#2c2a58"]],
      astro: "#e6ecff", astroLuz: "#b9c6ff", astroX: .74, astroY: .20, astroR: .035,
      niebla: "#2e2d5c", silueta: "#0a0917", luz: "#ffd9a0", estrellas: 1, agua: "#1b2150"
    }
  };

  /* ==========================================================
     Piezas de paisaje reutilizables
     ========================================================== */

  /** Cordillera dentada. */
  function cordillera(c, w, h, base, alto, color, rnd, picos) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(-20, h);
    c.lineTo(-20, base);
    const n = picos || 5;
    const paso = (w + 40) / n;
    let x = -20;
    for (let i = 0; i < n; i++) {
      const cima = base - alto * (.45 + rnd() * .55);
      c.lineTo(x + paso * .5, cima);
      c.lineTo(x + paso, base - alto * (.05 + rnd() * .22));
      x += paso;
    }
    c.lineTo(w + 20, h);
    c.closePath();
    c.fill();
  }

  /** Colinas suaves. */
  function colinas(c, w, h, base, alto, color, rnd) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(-20, h);
    c.lineTo(-20, base);
    const f1 = .6 + rnd() * 1.6, f2 = 1.8 + rnd() * 2.4, d = rnd() * 6;
    for (let x = -20; x <= w + 20; x += 6) {
      const p = x / w;
      const y = base - alto * (.5 + .5 * Math.sin(p * f1 * Math.PI * 2 + d)) * .7
                     - alto * .3 * Math.sin(p * f2 * Math.PI * 2 + d * 1.7);
      c.lineTo(x, y);
    }
    c.lineTo(w + 20, h);
    c.closePath();
    c.fill();
  }

  /** Skyline de ciudad, con ventanas encendidas si es de noche. */
  function edificios(c, w, h, base, alto, color, rnd, luz, densidadLuz) {
    c.fillStyle = color;
    const cajas = [];
    let x = -30;
    while (x < w + 30) {
      const an = 26 + rnd() * 68;
      const al = alto * (.28 + rnd() * .72);
      c.fillRect(x, base - al, an, h - base + al);
      cajas.push({ x, y: base - al, an, al });
      // remates: antenas y áticos
      if (rnd() > .78) c.fillRect(x + an * .45, base - al - 16 - rnd() * 20, 2.5, 22);
      x += an + 2 + rnd() * 12;
    }
    if (densidadLuz > 0) {
      for (const b of cajas) {
        const cols = Math.max(1, Math.floor(b.an / 13));
        const filas = Math.max(1, Math.floor(b.al / 17));
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < filas; j++) {
            if (rnd() > densidadLuz) continue;
            c.fillStyle = rgba(luz, .35 + rnd() * .5);
            c.fillRect(b.x + 5 + i * 13, b.y + 8 + j * 17, 4.5, 6.5);
          }
        }
        c.fillStyle = color;
      }
    }
  }

  /** Mar con horizonte y camino de luz. */
  function mar(c, w, h, base, color, rnd, pal) {
    const g = c.createLinearGradient(0, base, 0, h);
    g.addColorStop(0, aclarar(color, .12));
    g.addColorStop(1, oscurecer(color, .45));
    c.fillStyle = g;
    c.fillRect(-20, base, w + 40, h - base + 20);

    // reflejo vertical del sol / la luna
    const cx = pal.astroX * w;
    for (let i = 0; i < 46; i++) {
      const y = base + (i / 46) * (h - base);
      const ext = 8 + (i / 46) * 70;
      const an = 6 + rnd() * ext;
      c.fillStyle = rgba(pal.astro, .1 + rnd() * .13);
      c.fillRect(cx - an / 2 + (rnd() - .5) * ext, y, an, 1.6);
    }
    // olas
    for (let i = 0; i < 30; i++) {
      const y = base + rnd() * (h - base);
      const an = 18 + rnd() * 90;
      c.fillStyle = rgba(aclarar(color, .4), .09 + rnd() * .1);
      c.fillRect(rnd() * w, y, an, 1.4);
    }
  }

  /** Un árbol de copa redonda. */
  function arbol(c, x, base, alto, color) {
    const tronco = alto * .38;
    c.fillStyle = color;
    c.fillRect(x - alto * .045, base - tronco, alto * .09, tronco);
    // cada bola de la copa va en su propio trazo: si no, el lienzo une
    // el final de un arco con el principio del siguiente y sale un pico
    const bola = (bx, by, r) => {
      c.beginPath();
      c.arc(bx, by, r, 0, Math.PI * 2);
      c.fill();
    };
    bola(x,              base - tronco - alto * .26, alto * .30);
    bola(x - alto * .20, base - tronco - alto * .12, alto * .22);
    bola(x + alto * .20, base - tronco - alto * .14, alto * .23);
  }

  /** Un pino. */
  function pino(c, x, base, alto, color) {
    c.fillStyle = color;
    c.fillRect(x - alto * .035, base - alto * .3, alto * .07, alto * .3);
    for (let i = 0; i < 3; i++) {
      const y = base - alto * (.25 + i * .24);
      const an = alto * (.3 - i * .075);
      c.beginPath();
      c.moveTo(x, y - alto * .34);
      c.lineTo(x - an, y);
      c.lineTo(x + an, y);
      c.closePath();
      c.fill();
    }
  }

  /** Casitas de pueblo. */
  function casas(c, w, h, base, alto, color, rnd, luz, densidadLuz) {
    let x = -20;
    while (x < w + 20) {
      const an = 42 + rnd() * 54;
      const al = alto * (.4 + rnd() * .45);
      c.fillStyle = color;
      c.fillRect(x, base - al, an, h - base + al);
      c.beginPath();                     // tejado
      c.moveTo(x - 6, base - al);
      c.lineTo(x + an / 2, base - al - al * .38);
      c.lineTo(x + an + 6, base - al);
      c.closePath();
      c.fill();
      if (densidadLuz > 0 && rnd() > .28) {
        c.fillStyle = rgba(luz, .55);
        c.fillRect(x + an * .3, base - al * .62, an * .17, al * .2);
        if (rnd() > .5) c.fillRect(x + an * .58, base - al * .62, an * .17, al * .2);
      }
      x += an + 8 + rnd() * 26;
    }
  }

  /* ==========================================================
     Escenarios
     Cada uno devuelve capas: { depth, pintar(c,w,h,rnd,pal) }
     depth 0 = muy lejos (se mueve poco) · 1 = muy cerca
     ========================================================== */
  const ESCENARIOS = {

    montana: (pal) => ([
      { depth: .12, pintar: (c,w,h,r) => cordillera(c,w,h,h*.64,h*.34, mezclar(pal.silueta,pal.niebla,.62), r, 6) },
      { depth: .26, pintar: (c,w,h,r) => cordillera(c,w,h,h*.74,h*.32, mezclar(pal.silueta,pal.niebla,.40), r, 5) },
      { depth: .46, pintar: (c,w,h,r) => cordillera(c,w,h,h*.85,h*.30, mezclar(pal.silueta,pal.niebla,.18), r, 4) },
      { depth: .80, pintar: (c,w,h,r) => {
          colinas(c,w,h,h*.97,h*.10, pal.silueta, r);
          for (let i=0;i<7;i++) pino(c, r()*w, h*.97, h*(.07+r()*.06), pal.silueta);
      }}
    ]),

    ciudad: (pal) => ([
      { depth: .14, pintar: (c,w,h,r) => edificios(c,w,h,h*.70,h*.28, mezclar(pal.silueta,pal.niebla,.55), r, pal.luz, pal.estrellas>.5?.86:0) },
      { depth: .34, pintar: (c,w,h,r) => edificios(c,w,h,h*.82,h*.32, mezclar(pal.silueta,pal.niebla,.28), r, pal.luz, pal.estrellas>.5?.80:0) },
      { depth: .72, pintar: (c,w,h,r) => {
          edificios(c,w,h,h*.99,h*.26, pal.silueta, r, pal.luz, pal.estrellas>.5?.70:0);
          // farola en primer plano
          const x = w*.12;
          c.fillStyle = pal.silueta;
          c.fillRect(x-2, h*.66, 4, h*.34);
          c.beginPath(); c.arc(x, h*.66, 7, 0, Math.PI*2); c.fill();
          if (pal.estrellas > .5) {
            const g = c.createRadialGradient(x,h*.66,2,x,h*.66,70);
            g.addColorStop(0, rgba(pal.luz,.4)); g.addColorStop(1, rgba(pal.luz,0));
            c.fillStyle = g; c.beginPath(); c.arc(x,h*.66,70,0,Math.PI*2); c.fill();
          }
      }}
    ]),

    playa: (pal) => ([
      { depth: .10, pintar: (c,w,h,r) => cordillera(c,w,h,h*.62,h*.10, mezclar(pal.silueta,pal.niebla,.68), r, 3) },
      { depth: .30, pintar: (c,w,h,r) => mar(c,w,h,h*.62, pal.agua, r, pal) },
      { depth: .78, pintar: (c,w,h,r) => {
          c.fillStyle = mezclar(pal.silueta, pal.niebla, .12);
          c.beginPath();
          c.moveTo(-20,h); c.lineTo(-20,h*.90);
          for (let x=-20;x<=w+20;x+=8) c.lineTo(x, h*.90 + Math.sin(x/w*4.2)*h*.012);
          c.lineTo(w+20,h); c.closePath(); c.fill();
          // palmera
          const px = w*.86, py = h*.90;
          c.strokeStyle = pal.silueta; c.lineWidth = 6; c.lineCap = "round";
          c.beginPath(); c.moveTo(px,py); c.quadraticCurveTo(px-14, py-h*.16, px-26, py-h*.30); c.stroke();
          c.fillStyle = pal.silueta;
          for (let i=0;i<6;i++){
            const a = -Math.PI*.9 + i*(Math.PI*1.0/5);
            c.beginPath(); c.moveTo(px-26, py-h*.30);
            c.quadraticCurveTo(px-26+Math.cos(a)*46, py-h*.30+Math.sin(a)*30,
                               px-26+Math.cos(a)*72, py-h*.30+Math.sin(a)*46+12);
            c.quadraticCurveTo(px-26+Math.cos(a)*44, py-h*.30+Math.sin(a)*26-6, px-26, py-h*.30);
            c.fill();
          }
      }}
    ]),

    campo: (pal) => ([
      { depth: .12, pintar: (c,w,h,r) => colinas(c,w,h,h*.70,h*.14, mezclar(pal.silueta,pal.niebla,.60), r) },
      { depth: .32, pintar: (c,w,h,r) => {
          colinas(c,w,h,h*.82,h*.13, mezclar(pal.silueta,pal.niebla,.34), r);
          for (let i=0;i<4;i++) arbol(c, r()*w, h*.82, h*(.05+r()*.04), mezclar(pal.silueta,pal.niebla,.30));
      }},
      { depth: .74, pintar: (c,w,h,r) => {
          colinas(c,w,h,h*.99,h*.12, pal.silueta, r);
          arbol(c, w*.18, h*.96, h*.20, pal.silueta);
          for (let i=0;i<26;i++){                       // hierba
            const x=r()*w, y=h*.94+r()*h*.06;
            c.strokeStyle = pal.silueta; c.lineWidth=1.6;
            c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+3,y-9,x+7,y-15); c.stroke();
          }
      }}
    ]),

    bosque: (pal) => ([
      { depth: .14, pintar: (c,w,h,r) => {
          const col = mezclar(pal.silueta, pal.niebla, .62);
          for (let i=0;i<14;i++) pino(c, r()*w, h*.86, h*(.24+r()*.2), col);
      }},
      { depth: .38, pintar: (c,w,h,r) => {
          const col = mezclar(pal.silueta, pal.niebla, .32);
          for (let i=0;i<10;i++) pino(c, r()*w, h*.94, h*(.32+r()*.24), col);
      }},
      { depth: .82, pintar: (c,w,h,r) => {
          c.fillStyle = pal.silueta;
          for (let i=0;i<4;i++){                         // troncos en primer plano
            const x = r()*w, an = 14+r()*24;
            c.fillRect(x, 0, an, h);
          }
      }}
    ]),

    pueblo: (pal) => ([
      { depth: .12, pintar: (c,w,h,r) => colinas(c,w,h,h*.68,h*.16, mezclar(pal.silueta,pal.niebla,.62), r) },
      { depth: .34, pintar: (c,w,h,r) => {
          casas(c,w,h,h*.84,h*.20, mezclar(pal.silueta,pal.niebla,.30), r, pal.luz, pal.estrellas>.4?1:0);
          // campanario
          const x=w*.62, al=h*.30;
          c.fillStyle = mezclar(pal.silueta,pal.niebla,.30);
          c.fillRect(x, h*.84-al, 30, al);
          c.beginPath(); c.moveTo(x-6,h*.84-al); c.lineTo(x+15,h*.84-al-42); c.lineTo(x+36,h*.84-al); c.closePath(); c.fill();
      }},
      { depth: .76, pintar: (c,w,h,r) => {
          casas(c,w,h,h*1.02,h*.22, pal.silueta, r, pal.luz, pal.estrellas>.4?1:0);
      }}
    ]),

    carretera: (pal) => ([
      { depth: .12, pintar: (c,w,h,r) => colinas(c,w,h,h*.66,h*.12, mezclar(pal.silueta,pal.niebla,.62), r) },
      { depth: .30, pintar: (c,w,h,r) => colinas(c,w,h,h*.74,h*.10, mezclar(pal.silueta,pal.niebla,.36), r) },
      { depth: .70, pintar: (c,w,h,r) => {
          // asfalto en perspectiva
          const hor = h*.74, cx = w*.5;
          c.fillStyle = oscurecer(pal.silueta, .25);
          c.beginPath();
          c.moveTo(cx-26, hor); c.lineTo(cx+26, hor);
          c.lineTo(w*1.25, h); c.lineTo(-w*.25, h);
          c.closePath(); c.fill();
          // línea discontinua
          let y = hor + 6, paso = 6;
          while (y < h) {
            const p = (y-hor)/(h-hor);
            const an = 2 + p*13;
            c.fillStyle = rgba(pal.luz, .30 + p*.35);
            c.fillRect(cx - an/2 + (p*p*0), y, an, paso*.8);
            paso *= 1.28; y += paso*1.9;
          }
          // postes
          for (let i=0;i<5;i++){
            const p = .12 + i*.2, y = hor + p*(h-hor), al = 30+p*130;
            c.fillStyle = pal.silueta;
            c.fillRect(w*.5 - (60+p*520), y-al, 2+p*4, al);
            c.fillRect(w*.5 + (60+p*520), y-al, 2+p*4, al);
          }
      }}
    ]),

    parque: (pal) => ([
      { depth: .14, pintar: (c,w,h,r) => edificios(c,w,h,h*.66,h*.18, mezclar(pal.silueta,pal.niebla,.70), r, pal.luz, pal.estrellas>.5?.5:0) },
      { depth: .34, pintar: (c,w,h,r) => {
          colinas(c,w,h,h*.86,h*.08, mezclar(pal.silueta,pal.niebla,.34), r);
          for (let i=0;i<6;i++) arbol(c, r()*w, h*.86, h*(.14+r()*.1), mezclar(pal.silueta,pal.niebla,.30));
      }},
      { depth: .80, pintar: (c,w,h,r) => {
          c.fillStyle = pal.silueta;
          c.fillRect(-20, h*.93, w+40, h*.07+20);
          arbol(c, w*.84, h*.93, h*.34, pal.silueta);
          // banco
          const bx = w*.20, by = h*.93;
          c.fillRect(bx, by-30, 96, 6);
          c.fillRect(bx, by-44, 96, 6);
          c.fillRect(bx+6, by-30, 5, 30);
          c.fillRect(bx+85, by-30, 5, 30);
          // farola
          c.fillRect(w*.60-2, h*.60, 4, h*.33);
          c.beginPath(); c.arc(w*.60, h*.60, 8, 0, Math.PI*2); c.fill();
          if (pal.estrellas > .4){
            const g=c.createRadialGradient(w*.60,h*.60,2,w*.60,h*.60,90);
            g.addColorStop(0,rgba(pal.luz,.35)); g.addColorStop(1,rgba(pal.luz,0));
            c.fillStyle=g; c.beginPath(); c.arc(w*.60,h*.60,90,0,Math.PI*2); c.fill();
          }
      }}
    ]),

    lago: (pal) => ([
      { depth: .10, pintar: (c,w,h,r) => cordillera(c,w,h,h*.60,h*.26, mezclar(pal.silueta,pal.niebla,.66), r, 5) },
      { depth: .24, pintar: (c,w,h,r) => {
          cordillera(c,w,h,h*.66,h*.20, mezclar(pal.silueta,pal.niebla,.42), r, 4);
          for (let i=0;i<8;i++) pino(c, r()*w, h*.66, h*(.06+r()*.05), mezclar(pal.silueta,pal.niebla,.40));
      }},
      { depth: .40, pintar: (c,w,h,r) => mar(c,w,h,h*.66, pal.agua, r, pal) },
      { depth: .84, pintar: (c,w,h,r) => {
          c.fillStyle = pal.silueta;
          c.beginPath(); c.moveTo(-20,h); c.lineTo(-20,h*.94);
          c.quadraticCurveTo(w*.3,h*.90,w*.55,h*.97); c.lineTo(w*.55,h); c.closePath(); c.fill();
          for (let i=0;i<9;i++){                       // juncos
            const x = r()*w*.5, y = h*.95;
            c.strokeStyle = pal.silueta; c.lineWidth = 2;
            c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+5,y-34,x+13,y-58); c.stroke();
          }
      }}
    ]),

    interior: (pal) => ([
      { depth: .08, pintar: (c,w,h,r) => {
          // lo que se ve por la ventana
          edificios(c,w,h,h*.70,h*.22, mezclar(pal.silueta,pal.niebla,.52), r, pal.luz, pal.estrellas>.4?.8:0);
      }},
      { depth: .40, pintar: (c,w,h,r) => {
          // marco de ventana
          const m = Math.min(w,h)*.09;
          c.fillStyle = oscurecer(pal.silueta,.2);
          c.fillRect(0,0,w,m); c.fillRect(0,h-m*2.2,w,m*2.2);
          c.fillRect(0,0,m,h); c.fillRect(w-m,0,m,h);
          c.fillRect(w/2-m*.28,0,m*.56,h);
          c.fillRect(0,h*.44-m*.24,w,m*.48);
          // reflejo del cristal
          const g = c.createLinearGradient(0,0,w,h);
          g.addColorStop(0, rgba("#ffffff",.055));
          g.addColorStop(.5, rgba("#ffffff",0));
          c.fillStyle = g; c.fillRect(m,m,w-m*2,h-m*3);
      }},
      { depth: .88, pintar: (c,w,h,r) => {
          // mesa con dos tazas
          const my = h*.84;
          c.fillStyle = oscurecer(pal.silueta,.35);
          c.fillRect(-20, my, w+40, h-my+20);
          const taza = (x, esc) => {
            c.fillStyle = oscurecer(pal.silueta,.55);
            c.beginPath();
            c.moveTo(x-16*esc, my-30*esc);
            c.lineTo(x+16*esc, my-30*esc);
            c.lineTo(x+11*esc, my);
            c.lineTo(x-11*esc, my);
            c.closePath(); c.fill();
            c.beginPath(); c.ellipse(x, my-30*esc, 16*esc, 4.5*esc, 0, 0, Math.PI*2); c.fill();
            c.strokeStyle = oscurecer(pal.silueta,.55); c.lineWidth = 3.5*esc;
            c.beginPath(); c.arc(x+21*esc, my-19*esc, 8*esc, -1.2, 1.2); c.stroke();
          };
          taza(w*.34, 1.1); taza(w*.60, 1.1);
          // vapor
          c.strokeStyle = rgba(pal.luz,.16); c.lineWidth = 2.5;
          [w*.34, w*.60].forEach((x)=>{
            c.beginPath(); c.moveTo(x, my-38);
            c.quadraticCurveTo(x+12, my-62, x-4, my-84);
            c.quadraticCurveTo(x-16, my-104, x+6, my-124);
            c.stroke();
          });
      }}
    ]),

    cielo: (pal) => ([
      { depth: .20, pintar: (c,w,h,r) => {
          // nubes hechas de manchas blandas, sin bordes duros
          const col = mezclar(pal.niebla, "#ffffff", .3);
          for (let i=0;i<6;i++){
            const cx = r()*w, cy = h*(.28+r()*.46);
            const an = w*(.16+r()*.26), al = h*(.02+r()*.035);
            const op = .05+r()*.07;
            for (let j=0;j<9;j++){
              const px = cx + (r()-.5)*an*1.7;
              const py = cy + (r()-.5)*al*1.3;
              const pr = al*(1.1+r()*1.9);
              const g = c.createRadialGradient(px,py,0,px,py,pr);
              g.addColorStop(0, rgba(col, op));
              g.addColorStop(1, rgba(col, 0));
              c.fillStyle = g;
              c.beginPath(); c.arc(px,py,pr,0,Math.PI*2); c.fill();
            }
          }
      }},
      { depth: .60, pintar: (c,w,h,r) => {
          c.fillStyle = rgba(pal.silueta, .55);
          c.beginPath(); c.moveTo(-20,h); c.lineTo(-20,h*.95);
          for (let x=-20;x<=w+20;x+=10) c.lineTo(x, h*.95 + Math.sin(x/w*3)*h*.02);
          c.lineTo(w+20,h); c.closePath(); c.fill();
      }}
    ])
  };

  /* ==========================================================
     Lienzos auxiliares
     ========================================================== */
  function nuevoLienzo(w, h) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * DPR));
    c.height = Math.max(1, Math.round(h * DPR));
    const x = c.getContext("2d");
    x.scale(DPR, DPR);
    return { lienzo: c, ctx: x };
  }

  /* ---------- cielo + astro + estrellas ---------- */
  function pintarFondo(pal, rnd) {
    const { lienzo: l, ctx: c } = nuevoLienzo(W, H);

    const g = c.createLinearGradient(0, 0, 0, H);
    pal.cielo.forEach(([p, col]) => g.addColorStop(p, col));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // estrellas
    if (pal.estrellas > 0) {
      const n = Math.round(150 * pal.estrellas);
      for (let i = 0; i < n; i++) {
        const x = rnd() * W, y = rnd() * H * .72;
        const r = rnd() * 1.25 + .25;
        c.fillStyle = rgba("#ffffff", (.25 + rnd() * .7) * pal.estrellas * (1 - y / (H * .9)));
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
    }

    // neblina en el horizonte: da profundidad
    const nb = c.createLinearGradient(0, H * .45, 0, H);
    nb.addColorStop(0, rgba(pal.niebla, 0));
    nb.addColorStop(1, rgba(pal.niebla, .30));
    c.fillStyle = nb;
    c.fillRect(0, H * .45, W, H * .55);

    // sol o luna: va por encima de la neblina para que se vea de verdad
    const ax = pal.astroX * W, ay = pal.astroY * H, ar = pal.astroR * Math.min(W, H) * 1.4;

    const halo = c.createRadialGradient(ax, ay, ar * .4, ax, ay, ar * 9);
    halo.addColorStop(0,  rgba(pal.astroLuz, .50));
    halo.addColorStop(.18, rgba(pal.astroLuz, .22));
    halo.addColorStop(.5,  rgba(pal.astroLuz, .07));
    halo.addColorStop(1,  rgba(pal.astroLuz, 0));
    c.fillStyle = halo;
    c.beginPath(); c.arc(ax, ay, ar * 9, 0, Math.PI * 2); c.fill();

    const nucleo = c.createRadialGradient(ax, ay, 0, ax, ay, ar);
    nucleo.addColorStop(0,   aclarar(pal.astro, .55));
    nucleo.addColorStop(.72, pal.astro);
    nucleo.addColorStop(1,   rgba(pal.astro, .82));
    c.fillStyle = nucleo;
    c.beginPath(); c.arc(ax, ay, ar, 0, Math.PI * 2); c.fill();

    return l;
  }

  /* ==========================================================
     Partículas (el "clima")
     ========================================================== */
  function crearParticulas(clima, pal) {
    const p = [];
    const area = (W * H) / 800000;
    const n = Math.round(U.limitar(area * 70, 26, 120));

    for (let i = 0; i < n; i++) {
      const base = { x: Math.random() * W, y: Math.random() * H, s: Math.random() };
      if (clima === "lluvia") {
        p.push({ ...base, vy: 7 + Math.random() * 11, vx: -1.2 - Math.random() * 1.2,
                 largo: 9 + Math.random() * 20, a: .1 + Math.random() * .22 });
      } else if (clima === "nieve") {
        p.push({ ...base, vy: .45 + Math.random() * 1.0, vx: (Math.random() - .5) * .5,
                 r: 1 + Math.random() * 2.6, a: .28 + Math.random() * .5, f: Math.random() * 6.28 });
      } else if (clima === "petalos") {
        p.push({ ...base, vy: .55 + Math.random() * 1.1, vx: (Math.random() - .5) * 1.1,
                 r: 3 + Math.random() * 4.5, a: .3 + Math.random() * .45, f: Math.random() * 6.28,
                 giro: Math.random() * 6.28, vg: (Math.random() - .5) * .05 });
      } else if (clima === "luciernagas") {
        p.push({ ...base, y: H * (.5 + Math.random() * .5),
                 vy: (Math.random() - .5) * .28, vx: (Math.random() - .5) * .34,
                 r: 1.4 + Math.random() * 2.1, f: Math.random() * 6.28, vf: .015 + Math.random() * .035 });
      } else if (clima === "estrellas") {
        p.push({ x: Math.random() * W, y: Math.random() * H * .72,
                 r: .5 + Math.random() * 1.5, f: Math.random() * 6.28, vf: .012 + Math.random() * .035 });
      } else if (clima === "niebla") {
        p.push({ x: Math.random() * W, y: H * (.45 + Math.random() * .5),
                 vx: .12 + Math.random() * .3, an: W * (.25 + Math.random() * .55),
                 al: H * (.03 + Math.random() * .09), a: .035 + Math.random() * .055 });
      }
    }
    return p;
  }

  function pintarParticulas(c, clima, pal) {
    if (clima === "lluvia") {
      c.lineCap = "round";
      for (const g of particulas) {
        c.strokeStyle = rgba("#cfe0f5", g.a);
        c.lineWidth = 1.1;
        c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + g.vx * 1.6, g.y + g.largo); c.stroke();
        g.x += g.vx; g.y += g.vy;
        if (g.y > H) { g.y = -20; g.x = Math.random() * (W + 120); }
        if (g.x < -30) g.x = W + 20;
      }
    } else if (clima === "nieve") {
      for (const g of particulas) {
        c.fillStyle = rgba("#ffffff", g.a);
        c.beginPath(); c.arc(g.x, g.y, g.r, 0, Math.PI * 2); c.fill();
        g.f += .02;
        g.x += g.vx + Math.sin(g.f) * .45;
        g.y += g.vy;
        if (g.y > H + 6) { g.y = -6; g.x = Math.random() * W; }
        if (g.x < -10) g.x = W + 6; if (g.x > W + 10) g.x = -6;
      }
    } else if (clima === "petalos") {
      for (const g of particulas) {
        g.giro += g.vg;
        c.save();
        c.translate(g.x, g.y);
        c.rotate(g.giro);
        c.fillStyle = rgba("#f0a8b4", g.a);
        c.beginPath();
        c.ellipse(0, 0, g.r, g.r * .52, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
        g.f += .022;
        g.x += g.vx + Math.sin(g.f) * .85;
        g.y += g.vy;
        if (g.y > H + 10) { g.y = -10; g.x = Math.random() * W; }
        if (g.x < -14) g.x = W + 8; if (g.x > W + 14) g.x = -8;
      }
    } else if (clima === "luciernagas") {
      for (const g of particulas) {
        g.f += g.vf;
        const br = (Math.sin(g.f) + 1) / 2;
        const col = "#ffe9a8";
        const halo = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 7);
        halo.addColorStop(0, rgba(col, .55 * br));
        halo.addColorStop(1, rgba(col, 0));
        c.fillStyle = halo;
        c.beginPath(); c.arc(g.x, g.y, g.r * 7, 0, Math.PI * 2); c.fill();
        c.fillStyle = rgba("#fff6d0", .85 * br);
        c.beginPath(); c.arc(g.x, g.y, g.r, 0, Math.PI * 2); c.fill();
        g.x += g.vx; g.y += g.vy;
        if (g.x < 0 || g.x > W) g.vx *= -1;
        if (g.y < H * .42 || g.y > H) g.vy *= -1;
      }
    } else if (clima === "estrellas") {
      for (const g of particulas) {
        g.f += g.vf;
        const br = (Math.sin(g.f) + 1) / 2;
        c.fillStyle = rgba("#ffffff", .15 + br * .75);
        c.beginPath(); c.arc(g.x, g.y, g.r, 0, Math.PI * 2); c.fill();
        if (g.r > 1.2 && br > .8) {                   // destello en cruz
          c.strokeStyle = rgba("#ffffff", (br - .8) * 1.6);
          c.lineWidth = .8;
          c.beginPath();
          c.moveTo(g.x - g.r * 4, g.y); c.lineTo(g.x + g.r * 4, g.y);
          c.moveTo(g.x, g.y - g.r * 4); c.lineTo(g.x, g.y + g.r * 4);
          c.stroke();
        }
      }
    } else if (clima === "niebla") {
      for (const g of particulas) {
        const gr = c.createLinearGradient(g.x, 0, g.x + g.an, 0);
        gr.addColorStop(0, rgba(pal.niebla, 0));
        gr.addColorStop(.5, rgba(pal.niebla, g.a));
        gr.addColorStop(1, rgba(pal.niebla, 0));
        c.fillStyle = gr;
        c.fillRect(g.x, g.y, g.an, g.al);
        g.x += g.vx;
        if (g.x > W + 20) g.x = -g.an;
      }
    }
  }

  /* ==========================================================
     Composición
     ========================================================== */
  function medir() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = U.limitar(window.devicePixelRatio || 1, 1, 2);
    lienzo.width  = Math.round(W * DPR);
    lienzo.height = Math.round(H * DPR);
    lienzo.style.width  = W + "px";
    lienzo.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function construir(escena) {
    const tipo    = ESCENARIOS[escena.tipo] ? escena.tipo : "campo";
    const momento = PALETAS[escena.momento] ? escena.momento : "atardecer";
    paleta   = Object.assign({}, PALETAS[momento]);
    tipoClima = escena.clima || "despejado";

    const rnd = U.semilla((escena.semilla || "") + "|" + tipo + "|" + momento);

    fondo = pintarFondo(paleta, rnd);
    capas = ESCENARIOS[tipo](paleta).map((c) => {
      const { lienzo: l, ctx: x } = nuevoLienzo(W, H);
      c.pintar(x, W, H, U.semilla(String(rnd())), paleta);
      return { depth: c.depth, lienzo: l };
    });
    particulas = crearParticulas(tipoClima, paleta);

    // El velo se adapta al cielo: cuanto más claro es el paisaje, más tapa,
    // para que el texto blanco se lea igual de bien a mediodía que de noche.
    const arriba = paleta.cielo[0][1];
    const abajo  = paleta.cielo[paleta.cielo.length - 1][1];
    const brillo = (luminancia(arriba) + luminancia(abajo) * 1.4) / 2.4;
    const k = U.limitar(.30 + brillo * .62, .30, .74);
    const a = (v) => Math.round(v * k * 100) / 100;

    elVelo.style.background =
      `radial-gradient(140% 95% at 50% 38%, ${rgba(arriba,0)} 0%, ` +
        `${rgba(oscurecer(arriba,.4), a(.34))} 62%, ${rgba(oscurecer(arriba,.62), a(.78))} 100%),` +
      `linear-gradient(180deg, ${rgba(oscurecer(arriba,.3), a(.30))} 0%, ` +
        `${rgba(oscurecer(arriba,.45), a(.20))} 45%, ${rgba(oscurecer(abajo,.78), a(.84))} 100%)`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", oscurecer(arriba, .25));
  }

  function fotograma() {
    t += 1;
    paraX += (objX - paraX) * .05;
    paraY += (objY - paraY) * .05;

    ctx.clearRect(0, 0, W, H);
    if (fondo) ctx.drawImage(fondo, paraX * 6, paraY * 4, W, H);

    for (const c of capas) {
      const dx = paraX * (10 + c.depth * 52);
      const dy = paraY * (5 + c.depth * 26);
      ctx.drawImage(c.lienzo, dx, dy, W, H);
    }
    pintarParticulas(ctx, tipoClima, paleta);

    bucle = requestAnimationFrame(fotograma);
  }

  /* ---------- parallax con ratón / giroscopio ---------- */
  function moverPuntero(e) {
    objX = (e.clientX / window.innerWidth - .5) * -1;
    objY = (e.clientY / window.innerHeight - .5) * -1;
  }
  function moverGiro(e) {
    if (e.gamma == null) return;
    objX = U.limitar(e.gamma / 42, -1, 1) * -1;
    objY = U.limitar((e.beta - 45) / 42, -1, 1) * -1;
  }

  /* ==========================================================
     API
     ========================================================== */
  function pintar(escena, semillaId) {
    const e = Object.assign({ tipo: "campo", momento: "atardecer", clima: "despejado" },
                            escena || {}, { semilla: semillaId || (escena && escena.tipo) || "x" });
    escenaActual = e;
    construir(e);

    // foto real de fondo, si la hay
    if (e.foto) {
      U.existeFoto(e.foto).then((existe) => {
        if (!existe || escenaActual !== e) { elFoto.classList.remove("visible"); lienzo.classList.remove("atenuado"); return; }
        elFoto.style.backgroundImage = `url("${e.foto}")`;
        elFoto.classList.add("visible");
        lienzo.classList.add("atenuado");
      });
    } else {
      elFoto.classList.remove("visible");
      elFoto.style.backgroundImage = "";
      lienzo.classList.remove("atenuado");
    }
  }

  function iniciar() {
    medir();
    window.addEventListener("resize", () => {
      medir();
      if (escenaActual) construir(escenaActual);
    });
    window.addEventListener("pointermove", moverPuntero, { passive: true });
    window.addEventListener("deviceorientation", moverGiro, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(bucle); bucle = null; }
      else if (!bucle) bucle = requestAnimationFrame(fotograma);
    });
    if (!bucle) bucle = requestAnimationFrame(fotograma);
  }

  return { iniciar, pintar };
})();
