#!/bin/bash
# Fix for Next.js build failure on Heroku
# This script will update Next.js dependencies and clear caches

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Next.js build failure fix...${NC}"

# Update Next.js to latest version
echo -e "${YELLOW}Updating Next.js to latest version...${NC}"
npm install next@latest

# Clear node_modules and reinstall
echo -e "${YELLOW}Clearing node_modules and reinstalling dependencies...${NC}"
rm -rf node_modules
rm package-lock.json
npm install

# Create a .npmrc file to force clean installs
echo -e "${YELLOW}Creating .npmrc file to force clean installs...${NC}"
cat > ".npmrc" << 'EOL'
# Force clean installs
force=true
# Disable package-lock for more reliable builds
package-lock=false
EOL

# Create a new Procfile to ensure proper startup
echo -e "${YELLOW}Creating Procfile to ensure proper startup...${NC}"
cat > "Procfile" << 'EOL'
web: npm run start
EOL

# Update package.json scripts
echo -e "${YELLOW}Updating package.json scripts...${NC}"
# Using node to update package.json
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Update scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'heroku-postbuild': 'npm run build',
  'start': 'next start -p \$PORT'
};

// Ensure proper Node.js version
packageJson.engines = {
  'node': '18.x'
};

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
"

# Create deployment script
echo -e "${GREEN}Creating deployment script with cache purging...${NC}"
cat > "deploy-with-cache-purge.sh" << 'EOL'
#!/bin/bash
# Deployment script with cache purging

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment with cache purging...${NC}"

# Install Heroku builds plugin if not already installed
echo -e "${YELLOW}Installing Heroku builds plugin...${NC}"
heroku plugins:install heroku-builds || true

# Purge Heroku build cache
echo -e "${YELLOW}Purging Heroku build cache...${NC}"
heroku builds:cache:purge -a sonar-edm-staging --confirm sonar-edm-staging

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Fix Next.js dependency issues and update build configuration"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}To monitor logs, run: heroku logs --tail --app sonar-edm-staging${NC}"
echo -e "${YELLOW}To verify the implementation, visit: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard${NC}"
EOL

# Make deployment script executable
chmod +x "deploy-with-cache-purge.sh"

echo -e "${GREEN}Fix preparation complete!${NC}"
echo -e "${YELLOW}To deploy with cache purging, run: ./deploy-with-cache-purge.sh${NC}"
echo -e "${YELLOW}This should resolve the Next.js build failure on Heroku.${NC}"
