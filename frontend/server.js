const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const HOSTNAME = 'localhost';

const server = http.createServer((req, res) => {
  // Parse URL to remove query parameters
  const urlWithoutQuery = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlWithoutQuery);
  
  // Default to form-home.html if root is requested
  if (urlWithoutQuery === '/') {
    filePath = path.join(__dirname, 'form/form-home.html');
  }

  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`🚀 Node.js Server running at http://${HOSTNAME}:${PORT}/`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`✅ Press Ctrl+C to stop the server`);
});
