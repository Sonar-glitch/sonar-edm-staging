#!/bin/bash
# deploy-tiko-dashboard-improvements.sh
# Script to deploy the improved dashboard components to Heroku
# For use in Windows Git Bash at /c/sonar/users/sonar-edm-user/

# Set timestamp to force a clean build on Heroku
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Starting deployment at $TIMESTAMP"

# Create necessary directories if they don't exist
mkdir -p /c/sonar/users/sonar-edm-user/components/styles

# Copy all component files to the correct locations
echo "Copying component files..."

# Main components
cp /home/ubuntu/components/SoundCharacteristicsChart.js /c/sonar/users/sonar-edm-user/components/
cp /home/ubuntu/components/ReorganizedSeasonalVibes.js /c/sonar/users/sonar-edm-user/components/
cp /home/ubuntu/components/UserFeedbackGrid.js /c/sonar/users/sonar-edm-user/components/
cp /home/ubuntu/components/EnhancedEventFilters.js /c/sonar/users/sonar-edm-user/components/
cp /home/ubuntu/components/ImprovedEventList.js /c/sonar/users/sonar-edm-user/components/

# CSS files
cp /home/ubuntu/components/styles/ReorganizedSeasonalVibes.module.css /c/sonar/users/sonar-edm-user/styles/
cp /home/ubuntu/components/styles/EnhancedEventFilters.module.css /c/sonar/users/sonar-edm-user/styles/
cp /home/ubuntu/components/styles/ImprovedEventList.module.css /c/sonar/users/sonar-edm-user/styles/
cp /home/ubuntu/components/styles/UserFeedbackGrid.module.css /c/sonar/users/sonar-edm-user/styles/

# Copy the improved dashboard to replace the current dashboard
cp /home/ubuntu/components/ImprovedDashboard.js /c/sonar/users/sonar-edm-user/pages/dashboard.js

# Update package.json to ensure Recharts is included
if ! grep -q "recharts" /c/sonar/users/sonar-edm-user/package.json; then
  echo "Adding Recharts dependency to package.json..."
  # Use sed to add recharts before the last dependency
  sed -i 's/"tailwindcss": "^3.1.8"/"tailwindcss": "^3.1.8",\n    "recharts": "^2.5.0"/' /c/sonar/users/sonar-edm-user/package.json
fi

# Add timestamp to force Heroku rebuild
echo "DEPLOY_TIMESTAMP=$TIMESTAMP" > /c/sonar/users/sonar-edm-user/.env

# Commit changes
echo "Committing changes..."
cd /c/sonar/users/sonar-edm-user
git add .
git commit -m "Improve dashboard with better space usage and enhanced visualizations"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main:master --force

echo "Deployment complete! Your improved dashboard should be live in a few minutes."
echo "Visit https://sonar-edm-user-50e4fb038f6e.herokuapp.com to see the changes."
