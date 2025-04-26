#!/bin/bash
# Deployment script for debug API implementation

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of debug API implementation...${NC}"

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add pages/api/events/index.js
git commit -m "Add debug version of events API"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}To monitor logs, run: heroku logs --tail --app sonar-edm-user${NC}"
echo -e "${YELLOW}To verify the implementation, visit: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/dashboard${NC}"
