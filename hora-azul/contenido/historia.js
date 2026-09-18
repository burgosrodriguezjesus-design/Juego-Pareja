/* ============================================================
   LA HORA AZUL · contenido
   ------------------------------------------------------------
   Este es el único archivo que hay que tocar para cambiar el
   juego. Todo lo demás es motor.

   Los textos vienen rescatados del compilado original: son los
   tuyos, palabra por palabra. Lo que ha cambiado son los
   acertijos, para que necesiten a Alicia y no a cualquiera.

   Busca «PENDIENTE» para ver lo que falta por rellenar: son las
   respuestas que solo sabéis vosotros. El juego funciona con lo
   que hay puesto, pero esas son las que lo hacen vuestro.
   ============================================================ */

export const NOSOTROS = {
  ella: 'Alicia',
  el: 'Jesús',
  empezamos: '2025-09-19',
  entrega: '2026-09-19',
  primerasPalabras: 'No quiero nada contigo pero quiero tu instagram',
  carta: 'Amor te amo infinito, espero que valores muchísimo esto porque está hecho ' +
         'con muchísimo amor y esfuerzo, eres el amor de mi vida, feliz año juntos!!!'
};

export const PORTADA = {
  titulo: 'La hora azul',
  subtitulo: 'Ocho lugares. Una historia que sigue.',
  entradilla: 'La ciudad se ha quedado entre el día y la noche. Cada lugar guarda una luz. ' +
              'Enciéndelas, reúne sus seis cristales y lleva el último al mirador. ' +
              'Camina, observa y deja que los objetos te muestren el camino.'
};

/* ------------------------------------------------------------
   Paletas. La de cada lugar parte del color de cielo original.
   ------------------------------------------------------------ */
const P = {
  noche:  { alto:'#131f36', medio:'#22384f', bajo:'#4a6076' },
  azul:   { alto:'#1b2f4d', medio:'#2e4a63', bajo:'#6d8ea0' },
  malva:  { alto:'#312a44', medio:'#4d4257', bajo:'#8d7f8c' },
  claro:  { alto:'#5d7f92', medio:'#8fb0bc', bajo:'#c4d6d8' },
  calido: { alto:'#3a3550', medio:'#8a6a6a', bajo:'#dfc4a4' },
  ambar:  { alto:'#2e2b45', medio:'#8a5a52', bajo:'#d19b84' }
};

const MATERIALES = {
  suelo:'#b3ae98', arena:'#c4bda4', asfalto:'#3a3c42', madera:'#6b4636',
  muro:'#b9b2a2', crema:'#e6ddc8', toldo:'#8d3f52', azulado:'#2f6d80',
  metal:'#59656d', tronco:'#4a3529', hoja:'#3d5a44', bombilla:'#ffd9a0',
  neon:'#8fd8e8', cristal:'#9fc4d8', agua:'#2c4a5e', reflejo:'#2b333c',
  tela:'#c98f7e', rosa:'#c96f86', verde:'#2f5a3f'
};

/* ============================================================
   LOS OCHO LUGARES
   ============================================================ */
export const LUGARES = [

/* ---------------------------------------------------------- 0 */
{
  id: 'feria',
  titulo: 'La feria',
  subtitulo: 'Prólogo · Una frase inesperada',
  // Tu texto original, sin la frase de los controles: esa la pone el
  // juego sola y cambia según se juegue con teclado o con el dedo.
  intro: 'Hay una farola apagada junto al puesto. Busca lo que le falta.',
  objetivo: 'Devuelve la luz al primer encuentro.',
  pistas: [
    'Mira las mesas a ambos lados del camino.',
    'Recoge la pila y colócala en la farola. Después lee el teléfono.',
    'La pila está sobre la mesa de la izquierda. La farola es la del centro.'
  ],
  recuerdo: 'No quiero nada contigo pero quiero tu instagram\n' +
            'Jesús le dio su Instagram y, minutos después, le escribió que era perfecta.',
  cielo: P.noche,
  materiales: MATERIALES,
  aparicion: [0, 9],
  suelo: { tam: 80, color: 'arena', humedo: true },
  piezas: [
    { prefab:'caseta', pos:[-8.5,0,-6], an:6.4, fo:4, giro:0.06 },
    { prefab:'caseta', pos:[ 8.5,0,-6], an:6.4, fo:4, giro:-0.06 },
    { prefab:'mesa',   pos:[-4.6,0,1.6] },
    { prefab:'mesa',   pos:[ 4.6,0,1.6] },
    { prefab:'mesa',   pos:[-6.4,0,4.4] },
    { prefab:'banco',  pos:[3.4,0,3.6], giro:-0.4 },
    { prefab:'guirnalda', de:[-12,5.2,-3], a:[0,5.2,-1.6], n:9 },
    { prefab:'guirnalda', de:[0,5.2,-1.6], a:[12,5.2,-3], n:9 },
    { prefab:'guirnalda', de:[-12,4.9,4], a:[12,4.9,4], n:16 },
    // la noria al fondo
    { forma:'cilindro', pos:[-3.2,0,-19], tam:[0.22,0.3,8.8], color:'metal', metal:0.8, rugosidad:0.4 },
    { forma:'cilindro', pos:[ 3.2,0,-19], tam:[0.22,0.3,8.8], color:'metal', metal:0.8, rugosidad:0.4 }
  ],
  // la noria se genera aparte porque gira
  noria: { pos:[0,9,-19], radio:7, cabinas:10, bombillas:26 },
  acertijo: {
    tipo: 'recoger',
    recoge: [{ id:'pila', nombre:'Pila de la farola', pos:[-4.6,0.85,1.6] }],
    usaEn: { id:'farola', nombre:'la farola apagada', pos:[0,0,-2], necesita:['pila'],
             alHacerlo:'La farola vuelve a encenderse.' },
    // y después, lo que de verdad importa
    despues: {
      tipo: 'frase',
      pos: [0.9, 0.9, -2],
      nombre: 'el teléfono',
      pregunta: 'La pantalla está encendida. Hay una conversación a medio empezar.',
      subpregunta: '¿Qué fue lo primero que le dijiste?',
      // acepta cualquier cosa que contenga estas piezas, sin tildes ni mayúsculas
      claves: [['instagram'], ['no quiero nada']],
      alAcertar: 'El primer intercambio vuelve a aparecer.'
    }
  }
},

/* ---------------------------------------------------------- 1 */
{
  id: 'martonela',
  titulo: 'Martonela · Muelle Uno',
  subtitulo: '01 · Un helado y un paseo',
  intro: 'El mostrador está listo, pero el pedido no está escrito en ninguna parte. ' +
         'Tendrás que acordarte.',
  objetivo: 'Sirve los dos sabores de siempre y sal a buscar el mar.',
  pistas: [
    'Uno de los dos lo pides siempre tú.',
    'Son dos, y ninguno es de chocolate.',
    'Turrón y caramelo salado.'
  ],
  recuerdo: 'Compramos helados en Martonela y paseamos por Muelle Uno. ' +
            'Después, aquel lugar también se convirtió en nuestro trabajo.',
  cielo: P.claro,
  materiales: MATERIALES,
  aparicion: [0, 8],
  suelo: { tam: 80, color: 'suelo' },
  piezas: [
    { pos:[0,0,-8], tam:[14,3.4,6], color:'crema' },
    { pos:[0,0,-4.6], tam:[12,1.1,1.0], color:'madera' },       // mostrador
    { pos:[0,3.4,-8], tam:[15,0.3,7], color:'azulado', choca:false },
    { prefab:'mesa', pos:[-5,0,2] },
    { prefab:'mesa', pos:[ 5,0,2] },
    { prefab:'banco', pos:[0,0,5], giro:Math.PI },
    { prefab:'palmera', pos:[-9,0,0], alt:7 },
    { prefab:'palmera', pos:[ 9,0,1], alt:6.2, curva:-0.5 },
    { prefab:'farola', pos:[-6,0,4], encendida:true },
    { prefab:'farola', pos:[ 6,0,4], encendida:true }
  ],
  acertijo: {
    tipo: 'elegir',
    pos: [0, 1.2, -4.6],
    nombre: 'las cubetas',
    pregunta: '¿Cuáles son los dos de siempre?',
    cuantos: 2,
    // PENDIENTE · pon aquí los sabores que tenga la carta de verdad.
    // Cuantos más haya, más mérito tiene acordarse.
    opciones: ['Turrón', 'Caramelo salado', 'Chocolate negro', 'Pistacho',
               'Stracciatella', 'Fresa', 'Limón', 'Tiramisú', 'Nata', 'Mango'],
    correctas: ['Turrón', 'Caramelo salado'],
    alAcertar: 'Dos bolas, la tarrina lista.'
  }
},

/* ---------------------------------------------------------- 2 */
{
  id: 'malagueta',
  titulo: 'La Malagueta',
  subtitulo: '02 · Aprender a mirar',
  intro: 'En el banco hay tres fotos clavadas. Colócate donde se hicieron ' +
         'y recompón el encuadre.',
  objetivo: 'Encuentra los tres encuadres y vuelve al banco.',
  pistas: [
    'Las marcas del suelo son sitios desde los que mirar.',
    'Cada marca apunta a una cosa concreta: el quiosco, la palmera y el horizonte.',
    'Ponte sobre la marca, mira hacia lo que señala y dispara cuando se ilumine.'
  ],
  recuerdo: 'Aquí paseamos y nos sentamos a conocernos mejor. ' +
            'Nuestro banco, el mar delante y una conversación sin prisa.',
  cielo: P.calido,
  materiales: MATERIALES,
  aparicion: [0, 10],
  suelo: { tam: 90, color: 'arena' },
  piezas: [
    { pos:[-16,0,-14], tam:[60,0.3,26], color:'agua', choca:false },   // el mar
    { pos:[-11,0,-3], tam:[4,2.8,3], color:'crema' },                  // quiosco
    { pos:[-11,2.8,-3], tam:[5,0.25,4], color:'toldo', choca:false },
    { prefab:'palmera', pos:[9,0,-4], alt:8 },
    { prefab:'banco', pos:[0,0,4], giro:Math.PI },
    { prefab:'farola', pos:[-5,0,5], encendida:true },
    { prefab:'farola', pos:[ 5,0,5], encendida:true },
    { prefab:'mesa', pos:[2,0,4.6], an:0.8, fo:0.6, alt:0.6 }
  ],
  acertijo: {
    tipo: 'encuadre',
    camara: { pos:[2, 0.75, 4.6], nombre:'la cámara' },
    // PENDIENTE · si tienes tres fotos vuestras de la Malagueta, van aquí
    // como `foto:'media/fotos/....jpg'` y se ven al acertar cada encuadre.
    encuadres: [
      { marca:[-6, 0, 0], mira:[-11, 2, -3],  nombre:'el quiosco' },
      { marca:[ 3, 0, 0], mira:[  9, 5, -4],  nombre:'la palmera' },
      { marca:[ 0, 0, -3], mira:[ -4, 1, -20], nombre:'el horizonte' }
    ],
    volverA: { pos:[0,0,4], nombre:'vuestro banco' },
    alAcertar: 'Encuadre recuperado.'
  }
},

/* ---------------------------------------------------------- 3 */
{
  id: 'yelmo',
  titulo: 'Yelmo · Plaza Mayor',
  subtitulo: '03 · Nuestra próxima sesión',
  intro: 'La sala está esperando. En la pared hay tres carteles, ' +
         'y la pantalla no se enciende hasta que estén en su sitio.',
  objetivo: 'Pon las tres en el orden en que las visteis.',
  pistas: [
    'No es el orden en que están colgadas.',
    'Piensa en cuál fue la primera que visteis juntos.',
    'De la más antigua a la más reciente, de izquierda a derecha.'
  ],
  recuerdo: 'Casi todas las semanas buscamos otra película que ver juntos. ' +
            'Lo especial también puede ser un plan que se repite.',
  cielo: P.malva,
  materiales: MATERIALES,
  aparicion: [0, 9],
  suelo: { tam: 70, color: 'asfalto' },
  piezas: [
    { pos:[0,0,-12], tam:[22,7,1], color:'muro' },
    { pos:[0,1.2,-11.4], tam:[14,6,0.3], color:'crema', choca:false },   // la pantalla
    { pos:[-12,0,-2], tam:[1,5,20], color:'muro' },
    { pos:[ 12,0,-2], tam:[1,5,20], color:'muro' },
    { prefab:'banco', pos:[-4,0,0] }, { prefab:'banco', pos:[0,0,0] }, { prefab:'banco', pos:[4,0,0] },
    { prefab:'banco', pos:[-4,0,3] }, { prefab:'banco', pos:[0,0,3] }, { prefab:'banco', pos:[4,0,3] },
    { prefab:'farola', pos:[-8,0,6], encendida:true, alt:3.4, fuerza:20 },
    { prefab:'farola', pos:[ 8,0,6], encendida:true, alt:3.4, fuerza:20 }
  ],
  acertijo: {
    tipo: 'ordenar',
    pos: [0, 1.4, -10.6],
    nombre: 'los tres carteles',
    pregunta: '¿En qué orden las visteis?',
    // PENDIENTE · las tres películas de verdad, de la primera a la última
    elementos: ['La primera que vimos juntos', 'La del sofá y la manta', 'La última que vimos'],
    alAcertar: 'La sala se ilumina.'
  }
},

/* ---------------------------------------------------------- 4 */
{
  id: 'fratelly',
  titulo: 'Fratelly · El Palo',
  subtitulo: '04 · La música del frío',
  intro: 'Las campanas de la heladería suenan en el orden en que pedís siempre. ' +
         'Repítelo y la máquina se pone en marcha.',
  objetivo: 'Repite vuestro pedido y estabiliza el frío.',
  pistas: [
    'No es un orden cualquiera: es el vuestro.',
    'Primero el tuyo, después el suyo.',
    'Chocolate negro y después Bruce.'
  ],
  recuerdo: 'Chocolate negro y Bruce, el helado de brownie. ' +
            'Dos buenas razones para volver a Fratelly.',
  cielo: P.azul,
  materiales: MATERIALES,
  aparicion: [0, 8],
  suelo: { tam: 70, color: 'suelo' },
  piezas: [
    { pos:[0,0,-7], tam:[12,3.2,5], color:'crema' },
    { pos:[0,0,-4], tam:[10,1.1,0.9], color:'madera' },
    { pos:[0,3.2,-7], tam:[13,0.3,6], color:'rosa', choca:false },
    { prefab:'mesa', pos:[-4,0,1.5] }, { prefab:'mesa', pos:[4,0,1.5] },
    { prefab:'banco', pos:[-4,0,3.2] }, { prefab:'banco', pos:[4,0,3.2] },
    { prefab:'farola', pos:[0,0,5], encendida:true },
    { prefab:'arbol', pos:[-8,0,2], alt:4.5 }, { prefab:'arbol', pos:[8,0,2.5], alt:5 }
  ],
  acertijo: {
    tipo: 'secuencia',
    pos: [0, 1.3, -4],
    nombre: 'las campanas',
    pregunta: 'Tócalas en el orden de siempre.',
    // PENDIENTE · si el orden real es al revés, cámbialo aquí
    campanas: [
      { nombre:'Chocolate negro', color:'#4a2f26' },
      { nombre:'Bruce',           color:'#8d5a3f' },
      { nombre:'Nata',            color:'#e6ddc8' },
      { nombre:'Pistacho',        color:'#6b8a5a' }
    ],
    correcta: [0, 1],
    alAcertar: 'La máquina arranca.'
  }
},

/* ---------------------------------------------------------- 5 */
{
  id: 'mya',
  titulo: 'Mya · Pedregalejo',
  subtitulo: '05 · La mesa está lista',
  intro: 'La comanda está en blanco. Monta el pedido de siempre y ponlo en la plancha.',
  objetivo: 'Prepara vuestro pedido y contrólalo en la plancha.',
  pistas: [
    'Es lo que pedís siempre, sin mirar la carta.',
    'Un plato principal y poco más.',
    'El campero.'
  ],
  recuerdo: 'El amor también tiene una mesa y un pedido favorito.',
  cielo: P.ambar,
  materiales: MATERIALES,
  aparicion: [0, 8],
  suelo: { tam: 70, color: 'suelo' },
  piezas: [
    { pos:[0,0,-8], tam:[13,3.4,5], color:'muro' },
    { pos:[0,0,-5], tam:[11,1.0,1.0], color:'metal', metal:0.6, rugosidad:0.35 },  // plancha
    { pos:[0,3.4,-8], tam:[14,0.3,6], color:'toldo', choca:false },
    { prefab:'mesa', pos:[-4,0,1] }, { prefab:'mesa', pos:[4,0,1] }, { prefab:'mesa', pos:[0,0,3.5] },
    { prefab:'banco', pos:[-4,0,2.6] }, { prefab:'banco', pos:[4,0,2.6] },
    { prefab:'farola', pos:[-7,0,4], encendida:true }, { prefab:'farola', pos:[7,0,4], encendida:true },
    { prefab:'palmera', pos:[10,0,0], alt:6 }
  ],
  acertijo: {
    tipo: 'elegir',
    pos: [0, 1.2, -5],
    nombre: 'la comanda',
    pregunta: '¿Qué pedís siempre?',
    cuantos: 1,
    // PENDIENTE · añade lo que pidáis de verdad, y relleno plausible
    opciones: ['Campero', 'Ensaladilla', 'Pizza', 'Hamburguesa', 'Sardinas', 'Tortilla'],
    correctas: ['Campero'],
    alAcertar: 'A la plancha.',
    // después, el tostado
    despues: {
      tipo: 'medidor',
      nombre: 'la plancha',
      pregunta: 'Párala en su punto.',
      zona: [0.42, 0.68],
      velocidad: 0.55,
      alAcertar: 'En su punto.',
      alFallar: 'Se ha pasado un poco. No pasa nada: otra vez.'
    }
  }
},

/* ---------------------------------------------------------- 6 */
{
  id: 'ibiza',
  titulo: 'El Ibiza verde',
  subtitulo: '06 · La carretera al atardecer',
  intro: 'El coche espera con la llave puesta. Antes de arrancar, pon la emisora.',
  objetivo: 'Pon vuestra canción y conduce hasta el mirador.',
  pistas: [
    'Solo una de las tres es vuestra.',
    'Es la que cantas mal a propósito.',
    'La del medio.'
  ],
  recuerdo: 'Alicia conduce el Seat Ibiza 1.9 de cinco puertas de 2004, verde oscuro. ' +
            'Un paseo tranquilo al atardecer.',
  cielo: P.ambar,
  materiales: MATERIALES,
  aparicion: [0, 7],
  suelo: { tam: 90, color: 'suelo' },
  piezas: [
    { pos:[-30,0,-40], tam:[9,0.12,90], color:'asfalto', choca:false },
    { prefab:'arbol', pos:[-12,0,-6], alt:5 }, { prefab:'arbol', pos:[12,0,-8], alt:5.5 },
    { prefab:'arbol', pos:[-14,0,4], alt:4.5 }, { prefab:'arbol', pos:[14,0,2], alt:5 },
    { prefab:'farola', pos:[-6,0,2], encendida:true }
  ],
  // el coche se construye aparte porque es el centro del capítulo
  coche: { pos:[0, 0, -1], giro: 0, color:'#2f5a3f' },
  acertijo: {
    tipo: 'ordenar',
    pos: [0, 1.1, -1],
    nombre: 'la radio',
    pregunta: 'Tres emisoras. Solo una es vuestra.',
    modo: 'elegirUna',
    // PENDIENTE · pon vuestra canción en el medio y dos plausibles a los lados
    elementos: ['La que ponía la radio siempre', 'NUESTRA CANCIÓN', 'La del anuncio'],
    correcta: 1,
    alAcertar: 'Suena. Arranca el coche.'
  }
},

/* ---------------------------------------------------------- 7 */
{
  id: 'final',
  titulo: 'El mirador',
  subtitulo: '07 · La hora azul',
  intro: 'Seis lámparas alrededor. Cada una espera el cristal de un lugar, ' +
         'y no valen en cualquier orden.',
  objetivo: 'Coloca los seis cristales en orden y abre la carta.',
  pistas: [
    'Las lámparas están en orden, de la primera a la última.',
    'Piensa en cuándo pasó cada cosa, no en el orden en que las jugaste.',
    'De la feria al Ibiza, tal y como ocurrió.'
  ],
  recuerdo: '19 de septiembre de 2025 — 19 de septiembre de 2026. Nuestro primer año.',
  cielo: P.noche,
  materiales: MATERIALES,
  aparicion: [0, 11],
  suelo: { tam: 70, color: 'suelo', humedo: true },
  piezas: [
    { forma:'cilindro', pos:[0,0,0], tam:[3.4,3.8,0.5], color:'muro' },
    { forma:'cilindro', pos:[0,0.5,0], tam:[2.4,2.8,0.4], color:'muro' },
    { prefab:'banco', pos:[-6,0,4], giro:0.5 }, { prefab:'banco', pos:[6,0,4], giro:-0.5 },
    { prefab:'guirnalda', de:[-10,4.4,-6], a:[10,4.4,-6], n:18 }
  ],
  acertijo: {
    tipo: 'colocar',
    lamparas: 6,
    radio: 7,
    // el orden correcto es el cronológico de los lugares
    orden: ['feria','martonela','malagueta','yelmo','fratelly','mya'],
    alAcertar: 'El mirador se enciende.'
  }
}

];

/* ------------------------------------------------------------
   El final
   ------------------------------------------------------------ */
export const FINAL = {
  titulo: 'Una carta para ti',
  texto: NOSOTROS.carta,
  firma: `— ${NOSOTROS.el}`,
  fecha: '19 · 09 · 2026'
};
