import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const root = import.meta.dirname;
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

createServer(async (request, response) => {
  const file = join(root, decodeURIComponent(request.url.split('?')[0] === '/' ? '/index.html' : request.url.split('?')[0]));
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': `${mime[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173/'));
