/* Genera «La-hora-azul.html»: el juego entero en un solo archivo, para
   poder abrirlo con doble clic sin servidor y sin Node instalado.

   El fuente de verdad sigue siendo esta carpeta. Esto es solo la copia
   de regalo: cuando cambies algo en contenido/historia.js, vuelve a
   ejecutar «node EMPAQUETAR.mjs» y se rehace.                        */
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/* Normalmente la carpeta del juego es la de este archivo; se puede pasar
   otra como argumento para ejecutarlo desde fuera. */
const raiz = process.argv[2]
  ? process.argv[2].replace(/\/?$/, '/')
  : fileURLToPath(new URL('./', import.meta.url));

/* «three» y «three/addons/…» son nombres inventados por el importmap:
   aquí hay que traducirlos a archivos de verdad. */
const traducirTres = {
  name: 'tres',
  setup(b) {
    b.onResolve({ filter: /^three$/ },        () => ({ path: raiz + 'vendor/three.module.js' }));
    b.onResolve({ filter: /^three\/addons\// }, (a) =>
      ({ path: raiz + 'vendor/jsm/' + a.path.slice('three/addons/'.length) }));
  }
};

const r = await build({
  entryPoints: [raiz + 'motor/juego.js'],
  bundle: true, format: 'esm', target: 'es2022',
  plugins: [traducirTres], write: false, legalComments: 'none'
});
const js = r.outputFiles[0].text;

const css  = await readFile(raiz + 'estilo.css', 'utf8');
let   html = await readFile(raiz + 'index.html', 'utf8');

html = html.replace('<link rel="stylesheet" href="estilo.css">',
                    '<style>\n' + css + '\n</style>');
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>\n?/, '');
html = html.replace(/<script type="module">[\s\S]*?<\/script>/,
  '<script type="module">\n' + js + `
/* En bloque y con nombre propio: el código empaquetado tiene sus
   propias variables sueltas y «j» ya estaba cogida. */
{
  const juego = new Juego();
  document.documentElement.style.setProperty('--escala', juego.estado.ajustes.texto);
  juego.render.ponerCalidad(juego.estado.ajustes.calidad);
  juego.arrancar();
  window.__juego = juego;
}
</script>`);

/* Un aviso por si alguien lo edita creyendo que es el fuente. */
html = html.replace('<head>', `<head>
<!-- Generado por EMPAQUETAR.mjs. No edites este archivo: los cambios se
     pierden al regenerarlo. El fuente está en la carpeta del juego. -->`);

await writeFile(raiz + 'La-hora-azul.html', html);
console.log('La-hora-azul.html ·', (html.length / 1024 / 1024).toFixed(2), 'MB');
