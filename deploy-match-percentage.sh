#!/bin/bash

# Deployment script for the first enhancement: MatchPercentage Component
# Deploys changes from the current branch (expected: feature/enhanced-dashboard-ui)
# to the main branch of the sonar-edm-staging Heroku app.

echo "=== TIKO Platform - Deploying MatchPercentage Enhancement to Staging ==="
echo "Starting deployment process..."

# Define the target Heroku app name and Git URL
HEROKU_APP_NAME="sonar-edm-staging"
HEROKU_GIT_URL="https://git.heroku.com/sonar-edm-staging.git"

# Ensure component and style directories exist
echo "Ensuring component directories exist..."
mkdir -p components
mkdir -p styles
mkdir -p pages

# Copy the new dashboard file
echo "Copying dashboard with MatchPercentage..."
cp -f DashboardWithMatchPercentage.js pages/dashboard.js

# Copy the MatchPercentage component and its styles
echo "Copying MatchPercentage component and styles..."
cp -f MatchPercentage.js components/
cp -f MatchPercentage.module.css styles/

# Stage changes
echo "Staging changes for commit..."
git add pages/dashboard.js
git add components/MatchPercentage.js
git add styles/MatchPercentage.module.css

# Commit changes
echo "Committing changes to Git..."
# Check if there are staged changes before committing
if ! git diff --staged --quiet; then
  git commit -m "Feat: Add MatchPercentage component to dashboard"
else
  echo "No changes staged for commit. Skipping commit."
fi

# Push the current branch to the main branch of the staging Heroku app
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Pushing branch ".$CURRENT_BRANCH." to Heroku app: $HEROKU_APP_NAME (main branch)..."
git push $HEROKU_GIT_URL $CURRENT_BRANCH:main

# Restart the staging Heroku dyno
echo "Restarting Heroku dyno for $HEROKU_APP_NAME..."
heroku restart --app $HEROKU_APP_NAME

echo "Deployment complete!"
echo "The MatchPercentage enhancement should be deployed to staging at: https://$HEROKU_APP_NAME-ef96efd71e8e.herokuapp.com/dashboard"
echo "Please check the staging application to verify the changes."
