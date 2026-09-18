/* Servidor local mínimo. Sirve esta carpeta en el ordenador.
   Con RED=1 acepta también conexiones del wifi de casa, para
   poder probarlo en el móvil:  RED=1 node SERVIR.mjs           */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const raiz = fileURLToPath(new URL('./', import.meta.url));
const tipos = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.webp':'image/webp', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.txt':'text/plain; charset=utf-8' };
const puerto = Number(process.env.GAME_PORT || 4173);
const abierto = process.env.RED === '1';

const servidor = createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) return res.writeHead(405).end();
    const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const archivo = resolve(raiz, '.' + (ruta === '/' ? '/index.html' : ruta));
    if (!archivo.startsWith(resolve(raiz) + sep)) return res.writeHead(403).end();
    if (!(await stat(archivo)).isFile()) return res.writeHead(404).end();
    const datos = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': tipos[extname(archivo)] || 'application/octet-stream',
      'Content-Length': datos.length, 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : datos);
  } catch { res.writeHead(404).end('No disponible.'); }
});

servidor.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE'
    ? `El puerto ${puerto} está ocupado. Cierra el otro servidor o usa GAME_PORT.`
    : e.message);
  process.exitCode = 1;
});

servidor.listen(puerto, abierto ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`La hora azul:  http://127.0.0.1:${puerto}/`);
  if (abierto) {
    for (const lista of Object.values(networkInterfaces()))
      for (const i of lista || [])
        if (i.family === 'IPv4' && !i.internal)
          console.log(`Desde el móvil: http://${i.address}:${puerto}/`);
    console.log('\nAbierto al wifi de casa. Cierra la ventana para detenerlo.');
  } else {
    console.log('Solo desde este ordenador. Para verlo en el móvil: RED=1 node SERVIR.mjs');
  }
});
