#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Change to the Backend directory and stay there for all commands
cd Backend
echo "Changed to Backend directory: $(pwd)"

# Clean up
echo "Cleaning up any existing package-lock.json..."
rm -f package-lock.json

# Install all dependencies from package.json
echo "Installing ALL dependencies from Backend/package.json..."
npm cache clean --force
npm install

# List installed modules to verify
echo "Installed modules in Backend/node_modules:"
ls -la node_modules | head -n 10
echo "..."

# Verify specific key packages are installed
if [ -d "node_modules/express" ]; then
  echo "Express package installed successfully"
else
  echo "Express package missing, installing it directly..."
  npm install express --save
fi

if [ -d "node_modules/rootpath" ]; then
  echo "Rootpath package installed successfully"
else
  echo "Rootpath package missing, installing it directly..."
  npm install rootpath --save
fi

echo "All dependencies have been installed in Backend/node_modules"
echo "Build completed successfully" 