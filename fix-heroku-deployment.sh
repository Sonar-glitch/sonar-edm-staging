#!/bin/bash
# Heroku Deployment Fix Script for Sonar EDM Platform
# This script fixes common deployment issues for Next.js applications on Heroku

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform Heroku Deployment Fix Script ===${NC}"
echo -e "${BLUE}This script will fix common deployment issues for your Next.js application on Heroku${NC}"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
  echo -e "${RED}Error: Heroku CLI is not installed.${NC}"
  echo -e "Please install the Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli"
  exit 1
fi

# Ask for Heroku app name
read -p "Enter your Heroku app name (e.g., sonar-edm-platform): " APP_NAME

# Check if app exists
if ! heroku apps:info --app $APP_NAME &> /dev/null; then
  echo -e "${RED}Error: App '$APP_NAME' not found or you don't have access to it.${NC}"
  exit 1
fi

echo -e "\n${GREEN}Step 1: Updating Procfile...${NC}"
echo "web: npm run build && npm start" > Procfile
echo -e "✅ Procfile updated to include build step"

echo -e "\n${GREEN}Step 2: Setting required environment variables...${NC}"
heroku config:set NEXTAUTH_URL=https://$APP_NAME.herokuapp.com --app $APP_NAME

# Generate a random secret if NEXTAUTH_SECRET is not set
if ! heroku config:get NEXTAUTH_SECRET --app $APP_NAME &> /dev/null; then
  RANDOM_SECRET=$(openssl rand -base64 32)
  heroku config:set NEXTAUTH_SECRET=$RANDOM_SECRET --app $APP_NAME
  echo -e "✅ Generated and set NEXTAUTH_SECRET"
else
  echo -e "✅ NEXTAUTH_SECRET is already set"
fi

echo -e "\n${GREEN}Step 3: Checking for other required environment variables...${NC}"
# Check for Spotify credentials (for user authentication)
if ! heroku config:get SPOTIFY_CLIENT_ID --app $APP_NAME &> /dev/null; then
  echo -e "${YELLOW}Warning: SPOTIFY_CLIENT_ID is not set.${NC}"
  read -p "Would you like to set it now? (y/n): " SET_SPOTIFY
  if [[ $SET_SPOTIFY == "y" ]]; then
    read -p "Enter your Spotify Client ID: " SPOTIFY_ID
    heroku config:set SPOTIFY_CLIENT_ID=$SPOTIFY_ID --app $APP_NAME
    
    read -p "Enter your Spotify Client Secret: " SPOTIFY_SECRET
    heroku config:set SPOTIFY_CLIENT_SECRET=$SPOTIFY_SECRET --app $APP_NAME
    echo -e "✅ Spotify credentials set"
  fi
fi

# Check for Google credentials (for promoter authentication)
if ! heroku config:get GOOGLE_CLIENT_ID --app $APP_NAME &> /dev/null; then
  echo -e "${YELLOW}Warning: GOOGLE_CLIENT_ID is not set.${NC}"
  read -p "Would you like to set it now? (y/n): " SET_GOOGLE
  if [[ $SET_GOOGLE == "y" ]]; then
    read -p "Enter your Google Client ID: " GOOGLE_ID
    heroku config:set GOOGLE_CLIENT_ID=$GOOGLE_ID --app $APP_NAME
    
    read -p "Enter your Google Client Secret: " GOOGLE_SECRET
    heroku config:set GOOGLE_CLIENT_SECRET=$GOOGLE_SECRET --app $APP_NAME
    echo -e "✅ Google credentials set"
  fi
fi

echo -e "\n${GREEN}Step 4: Forcing a clean rebuild...${NC}"
git add Procfile
git commit -m "Update Procfile to include build step"
git push heroku main

echo -e "\n${GREEN}Step 5: Checking build logs for errors...${NC}"
heroku logs --source app --app $APP_NAME

echo -e "\n${BLUE}=== Deployment fix process completed! ===${NC}"
echo -e "If you still encounter issues, please check the following:"
echo -e "1. Verify that all required environment variables are set"
echo -e "2. Check for any build errors in the logs"
echo -e "3. Ensure your Next.js version is compatible with your Node.js version"
echo -e "\nYou can open your app with: heroku open --app $APP_NAME"
