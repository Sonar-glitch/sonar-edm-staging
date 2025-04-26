#!/bin/bash

echo "Starting deployment of dashboard restoration..."

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Step 2: Clear Heroku build cache
echo "Clearing Heroku build cache..."
heroku plugins:install heroku-builds
heroku builds:cache:purge -a sonar-edm-user --confirm sonar-edm-user

# Step 3: Verify environment variables
echo "Verifying environment variables..."
TICKETMASTER_API_KEY=$(heroku config:get TICKETMASTER_API_KEY --app sonar-edm-user)
if [ -z "$TICKETMASTER_API_KEY" ]; then
  echo "Setting Ticketmaster API key..."
  heroku config:set TICKETMASTER_API_KEY=gjGKNoTGeWl8HF2FAgYQVCf25D5ap7yw --app sonar-edm-user
fi

# Step 4: Commit changes
echo "Committing changes..."
git add pages/dashboard.js
git add components/
git add styles/
git add pages/api/events/index.js
git add pages/api/cors-middleware.js
git add public/js/service-worker-bypass.js
git add public/images/placeholders/
git commit -m "Restore original dashboard with working events"

# Step 5: Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment complete! Monitor logs with: heroku logs --tail --app sonar-edm-user"
