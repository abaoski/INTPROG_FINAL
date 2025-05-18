// Script to install dependencies after deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting dependency installation process...');

// Create a directory to store logs
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log helper function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(message);
  
  // Append to log file
  fs.appendFileSync(path.join(logsDir, 'install.log'), logMessage);
}

// Run command helper
function runCommand(command) {
  log(`Running command: ${command}`);
  try {
    const output = execSync(command, { stdio: 'pipe' }).toString();
    log(`Command output: ${output}`);
    return output;
  } catch (error) {
    log(`Error running command: ${error.message}`);
    log(`Error output: ${error.stderr ? error.stderr.toString() : 'No stderr'}`);
    return null;
  }
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  log('node_modules already exists, checking contents...');
  const files = fs.readdirSync(nodeModulesPath);
  log(`node_modules contains ${files.length} entries`);
  
  // Check if express exists
  if (files.includes('express')) {
    log('Express module found');
  } else {
    log('Express module not found, installing express...');
    runCommand('npm install express');
  }
} else {
  log('node_modules directory not found, installing all dependencies...');
  runCommand('npm install');
}

// Check dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  log('Verifying dependencies from package.json...');
  for (const dep in packageJson.dependencies) {
    const depPath = path.join(nodeModulesPath, dep);
    if (fs.existsSync(depPath)) {
      log(`✓ ${dep}`);
    } else {
      log(`✗ ${dep} - missing, installing...`);
      runCommand(`npm install ${dep}`);
    }
  }
} catch (error) {
  log(`Error checking package.json: ${error.message}`);
}

log('Dependency installation process complete');

// Output environment info
log('=== Environment Information ===');
log(`Node version: ${process.version}`);
log(`NPM version: ${runCommand('npm -v')}`);
log(`Current directory: ${__dirname}`);
log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Output successful message
log('Installation script completed successfully'); 