# Nuestra Historia

Un videojuego hecho para una sola persona.

Es un mundo en 3D que se recorre **andando, en primera persona**. Vuestros
sitios están repartidos por él como lugares a los que se puede ir. En cada uno
hay un recuerdo guardado, y para abrirlo hay que resolver un acertijo que solo
ella puede resolver. Cada recuerdo le da una letra. Al final, las letras forman
una palabra que abre la carta.

Puede ir a donde quiera desde el primer momento: el sitio que le toca está
marcado con una columna de luz que se ve desde lejos, así que hay libertad para
explorar pero no hay forma de perderse.

---

## Cómo verlo

**La forma rápida:** doble clic en `index.html`. Funciona sin instalar nada.

**La forma recomendada** (algunos navegadores son quisquillosos con los archivos
locales de audio):

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

## Cómo se juega

**En ordenador**
- `W A S D` o las flechas para andar
- Mover el ratón para mirar (hay que hacer clic una vez para que lo capture)
- `Mayúsculas` para correr
- `E` para acercarte a algo que tengas delante
- `Esc` para soltar el ratón

**En móvil**
- Palanca flotante en la mitad izquierda para andar
- Arrastrar en la mitad derecha para mirar
- Botón dorado para tocar lo que tengas delante

**Si el aparato no puede con el 3D** (móviles antiguos, WebGL desactivado), el
juego se da cuenta solo y pasa a unas pantallas dibujadas en 2D con los mismos
acertijos, los mismos recuerdos y el mismo final. No hay que hacer nada ni se
pierde nada.

---

## Lo único que tienes que tocar

### `contenido/historia.js`

Ahí está **todo**: los nombres, los capítulos, los acertijos, los recuerdos, la
carta final. Está lleno de contenido de ejemplo para que veas cómo funciona cada
pieza; ve sustituyéndolo por lo vuestro.

No hace falta saber programar. Si te equivocas en algo (una coma de más, una
comilla sin cerrar), el juego te lo dice en pantalla y te señala el capítulo.

En `docs/GUIA-DE-CONTENIDO.md` tienes la lista de lo que hace falta reunir.

### Cómo se convierte un sitio vuestro en un lugar del mundo

No hay que modelar nada. Cada capítulo describe su sitio con tres palabras y el
mundo se construye solo a partir de ellas:

```js
escena: { tipo: "pueblo", momento: "noche", clima: "nieve" }
```

- **tipo** — `ciudad` · `playa` · `montana` · `campo` · `bosque` · `pueblo` ·
  `carretera` · `parque` · `interior` · `lago` · `cielo`
- **momento** — `amanecer` · `dia` · `atardecer` · `noche`
- **clima** — `despejado` · `lluvia` · `nieve` · `petalos` · `estrellas` ·
  `luciernagas` · `niebla`

Eso da una ciudad con las ventanas encendidas, un pueblo con su campanario, una
playa con palmeras y el mar, una carretera con sus postes, un lago con una barca
o una casa en la que se entra y hay dos tazas en la mesa.

La hora del día y el clima **de todo el mundo** los marca el primer capítulo,
porque el mundo es continuo y no puede ser de noche y de día a la vez. El resto
de capítulos usan su `tipo` para decidir cómo es su sitio.

### `media/fotos/` y `media/musica/`

Metes ahí tus archivos y los referencias desde `historia.js`:

```js
foto:    "media/fotos/aquel-dia.jpg"
musica:  "media/musica/nuestra-cancion.mp3"
```

**La foto de cada recuerdo se queda plantada en su sitio.** Al resolver un
lugar, vuestra foto aparece enmarcada junto al pedestal y ahí se queda: si más
adelante ella vuelve a pasear por el mundo, va encontrando vuestras fotos por el
camino. Es como recorrer un álbum andando.

Si no pones foto, **no pasa nada**: el mundo se construye solo a partir de la
descripción del escenario.

La canción de cada capítulo **empieza a sonar al entrar en su sitio** y se funde
con la del siguiente al salir. Es de las cosas que mejor funcionan: llegar a un
lugar y que empiece vuestra canción.

---

## Cómo se lo das

### Opción A · un enlace (lo más cómodo)

Publícalo gratis con GitHub Pages y le mandas el enlace. Lo abre en el móvil y ya.

1. En este repositorio: **Settings → Pages**
2. En *Source* elige `Deploy from a branch`
3. Rama: la que estés usando · Carpeta: `/ (root)` · **Save**
4. En un par de minutos tendrás una dirección tipo
   `https://tuusuario.github.io/Juego-Pareja/`

> Ojo: con GitHub Pages el juego queda en una dirección pública. Nadie va a dar
> con ella por casualidad, pero si prefieres que no esté en internet, usa la
> opción B. Y si no quieres que el contenido esté en GitHub, haz el repositorio
> privado *antes* de subir nada personal.

### Opción B · una carpeta

Copia la carpeta entera a un USB o compártela. Abre `index.html` y funciona,
sin internet y sin nada instalado.

---

## Cómo está montado

```
index.html              la página
contenido/historia.js   ← TODO EL CONTENIDO PERSONAL (esto es lo tuyo)
css/                    estilos
  base.css              tipografía, colores, estructura
  escena.css            el fondo 2D y los marcos de foto
  ui.css                botones, mapa, álbum, carta
  acertijos.css         cada tipo de prueba
  mundo.css             brújula, mira, mandos táctiles
js/
  util.js               ayudas (comparar respuestas, guardar partida…)
  audio.js              música con fundidos y efectos
  escena.js             paisajes en 2D (portada y respaldo)
  dialogo.js            el texto que se escribe solo
  acertijos.js          los nueve tipos de acertijo
  album.js              la pantalla de recuerdos
  motor.js              el hilo que une todo
  main.js               arranque
  mundo/
    piezas.js           las formas con las que se construye todo
    paisaje.js          terreno, cielo, agua y clima
    jugador.js          andar en primera persona
    mundo.js            el mapa entero y las anclas de recuerdo
vendor/three.min.js     Three.js (incluido, no hace falta internet)
media/fotos/            tus fotos
media/musica/           tus canciones
docs/                   guía de contenido y referencia de acertijos
```

Sin compilar, sin `npm install`, sin conexión. La única dependencia es Three.js
y va dentro del repositorio: son archivos sueltos, dentro de diez años seguirá
abriéndose igual.

### Sobre el rendimiento

El mundo está hecho con formas simples y todo lo que se repite (árboles,
edificios, piedras) se dibuja de una sola pasada, así que va suelto también en
un móvil. En móvil se baja sola la resolución y el detalle del terreno.

---

## Los nueve acertijos

| tipo | qué hace |
|---|---|
| `texto` | escribe la respuesta (acepta acentos, mayúsculas y variantes) |
| `opcion` | elige entre varias |
| `fecha` | día, mes y año |
| `codigo` | cerradura numérica |
| `orden` | pon los recuerdos en el orden correcto |
| `parejas` | juego de memoria con cosas vuestras |
| `relacionar` | une cada frase con lo que significa |
| `mapa` | toca el punto exacto de una foto |
| `puzzle` | rompecabezas deslizante con una foto vuestra |

La referencia completa, con un ejemplo copiable de cada uno, está en
`docs/ACERTIJOS.md`.

---

## Detalles que están pensados

- **Ella nunca se atasca.** Puede pedir pistas cuando quiera, y tras varios
  fallos el juego se las ofrece solo. Si sigue sin salir, puede seguir adelante.
  Es un regalo, no un examen.
- **Tampoco se pierde.** Columna de luz en el sitio que toca, brújula arriba con
  la distancia, y desde "El viaje" puede ir directa a cualquier sitio ya abierto.
- **Se guarda sola.** Puede dejarlo a medias y seguir otro día.
- **Funciona en el móvil.** Está pensado para pantalla pequeña y dedo.
- **La música no arranca sola** (los navegadores no dejan): empieza en cuanto
  ella toca el primer botón, y hay un interruptor arriba a la derecha.
- **Sin fotos también queda bonito.** Los paisajes se dibujan solos.
- **Puede releerlo.** El álbum de recuerdos y la carta quedan ahí para siempre.
