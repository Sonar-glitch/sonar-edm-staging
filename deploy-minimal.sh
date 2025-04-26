#!/bin/bash

# TIKO Platform Minimal Deployment Script
# This script deploys the application with minimal changes

echo "Starting minimal deployment at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Commit changes
echo "Committing changes..."
git add package.json package-lock.json
git commit -m "Add missing visualization libraries"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
