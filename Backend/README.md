# Backend Part A: Core & Authentication

## Responsibility

This component is responsible for:

1. **Core Backend Setup**
   - Server configuration
   - Database connections
   - Middleware setup
   - Error handling

2. **Authentication**
   - User login/logout
   - JWT token management
   - Password hashing
   - Session handling

3. **Account Management**
   - User registration
   - Account verification
   - Password reset
   - Account updates

4. **Security**
   - Authorization middleware
   - Role-based access control
   - Request validation

## Key Files & Directories

These files and directories from the main project would be part of this component:

### Core Setup
- `Backend/server.js` - Main server file
- `Backend/config.json` - Server configuration
- `Backend/_helpers/` - Helper functions
- `Backend/_middleware/` - Middleware components

### Authentication
- `Backend/accounts/account.model.js` - Account model
- `Backend/accounts/account.service.js` - Account service
- `Backend/accounts/accounts.controller.js` - Account controller
- `Backend/accounts/refresh-token.model.js` - Refresh token model

### Security
- `Backend/_middleware/authorize.js` - Authorization middleware
- `Backend/_middleware/validate-request.js` - Request validation
- `Backend/_middleware/error-handler.js` - Error handling

## Development Guidelines

1. Follow security best practices for authentication
2. Implement proper error handling and logging
3. Ensure efficient database queries
4. Document API endpoints thoroughly
5. Write unit tests for critical functions 

## Deployment to Render

This backend is configured for deployment to Render:

1. The render.yaml file in the root directory contains the deployment configuration
2. Environment variables are managed through .env locally and in Render dashboard
3. Database connection settings for the production MySQL database are included
4. Security credentials are handled through Render's environment variable management

### Deployment Steps

1. Push code to GitHub
2. Connect to Render and select the repository
3. Render will detect the render.yaml configuration
4. Add any missing environment variables (especially DB_PASSWORD)
5. Deploy the service

### Environment Variables

The following environment variables can be configured:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret for JWT tokens
- `EMAIL_FROM` - Email sender address
- `SMTP_HOST` - SMTP server
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password 