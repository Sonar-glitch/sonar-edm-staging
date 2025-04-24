#!/bin/bash
# deploy-tiko-dashboard-improvements-fixed.sh
# Script to deploy the improved dashboard components to Heroku
# For use in Windows Git Bash at /c/sonar/users/sonar-edm-user/

# Set timestamp to force a clean build on Heroku
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Starting deployment at $TIMESTAMP"

# Create necessary directories if they don't exist
mkdir -p components/styles
mkdir -p pages/auth

# Copy all component files from the local directory
echo "Copying component files..."

# Main components
cp tiko-dashboard-improvements/SoundCharacteristicsChart.js components/
cp tiko-dashboard-improvements/ReorganizedSeasonalVibes.js components/
cp tiko-dashboard-improvements/UserFeedbackGrid.js components/
cp tiko-dashboard-improvements/EnhancedEventFilters.js components/
cp tiko-dashboard-improvements/ImprovedEventList.js components/

# CSS files
cp tiko-dashboard-improvements/ReorganizedSeasonalVibes.module.css styles/
cp tiko-dashboard-improvements/EnhancedEventFilters.module.css styles/
cp tiko-dashboard-improvements/ImprovedEventList.module.css styles/
cp tiko-dashboard-improvements/UserFeedbackGrid.module.css styles/

# Copy the improved dashboard to replace the current dashboard
cp tiko-dashboard-improvements/ImprovedDashboard.js pages/dashboard.js

# Fix authentication flow by updating signin.js to redirect to dashboard
cp tiko-dashboard-improvements/fixed-signin.js pages/auth/signin.js

# Update package.json to ensure Recharts is included
if ! grep -q "recharts" package.json; then
  echo "Adding Recharts dependency to package.json..."
  # Use sed to add recharts before the last dependency
  sed -i 's/"tailwindcss": "^3.1.8"/"tailwindcss": "^3.1.8",\n    "recharts": "^2.5.0"/' package.json
fi

# Add timestamp to force Heroku rebuild
echo "DEPLOY_TIMESTAMP=$TIMESTAMP" > .env

# Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix dashboard with improved components and authentication flow"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main:master --force

echo "Deployment complete! Your improved dashboard should be live in a few minutes."
echo "Visit https://sonar-edm-user-50e4fb038f6e.herokuapp.com to see the changes."
echo "Users should now be redirected to the dashboard after login."
