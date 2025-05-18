// Import required modules directly
const fs = require('fs');
const path = require('path');

console.log('Starting server with resilient entry point...');

// Check for node_modules existence
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('ERROR: node_modules directory not found');
  console.log('Attempting to install dependencies...');
  require('child_process').execSync('npm install', { stdio: 'inherit' });
}

// List all dependencies to verify installation
console.log('Checking installed dependencies:');
try {
  const deps = require('./package.json').dependencies;
  for (const dep in deps) {
    try {
      require(dep);
      console.log(`✓ ${dep}`);
    } catch (err) {
      console.error(`✗ ${dep} - NOT FOUND`);
    }
  }
} catch (err) {
  console.error('Error checking dependencies:', err);
}

// Start the appropriate server
try {
  console.log('Starting server.js...');
  require('./server');
} catch (err) {
  console.error('Failed to start server.js:', err);
  console.log('Falling back to simple-server.js...');
  
  try {
    require('./simple-server');
  } catch (simpleErr) {
    console.error('Failed to start simple-server.js:', simpleErr);
    
    // Last resort - create a minimal HTTP server
    console.log('Creating minimal HTTP server as last resort...');
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'Minimal server running',
        message: 'Main servers failed to start',
        time: new Date().toISOString()
      }));
    });
    
    const port = process.env.PORT || 10000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`Minimal HTTP server running on port ${port}`);
    });
  }
} 