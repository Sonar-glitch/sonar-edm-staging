#!/bin/bash

# TIKO Platform Image Fix Deployment Script
# This script deploys the application with image loading fixes

echo "Starting image fix deployment at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Clear Heroku build cache
echo "Clearing Heroku build cache..."
heroku plugins:install heroku-builds 2>/dev/null || echo "Heroku builds plugin already installed"
heroku builds:cache:purge -a sonar-edm-staging --confirm sonar-edm-staging

# Commit changes
echo "Committing changes..."
git add pages/api/events/index.js pages/dashboard.js public/images/placeholders
git commit -m "Fix image loading errors and maintain Ticketmaster API integration"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
