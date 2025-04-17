#!/bin/bash

# This script will copy the implementation files to the correct locations in your project
# and then deploy the changes to Heroku

echo "=====================================================
  Sonar EDM Platform - Implementation Script
====================================================="

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define project directory
PROJECT_DIR="/c/sonar/users/sonar-edm-user"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
  echo "Please update the PROJECT_DIR variable in this script with the correct path."
  exit 1
fi

# Create backup directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_DIR/backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR/pages/users" "$BACKUP_DIR/pages/api/auth"

echo -e "${YELLOW}Creating backup of existing files in $BACKUP_DIR${NC}"

# Backup existing files
if [ -f "$PROJECT_DIR/pages/users/music-taste.js" ]; then
  cp "$PROJECT_DIR/pages/users/music-taste.js" "$BACKUP_DIR/pages/users/"
fi

if [ -f "$PROJECT_DIR/pages/users/profile.js" ]; then
  cp "$PROJECT_DIR/pages/users/profile.js" "$BACKUP_DIR/pages/users/"
fi

if [ -f "$PROJECT_DIR/pages/users/settings.js" ]; then
  cp "$PROJECT_DIR/pages/users/settings.js" "$BACKUP_DIR/pages/users/"
fi

if [ -f "$PROJECT_DIR/pages/api/auth/[...nextauth].js" ]; then
  cp "$PROJECT_DIR/pages/api/auth/[...nextauth].js" "$BACKUP_DIR/pages/api/auth/"
fi

# Copy implementation files
echo -e "${YELLOW}Copying implementation files to your project...${NC}"

# Create directories if they don't exist
mkdir -p "$PROJECT_DIR/pages/users"
mkdir -p "$PROJECT_DIR/pages/api/auth"

# Copy the files from this directory to the project
cp "profile.js" "$PROJECT_DIR/pages/users/"
cp "settings.js" "$PROJECT_DIR/pages/users/"
cp "music-taste.js" "$PROJECT_DIR/pages/users/"
cp "[...nextauth].js" "$PROJECT_DIR/pages/api/auth/"

echo -e "${GREEN}Files copied successfully!${NC}"

# Create Heroku deployment script
DEPLOY_SCRIPT="$PROJECT_DIR/deploy-to-heroku.sh"
cat > "$DEPLOY_SCRIPT" << 'EOF'
#!/bin/bash

echo "=====================================================
  Sonar EDM Platform - Heroku Deployment Script
====================================================="

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "pages" ] || [ ! -d "components" ] || [ ! -d "styles" ]; then
  echo -e "${RED}Error: This script must be run from the root of your Sonar EDM project.${NC}"
  echo "Please navigate to your project root directory and try again."
  exit 1
fi

# Create backup branch
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BRANCH="backup-${TIMESTAMP}"

echo -e "${YELLOW}Creating backup branch: ${BACKUP_BRANCH}${NC}"
git checkout -b $BACKUP_BRANCH

# Add all changes
echo -e "${YELLOW}Adding all changes to git...${NC}"
git add pages/users/profile.js
git add pages/users/settings.js
git add pages/users/music-taste.js
git add pages/api/auth/[...nextauth].js

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Implement neon EDM-themed Music Taste page and fix missing pages"

# Switch back to main branch
echo -e "${YELLOW}Switching back to main branch...${NC}"
git checkout main

# Merge changes from backup branch
echo -e "${YELLOW}Merging changes from backup branch...${NC}"
git merge $BACKUP_BRANCH

# Push to Heroku
echo -e "${YELLOW}Pushing changes to Heroku...${NC}"
git push heroku main

# Check if push was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deployment successful!${NC}"
  echo ""
  echo "Your application is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com"
  echo ""
  echo "You can check the following pages:"
  echo "- Music Taste page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/music-taste"
  echo "- Profile page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/profile"
  echo "- Settings page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/settings"
  echo "- Events page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/events"
  echo ""
  echo "If you need to revert the changes, you can use the backup branch:"
  echo "git checkout $BACKUP_BRANCH"
  echo "git push -f heroku $BACKUP_BRANCH:main"
  echo ""
  echo "Thank you for using the Sonar EDM Platform Heroku Deployment Script!"
else
  echo -e "${RED}Deployment failed.${NC}"
  echo "Please check the error messages above and try again."
  echo "You can manually push your changes with: git push heroku main"
  echo ""
  echo "If you need to revert to the previous state, you can use the backup branch:"
  echo "git checkout $BACKUP_BRANCH"
fi
EOF

# Make the deployment script executable
chmod +x "$DEPLOY_SCRIPT"

echo -e "${GREEN}Deployment script created at $DEPLOY_SCRIPT${NC}"
echo ""
echo "To deploy your changes to Heroku:"
echo "1. Navigate to your project directory: cd $PROJECT_DIR"
echo "2. Run the deployment script: ./deploy-to-heroku.sh"
echo ""
echo "After deployment, you can access your pages at:"
echo "- Music Taste page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/music-taste"
echo "- Profile page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/profile"
echo "- Settings page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/settings"
echo "- Events page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/events"
echo ""
echo "Thank you for using the Sonar EDM Platform Implementation Script!"
