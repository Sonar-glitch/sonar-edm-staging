#!/bin/bash
# Deployment script with cache purging

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment with cache purging...${NC}"

# Install Heroku builds plugin if not already installed
echo -e "${YELLOW}Installing Heroku builds plugin...${NC}"
heroku plugins:install heroku-builds || true

# Purge Heroku build cache
echo -e "${YELLOW}Purging Heroku build cache...${NC}"
heroku builds:cache:purge -a sonar-edm-staging --confirm sonar-edm-staging

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Fix Next.js dependency issues and update build configuration"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}To monitor logs, run: heroku logs --tail --app sonar-edm-staging${NC}"
echo -e "${YELLOW}To verify the implementation, visit: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard${NC}"
