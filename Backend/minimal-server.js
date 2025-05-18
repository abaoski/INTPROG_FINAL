// Minimal server using only Node.js built-in modules (no dependencies)
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Server configuration
const PORT = process.env.PORT || 10000;

// Debug information
console.log('=== Environment Information ===');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${__dirname}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log('=== Checking file system ===');
console.log('Directory contents:');
try {
  fs.readdirSync(__dirname).forEach(file => {
    console.log(` - ${file}`);
  });
} catch (err) {
  console.error('Error reading directory:', err);
}

// Check for node_modules
console.log('=== Checking Node Modules ===');
try {
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('node_modules directory exists');
    console.log('First 10 entries in node_modules:');
    fs.readdirSync(nodeModulesPath).slice(0, 10).forEach(file => {
      console.log(` - ${file}`);
    });
  } else {
    console.error('ERROR: node_modules directory not found');
  }
} catch (err) {
  console.error('Error checking node_modules:', err);
}

// Helper to run the install-deps script
function runInstallDeps() {
  return new Promise((resolve, reject) => {
    console.log('Running install-deps.js...');
    exec('node install-deps.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running install-deps.js: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        reject(error);
      } else {
        console.log(`Install-deps.js output: ${stdout}`);
        resolve(stdout);
      }
    });
  });
}

// Routes
const routes = {
  '/': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'Minimal server running (no dependencies)',
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      installPath: '/install-deps'
    }, null, 2));
  },
  
  '/info': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      node: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
      dir: __dirname,
      cwd: process.cwd()
    }, null, 2));
  },
  
  '/db': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      host: process.env.DB_HOST || '153.92.15.31',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'u875409848_balberos',
      user: process.env.DB_USER || 'u875409848_balberos'
    }, null, 2));
  },
  
  '/install-deps': async (req, res) => {
    console.log('Received request to install dependencies');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({
      status: 'Installing dependencies...',
      time: new Date().toISOString()
    }, null, 2));
    
    try {
      await runInstallDeps();
      res.end(JSON.stringify({
        status: 'Dependency installation complete',
        time: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      res.end(JSON.stringify({
        status: 'Dependency installation failed',
        error: error.message,
        time: new Date().toISOString()
      }, null, 2));
    }
  }
};

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || '/', true);
  const pathname = parsedUrl.pathname || '/';
  
  console.log(`${new Date().toISOString()} | ${req.method} ${pathname}`);
  
  const routeHandler = routes[pathname];
  if (routeHandler) {
    routeHandler(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal HTTP server running on port ${PORT}`);
}); 