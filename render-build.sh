#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing backend dependencies..."
cd Backend
npm install --no-optional
npm install dotenv --save
echo "Backend dependencies installed successfully." 