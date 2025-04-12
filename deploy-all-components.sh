#!/bin/bash
# Comprehensive Deployment Script for Sonar EDM Platform
# This script deploys all components to their respective Heroku apps

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform Comprehensive Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy all components to their respective Heroku apps${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install Git before running this script.${NC}"
    exit 1
fi

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}Error: Heroku CLI is not installed. Please install it before running this script.${NC}"
    echo -e "${YELLOW}Visit https://devcenter.heroku.com/articles/heroku-cli to install.${NC}"
    exit 1
fi

# Check if user is logged in to Heroku
heroku whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You are not logged in to Heroku. Please log in:${NC}"
    heroku login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Could not log in to Heroku. Deployment aborted.${NC}"
        exit 1
    fi
fi

# Function to deploy a component
deploy_component() {
    local component_dir=$1
    local heroku_app=$2
    local component_name=$3
    
    echo -e "\n${BLUE}=== Deploying ${component_name} (${heroku_app}) ===${NC}"
    
    # Navigate to component directory
    cd "$component_dir"
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        echo -e "${YELLOW}Initializing git repository for ${component_name}...${NC}"
        git init
        git add .
        git commit -m "Initial commit for ${component_name}"
    fi
    
    # Check if Heroku remote exists
    if ! git remote | grep -q "heroku"; then
        echo -e "${YELLOW}Adding Heroku remote for ${heroku_app}...${NC}"
        git remote add heroku "https://git.heroku.com/${heroku_app}.git"
    else
        # Update the Heroku remote to ensure it's pointing to the correct app
        echo -e "${YELLOW}Updating Heroku remote for ${heroku_app}...${NC}"
        git remote set-url heroku "https://git.heroku.com/${heroku_app}.git"
    fi
    
    # Add and commit any changes
    git add .
    git commit -m "Update ${component_name} for deployment" || true
    
    # Push to Heroku
    echo -e "${GREEN}Pushing ${component_name} to Heroku (${heroku_app})...${NC}"
    git push heroku main:main --force
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Could not push ${component_name} to Heroku. Please check the error message above.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}${component_name} deployed successfully to ${heroku_app}!${NC}"
    return 0
}

# Main deployment process
echo -e "${BLUE}Starting deployment process for all components...${NC}"

# 1. Deploy Backend API
deploy_component "/home/ubuntu/sonar-project/sonar-edm-platform/sonar-edm-api" "sonar-edm-api" "Backend API"
api_status=$?

# 2. Deploy User Dashboard
deploy_component "/home/ubuntu/sonar-project/sonar-edm-platform/sonar-edm-user" "sonar-edm-user" "User Dashboard"
user_status=$?

# 3. Deploy Promoter Dashboard
deploy_component "/home/ubuntu/sonar-project/sonar-edm-platform/sonar-edm-promoter" "sonar-edm-promoter" "Promoter Dashboard"
promoter_status=$?

# 4. Deploy Main Platform
deploy_component "/home/ubuntu/sonar-project/sonar-edm-platform" "sonar-edm-platform" "Main Platform"
platform_status=$?

# Summary
echo -e "\n${BLUE}=== Deployment Summary ===${NC}"

if [ $api_status -eq 0 ]; then
    echo -e "${GREEN}✓ Backend API (sonar-edm-api) deployed successfully${NC}"
else
    echo -e "${RED}✗ Backend API (sonar-edm-api) deployment failed${NC}"
fi

if [ $user_status -eq 0 ]; then
    echo -e "${GREEN}✓ User Dashboard (sonar-edm-user) deployed successfully${NC}"
else
    echo -e "${RED}✗ User Dashboard (sonar-edm-user) deployment failed${NC}"
fi

if [ $promoter_status -eq 0 ]; then
    echo -e "${GREEN}✓ Promoter Dashboard (sonar-edm-promoter) deployed successfully${NC}"
else
    echo -e "${RED}✗ Promoter Dashboard (sonar-edm-promoter) deployment failed${NC}"
fi

if [ $platform_status -eq 0 ]; then
    echo -e "${GREEN}✓ Main Platform (sonar-edm-platform) deployed successfully${NC}"
else
    echo -e "${RED}✗ Main Platform (sonar-edm-platform) deployment failed${NC}"
fi

echo -e "\n${BLUE}=== Deployment URLs ===${NC}"
echo -e "Main Platform: https://sonar-edm-platform.herokuapp.com/"
echo -e "User Dashboard: https://sonar-edm-user.herokuapp.com/"
echo -e "Promoter Dashboard: https://sonar-edm-promoter.herokuapp.com/"
echo -e "Backend API: https://sonar-edm-api.herokuapp.com/"

echo -e "\n${GREEN}=== Deployment process completed! ===${NC}"
echo -e "${BLUE}If you encountered any issues, please refer to the error messages above.${NC}"
echo -e "${BLUE}For more help, visit the Heroku documentation: https://devcenter.heroku.com/articles/git${NC}"
