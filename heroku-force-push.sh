#!/bin/bash
# Sonar EDM Platform - Heroku Force Push Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform - Heroku Force Push Script ===${NC}"
echo -e "${BLUE}This script will force push your local changes to Heroku${NC}\n"

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: git is not installed.${NC}"
  echo -e "${YELLOW}Please install git and try again.${NC}"
  exit 1
fi

# Check if heroku CLI is installed
if ! command -v heroku &> /dev/null; then
  echo -e "${RED}Error: Heroku CLI is not installed.${NC}"
  echo -e "${YELLOW}Please install the Heroku CLI and try again.${NC}"
  exit 1
fi

# Check if we're in the project directory
if [ ! -d "./pages" ] || [ ! -d "./components" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
  echo -e "${YELLOW}Please navigate to your project directory and run this script again.${NC}"
  exit 1
fi

# Check if user is logged in to Heroku
heroku_status=$(heroku auth:whoami 2>&1)
if [[ $heroku_status == *"Error"* ]]; then
  echo -e "${YELLOW}You are not logged in to Heroku. Please log in:${NC}"
  heroku login
fi

# Check if the app exists
app_name="sonar-edm-user"
app_exists=$(heroku apps:info --app $app_name 2>&1)
if [[ $app_exists == *"Couldn't find that app"* ]]; then
  echo -e "${RED}Error: Heroku app '$app_name' not found.${NC}"
  echo -e "${YELLOW}Please create the app first or use the correct app name.${NC}"
  exit 1
else
  echo -e "${GREEN}Using existing Heroku app: $app_name${NC}"
fi

# Check if git remote exists
remote_exists=$(git remote -v | grep heroku)
if [ -z "$remote_exists" ]; then
  echo -e "${YELLOW}Adding Heroku remote...${NC}"
  heroku git:remote -a $app_name
fi

# Force push to Heroku
echo -e "${YELLOW}Force pushing to Heroku...${NC}"
echo -e "${YELLOW}This will overwrite any existing code on Heroku with your local changes.${NC}"
echo -e "${YELLOW}Press Ctrl+C to cancel or wait 5 seconds to continue...${NC}"
sleep 5

git push heroku main:master --force

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Force push successful!${NC}"
  echo -e "${GREEN}Your app is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
else
  echo -e "${RED}Force push failed. Please check the error message above.${NC}"
  echo -e "${YELLOW}You may need to manually run:${NC} git push heroku main:master --force"
fi

echo -e "${BLUE}=======================================${NC}\n"
