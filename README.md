# Nuestra Historia

Un videojuego hecho para una sola persona.

Es una aventura corta en la que ella recorre vuestros sitios, resuelve acertijos
que solo ella puede resolver y va desbloqueando recuerdos. Cada recuerdo le da
una letra. Al final, las letras forman una palabra que abre la carta.

---

## Cómo verlo

**La forma rápida:** doble clic en `index.html`. Funciona sin instalar nada.

**La forma recomendada** (algunos navegadores son quisquillosos con los archivos
locales de audio):

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

---

## Lo único que tienes que tocar

### `contenido/historia.js`

Ahí está **todo**: los nombres, los capítulos, los acertijos, los recuerdos, la
carta final. Está lleno de contenido de ejemplo para que veas cómo funciona cada
pieza; ve sustituyéndolo por lo vuestro.

No hace falta saber programar. Si te equivocas en algo (una coma de más, una
comilla sin cerrar), el juego te lo dice en pantalla y te señala el capítulo.

En `docs/GUIA-DE-CONTENIDO.md` tienes la lista de lo que hace falta reunir.

### `media/fotos/` y `media/musica/`

Metes ahí tus archivos y los referencias desde `historia.js`:

```js
foto:    "media/fotos/aquel-dia.jpg"
musica:  "media/musica/nuestra-cancion.mp3"
```

Si no pones foto, **no pasa nada**: el juego dibuja el paisaje solo a partir de
la descripción del escenario.

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
  escena.css            el fondo y los marcos de foto
  ui.css                botones, mapa, álbum, carta
  acertijos.css         cada tipo de prueba
js/
  util.js               ayudas (comparar respuestas, guardar partida…)
  audio.js              música con fundidos y efectos
  escena.js             dibuja los paisajes
  dialogo.js            el texto que se escribe solo
  acertijos.js          los nueve tipos de acertijo
  album.js              la pantalla de recuerdos
  motor.js              el hilo que une todo
  main.js               arranque
media/fotos/            tus fotos
media/musica/           tus canciones
docs/                   guía de contenido y referencia de acertijos
```

Sin dependencias, sin compilar, sin `npm install`. Son archivos sueltos: dentro
de diez años seguirá abriéndose igual.

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
- **Se guarda sola.** Puede dejarlo a medias y seguir otro día.
- **Funciona en el móvil.** Está pensado para pantalla pequeña y dedo.
- **La música no arranca sola** (los navegadores no dejan): empieza en cuanto
  ella toca el primer botón, y hay un interruptor arriba a la derecha.
- **Sin fotos también queda bonito.** Los paisajes se dibujan solos.
- **Puede releerlo.** El álbum de recuerdos y la carta quedan ahí para siempre.
