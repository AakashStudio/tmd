const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Parse clean URL path
  let parsedUrl = req.url.split('?')[0];
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${parsedUrl}`);

  if (parsedUrl === '/' || parsedUrl === '') {
    parsedUrl = '/index.html';
  } else if (!path.extname(parsedUrl)) {
    // Check if .html exists for clean URL like /sample-3
    if (fs.existsSync(path.join(BASE_DIR, parsedUrl + '.html'))) {
      parsedUrl = parsedUrl + '.html';
    }
  }

  const filePath = path.join(BASE_DIR, parsedUrl);

  // Security check to stay inside BASE_DIR
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + parsedUrl);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Fast caching for static assets/images, dynamic for HTML
    const isAsset = ['.webp', '.png', '.jpg', '.svg', '.ico', '.css', '.js'].includes(ext);
    const cacheHeader = isAsset
      ? 'public, max-age=86400, stale-while-revalidate=604800'
      : 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheHeader
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Pinnacle Server running at:`);
  console.log(`- http://localhost:${PORT}/sample-3.html`);
  console.log(`- http://127.0.0.1:${PORT}/sample-3.html`);
});
