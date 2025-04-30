#!/bin/bash

# Deployment script for Ticketmaster + Resident Advisor integration
# This script installs required dependencies, deploys the implementation,
# and pushes changes to Heroku

echo "=== TIKO Platform - Ticketmaster + Resident Advisor Integration ==="
echo "Starting deployment process..."

# Install required dependencies
echo "Installing required dependencies..."
npm install xml2js --save

# Create backup of current implementation
echo "Creating backup of current events API implementation..."
mkdir -p backups
cp pages/api/events/index.js backups/index.js.backup-$(date +%Y%m%d%H%M%S)

# Deploy the new implementation
echo "Deploying Ticketmaster + Resident Advisor integration..."
cp ticketmaster-ra-integration.js pages/api/events/index.js

# Create enhanced correlated-events implementation
echo "Deploying enhanced correlated-events implementation..."
cp enhanced-correlated-events.js pages/api/events/correlated-events.js

# Commit changes
echo "Committing changes to Git..."
git add pages/api/events/index.js pages/api/events/correlated-events.js package.json package-lock.json
git commit -m "Implement Ticketmaster + Resident Advisor integration with enhanced correlation"

# Push to Heroku
echo "Pushing changes to Heroku..."
git push heroku main

# Restart Heroku dyno
echo "Restarting Heroku dyno to clear caches..."
heroku restart --app sonar-edm-user

echo "Deployment complete!"
echo "Please check the application to verify the changes."
echo "You should now see events from both Ticketmaster and Resident Advisor,"
echo "with proper match filtering and at least 6 events displayed."
