#!/bin/bash

# Deployment script for Sonar EDM Platform
# This script automates the process of fixing import paths and deploying to Heroku

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform Deployment Script ===${NC}"
echo -e "${BLUE}This script will fix import paths and deploy your application to Heroku${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js before running this script.${NC}"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install Git before running this script.${NC}"
    exit 1
fi

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${YELLOW}Warning: Heroku CLI is not installed. You'll need to install it to deploy to Heroku.${NC}"
    echo -e "${YELLOW}Visit https://devcenter.heroku.com/articles/heroku-cli to install.${NC}"
    read -p "Continue with the fix script only? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    HEROKU_INSTALLED=false
else
    HEROKU_INSTALLED=true
fi

# Step 1: Run the fix script
echo -e "${GREEN}Step 1: Running the import path fix script...${NC}"
node fix_import_paths.js

# Check if the fix script was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: The fix script encountered an error. Please check the output above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Import paths fixed successfully!${NC}"
echo ""

# Step 2: Commit the changes
echo -e "${GREEN}Step 2: Committing the changes...${NC}"
cd sonar-edm-platform
git add .
git commit -m "Fix import paths in API files"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: Could not commit changes. You may need to configure Git or there were no changes to commit.${NC}"
    echo -e "${YELLOW}If you haven't configured Git, run:${NC}"
    echo "  git config --global user.email \"your-email@example.com\""
    echo "  git config --global user.name \"Your Name\""
    echo ""
else
    echo -e "${GREEN}Changes committed successfully!${NC}"
    echo ""
fi

# Step 3: Deploy to Heroku if installed
if [ "$HEROKU_INSTALLED" = true ]; then
    echo -e "${GREEN}Step 3: Deploying to Heroku...${NC}"
    echo -e "${YELLOW}Note: You need to be logged in to Heroku and have access to the application.${NC}"
    
    # Check if user is logged in to Heroku
    heroku whoami &> /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}You are not logged in to Heroku. Please log in:${NC}"
        heroku login
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Could not log in to Heroku. Deployment aborted.${NC}"
            echo -e "${YELLOW}You can still push the changes manually with:${NC}"
            echo "  git push heroku main:main --force"
            exit 1
        fi
    fi
    
    # Check if Heroku remote exists
    if ! git remote | grep -q "heroku"; then
        echo -e "${YELLOW}Heroku remote not found. Please enter your Heroku app name:${NC}"
        read -p "Heroku app name: " heroku_app
        
        if [ -z "$heroku_app" ]; then
            echo -e "${RED}Error: No app name provided. Deployment aborted.${NC}"
            echo -e "${YELLOW}You can add the remote manually with:${NC}"
            echo "  git remote add heroku https://git.heroku.com/your-app-name.git"
            exit 1
        fi
        
        git remote add heroku "https://git.heroku.com/${heroku_app}.git"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Could not add Heroku remote. Deployment aborted.${NC}"
            exit 1
        fi
    fi
    
    # Push to Heroku
    echo -e "${BLUE}Pushing to Heroku...${NC}"
    git push heroku main:main --force
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Could not push to Heroku. Please check the error message above.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Deployment to Heroku completed successfully!${NC}"
    echo ""
    
    # Open the app in browser
    echo -e "${BLUE}Opening the app in your browser...${NC}"
    heroku open
else
    echo -e "${YELLOW}Step 3: Skipping Heroku deployment (Heroku CLI not installed)${NC}"
    echo -e "${YELLOW}To deploy manually after installing Heroku CLI:${NC}"
    echo "  1. Log in to Heroku: heroku login"
    echo "  2. Add Heroku remote: git remote add heroku https://git.heroku.com/your-app-name.git"
    echo "  3. Push to Heroku: git push heroku main:main --force"
    echo ""
fi

echo -e "${GREEN}=== Process completed! ===${NC}"
echo -e "${BLUE}If you encounter any issues, please refer to the error messages above.${NC}"
echo -e "${BLUE}For more help, visit the Heroku documentation: https://devcenter.heroku.com/articles/git${NC}"
