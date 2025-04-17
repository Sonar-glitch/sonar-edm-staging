#!/bin/bash

echo "=====================================================
  Sonar EDM Platform - Heroku Deployment Script
====================================================="

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "pages" ] || [ ! -d "components" ] || [ ! -d "styles" ]; then
  echo -e "${RED}Error: This script must be run from the root of your Sonar EDM project.${NC}"
  echo "Please navigate to your project root directory and try again."
  exit 1
fi

# Create backup branch
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BRANCH="backup-${TIMESTAMP}"

echo -e "${YELLOW}Creating backup branch: ${BACKUP_BRANCH}${NC}"
git checkout -b $BACKUP_BRANCH

# Add all changes
echo -e "${YELLOW}Adding all changes to git...${NC}"
git add pages/users/profile.js
git add pages/users/settings.js
git add pages/users/music-taste.js
git add pages/api/auth/[...nextauth].js

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Implement neon EDM-themed Music Taste page and fix missing pages"

# Switch back to main branch
echo -e "${YELLOW}Switching back to main branch...${NC}"
git checkout main

# Merge changes from backup branch
echo -e "${YELLOW}Merging changes from backup branch...${NC}"
git merge $BACKUP_BRANCH

# Push to Heroku
echo -e "${YELLOW}Pushing changes to Heroku...${NC}"
git push heroku main

# Check if push was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deployment successful!${NC}"
  echo ""
  echo "Your application is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com"
  echo ""
  echo "You can check the following pages:"
  echo "- Music Taste page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/music-taste"
  echo "- Profile page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/profile"
  echo "- Settings page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/settings"
  echo "- Events page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/events"
  echo ""
  echo "If you need to revert the changes, you can use the backup branch:"
  echo "git checkout $BACKUP_BRANCH"
  echo "git push -f heroku $BACKUP_BRANCH:main"
  echo ""
  echo "Thank you for using the Sonar EDM Platform Heroku Deployment Script!"
else
  echo -e "${RED}Deployment failed.${NC}"
  echo "Please check the error messages above and try again."
  echo "You can manually push your changes with: git push heroku main"
  echo ""
  echo "If you need to revert to the previous state, you can use the backup branch:"
  echo "git checkout $BACKUP_BRANCH"
fi
