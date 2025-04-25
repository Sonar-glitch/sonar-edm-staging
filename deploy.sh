#!/bin/bash

# TIKO Platform Deployment Script
# This script commits and deploys the changes to Heroku

echo "Starting deployment at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Commit changes
echo "Committing changes..."
git add .
git commit -m "Comprehensive fix for Ticketmaster API, user flow, and event functionality"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
