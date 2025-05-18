// Configuration helper that processes environment variables
const fs = require('fs');
const path = require('path');

// Load raw config
const configPath = path.join(__dirname, '../config.json');
const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Process environment variables
function processConfigValue(value) {
  if (typeof value !== 'string') return value;
  
  // If the value contains a template literal pattern, process it
  if (value.includes('${') && value.includes('}')) {
    // Extract the environment variable name and default value
    const match = value.match(/\${([^}|]*)\s*\|\|\s*['"]?([^'"}\s]*)['"]?}/);
    if (match) {
      const envVar = match[1].trim();
      const defaultValue = match[2].trim();
      
      // Return environment variable value or default
      return process.env[envVar] || defaultValue;
    }
  }
  
  return value;
}

// Process all config values recursively
function processConfig(obj) {
  const result = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = processConfig(obj[key]);
    } else {
      result[key] = processConfigValue(obj[key]);
    }
  }
  
  return result;
}

// Process and export the configuration
const config = processConfig(rawConfig);

// Type conversion for port values
if (config.database && config.database.port) {
  config.database.port = parseInt(config.database.port, 10);
}
if (config.smtpOptions && config.smtpOptions.port) {
  config.smtpOptions.port = parseInt(config.smtpOptions.port, 10);
}

// For debugging
console.log('Processed configuration:');
console.log('Database host:', config.database.host);
console.log('Database port:', config.database.port);
console.log('Database user:', config.database.user);
console.log('Database name:', config.database.database);

module.exports = config; 