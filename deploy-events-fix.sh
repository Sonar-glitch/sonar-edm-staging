#!/bin/bash

echo "Starting deployment of events section fix..."

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Step 2: Add events fix to dashboard
echo "Adding events fix to dashboard..."
node add-events-fix-to-dashboard.js

# Step 3: Clear Heroku build cache
echo "Clearing Heroku build cache..."
heroku plugins:install heroku-builds
heroku builds:cache:purge -a sonar-edm-user --confirm sonar-edm-user

# Step 4: Verify environment variables
echo "Verifying environment variables..."
TICKETMASTER_API_KEY=$(heroku config:get TICKETMASTER_API_KEY --app sonar-edm-user)
if [ -z "$TICKETMASTER_API_KEY" ]; then
  echo "Setting Ticketmaster API key..."
  heroku config:set TICKETMASTER_API_KEY=gjGKNoTGeWl8HF2FAgYQVCf25D5ap7yw --app sonar-edm-user
fi

# Step 5: Commit changes
echo "Committing changes..."
git add pages/api/cors-middleware.js
git add pages/api/events/index.js
git add public/images/placeholders/event_placeholder_medium.svg
git add public/js/events-section-fix.js
git add pages/_document.js 2>/dev/null || true
git commit -m "Fix events section with client-side solution"

# Step 6: Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment complete! Monitor logs with: heroku logs --tail --app sonar-edm-user"
