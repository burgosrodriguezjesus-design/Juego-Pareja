# La hora azul · para Alicia

Reconstrucción del juego con el código fuente incluido. Los textos, los lugares,
los recuerdos y la carta son los originales, rescatados del compilado anterior.

## Cómo abrirlo

Doble clic en **`EMPEZAR-mac.command`** (o `EMPEZAR-windows.bat`, o
`./empezar-linux.sh`). Se abre el navegador solo. Para cerrarlo, cierra la
ventana negra que se queda detrás.

La primera vez en Mac puede salir un aviso de seguridad: clic derecho sobre el
archivo → **Abrir** → **Abrir**. Solo hace falta una vez.

Si prefieres hacerlo a mano, es lo mismo que:

```
node SERVIR.mjs
```

y abrir **http://127.0.0.1:4173**

### Para jugarlo en el móvil

Con el teléfono en el mismo wifi:

```
RED=1 node SERVIR.mjs
```

Te dirá por pantalla a qué dirección entrar desde el teléfono. Sale un joystick
en la mitad izquierda y se mira arrastrando en la derecha.

> Hace falta **Node** instalado (https://nodejs.org). Es lo único.

> No vale con hacer doble clic en `index.html`: el navegador bloquea los
> módulos al abrirlos como archivo suelto y sale una pantalla en blanco.

## Lo que hay que tocar

**`contenido/historia.js`** y nada más. Ahí están los ocho lugares, sus textos,
sus pistas y sus acertijos.

Las respuestas vuestras ya están dentro: los sabores de Martonela, Spider-Man
en el Yelmo, el campero Chef de Mya y *See You Again* en la radio del Ibiza.

Ya no queda nada por rellenar.

## Cómo está montado

```
index.html            la página
estilo.css            toda la interfaz
contenido/historia.js ← LO TUYO
motor/
  juego.js            el hilo que une todo
  render.js           PBR, sombras, oclusión, bloom, tono filmico
  jugador.js          caminar en primera persona
  acertijos.js        los cinco tipos de acertijo de panel
mundo/
  piezas.js           las formas con las que se construyen los lugares
  escenario.js        monta un lugar a partir de su descripción
vendor/               Three.js r180 (incluido, no hace falta internet)
SERVIR.mjs            el servidor local
```

Sin compilar, sin `npm install`, sin Vite. Lo que se edita es lo que se ejecuta:
no hay forma de perder el fuente porque el fuente **es** el juego.

## Un lugar no se programa, se describe

Cada sitio de `historia.js` es una lista de piezas:

```js
piezas: [
  { prefab:'caseta', pos:[-8.5,0,-6], an:6.4 },
  { prefab:'farola', pos:[0,0,-2], encendida:true },
  { prefab:'banco',  pos:[3.4,0,3.6], giro:-0.4 },
  { pos:[0,0,-8], tam:[14,3.4,6], color:'crema' }
]
```

Prefabricados disponibles: `mesa`, `banco`, `farola`, `caseta`, `palmera`,
`arbol`, `guirnalda`, `paredConPuerta`, `objeto`. Y formas sueltas: caja
(por defecto), `cilindro` y `esfera`. Las colisiones y las luces salen solas.

## Los acertijos

| tipo | qué pide |
|---|---|
| `recoger` | coger objetos del mundo y usarlos en un sitio |
| `frase` | escribir algo que solo ella sabe (acepta cualquier forma de escribirlo) |
| `elegir` | escoger N entre muchas opciones |
| `ordenar` | poner cosas en su orden (o elegir una entre varias) |
| `secuencia` | repetir un patrón |
| `medidor` | parar una aguja en su punto |
| `encuadre` | colocarse en un sitio y mirar hacia algo concreto |
| `colocar` | activar cosas del mundo en el orden correcto |

Cualquiera puede llevar un `despues:` con otro acertijo encadenado.

## Decisiones que conviene conocer

**Fuera Rapier.** El controlador de personaje ocupaba 2,18 MB, el 79 % de la
descarga, para mover una cápsula que choca con cajas. Ahora son 250 líneas en
`motor/jugador.js`. El paquete pasa de 2,75 MB a menos de 1 MB.

**Todo lo que se mueve va por tiempo, no por fotograma.** El movimiento va en
pasos fijos y la aguja del medidor se calcula desde el reloj. Da igual que el
aparato vaya a 15 fps o a 144: la velocidad es la misma.

**El umbral del bloom es 2.40, y está medido.** Va en escala HDR, antes del
tone mapping. Por debajo de ~0.85 también florece el suelo iluminado y la
escena se convierte en una mancha blanca.

**La calidad gráfica tiene tres niveles** atados al ajuste de la pausa: Alta
(oclusión + suavizado + sombras + bloom), Media (sombras + bloom) y Ligera.
