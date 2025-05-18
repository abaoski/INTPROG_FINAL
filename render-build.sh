#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "Installing backend dependencies..."
cd Backend

# Ensure .npmrc exists
if [ ! -f ".npmrc" ]; then
  echo "Creating .npmrc file..."
  echo "registry=https://registry.npmjs.org/" > .npmrc
  echo "legacy-peer-deps=true" >> .npmrc
  echo "package-lock=false" >> .npmrc
  echo "save-exact=true" >> .npmrc
  echo "progress=false" >> .npmrc
fi

# Clean up
rm -f package-lock.json
npm cache clean --force

# Install dependencies
echo "Installing dependencies from package.json..."
npm install --no-optional

# Verify key dependencies exist
echo "Verifying express is installed..."
if [ ! -d "node_modules/express" ]; then
  echo "Express not found, installing directly..."
  npm install express --save
fi

echo "Verifying dotenv is installed..."
if [ ! -d "node_modules/dotenv" ]; then
  echo "Dotenv not found, installing directly..."
  npm install dotenv --save
fi

echo "Verifying rootpath is installed..."
if [ ! -d "node_modules/rootpath" ]; then
  echo "Rootpath not found, installing directly..."
  npm install rootpath --save
fi

echo "Backend dependencies installed successfully."
ls -la node_modules | head -n 10
echo "..." 