#!/bin/bash
# Three-Component Deployment Script for Sonar EDM Platform
# This script configures and deploys all three components of the Sonar EDM Platform

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform Three-Component Deployment Script ===${NC}"
echo -e "${BLUE}This script will configure and deploy all three components of your platform${NC}"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
  echo -e "${RED}Error: Heroku CLI is not installed.${NC}"
  echo -e "Please install the Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli"
  exit 1
fi

# Define the app names
USER_APP="sonar-edm-user"
PROMOTER_APP="sonar-edm-promoter"
API_APP="sonar-edm-api"
PLATFORM_APP="sonar-edm-platform"

# Check if apps exist
echo -e "${GREEN}Checking if Heroku apps exist...${NC}"
for APP in "$USER_APP" "$PROMOTER_APP" "$API_APP" "$PLATFORM_APP"; do
  if ! heroku apps:info --app $APP &> /dev/null; then
    echo -e "${YELLOW}Warning: App '$APP' not found or you don't have access to it.${NC}"
    read -p "Would you like to create this app? (y/n): " CREATE_APP
    if [[ $CREATE_APP == "y" ]]; then
      heroku apps:create $APP
      echo -e "✅ Created app: $APP"
    else
      echo -e "${RED}Skipping app: $APP${NC}"
    fi
  else
    echo -e "✅ App exists: $APP"
  fi
done

# Configure API app
echo -e "\n${GREEN}Step 1: Configuring Backend API (${API_APP})...${NC}"
# Set CORS to allow requests from user and promoter apps
heroku config:set CORS_ORIGIN=https://$USER_APP.herokuapp.com,https://$PROMOTER_APP.herokuapp.com,https://$PLATFORM_APP.herokuapp.com --app $API_APP

# Ask for MongoDB URI if not set
if ! heroku config:get MONGODB_URI --app $API_APP &> /dev/null; then
  echo -e "${YELLOW}MongoDB URI is not set for the API app.${NC}"
  read -p "Enter your MongoDB URI (or press Enter to skip): " MONGODB_URI
  if [[ ! -z "$MONGODB_URI" ]]; then
    heroku config:set MONGODB_URI=$MONGODB_URI --app $API_APP
    echo -e "✅ Set MongoDB URI"
  else
    echo -e "${YELLOW}Skipping MongoDB URI setup${NC}"
  fi
fi

# Configure User app (Spotify authentication)
echo -e "\n${GREEN}Step 2: Configuring User Dashboard (${USER_APP})...${NC}"
# Set NextAuth URL
heroku config:set NEXTAUTH_URL=https://$USER_APP.herokuapp.com --app $USER_APP

# Generate NextAuth secret if not set
if ! heroku config:get NEXTAUTH_SECRET --app $USER_APP &> /dev/null; then
  RANDOM_SECRET=$(openssl rand -base64 32)
  heroku config:set NEXTAUTH_SECRET=$RANDOM_SECRET --app $USER_APP
  echo -e "✅ Generated and set NEXTAUTH_SECRET"
else
  echo -e "✅ NEXTAUTH_SECRET is already set"
fi

# Set API base URL
heroku config:set API_BASE_URL=https://$API_APP.herokuapp.com --app $USER_APP
echo -e "✅ Set API_BASE_URL to point to the API app"

# Ask for Spotify credentials if not set
if ! heroku config:get SPOTIFY_CLIENT_ID --app $USER_APP &> /dev/null; then
  echo -e "${YELLOW}Spotify credentials are not set for the User app.${NC}"
  read -p "Enter your Spotify Client ID (or press Enter to skip): " SPOTIFY_ID
  if [[ ! -z "$SPOTIFY_ID" ]]; then
    heroku config:set SPOTIFY_CLIENT_ID=$SPOTIFY_ID --app $USER_APP
    
    read -p "Enter your Spotify Client Secret: " SPOTIFY_SECRET
    heroku config:set SPOTIFY_CLIENT_SECRET=$SPOTIFY_SECRET --app $USER_APP
    echo -e "✅ Set Spotify credentials"
  else
    echo -e "${YELLOW}Skipping Spotify credentials setup${NC}"
  fi
fi

# Configure Promoter app (Google authentication)
echo -e "\n${GREEN}Step 3: Configuring Promoter Dashboard (${PROMOTER_APP})...${NC}"
# Set NextAuth URL
heroku config:set NEXTAUTH_URL=https://$PROMOTER_APP.herokuapp.com --app $PROMOTER_APP

# Generate NextAuth secret if not set
if ! heroku config:get NEXTAUTH_SECRET --app $PROMOTER_APP &> /dev/null; then
  RANDOM_SECRET=$(openssl rand -base64 32)
  heroku config:set NEXTAUTH_SECRET=$RANDOM_SECRET --app $PROMOTER_APP
  echo -e "✅ Generated and set NEXTAUTH_SECRET"
else
  echo -e "✅ NEXTAUTH_SECRET is already set"
fi

# Set API base URL
heroku config:set API_BASE_URL=https://$API_APP.herokuapp.com --app $PROMOTER_APP
echo -e "✅ Set API_BASE_URL to point to the API app"

# Ask for Google credentials if not set
if ! heroku config:get GOOGLE_CLIENT_ID --app $PROMOTER_APP &> /dev/null; then
  echo -e "${YELLOW}Google credentials are not set for the Promoter app.${NC}"
  read -p "Enter your Google Client ID (or press Enter to skip): " GOOGLE_ID
  if [[ ! -z "$GOOGLE_ID" ]]; then
    heroku config:set GOOGLE_CLIENT_ID=$GOOGLE_ID --app $PROMOTER_APP
    
    read -p "Enter your Google Client Secret: " GOOGLE_SECRET
    heroku config:set GOOGLE_CLIENT_SECRET=$GOOGLE_SECRET --app $PROMOTER_APP
    echo -e "✅ Set Google credentials"
  else
    echo -e "${YELLOW}Skipping Google credentials setup${NC}"
  fi
fi

# Configure Platform app (main landing page)
echo -e "\n${GREEN}Step 4: Configuring Main Platform (${PLATFORM_APP})...${NC}"
# Set URLs for user and promoter apps
heroku config:set USER_APP_URL=https://$USER_APP.herokuapp.com --app $PLATFORM_APP
heroku config:set PROMOTER_APP_URL=https://$PROMOTER_APP.herokuapp.com --app $PLATFORM_APP
echo -e "✅ Set USER_APP_URL and PROMOTER_APP_URL"

# Deploy all components
echo -e "\n${GREEN}Step 5: Deploying all components...${NC}"
echo -e "${YELLOW}Note: This step assumes you have separate directories for each component.${NC}"
echo -e "${YELLOW}If your project structure is different, you may need to deploy manually.${NC}"

read -p "Do you want to deploy all components now? (y/n): " DEPLOY_ALL
if [[ $DEPLOY_ALL == "y" ]]; then
  # Ask for component directories
  read -p "Enter the directory path for the API component: " API_DIR
  read -p "Enter the directory path for the User component: " USER_DIR
  read -p "Enter the directory path for the Promoter component: " PROMOTER_DIR
  read -p "Enter the directory path for the Platform component: " PLATFORM_DIR
  
  # Deploy API component
  if [[ -d "$API_DIR" ]]; then
    echo -e "\n${GREEN}Deploying API component...${NC}"
    cd "$API_DIR"
    git init
    heroku git:remote -a $API_APP
    git add .
    git commit -m "Deploy API component"
    git push heroku main --force
    echo -e "✅ Deployed API component"
  else
    echo -e "${RED}Error: API directory not found${NC}"
  fi
  
  # Deploy User component
  if [[ -d "$USER_DIR" ]]; then
    echo -e "\n${GREEN}Deploying User component...${NC}"
    cd "$USER_DIR"
    git init
    heroku git:remote -a $USER_APP
    git add .
    git commit -m "Deploy User component"
    git push heroku main --force
    echo -e "✅ Deployed User component"
  else
    echo -e "${RED}Error: User directory not found${NC}"
  fi
  
  # Deploy Promoter component
  if [[ -d "$PROMOTER_DIR" ]]; then
    echo -e "\n${GREEN}Deploying Promoter component...${NC}"
    cd "$PROMOTER_DIR"
    git init
    heroku git:remote -a $PROMOTER_APP
    git add .
    git commit -m "Deploy Promoter component"
    git push heroku main --force
    echo -e "✅ Deployed Promoter component"
  else
    echo -e "${RED}Error: Promoter directory not found${NC}"
  fi
  
  # Deploy Platform component
  if [[ -d "$PLATFORM_DIR" ]]; then
    echo -e "\n${GREEN}Deploying Platform component...${NC}"
    cd "$PLATFORM_DIR"
    git init
    heroku git:remote -a $PLATFORM_APP
    git add .
    git commit -m "Deploy Platform component"
    git push heroku main --force
    echo -e "✅ Deployed Platform component"
  else
    echo -e "${RED}Error: Platform directory not found${NC}"
  fi
else
  echo -e "${YELLOW}Skipping deployment step${NC}"
fi

# Restart all apps
echo -e "\n${GREEN}Step 6: Restarting all applications...${NC}"
heroku restart --app $API_APP
heroku restart --app $USER_APP
heroku restart --app $PROMOTER_APP
heroku restart --app $PLATFORM_APP
echo -e "✅ Restarted all applications"

echo -e "\n${BLUE}=== Deployment process completed! ===${NC}"
echo -e "Your applications should now be accessible at:"
echo -e "Main Platform: https://$PLATFORM_APP.herokuapp.com/"
echo -e "User Dashboard: https://$USER_APP.herokuapp.com/"
echo -e "Promoter Dashboard: https://$PROMOTER_APP.herokuapp.com/"
echo -e "Backend API: https://$API_APP.herokuapp.com/"
echo -e "\nIf you encounter any issues, check the logs for each app:"
echo -e "heroku logs --tail --app $PLATFORM_APP"
echo -e "heroku logs --tail --app $USER_APP"
echo -e "heroku logs --tail --app $PROMOTER_APP"
echo -e "heroku logs --tail --app $API_APP"
