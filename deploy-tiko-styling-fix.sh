#!/bin/bash
echo "=== TIKO - Styling Fix Deployment Script ==="

# Set timestamp to force a clean build
echo "Setting timestamp to force a clean build..."
heroku config:set DEPLOY_TIMESTAMP=$(date +%s) --app sonar-edm-user

# Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix styling while maintaining performance improvements"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main:master --force

echo "Deployment complete!"
echo "Your TIKO platform with fixed styling is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com"
