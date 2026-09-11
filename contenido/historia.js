/* ============================================================================
 *  NUESTRA HISTORIA  ·  archivo de contenido
 * ----------------------------------------------------------------------------
 *  ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS TOCAR.
 *
 *  Todo lo que hay aquí es contenido de ejemplo para que el juego funcione
 *  desde el primer momento y puedas ver cómo queda cada pieza. Ve sustituyendo
 *  los textos por los vuestros.
 *
 *  Reglas básicas para no romper nada:
 *    · Todo texto va entre comillas dobles: "así"
 *    · Cada elemento de una lista termina en coma, menos el último
 *    · Si un texto lleva comillas dentro, escríbelas así: \"
 *    · Los acentos y las eñes funcionan sin problema
 *
 *  Si algo se rompe, el juego te avisará en pantalla diciéndote qué capítulo
 *  tiene el fallo.
 * ==========================================================================*/

const HISTORIA = {

  /* ==========================================================================
   *  1. AJUSTES GENERALES
   * ======================================================================== */
  config: {
    nombreElla:   "Laura",            // <<< el nombre de ella
    nombreEl:     "Jesús",            // <<< tu nombre
    titulo:       "Nuestra Historia", // título que aparece en la portada
    subtitulo:    "un viaje en siete recuerdos",
    dedicatoria:  "Para ti, que eres el sitio al que siempre vuelvo.",

    // Texto del botón para empezar
    textoEmpezar: "Empezar",

    // Nombre con el que se guarda la partida (no lo cambies una vez se lo des)
    partida: "nuestra-historia-v1",

    // El juego se recorre andando por un mundo en 3D, en primera persona.
    // Si el móvil o el ordenador no puede con el 3D, se pasa solo a las
    // pantallas en 2D sin perder nada. Ponlo en false para forzar el 2D.
    mundo3d: true,

    // Si lo pones en true, se puede saltar cualquier acertijo tras muchos
    // intentos fallidos. Recomendado dejarlo en true: es un regalo, no un examen.
    permitirRendirse: true,

    // Número de fallos antes de ofrecer cada ayuda
    fallosParaPista:     2,
    fallosParaRendirse:  6
  },


  /* ==========================================================================
   *  2. PRÓLOGO  ·  lo primero que lee al abrir el juego
   *  Cada línea de la lista aparece escribiéndose sola, una detrás de otra.
   * ======================================================================== */
  prologo: {
    escena: { tipo: "cielo", momento: "amanecer", clima: "estrellas" },
    musica: "",                       // ej: "media/musica/intro.mp3"
    lineas: [
      "Hay historias que no caben en una foto.",
      "Ni en un mensaje. Ni en una canción.",
      "",
      "Esta es una de esas.",
      "",
      "Delante de ti hay siete lugares.",
      "En cada uno hay algo escondido que solo tú sabrías encontrar.",
      "",
      "Ve despacio. No hay prisa.",
      "Cuando llegues al final lo vas a entender todo."
    ],
    // Texto del botón que abre el primer capítulo
    boton: "Abrir el primer recuerdo"
  },


  /* ==========================================================================
   *  3. CAPÍTULOS  ·  el corazón del juego
   *
   *  Cada capítulo es un lugar real vuestro. Puedes poner los que quieras:
   *  añade o quita bloques { ... } de esta lista.
   *
   *  ESCENA (el paisaje de fondo, se dibuja solo):
   *    tipo:    ciudad · playa · montana · campo · bosque · pueblo ·
   *             carretera · parque · interior · lago · cielo
   *    momento: amanecer · dia · atardecer · noche
   *    clima:   despejado · lluvia · nieve · petalos · estrellas ·
   *             luciernagas · niebla
   *    foto:    (opcional) "media/fotos/loquesea.jpg" -> si la pones, se usa
   *             la foto real de fondo en lugar del dibujo
   *
   *  ACERTIJO (tipos disponibles — hay un ejemplo de cada uno más abajo):
   *    texto · opcion · fecha · codigo · orden · parejas · relacionar ·
   *    mapa · puzzle
   *
   *  FRAGMENTO: la letra que este capítulo aporta al mensaje final.
   *  Leídas en orden, las letras de todos los capítulos forman la clave
   *  que abre el final. (Mira el apartado 4).
   * ======================================================================== */
  capitulos: [

    /* ---------------------------------------------------------------- 1 --- */
    {
      id: "donde-empezo",
      titulo: "Donde empezó todo",
      lugar: "La primera vez que te vi",
      fecha: "",                      // opcional, sale como sello en la esquina

      escena: { tipo: "ciudad", momento: "atardecer", clima: "despejado" },
      musica: "",                     // ej: "media/musica/capitulo-1.mp3"

      intro: [
        "Todo tiene un principio, aunque casi nunca te das cuenta cuando está pasando.",
        "Yo sí me di cuenta. Tarde, pero me di cuenta.",
        "Vamos a volver allí."
      ],

      acertijo: {
        tipo: "texto",
        pregunta: "¿En qué sitio nos vimos por primera vez?",
        placeholder: "escribe el lugar",
        respuestas: ["la cafetería", "cafeteria", "la cafeteria"],  // <<< todas las formas válidas
        pistas: [
          "Había demasiada gente y demasiado ruido.",
          "Tú pediste algo caliente. Yo no me acuerdo de lo que pedí, solo de ti."
        ]
      },

      recuerdo: {
        titulo: "El principio",
        texto: "Me acuerdo de la ropa que llevabas. Me acuerdo de que te reíste de algo que dije y pensé que ojalá se repitiera. Y mira.",
        cita: "\"¿Tú siempre hablas tanto?\"",   // una frase o broma vuestra
        foto: ""                                  // ej: "media/fotos/primera-vez.jpg"
      },

      fragmento: "S"
    },

    /* ---------------------------------------------------------------- 2 --- */
    {
      id: "primera-cita",
      titulo: "La primera vez que fue una cita",
      lugar: "Aquella tarde",
      fecha: "",

      escena: { tipo: "parque", momento: "dia", clima: "petalos" },
      musica: "",

      intro: [
        "Hubo un día en el que dejó de ser casualidad.",
        "Los dos lo sabíamos y ninguno lo dijo."
      ],

      acertijo: {
        tipo: "fecha",
        pregunta: "¿Qué día fue?",
        respuesta: { dia: 14, mes: 3, anio: 2021 },   // <<< vuestra fecha real
        anioDesde: 2015,
        anioHasta: 2026,
        pistas: [
          "Fue en primavera.",
          "Lo tienes marcado en el móvil desde entonces."
        ]
      },

      recuerdo: {
        titulo: "El día que cuenta",
        texto: "Desde ese día empezamos a contar. Todo lo de antes era el borrador.",
        cita: "",
        foto: ""
      },

      fragmento: "I"
    },

    /* ---------------------------------------------------------------- 3 --- */
    {
      id: "nuestra-cancion",
      titulo: "Lo que sonaba de fondo",
      lugar: "En el coche, siempre",
      fecha: "",

      escena: { tipo: "carretera", momento: "noche", clima: "estrellas" },
      musica: "",

      intro: [
        "Hay una canción que ya no es de quien la escribió.",
        "Es nuestra. La secuestramos."
      ],

      acertijo: {
        tipo: "opcion",
        pregunta: "¿Cuál de estas es nuestra canción?",
        opciones: [                         // <<< pon una verdadera y tres falsas
          "La que ponías tú siempre",
          "La que sonó aquella noche",
          "La que te cantaba mal a propósito",
          "La del anuncio que odiabas"
        ],
        correcta: 2,                        // <<< posición de la buena (1, 2, 3 o 4)
        pistas: [
          "Me la sé entera y la canto fatal.",
          "Te da vergüenza que la ponga cuando hay gente delante."
        ]
      },

      recuerdo: {
        titulo: "Banda sonora",
        texto: "La ponemos y volvemos. No importa dónde estemos.",
        cita: "",
        foto: ""
      },

      fragmento: "E"
    },

    /* ---------------------------------------------------------------- 4 --- */
    {
      id: "el-viaje",
      titulo: "El viaje",
      lugar: "Lejos de casa",
      fecha: "",

      escena: { tipo: "playa", momento: "atardecer", clima: "despejado" },
      musica: "",

      intro: [
        "Nos fuimos sin saber muy bien a qué.",
        "Volvimos sabiendo perfectamente a qué."
      ],

      acertijo: {
        tipo: "orden",
        pregunta: "Ordena aquel día como pasó de verdad.",
        elementos: [                        // <<< en el ORDEN CORRECTO; el juego los baraja
          "Nos perdimos buscando el sitio",
          "Comimos fatal y nos dio igual",
          "Aquella foto en la que salimos horribles",
          "Nos quedamos hasta que se hizo de noche"
        ],
        pistas: [
          "Empieza por lo que nos pasó nada más llegar."
        ]
      },

      recuerdo: {
        titulo: "Aquel día entero",
        texto: "No salió nada según el plan y fue de los mejores días de mi vida.",
        cita: "",
        foto: ""
      },

      fragmento: "M"
    },

    /* ---------------------------------------------------------------- 5 --- */
    {
      id: "nuestras-cosas",
      titulo: "Nuestras cosas",
      lugar: "El idioma que inventamos",
      fecha: "",

      escena: { tipo: "interior", momento: "noche", clima: "despejado" },
      musica: "",

      intro: [
        "Con el tiempo empezamos a hablar raro.",
        "Palabras que fuera de aquí no significan nada.",
        "Y aquí lo significan todo."
      ],

      acertijo: {
        tipo: "relacionar",
        pregunta: "Une cada frase con lo que quiere decir de verdad.",
        parejas: [                          // <<< vuestras bromas internas
          { a: "\"Estoy bien\"",            b: "Ven aquí ahora mismo" },
          { a: "\"Haz tú lo que quieras\"", b: "Ni se te ocurra" },
          { a: "\"Cinco minutos\"",         b: "Media hora mínimo" },
          { a: "\"Ya cenamos algo\"",       b: "Pizza otra vez" }
        ],
        pistas: [
          "Piensa en lo que dices tú, no en lo que digo yo."
        ]
      },

      recuerdo: {
        titulo: "Idioma propio",
        texto: "Nadie más entiende cómo hablamos y esa es exactamente la gracia.",
        cita: "",
        foto: ""
      },

      fragmento: "P"
    },

    /* ---------------------------------------------------------------- 6 --- */
    {
      id: "lo-dificil",
      titulo: "La parte difícil",
      lugar: "Aquella época",
      fecha: "",

      escena: { tipo: "montana", momento: "amanecer", clima: "niebla" },
      musica: "",

      intro: [
        "No todo fue bonito y no quiero hacer como que sí.",
        "Hubo una temporada complicada.",
        "Pero la parte que importa es que seguimos aquí."
      ],

      acertijo: {
        tipo: "codigo",
        pregunta: "Marca la fecha que lo cambió todo.",
        subtitulo: "cuatro cifras",
        longitud: 4,
        respuesta: "1403",                  // <<< por ejemplo día y mes: 14/03
        pistas: [
          "Día y mes, sin barra.",
          "Es la fecha que ya has escrito antes en este juego."
        ]
      },

      recuerdo: {
        titulo: "Lo que aguantó",
        texto: "Cualquiera está bien cuando todo va bien. Nosotros estuvimos bien cuando no lo iba.",
        cita: "",
        foto: ""
      },

      fragmento: "R"
    },

    /* ---------------------------------------------------------------- 7 --- */
    {
      id: "hoy",
      titulo: "Hoy",
      lugar: "Aquí",
      fecha: "",

      escena: { tipo: "campo", momento: "atardecer", clima: "luciernagas" },
      musica: "",

      intro: [
        "Y llegamos a hoy.",
        "Que es el sitio donde quiero quedarme."
      ],

      acertijo: {
        tipo: "parejas",
        pregunta: "Encuentra las parejas.",
        subtitulo: "cada carta tiene su mitad",
        parejas: [                          // <<< cosas que van juntas para vosotros
          { a: "Café",        b: "Sin azúcar" },
          { a: "Domingo",     b: "Sofá" },
          { a: "Tú",          b: "Yo" },
          { a: "Verano",      b: "Playa" }
        ],
        pistas: [
          "Dale la vuelta a dos cartas y acuérdate de dónde están."
        ]
      },

      recuerdo: {
        titulo: "Ahora",
        texto: "Aquí es donde estamos. Y desde aquí se ve bastante bien el futuro.",
        cita: "",
        foto: ""
      },

      fragmento: "E"
    }

  ],


  /* ==========================================================================
   *  4. EL FINAL
   *
   *  Al acabar todos los capítulos, ella tendrá las letras de los fragmentos.
   *  Leídas en orden forman la CLAVE. En el ejemplo:
   *      S · I · E · M · P · R · E   ->   "SIEMPRE"
   *
   *  Cambia las letras de cada capítulo y la clave de aquí para que formen
   *  la palabra que tú quieras (un sitio, una fecha, una pregunta...).
   * ======================================================================== */
  final: {
    escena: { tipo: "cielo", momento: "noche", clima: "estrellas" },
    musica: "",                        // la canción importante va aquí

    // Pantalla del candado final
    tituloCandado: "Una última cosa",
    textoCandado: [
      "Cada recuerdo te ha dado una letra.",
      "Ponlas en orden."
    ],
    clave: "SIEMPRE",                  // <<< debe coincidir con los fragmentos
    pistaClave: "Es lo que te contesto siempre que me preguntas cuánto.",

    // La carta final. Cada línea se escribe sola, despacio.
    titulo: "Para ti",
    carta: [
      "Si has llegado hasta aquí es que te has acordado de todo.",
      "",
      "No sé hacer regalos caros y tampoco sé escribir bonito,",
      "así que he hecho lo único que sé hacer: esto.",
      "",
      "Cada sitio por el que has pasado existe.",
      "Cada frase la hemos dicho.",
      "Cada recuerdo es verdad.",
      "",
      "Lo he hecho entero pensando en ti,",
      "porque no podría habérselo hecho a nadie más.",
      "",
      "Gracias por todo lo de antes.",
      "Y sobre todo por todo lo que queda."
    ],
    firma: "Te quiero.",
    foto: "",                          // una foto vuestra para el cierre

    // (Opcional) Un regalo real escondido detrás de la carta.
    // Si no quieres usarlo, pon mostrar: false
    regalo: {
      mostrar: true,
      boton: "Todavía hay una cosa más",
      titulo: "Tu regalo de verdad",
      texto: "Mira debajo de la almohada.",
      foto: ""
    }
  }
};
