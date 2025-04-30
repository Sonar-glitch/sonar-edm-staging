#!/bin/bash

# Corrected deployment script v2 for Enhanced UI Components to Staging
# This script explicitly targets the sonar-edm-staging Heroku app
# Uses `git add` on directories to ensure changes are staged before commit

echo "=== TIKO Platform - Corrected Enhanced UI Deployment v2 to Staging ==="
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

# Copy ALL necessary CSS files
echo "Copying CSS files..."
cp -f MatchPercentage.module.css styles/
cp -f EnhancedDashboard.module.css styles/
cp -f EnhancedEventCard.module.css styles/
cp -f EnhancedFilterPanel.module.css styles/

# Copy the staging dashboard directly to dashboard.js
echo "Deploying staging enhanced dashboard as default dashboard..."
cp -f StagingEnhancedDashboard.js pages/dashboard.js

# Update package.json if needed
echo "Checking for required dependencies..."
if ! grep -q "react-icons" package.json; then
  echo "Adding react-icons dependency..."
  npm install --save react-icons
fi

# Stage changes using directory paths for robustness
echo "Staging changes for commit..."
git add components/
git add pages/
git add styles/
# Add package.json only if npm install ran, otherwise it might stage unrelated changes
if grep -q "react-icons" package.json; then
  git add package.json
fi

# Commit changes
echo "Committing changes to Git..."
# Check if there are staged changes before committing
if ! git diff --staged --quiet; then
  git commit -m "Fix staging UI by deploying enhanced dashboard with all CSS files (v2)"
else
  echo "No changes staged for commit. Skipping commit."
fi

# Push to the staging Heroku app
echo "Pushing changes to Heroku app: $HEROKU_APP_NAME..."
git push $HEROKU_GIT_URL main

# Restart the staging Heroku dyno
echo "Restarting Heroku dyno for $HEROKU_APP_NAME to clear caches..."
heroku restart --app $HEROKU_APP_NAME

echo "Deployment complete!"
echo "The enhanced dashboard UI should now be restored on staging at: https://$HEROKU_APP_NAME-ef96efd71e8e.herokuapp.com/dashboard"
echo "Please check the staging application to verify the changes."
