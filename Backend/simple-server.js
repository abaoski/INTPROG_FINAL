// Simple express server as a fallback
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Simple status endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Server is running',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Database info endpoint
app.get('/db-info', (req, res) => {
  res.json({
    host: process.env.DB_HOST || '153.92.15.31',
    database: process.env.DB_NAME || 'u875409848_balberos',
    user: process.env.DB_USER || 'u875409848_balberos'
  });
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Simple server is running on port ${port}`);
}); 