#!/bin/bash

# Deployment script for Enhanced UI Components to Staging
# This script explicitly targets the sonar-edm-staging Heroku app
# It deploys the StagingEnhancedDashboard which includes the top sections

echo "=== TIKO Platform - Enhanced UI Deployment to Staging ==="
echo "Starting deployment process..."

# Define the target Heroku app name and Git URL
HEROKU_APP_NAME="sonar-edm-staging"
HEROKU_GIT_URL="https://git.heroku.com/sonar-edm-staging.git"

# Create backup directory
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Creating backup directory..."
mkdir -p backups/$TIMESTAMP

# Backup existing dashboard file
echo "Backing up existing dashboard.js file..."
cp -f pages/dashboard.js backups/$TIMESTAMP/dashboard.js.bak 2>/dev/null || :

# Create component directories if they don't exist
echo "Creating component directories if needed..."
mkdir -p components
mkdir -p styles
mkdir -p pages

# Copy necessary component files
echo "Copying MatchPercentage component..."
cp -f MatchPercentage.js components/

# Copy necessary CSS files
echo "Copying CSS files..."
cp -f MatchPercentage.module.css styles/
cp -f EnhancedDashboard.module.css styles/ # This CSS is used by StagingEnhancedDashboard

# Copy the staging dashboard directly to dashboard.js
echo "Deploying staging enhanced dashboard as default dashboard..."
cp -f StagingEnhancedDashboard.js pages/dashboard.js

# Update package.json if needed
echo "Checking for required dependencies..."
if ! grep -q "react-icons" package.json; then
  echo "Adding react-icons dependency..."
  npm install --save react-icons
fi

# Commit changes
echo "Committing changes to Git..."
git add components/MatchPercentage.js
git add pages/dashboard.js
git add styles/MatchPercentage.module.css
git add styles/EnhancedDashboard.module.css
git add package.json
git commit -m "Deploy enhanced dashboard with top sections to staging"

# Push to the staging Heroku app
echo "Pushing changes to Heroku app: $HEROKU_APP_NAME..."
git push $HEROKU_GIT_URL main

# Restart the staging Heroku dyno
echo "Restarting Heroku dyno for $HEROKU_APP_NAME to clear caches..."
heroku restart --app $HEROKU_APP_NAME

echo "Deployment complete!"
echo "The enhanced dashboard should now be the default dashboard on staging at: https://$HEROKU_APP_NAME-ef96efd71e8e.herokuapp.com/dashboard"
echo "Please check the staging application to verify the changes."
