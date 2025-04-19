#!/bin/bash
# TIKO Tailwind CSS Fix Script
# This script fixes the Tailwind CSS dependency issue by moving it from devDependencies to dependencies

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Tailwind CSS Fix Script ===${NC}"
echo -e "${BLUE}This script fixes the Tailwind CSS dependency issue by moving it from devDependencies to dependencies${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/tailwind_fix_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./package.json $BACKUP_DIR/ 2>/dev/null || :
cp -r ./postcss.config.js $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Update package.json to move tailwindcss from devDependencies to dependencies
echo -e "${YELLOW}Updating package.json to move tailwindcss to dependencies...${NC}"

# Check if package.json exists
if [ ! -f ./package.json ]; then
  echo -e "${RED}Error: package.json not found${NC}"
  exit 1
fi

# Create a new package.json with tailwindcss as a regular dependency
cat > ./package.json << 'EOL'
{
  "name": "sonar-edm-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "heroku-postbuild": "npm run build"
  },
  "dependencies": {
    "axios": "^0.27.2",
    "chart.js": "^3.9.1",
    "critters": "^0.0.16",
    "mongodb": "^4.10.0",
    "next": "12.3.1",
    "next-auth": "^4.12.2",
    "next-pwa": "^5.6.0",
    "react": "18.2.0",
    "react-chartjs-2": "^4.3.1",
    "react-dom": "18.2.0",
    "react-icons": "^4.4.0",
    "tailwindcss": "^3.1.8",
    "autoprefixer": "^10.4.12",
    "postcss": "^8.4.17"
  },
  "devDependencies": {
    "eslint": "8.25.0",
    "eslint-config-next": "12.3.1"
  },
  "engines": {
    "node": "16.x"
  }
}
EOL

echo -e "${GREEN}Updated package.json with tailwindcss as a regular dependency${NC}"

# Ensure PostCSS configuration is correct
echo -e "${YELLOW}Ensuring PostCSS configuration is correct...${NC}"

cat > ./postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
EOL

echo -e "${GREEN}Created proper PostCSS configuration${NC}"

# Create a Procfile for Heroku
echo -e "${YELLOW}Creating Procfile for Heroku...${NC}"

cat > ./Procfile << 'EOL'
web: npm start
EOL

echo -e "${GREEN}Created Procfile for Heroku${NC}"

# Create a deployment script
echo -e "${YELLOW}Creating final deployment script...${NC}"

cat > ./deploy-tiko-tailwind-fix.sh << 'EOL'
#!/bin/bash
# TIKO Tailwind CSS Fix Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Tailwind CSS Fix Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO platform with Tailwind CSS properly configured${NC}\n"

# Check if heroku CLI is installed
if ! command -v heroku &> /dev/null; then
  echo -e "${RED}Error: Heroku CLI is not installed.${NC}"
  echo -e "${YELLOW}Please install the Heroku CLI and try again.${NC}"
  exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: git is not installed.${NC}"
  echo -e "${YELLOW}Please install git and try again.${NC}"
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

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
heroku config:set NEXTAUTH_URL=https://sonar-edm-user-50e4fb038f6e.herokuapp.com --app $app_name
heroku config:set NODE_ENV=production --app $app_name
heroku config:set NPM_CONFIG_PRODUCTION=false --app $app_name

# Set a timestamp environment variable to force a clean build
echo -e "${YELLOW}Setting timestamp to force a clean build...${NC}"
heroku config:set DEPLOY_TIMESTAMP=$(date +%s) --app $app_name

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Fix Tailwind CSS dependency issue by moving it to regular dependencies"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO platform is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-tailwind-fix.sh

echo -e "${GREEN}Tailwind CSS fix script complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO platform with Tailwind CSS properly configured, run:${NC}"
echo -e "${BLUE}./deploy-tiko-tailwind-fix.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of changes
echo -e "${YELLOW}Summary of Tailwind CSS Fixes:${NC}"
echo -e "1. Updated package.json:"
echo -e "   - Moved tailwindcss from devDependencies to dependencies"
echo -e "   - Moved autoprefixer and postcss to dependencies"
echo -e "   - Added heroku-postbuild script"
echo -e ""
echo -e "2. Created proper PostCSS configuration:"
echo -e "   - Ensured correct plugin format"
echo -e ""
echo -e "3. Created Procfile for Heroku:"
echo -e "   - Specified web process command"
echo -e ""
echo -e "4. Created a deployment script:"
echo -e "   - Sets NPM_CONFIG_PRODUCTION=false to ensure all dependencies are installed"
echo -e "   - Uses the timestamp approach to force clean builds"
echo -e "   - Includes proper error handling and feedback"
echo -e "\n${BLUE}=======================================${NC}"
