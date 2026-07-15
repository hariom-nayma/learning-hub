const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Parser to clean up LeetCode file names (e.g., 150-EvaluateRPN.md -> 150. Evaluate RPN)
function parseTitle(filename) {
  const baseName = filename.replace(/\.md$/i, '');
  const match = baseName.match(/^(\d+)[-_](.+)$/);
  if (match) {
    const num = match[1];
    const rest = match[2];
    const cleanedName = rest
      .replace(/[-_]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
    return `${num}. ${cleanedName}`;
  }
  if (baseName.toLowerCase() === 'readme') {
    return 'Syllabus & Roadmap Index';
  }
  return baseName.replace(/[-_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Formatter to clean up category directories
function formatCategoryName(dirName) {
  const match = dirName.match(/^(\d+)_(.+)$/);
  if (match) {
    const num = match[1];
    const rest = match[2];
    const cleaned = rest.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    return `Module ${num}: ${cleaned}`;
  }
  return dirName.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Icon mapper based on category and filenames
function selectIcon(category, filename) {
  const name = (category + '/' + filename).toLowerCase();
  if (name.includes('readme') || name.includes('roadmap') || name.includes('syllabus')) return 'fa-map';
  if (name.includes('load_balancer') || name.includes('loadbalancer')) return 'fa-balance-scale';
  if (name.includes('rate_limiter') || name.includes('ratelimiter')) return 'fa-filter';
  if (name.includes('queue') || name.includes('mq')) return 'fa-envelope-open-text';
  if (name.includes('database') || name.includes('db') || name.includes('scaling')) return 'fa-database';
  if (name.includes('cache') || name.includes('caching')) return 'fa-bolt';
  if (name.includes('security') || name.includes('auth') || name.includes('ddos')) return 'fa-shield-alt';
  if (name.includes('hld') || name.includes('fundamentals')) return 'fa-network-wired';
  if (name.includes('lld') || name.includes('principles')) return 'fa-project-diagram';
  if (name.includes('url') || name.includes('shortener')) return 'fa-link';
  if (name.includes('video') || name.includes('streaming') || name.includes('netflix')) return 'fa-video';
  if (name.includes('ride') || name.includes('uber') || name.includes('taxi')) return 'fa-car';
  if (name.includes('food') || name.includes('delivery') || name.includes('swiggy')) return 'fa-utensils';
  if (name.includes('chat') || name.includes('whatsapp') || name.includes('messaging')) return 'fa-comments';
  
  // DSA Patterns
  if (name.includes('array') || name.includes('hashmap') || name.includes('hash')) return 'fa-hashtag';
  if (name.includes('greedy')) return 'fa-lightbulb';
  if (name.includes('stack')) return 'fa-layer-group';
  if (name.includes('queue')) return 'fa-people-arrows';
  if (name.includes('tree') || name.includes('bst')) return 'fa-tree';
  if (name.includes('graph')) return 'fa-circle-nodes';
  if (name.includes('string')) return 'fa-font';
  if (name.includes('binary') || name.includes('search')) return 'fa-magnifying-glass';
  if (name.includes('pointer') || name.includes('two')) return 'fa-arrows-left-right';
  if (name.includes('sliding') || name.includes('window')) return 'fa-sliders';
  if (name.includes('dynamic') || name.includes('dp')) return 'fa-rotate';
  
  return 'fa-file-code';
}

// Crawl subfolders and find all .md files
function scanFolder(folderPath, relativePrefix) {
  if (!fs.existsSync(folderPath)) return [];
  const categories = [];
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  
  // Sort alphabetically and numerically
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const categoryPath = path.join(folderPath, entry.name);
      const files = fs.readdirSync(categoryPath, { withFileTypes: true });
      
      const items = [];
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      for (const file of files) {
        if (file.isFile() && file.name.endsWith('.md')) {
          const filePath = path.join(categoryPath, file.name);
          const relativeFilePath = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
          
          items.push({
            title: parseTitle(file.name),
            path: relativeFilePath,
            icon: selectIcon(entry.name, file.name)
          });
        }
      }
      
      if (items.length > 0) {
        categories.push({
          category: formatCategoryName(entry.name),
          items: items
        });
      }
    }
  }
  return categories;
}

// Generate the complete catalog object
function getCatalog() {
  const dsaPath = path.join(PUBLIC_DIR, 'DSA');
  const sdPath = path.join(PUBLIC_DIR, 'SystemDesign');
  
  const dsaCatalog = scanFolder(dsaPath, 'DSA');
  const sdCatalog = scanFolder(sdPath, 'SystemDesign');
  
  // Check if SystemDesign/README.md exists and add it
  const sdReadmePath = path.join(sdPath, 'README.md');
  if (fs.existsSync(sdReadmePath)) {
    sdCatalog.unshift({
      category: "Roadmap",
      items: [
        { title: "Syllabus & Roadmap Index", path: "SystemDesign/README.md", icon: "fa-map" }
      ]
    });
  }

  return {
    dsa: dsaCatalog,
    systemDesign: sdCatalog
  };
}

const server = http.createServer((req, res) => {
  let safeUrl = decodeURIComponent(req.url.split('?')[0]);
  
  // API route to get catalog data
  if (safeUrl === '/api/catalog') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(getCatalog()));
    return;
  }

  if (safeUrl === '/') {
    safeUrl = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safeUrl);
  const relative = path.relative(PUBLIC_DIR, filePath);

  // Security check to prevent Directory Traversal attacks
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    console.log(`${req.method} ${req.url} -> 403 Forbidden`);
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      console.log(`${req.method} ${req.url} -> 404 Not Found`);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    console.log(`${req.method} ${req.url} -> 200 OK`);

    const stream = fs.createReadStream(filePath);
    stream.on('error', (streamErr) => {
      console.log(`${req.method} ${req.url} -> 500 Server Error`);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Unified DSA & System Design Viewer Server running at http://localhost:${PORT}/`);
});
