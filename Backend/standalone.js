// Standalone server that installs its own dependencies
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 10000;
let server = null;
let dependenciesInstalled = false;

// Logging
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Check if a module exists
function moduleExists(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (err) {
    return false;
  }
}

// Install dependencies
function installDependencies() {
  if (dependenciesInstalled) return;
  
  log('Starting dependency installation...');
  try {
    // Ensure we're in the right directory
    log(`Current directory: ${process.cwd()}`);
    
    // First check if node_modules exists
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    const hasNodeModules = fs.existsSync(nodeModulesPath);
    log(`node_modules exists: ${hasNodeModules}`);
    
    if (!hasNodeModules || !moduleExists('express')) {
      log('Installing express and core dependencies...');
      execSync('npm install express cors body-parser cookie-parser dotenv rootpath', { 
        cwd: __dirname,
        stdio: 'inherit'
      });
      log('Core dependencies installed.');
      
      // Install other dependencies in the background
      log('Installing remaining dependencies in the background...');
      require('child_process').spawn('npm', ['install'], { 
        cwd: __dirname,
        stdio: 'ignore',
        detached: true 
      }).unref();
    }
    
    dependenciesInstalled = true;
    log('Dependency check/installation complete');
    return true;
  } catch (error) {
    log(`Error installing dependencies: ${error.message}`);
    return false;
  }
}

// Start the real server
function startRealServer() {
  try {
    log('Attempting to start the real server...');
    
    // First try the standard server
    try {
      const express = require('express');
      const app = express();
      
      // Setup basic express config
      app.use(express.json());
      
      // Health check endpoint
      app.get('/', (req, res) => {
        res.json({
          status: 'Express server running',
          time: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        });
      });
      
      // Try to require controllers with error handling
      const controllers = ['accounts', 'employees', 'requests', 'departments', 'workflow'];
      controllers.forEach(controller => {
        try {
          const controllerModule = require(`./accounts/${controller}.controller`);
          app.use(`/${controller}`, controllerModule);
          log(`Loaded controller: ${controller}`);
        } catch (err) {
          log(`Failed to load controller: ${controller}, error: ${err.message}`);
          app.use(`/${controller}`, (req, res) => {
            res.status(503).json({ message: `${controller} service unavailable` });
          });
        }
      });
      
      // Diagnostic endpoint
      app.get('/diagnostic', (req, res) => {
        const modules = ['express', 'cors', 'body-parser', 'cookie-parser', 'dotenv', 'rootpath'];
        const diagnostics = {
          time: new Date().toISOString(),
          node_version: process.version,
          working_directory: process.cwd(),
          modules: {}
        };
        
        modules.forEach(mod => {
          diagnostics.modules[mod] = moduleExists(mod) ? 'loaded' : 'not found';
        });
        
        res.json(diagnostics);
      });
      
      // Fallback for all other routes
      app.use((req, res) => {
        res.status(404).json({ message: 'Route not found' });
      });
      
      // Close the minimal server if it exists
      if (server) {
        server.close();
      }
      
      // Start express server
      const expressServer = app.listen(PORT, '0.0.0.0', () => {
        log(`Express server running on port ${PORT}`);
      });
      
      return expressServer;
    } catch (err) {
      log(`Could not start express server: ${err.message}`);
      throw err;
    }
  } catch (error) {
    log(`Error starting real server: ${error.message}`);
    return null;
  }
}

// Create minimal HTTP server
function createMinimalServer() {
  log('Creating minimal HTTP server...');
  
  const server = http.createServer((req, res) => {
    const url = req.url || '/';
    log(`Received request: ${req.method} ${url}`);
    
    if (url === '/') {
      // Health check
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'Minimal server running',
        message: 'Installing dependencies, please wait...',
        installComplete: dependenciesInstalled,
        time: new Date().toISOString()
      }, null, 2));
    } else if (url === '/install') {
      // Manual dependency installation endpoint
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      // Install dependencies in the background
      installDependencies();
      
      // Start the real server if possible
      if (dependenciesInstalled) {
        startRealServer();
      }
      
      res.end(JSON.stringify({
        status: 'Installation triggered',
        time: new Date().toISOString()
      }, null, 2));
    } else if (url === '/info') {
      // Server info endpoint
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        node: process.version,
        cwd: process.cwd(),
        dirname: __dirname,
        files: fs.readdirSync(__dirname).slice(0, 10),
        env: process.env.NODE_ENV || 'development',
        dependenciesInstalled
      }, null, 2));
    } else {
      // Not found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }, null, 2));
    }
  });
  
  return server;
}

// Main execution
log('Starting standalone server...');

// Create and start minimal server first
server = createMinimalServer();
server.listen(PORT, '0.0.0.0', () => {
  log(`Minimal HTTP server running on port ${PORT}`);
  
  // Install dependencies and then try to start the real server
  if (installDependencies()) {
    const realServer = startRealServer();
    if (realServer) {
      // Real server started successfully, replace our reference
      server = realServer;
    }
  }
}); 