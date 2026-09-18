/* ============================================================
   RENDER · el motor gráfico
   ------------------------------------------------------------
   Para Three.js r180. Todos los valores están medidos.
   ============================================================ */
import * as THREE from '../vendor/three.module.js';
import { EffectComposer }  from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass }      from '../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass }        from '../vendor/jsm/postprocessing/SSAOPass.js';
import { SMAAPass }        from '../vendor/jsm/postprocessing/SMAAPass.js';
import { OutputPass }      from '../vendor/jsm/postprocessing/OutputPass.js';

/* Niveles del ajuste de "Calidad gráfica" de la pausa. */
export const CALIDAD = { BAJA: 0, MEDIA: 1, ALTA: 2 };

export class Render {
  constructor(lienzo) {
    this.ren = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false,
                                         powerPreference: 'high-performance' });
    this.ren.outputColorSpace = THREE.SRGBColorSpace;
    this.ren.toneMapping = THREE.ACESFilmicToneMapping;
    this.ren.toneMappingExposure = 1.0;
    this.ren.shadowMap.enabled = true;
    this.ren.shadowMap.type = THREE.PCFSoftShadowMap;
    this.lienzo = lienzo;
    this.calidad = CALIDAD.ALTA;
  }

  montar(escena, camara) {
    this.escena = escena; this.camara = camara;
    const w = innerWidth, h = innerHeight;

    this.compositor = new EffectComposer(this.ren);
    this.compositor.addPass(new RenderPass(escena, camara));

    // Oclusión: oscurece rincones y los puntos donde las cosas tocan el suelo.
    this.ao = new SSAOPass(escena, camara, w, h);
    this.ao.kernelRadius = 0.5;
    this.ao.minDistance = 0.002;
    this.ao.maxDistance = 0.08;
    this.compositor.addPass(this.ao);

    // BLOOM · el umbral va en escala HDR, antes del tone mapping, porque
    // OutputPass va después. Barrido medido sobre una escena nocturna
    // (brillo medio sin bloom = 62):
    //   0.90 -> 95 (+53 %) todo florece   1.60 -> 84 (+35 %) se desborda
    //   2.40 -> 75 (+21 %) solo bombillas 3.20 -> 67 (+8 %) casi nada
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.60, 0.55, 2.40);
    this.compositor.addPass(this.bloom);

    // Obligatorio desde r152 con compositor: aplica tone mapping y sRGB.
    this.compositor.addPass(new OutputPass());

    // El suavizado va al final, sobre la imagen ya en LDR.
    this.smaa = new SMAAPass(w, h);
    this.compositor.addPass(this.smaa);

    this.redimensionar();
    this.ponerCalidad(this.calidad);
  }

  /** Entorno de hora azul: sin esto el PBR parece plástico. */
  entorno(cielo) {
    const pm = new THREE.PMREMGenerator(this.ren);
    pm.compileEquirectangularShader();
    const esc = new THREE.Scene();
    esc.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { a:{value:new THREE.Color(cielo.alto)}, m:{value:new THREE.Color(cielo.medio)},
                  b:{value:new THREE.Color(cielo.bajo)} },
      vertexShader: `varying vec3 vP; void main(){ vP=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 a; uniform vec3 m; uniform vec3 b; varying vec3 vP;
        void main(){ float h=normalize(vP).y; float t=clamp((h+0.15)/0.7,0.0,1.0);
          vec3 c=mix(b,m,smoothstep(0.0,0.55,t)); c=mix(c,a,smoothstep(0.45,1.0,t));
          gl_FragColor=vec4(c,1.0); }`
    })));
    const tex = pm.fromScene(esc, 0.04).texture;
    pm.dispose();
    return tex;
  }

  ponerCalidad(n) {
    this.calidad = n;
    // Se puede llamar antes de montar la escena (al restaurar los ajustes
    // guardados): en ese caso solo se apunta y montar() lo aplica.
    if (!this.compositor) { this.ren.setPixelRatio(n >= CALIDAD.ALTA ? Math.min(devicePixelRatio, 2) : 1); return; }
    this.ao.enabled    = n >= CALIDAD.ALTA;
    this.smaa.enabled  = n >= CALIDAD.ALTA;
    this.bloom.enabled = n >= CALIDAD.MEDIA;
    this.ren.shadowMap.enabled = n >= CALIDAD.MEDIA;
    this.ren.setPixelRatio(n >= CALIDAD.ALTA ? Math.min(devicePixelRatio, 2) : 1);
    this.escena?.traverse(o => { if (o.isMesh) o.castShadow = o.userData.proyecta !== false && n >= CALIDAD.MEDIA; });
    this.redimensionar();
  }

  redimensionar() {
    const w = innerWidth, h = innerHeight;
    this.ren.setSize(w, h, false);
    if (this.camara) { this.camara.aspect = w / h; this.camara.updateProjectionMatrix(); }
    if (this.compositor) {
      this.compositor.setSize(w, h);
      this.ao?.setSize(w, h);
      this.bloom?.setSize(w, h);
      const pr = this.ren.getPixelRatio();
      this.smaa?.setSize(w * pr, h * pr);
    }
  }

  pintar() { this.compositor ? this.compositor.render() : this.ren.render(this.escena, this.camara); }
}

/* ------------------------------------------------------------
   Luz principal, con el mapa de sombras ajustado
   ------------------------------------------------------------ */
export function prepararSol(luz, { radio = 34, resolucion = 2048 } = {}) {
  luz.castShadow = true;
  luz.shadow.mapSize.set(resolucion, resolucion);
  const c = luz.shadow.camera;
  c.left = -radio; c.right = radio; c.top = radio; c.bottom = -radio;
  c.near = 1; c.far = radio * 3;
  c.updateProjectionMatrix();
  luz.shadow.bias = -0.0008;
  luz.shadow.normalBias = 0.025;   // quita el acné de sombra en superficies planas
  luz.shadow.radius = 2.5;
  return luz;
}

/* Intensidades de referencia. Desde r155 las luces van en unidades
   físicas: las puntuales se miden en candelas, de ahí los números altos. */
export const LUZ = { sol: 1.0, cielo: 0.5, ambiente: 0.22,
                     farola: 34, interior: 16, foco: 55 };
