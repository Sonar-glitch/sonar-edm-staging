#!/bin/bash

# Deployment script for correlated-events authentication fix
# This script deploys the fixed correlated-events.js file to the TIKO platform

echo "=== TIKO Platform - Correlated Events Authentication Fix ==="
echo "Starting deployment process..."

# Check if we're in the correct directory
if [ ! -d "pages" ]; then
  echo "Error: This script must be run from the project root directory."
  echo "Please navigate to /c/sonar/users/sonar-edm-user and try again."
  exit 1
fi

# Create backup of current file
echo "Creating backup of current correlated-events.js file..."
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
if [ -f "pages/api/events/correlated-events.js" ]; then
  cp pages/api/events/correlated-events.js "pages/api/events/correlated-events.js.backup-${TIMESTAMP}"
  echo "Backup created: pages/api/events/correlated-events.js.backup-${TIMESTAMP}"
else
  echo "Warning: Original file not found, creating directory structure..."
  mkdir -p pages/api/events
fi

# Copy the fixed implementation
echo "Deploying fixed implementation..."
cp /home/ubuntu/fixed-correlated-events.js pages/api/events/correlated-events.js
echo "Fixed implementation deployed successfully."

# Commit changes
echo "Committing changes to Git..."
git add pages/api/events/correlated-events.js
git commit -m "Fix authentication issue in correlated-events endpoint"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "=== Deployment Complete ==="
echo "The correlated-events authentication fix has been deployed."
echo "To verify the fix, visit your dashboard and check the browser console for any errors."
echo "You should no longer see the 401 Unauthorized error for correlated-events."
