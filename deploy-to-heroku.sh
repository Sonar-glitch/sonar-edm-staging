#!/bin/bash

# Sonar EDM Platform - Heroku Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform - Heroku Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your Sonar EDM Platform to Heroku.${NC}\n"

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
  echo -e "${YELLOW}Creating Heroku app: $app_name${NC}"
  heroku create $app_name
else
  echo -e "${GREEN}Using existing Heroku app: $app_name${NC}"
fi

# Check if git remote exists
remote_exists=$(git remote -v | grep heroku)
if [ -z "$remote_exists" ]; then
  echo -e "${YELLOW}Adding Heroku remote...${NC}"
  heroku git:remote -a $app_name
fi

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
heroku config:set TICKETMASTER_API_KEY=gjGKNoTGeWl8HF2FAgYQVCf25D5ap7yw --app $app_name
heroku config:set SPOTIFY_CLIENT_ID=20d98eaf33fa464291b4c13a1e70a2ad --app $app_name
heroku config:set SPOTIFY_CLIENT_SECRET=8cb4a223b7434a52b4c21e5f6aef6b19 --app $app_name
heroku config:set NEXTAUTH_URL=https://sonar-edm-user-50e4fb038f6e.herokuapp.com --app $app_name
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32) --app $app_name
heroku config:set EDMTRAIN_API_KEY=b5143e2e-21f2-4b45-b537-0b5b9ec9bdad --app $app_name
heroku config:set MONGODB_URI=mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/?retryWrites=true&w=majority&appName=SonarEDM --app $app_name

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Enhance theme with artist card design and implement theme options"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku master

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your app is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
