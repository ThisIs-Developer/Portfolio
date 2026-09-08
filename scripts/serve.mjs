import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

export async function startServer({ root = repositoryRoot, port = 4173, host = '127.0.0.1' } = {}) {
  const directory = path.resolve(root);
  if (!(await stat(directory)).isDirectory()) throw new Error(`Not a directory: ${directory}`);
  const [headerText, notFoundPage] = await Promise.all([
    readFile(path.join(directory, '_headers'), 'utf8').catch(() => ''),
    readFile(path.join(directory, '404.html')).catch(() => null),
  ]);
  const headerRules = [];
  let currentRule;
  for (const line of headerText.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim().split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      currentRule = { pattern: new RegExp(`^${pattern}$`), headers: {} };
      headerRules.push(currentRule);
    } else if (currentRule) {
      const separator = line.indexOf(':');
      if (separator > 0) currentRule.headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
  }

  const server = createServer(async (request, response) => {
    const fail = (status, message) => {
      const custom404 = status === 404 && notFoundPage;
      response.writeHead(status, { 'Content-Type': custom404 ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : custom404 || message);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return fail(405, 'Method not allowed');
    }

    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const configuredHeaders = Object.assign({}, ...headerRules.filter(rule => rule.pattern.test(pathname)).map(rule => rule.headers));
      for (const [name, value] of Object.entries(configuredHeaders)) response.setHeader(name, value);
      const segments = pathname.replaceAll('\\', '/').split('/');
      if (pathname.includes('\0') || segments.some(segment => segment.startsWith('.') || segment === 'node_modules')) {
        return fail(403, 'Forbidden');
      }
      let filename = path.resolve(directory, `.${pathname}`);
      const requestedFilename = filename;
      if (filename !== directory && !filename.startsWith(`${directory}${path.sep}`)) return fail(403, 'Forbidden');

      let info;
      try {
        info = await stat(filename);
        if (info.isDirectory()) {
          filename = path.join(filename, 'index.html');
          info = await stat(filename);
        }
      } catch {
        // Cloudflare Pages resolves extensionless HTML routes such as /project.
        if (path.extname(requestedFilename)) return fail(404, 'Not found');
        filename = `${requestedFilename.replace(/[\\/]$/, '')}.html`;
        try { info = await stat(filename); } catch { return fail(404, 'Not found'); }
      }
      if (!info.isFile()) return fail(404, 'Not found');

      const headers = {
        'Content-Type': mimeTypes[path.extname(filename).toLowerCase()] || 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes',
        ...configuredHeaders,
      };
      let start = 0;
      let end = info.size - 1;
      let status = 200;
      if (request.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        if (!match || (!match[1] && !match[2])) return fail(416, 'Unsupported range');
        start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
        if (start > end || start >= info.size) {
          response.setHeader('Content-Range', `bytes */${info.size}`);
          return fail(416, 'Range not satisfiable');
        }
        status = 206;
        headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
        headers['Content-Length'] = end - start + 1;
      }
      response.writeHead(status, headers);
      if (request.method === 'HEAD' || !info.size) return response.end();
      const stream = createReadStream(filename, { start, end });
      stream.on('error', () => response.destroy());
      stream.pipe(response);
    } catch {
      fail(400, 'Invalid request');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  return { server, url: `http://${host}:${server.address().port}`, root: directory };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const port = Number(option('--port', 4173));
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be between 0 and 65535');
  const { server, url, root } = await startServer({ root: path.resolve(option('--dir', repositoryRoot)), port });
  console.log(`Portfolio preview: ${url}\nServing: ${root}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
