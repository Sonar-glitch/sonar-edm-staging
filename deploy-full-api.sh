#!/bin/bash
# Deployment script for full combined API implementation

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of full combined API implementation...${NC}"

# Verify API keys are set
echo -e "${YELLOW}Verifying environment variables...${NC}"
TICKETMASTER_KEY=$(heroku config:get TICKETMASTER_API_KEY --app sonar-edm-user)
EDMTRAIN_KEY=$(heroku config:get EDMTRAIN_API_KEY --app sonar-edm-user)

if [ -z "$TICKETMASTER_KEY" ]; then
  echo -e "${RED}Ticketmaster API key not set. Setting it now...${NC}"
  heroku config:set TICKETMASTER_API_KEY=gjGKNoTGeWl8HF2FAgYQVCf25D5ap7yw --app sonar-edm-user
else
  echo -e "${GREEN}Ticketmaster API key is set${NC}"
fi

if [ -z "$EDMTRAIN_KEY" ]; then
  echo -e "${RED}EDMTrain API key not set. Setting it now...${NC}"
  heroku config:set EDMTRAIN_API_KEY=b5143e2e-21f2-4b45-b537-0b5b9ec9bdad --app sonar-edm-user
else
  echo -e "${GREEN}EDMTrain API key is set${NC}"
fi

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add pages/api/events/index.js
git commit -m "Implement full combined Ticketmaster and EDMTrain API with caching"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}To monitor logs, run: heroku logs --tail --app sonar-edm-user${NC}"
echo -e "${YELLOW}To verify the implementation, visit: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/dashboard${NC}"
