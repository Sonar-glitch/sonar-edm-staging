#!/bin/bash

# TIKO Platform Tailored Deployment Script
# This script deploys the application with tailored fixes

echo "Starting tailored deployment at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Clear Heroku build cache
echo "Clearing Heroku build cache..."
heroku plugins:install heroku-builds 2>/dev/null || echo "Heroku builds plugin already installed"
heroku builds:cache:purge -a sonar-edm-user --confirm sonar-edm-user

# Commit changes
echo "Committing changes..."
git add package.json package-lock.json next.config.js lib/mongodb.js lib/spotify.js lib/cache.js pages/api/auth/[...nextauth].js
git commit -m "Fix dependencies and export issues with tailored approach"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
