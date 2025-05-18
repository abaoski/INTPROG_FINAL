#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing backend dependencies..."
cd Backend
rm -f package-lock.json
npm cache clean --force
npm install --no-optional
npm install dotenv rootpath express-jwt bcryptjs body-parser cookie-parser cors express joi jsonwebtoken mysql2 nodemailer sequelize swagger-ui-express yamljs --save
echo "Backend dependencies installed successfully." 