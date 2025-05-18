// Load environment variables from .env file
try {
    require('dotenv').config();
    console.log('Environment loaded from .env file');
} catch (err) {
    console.log('dotenv not available, using environment variables from system');
}

// Load rootpath
try {
    require('rootpath')();
    console.log('Rootpath loaded successfully');
} catch (err) {
    console.log('rootpath not available, using relative paths');
    // Set up a simple alternative to rootpath
    global.__basedir = __dirname;
}

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

// Handle require for middleware
let errorHandler;
try {
    errorHandler = require('_middleware/error-handler');
} catch (err) {
    console.log('Error loading error-handler from _middleware, trying relative path');
    try {
        errorHandler = require('./_middleware/error-handler');
    } catch (innerErr) {
        console.log('Failed to load error-handler, using default error handler');
        errorHandler = (err, req, res, next) => {
            console.error(err);
            const status = err.statusCode || 500;
            const message = err.message || 'Internal Server Error';
            res.status(status).json({ message });
        };
    }
}

// Only disable SSL verification in development
if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
});

// Define the path to frontend build based on environment
const frontendPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '../Frontend/dist/frontend')
    : path.join(__dirname, '../frontend/dist/frontend');

// Serve static files from the Angular app
app.use(express.static(frontendPath));

// allow cors requests from any origin and with credentials
app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'Cookie', 'X-Requested-With', 'pragma']
}));

// Function to safely require modules
function safeRequire(modulePath, alternativePath) {
    try {
        return require(modulePath);
    } catch (err) {
        console.log(`Error loading ${modulePath}, trying alternative path`);
        try {
            return require(alternativePath);
        } catch (innerErr) {
            console.log(`Failed to load ${alternativePath}, route will not be available`);
            return (req, res) => res.status(503).json({ message: 'Service unavailable' });
        }
    }
}

// api routes
try {
    app.use('/accounts', safeRequire('./accounts/accounts.controller', './accounts/accounts.controller'));
    app.use('/employees', safeRequire('./accounts/employees.controller', './accounts/employees.controller'));
    app.use('/requests', safeRequire('./accounts/requests.controller', './accounts/requests.controller'));
    app.use('/departments', safeRequire('./accounts/departments.controller', './accounts/departments.controller'));
    app.use('/workflows', safeRequire('./accounts/workflow.controller', './accounts/workflow.controller'));
} catch (err) {
    console.error('Error setting up API routes:', err);
}

// Add 404 handler for debugging
app.use((req, res, next) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route not found', url: req.url, method: req.method });
});

// swagger docs route
try {
    app.use('/api-docs', safeRequire('_helpers/swagger', './_helpers/swagger'));
} catch (err) {
    console.log('Swagger documentation not available');
    app.use('/api-docs', (req, res) => res.status(503).json({ message: 'API documentation not available' }));
}

// Send all other requests to the Angular app
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// global error handler
app.use(errorHandler);

// start server
const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 4000);
app.listen(port, '0.0.0.0', () => console.log('Server listening on port ' + port));
