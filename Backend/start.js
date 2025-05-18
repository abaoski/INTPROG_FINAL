// Fallback startup script
console.log('Starting backend server with fallback support...');

// First try to start the main server
try {
  console.log('Attempting to start main server.js...');
  require('./server.js');
} catch (error) {
  console.error('Error starting main server:', error);
  
  // If main server fails, try the simple server
  try {
    console.log('Attempting to start simple-server.js...');
    require('./simple-server.js');
  } catch (simpleError) {
    console.error('Error starting simple server:', simpleError);
    console.error('All server startup attempts failed!');
    process.exit(1);
  }
} 