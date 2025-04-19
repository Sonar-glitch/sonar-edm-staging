#!/bin/bash
# TIKO Styling Fix Deployment Script
# This script deploys the fixed styling components to Heroku

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Styling Fix Deployment Script ===${NC}"
echo -e "${BLUE}This script deploys the fixed styling components to Heroku${NC}\n"

# Set timestamp to force a clean build
echo -e "${YELLOW}Setting timestamp to force a clean build...${NC}"
TIMESTAMP=$(date +%s)
heroku config:set DEPLOY_TIMESTAMP=$TIMESTAMP --app sonar-edm-user

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Fix styling with neon theme and restore visualization components"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO platform with fixed styling is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
