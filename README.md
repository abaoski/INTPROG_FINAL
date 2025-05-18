# INTPROG FINAL PROJECT
## IT-INTPROG32- 16543

# **Members:** 
## ** FRONTEND **
### **Group Leader : Christopher Aron P. Abao**
#### **Andrian S. Balberos**
## ** BACKEND **
#### **Shekainah P. Gaceta**
#### **Jun-del S. Patuasic**

## Deployment to Render (Backend Only)

This project is configured to deploy only the backend API to Render. To deploy:

1. Push this repository to GitHub.

2. On Render dashboard:
   - Go to https://dashboard.render.com/
   - Click "New+" and select "Blueprint"
   - Connect your GitHub repository
   - Render will detect the render.yaml configuration file
   - Click "Apply"

3. Database configuration:
   - The MySQL database credentials are already configured in the render.yaml
   - For security, you'll need to add the DB_PASSWORD in the Render dashboard
   - Host: 153.92.15.31
   - Database: u875409848_abao
   - User: u875409848_abao

4. Access your API:
   - After deployment, your API will be available at https://backend-api.onrender.com/
   - Swagger documentation will be at https://backend-api.onrender.com/api-docs

## Local Development

1. Clone the repository
2. Install backend dependencies: `cd Backend && npm install`
3. Start backend development server: `cd Backend && npm run start:dev`
