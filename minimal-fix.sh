#!/bin/bash
# minimal-fix.sh
# Minimal script to fix the routing issue by updating only the necessary files
# For use in Windows Git Bash at /c/sonar/users/sonar-edm-user/

# Set timestamp to force a clean build on Heroku
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Starting minimal fix at $TIMESTAMP"

# Store current directory to return to it later
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Navigate to the main project directory
cd /c/sonar/users/sonar-edm-user/
echo "Moved to main project directory: $(pwd)"

# Make sure we have the latest changes
echo "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# 1. Create a minimal update to redirect signin to dashboard
echo "Updating pages/api/auth/[...nextauth].js to redirect to dashboard..."

# First check if the file exists
if [ -f "pages/api/auth/[...nextauth].js" ]; then
  # Make a backup
  cp pages/api/auth/[...nextauth].js pages/api/auth/[...nextauth].js.bak
  
  # Update the file to redirect to dashboard
  sed -i 's|callbackUrl: "/users/music-taste"|callbackUrl: "/dashboard"|g' pages/api/auth/[...nextauth].js
  echo "Updated [...nextauth].js to redirect to dashboard"
else
  echo "Warning: pages/api/auth/[...nextauth].js not found, skipping this update"
fi

# 2. Add timestamp to force Heroku rebuild
echo "DEPLOY_TIMESTAMP=$TIMESTAMP" > .env
echo "Added timestamp to force rebuild"

# 3. Commit changes
echo "Committing changes..."
git add .env
git add pages/api/auth/[...nextauth].js 2>/dev/null || true
git commit -m "Fix authentication redirect to point to dashboard"

# 4. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku $CURRENT_BRANCH:master --force

echo "Deployment complete! The authentication should now redirect to the dashboard."
echo "Dashboard page: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo "Music Taste page: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/users/music-taste"

# Return to original directory
cd "$CURRENT_DIR"
echo "Returned to original directory: $(pwd)"
