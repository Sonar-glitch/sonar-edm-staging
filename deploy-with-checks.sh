#!/bin/bash

# TIKO Platform Deployment Script with Dependency Checks
# This script ensures dependencies are properly installed before deploying to Heroku

echo "Starting deployment with dependency checks at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# 1. Verify dependencies
echo "Verifying dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "node_modules directory not found. Installing dependencies..."
  npm install --legacy-peer-deps
fi

# Check for critical Next.js files
if [ ! -f "node_modules/next/dist/bin/next" ]; then
  echo "Next.js binary not found. Reinstalling Next.js..."
  npm install next@13.4.4 --legacy-peer-deps
fi

# 2. Run a local build test
echo "Running local build test..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Local build failed. Fixing dependencies and trying again..."
  
  # Clean and reinstall
  rm -rf node_modules
  rm -f package-lock.json
  npm cache clean --force
  npm install --legacy-peer-deps
  
  # Try building again
  npm run build
  
  # Check if second build attempt was successful
  if [ $? -ne 0 ]; then
    echo "Build failed again. Please check the error messages above."
    exit 1
  fi
fi

echo "Local build successful. Proceeding with deployment."

# 3. Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix dependencies and implement comprehensive solution"

# 4. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
