const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const targetDomain = "http://bruce.local";
const bruceUsername = "admin";
const brucePassword = "bruce";

// Get folder from command line argument, default to 'interface'
let folder = process.argv[2] || 'interface';

// Prevent using 'backend' as the main folder
if (folder === 'backend') {
  console.error("Error: 'backend' folder is not allowed as the main folder.");
  process.exit(1);
}

// Check if the folder exists
const mainFolderPath = path.join(__dirname, folder);
if (!fs.existsSync(mainFolderPath) || !fs.statSync(mainFolderPath).isDirectory()) {
  console.error(`Error: Folder '${folder}' does not exist.`);
  process.exit(1);
}

const minify = {
  html: function (content) {
    // Remove leading/trailing whitespace from each line
    let lines = content.split('\n').map(line => line.trim());
    // Collapse multiple spaces in each line
    lines = lines.map(line => line.replace(/\s{2,}/g, ' '));
    // (Optional) Remove empty lines: lines = lines.filter(line => line);
    // Join lines with newline (keep new lines)
    content = lines.join('\n');
    return content;
  },
  css: function (content) {
    let lines = content.split('\n').map(line => line.trim());
    lines = lines.map(line => line.replace(/\s{2,}/g, ' '));
    content = lines.join('\n');
    return content;
  },
  js: function (content) {
    let lines = content.split('\n').map(line => line.trim());
    lines = lines.map(line => line.replace(/\s{2,}/g, ' '));
    content = lines.join('\n');
    return content;
  }
};

http.createServer((req, res) => {
  if (targetDomain && req.url.startsWith('/bruce/')) {
    let realUrl = req.url.replace('/bruce/', '/');
    const url = new URL(targetDomain + realUrl);

    // Clone headers and add Authorization
    const headers = Object.assign({}, req.headers);
    const auth = Buffer.from(`${bruceUsername}:${brucePassword}`).toString('base64');
    headers['authorization'] = `Basic ${auth}`;

    console.log(`Proxying request to: ${url.href} [${req.method}]`);
    const proxyReq = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: req.method,
      headers: headers,
    }, proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', err => {
      res.writeHead(502, {'Content-Type': 'text/plain'});
      res.end('Proxy error: ' + err.message);
    });

    // Pipe the request body to the proxy request
    req.pipe(proxyReq, { end: true });
    return;
  }

  const urlPath = req.url.split('?')[0];
  const decodedPath = decodeURIComponent(urlPath);

  // Possible base directories to check
  const bases = [
    mainFolderPath,
    path.join(__dirname, 'backend'),
    __dirname
  ];

  // Try to find the file in the bases
  let filePath;
  let found = false;
  for (const baseDir of bases) {
    let tryPath = path.join(baseDir, decodedPath);
    if (tryPath.endsWith(path.sep)) tryPath += 'index.html';
    if (fs.existsSync(tryPath) && fs.statSync(tryPath).isFile()) {
      filePath = tryPath;
      found = true;
      break;
    }
  }

  if (!found) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('404 Not Found');
    return;
  }

  console.log(`Request for: ${filePath}`);
  // Basic MIME type mapping
  const ext = path.extname(filePath).toLowerCase();
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  }[ext] || 'application/text';

  res.writeHead(200, {'Content-Type': mime});

  // Minify HTML, CSS, JS before serving
  if (ext === '.html' || ext === '.css' || ext === '.js') {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Internal Server Error');
        return;
      }
      let minified = data;
      if (ext === '.html') minified = minify.html(data);
      else if (ext === '.css') minified = minify.css(data);
      else if (ext === '.js') minified = minify.js(data);
      res.end(minified, 'utf8');
    });
  } else {
    fs.createReadStream(filePath).pipe(res);
  }
}).listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}/`);
  console.log(`Serving from folder: ${folder}`);
});