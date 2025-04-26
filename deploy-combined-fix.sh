#!/bin/bash
# Combined deployment script for Next.js on Heroku

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting combined deployment process...${NC}"

# Set memory configuration
echo -e "${YELLOW}Setting memory configuration...${NC}"
heroku config:set NODE_OPTIONS="--max_old_space_size=2560" --app sonar-edm-user

# Set build environment variables
echo -e "${YELLOW}Setting build environment variables...${NC}"
heroku config:set NPM_CONFIG_PRODUCTION=false --app sonar-edm-user

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Combined Next.js deployment fix"

# Option 1: Standard deployment with repo reset
deploy_standard() {
  echo -e "${YELLOW}Resetting Heroku repository...${NC}"
  heroku repo:reset --app sonar-edm-user
  
  echo -e "${YELLOW}Pushing to Heroku...${NC}"
  git push heroku main
}

# Option 2: Deploy from a new branch
deploy_new_branch() {
  echo -e "${YELLOW}Creating deployment branch...${NC}"
  git checkout -b deployment-fix
  
  echo -e "${YELLOW}Pushing to Heroku from deployment branch...${NC}"
  git push heroku deployment-fix:main
}

# Option 3: Use specific buildpacks
deploy_with_buildpacks() {
  echo -e "${YELLOW}Clearing and setting buildpacks...${NC}"
  heroku buildpacks:clear --app sonar-edm-user
  heroku buildpacks:set heroku/nodejs --app sonar-edm-user
  
  echo -e "${YELLOW}Pushing to Heroku...${NC}"
  git push heroku main
}

# Ask which deployment method to use
echo -e "${GREEN}Choose deployment method:${NC}"
echo -e "1) Standard deployment with repo reset"
echo -e "2) Deploy from a new branch"
echo -e "3) Use specific buildpacks"
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    deploy_standard
    ;;
  2)
    deploy_new_branch
    ;;
  3)
    deploy_with_buildpacks
    ;;
  *)
    echo -e "${RED}Invalid choice. Using standard deployment.${NC}"
    deploy_standard
    ;;
esac

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}To monitor logs, run: heroku logs --tail --app sonar-edm-user${NC}"
echo -e "${YELLOW}To verify the implementation, visit: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/dashboard${NC}"
