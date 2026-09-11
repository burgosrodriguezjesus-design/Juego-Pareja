# Los nueve acertijos

Copia el bloque que quieras y pégalo dentro de un capítulo, en su apartado
`acertijo:`. Todos aceptan además estos campos opcionales:

```js
subtitulo: "una línea pequeña bajo la pregunta",
pistas: ["primera pista", "segunda pista", "tercera"]
```

Las pistas salen cuando ella las pide, y también solas tras un par de fallos.

---

## 1 · `texto` — escribe la respuesta

El más útil de todos. No es quisquilloso: da igual mayúsculas, acentos, signos
o que ponga "el" delante.

```js
acertijo: {
  tipo: "texto",
  pregunta: "¿Cómo se llamaba el bar de la esquina?",
  placeholder: "escribe el nombre",
  respuestas: ["el rincón", "rincon", "bar el rincón"],
  pistas: ["Tenía las sillas rojas.", "Nos echaron dos veces."]
}
```

Admite además una imagen o un audio de apoyo:

```js
  imagen: "media/fotos/pista.jpg",
  audio:  "media/musica/nota-de-voz.mp3",
```

> Truco: pon en `respuestas` todas las formas en que podría escribirlo. Es
> mejor aceptar de más que dejarla atascada.

---

## 2 · `opcion` — elige una

`correcta` se cuenta desde **1**, no desde 0.

```js
acertijo: {
  tipo: "opcion",
  pregunta: "¿Qué te dije la primera vez que te vi?",
  opciones: [
    "Que me sonabas de algo",
    "Nada, me quedé callado",
    "Una tontería de la que aún te ríes",
    "Te pregunté la hora"
  ],
  correcta: 3
}
```

---

## 3 · `fecha` — el día exacto

```js
acertijo: {
  tipo: "fecha",
  pregunta: "¿Qué día nos fuimos a la playa por primera vez?",
  respuesta: { dia: 7, mes: 8, anio: 2022 },
  anioDesde: 2018,
  anioHasta: 2026
}
```

Si quitas `anio` de `respuesta`, solo pregunta el día y el mes.

---

## 4 · `codigo` — cerradura numérica

```js
acertijo: {
  tipo: "codigo",
  pregunta: "El portal de tu casa.",
  subtitulo: "cuatro cifras",
  longitud: 4,
  respuesta: "2708"
}
```

---

## 5 · `orden` — ponlo en su sitio

Escribe los elementos **en el orden correcto**; el juego los baraja al mostrarlos.

```js
acertijo: {
  tipo: "orden",
  pregunta: "Ordena aquel verano.",
  elementos: [
    "Se nos estropeó el coche",
    "Dormimos en aquel hostal horrible",
    "Encontramos la cala",
    "No nos quisimos ir"
  ]
}
```

Cuando falla, le marca en verde las que sí estaban en su sitio.

---

## 6 · `parejas` — juego de memoria

Cartas boca abajo. Cada `a` va con su `b`. Con 4 parejas salen 8 cartas
(que es la cantidad que mejor funciona en un móvil).

```js
acertijo: {
  tipo: "parejas",
  pregunta: "Encuentra las parejas.",
  parejas: [
    { a: "Café",    b: "Sin azúcar" },
    { a: "Domingo", b: "Sofá" },
    { a: "Tú",      b: "Yo" },
    { a: "Verano",  b: "Playa" }
  ]
}
```

---

## 7 · `relacionar` — une las dos columnas

Igual de fácil de escribir que `parejas`, pero se juega distinto: aquí ve todas
las fichas y tiene que unirlas. Ideal para bromas internas.

```js
acertijo: {
  tipo: "relacionar",
  pregunta: "Une cada frase con lo que quiere decir de verdad.",
  parejas: [
    { a: "\"Estoy bien\"",   b: "Ven aquí ahora mismo" },
    { a: "\"Cinco minutos\"", b: "Media hora mínimo" }
  ]
}
```

---

## 8 · `mapa` — toca el sitio exacto

Una foto y un punto que hay que acertar. Perfecto para "¿dónde estábamos
sentados?" o para un mapa recortado.

```js
acertijo: {
  tipo: "mapa",
  pregunta: "¿Dónde nos sentamos aquel día?",
  imagen: "media/fotos/la-plaza.jpg",
  zona: { x: 0.62, y: 0.48, r: 0.10 }
}
```

`x` e `y` van de 0 a 1 (0,0 es la esquina de arriba a la izquierda; 1,1 la de
abajo a la derecha). `r` es lo grande que es la zona buena: 0.10 es cómodo,
0.05 es exigente.

> Para sacar las coordenadas: abre la foto, mira dónde cae el punto y divide.
> Si está a un 62% de ancho y a un 48% de alto → `x: 0.62, y: 0.48`.

---

## 9 · `puzzle` — rompecabezas deslizante

Una foto vuestra partida en trozos. Al recomponerla, la ve entera.

```js
acertijo: {
  tipo: "puzzle",
  pregunta: "Recompón la foto.",
  imagen: "media/fotos/nosotros.jpg",
  tamano: 3
}
```

`tamano` puede ser 2 (fácil), 3 (bien) o 4 (para ratos largos). Usa una foto
**cuadrada** o quedará estirada. Siempre tiene solución.

---

## Las letras del final

Cada capítulo puede dar una letra:

```js
fragmento: "S"
```

Todas juntas, en el orden de los capítulos, forman la `clave` del apartado
`final`. El juego comprueba al arrancar que cuadren y te avisa si no.

Ideas para la palabra: `SIEMPRE`, `GRACIAS`, el nombre del sitio al que te la
vas a llevar, `TE QUIERO`, `CASA`, la fecha de algo…

Si no quieres candado final, quita el `fragmento` de todos los capítulos y deja
`clave: ""`.

---

## Y el sitio donde ocurre cada acertijo

Cada capítulo describe su lugar del mundo con tres palabras:

```js
escena: { tipo: "pueblo", momento: "noche", clima: "nieve" }
```

| `tipo` | qué se construye |
|---|---|
| `ciudad` | manzanas de edificios con las ventanas encendidas, farolas, bancos y coches |
| `playa` | arena, mar, palmeras, sombrillas y rocas |
| `montana` | cordillera alrededor, pinos y peñascos |
| `campo` | lomas suaves, árboles, matorrales y una valla |
| `bosque` | pinos y árboles espesos |
| `pueblo` | casas con tejado, campanario y farolas |
| `carretera` | una recta de asfalto con su línea, postes y un coche parado |
| `parque` | árboles, bancos, farolas y setos |
| `lago` | agua, pinos, rocas y una barca |
| `interior` | una casa en la que se entra: mesa, dos sillas, dos tazas y una ventana |
| `cielo` | una loma abierta, sin más |

`momento` es `amanecer`, `dia`, `atardecer` o `noche`.
`clima` es `despejado`, `lluvia`, `nieve`, `petalos`, `estrellas`,
`luciernagas` o `niebla`.

**La hora y el clima de todo el mundo los marca el primer capítulo**, porque el
mundo es continuo. El `tipo` sí es propio de cada capítulo.

Si además pones una foto en `escena.foto`, se usa en las pantallas 2D (portada,
respaldo). Dentro del mundo 3D el sitio se construye con las formas.
