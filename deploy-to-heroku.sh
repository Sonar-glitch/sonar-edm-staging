#!/bin/bash

# Sonar EDM Heroku Deployment Script
echo "🚀 Deploying Sonar EDM User to Heroku..."
echo "========================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
fi

# Add all files
echo "Adding files to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Updated Sonar EDM User with authentication flow and event integration fixes"

# Check if Heroku remote exists
if ! git remote | grep -q "heroku"; then
  echo "Adding Heroku remote..."
  heroku git:remote -a sonar-edm-user
fi

# Push to Heroku
echo "Pushing to Heroku..."
git push heroku main --force

echo "✅ Deployment complete!"
echo "Your app should be available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com"
