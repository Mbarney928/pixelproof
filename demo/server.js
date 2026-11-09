// Serves the demo site twice: /v1/ is release 1 (the baseline), /v2/ is release 2 with regressions.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./site/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };

export function createDemoServer() {
  return createServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    const match = /^\/v[12](\/.*)$/.exec(pathname);
    const rel = normalize(match?.[1] === '/' ? '/index.html' : (match?.[1] ?? '/missing'));
    const file = join(ROOT, rel);
    // Refuse anything that would escape the site folder.
    if (!match || !file.startsWith(ROOT) || rel.split(sep).includes('..')) {
      res.writeHead(404).end('Not found');
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
}

export async function startDemoServer(port = 4310) {
  const server = createDemoServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { server, url: `http://127.0.0.1:${port}` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { url } = await startDemoServer(Number(process.env.PORT ?? 4310));
  console.log(`Demo site: ${url}/v1/ (release 1) and ${url}/v2/ (release 2)`);
}
