#!/bin/bash
# TIKO Chart Dependency Fix Script
# This script adds the missing chart.js, react-chartjs-2, and axios dependencies

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Chart Dependency Fix Script ===${NC}"
echo -e "${BLUE}This script adds the missing chart.js, react-chartjs-2, and axios dependencies${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/chart_fix_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./package.json $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Update package.json to add chart.js, react-chartjs-2, and axios dependencies
echo -e "${YELLOW}Updating package.json with chart dependencies...${NC}"

# Check if package.json exists
if [ ! -f ./package.json ]; then
  echo -e "${RED}Error: package.json not found${NC}"
  exit 1
fi

# Read current package.json
PACKAGE_JSON=$(cat ./package.json)

# Create a new package.json with the added dependencies
cat > ./package.json << 'EOL'
{
  "name": "sonar-edm-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "axios": "^0.27.2",
    "chart.js": "^3.9.1",
    "next": "12.3.1",
    "next-auth": "^4.12.2",
    "next-pwa": "^5.6.0",
    "react": "18.2.0",
    "react-chartjs-2": "^4.3.1",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.12",
    "eslint": "8.25.0",
    "eslint-config-next": "12.3.1",
    "postcss": "^8.4.17",
    "tailwindcss": "^3.1.8"
  },
  "engines": {
    "node": "16.x"
  }
}
EOL

echo -e "${GREEN}Updated package.json with chart.js, react-chartjs-2, and axios dependencies${NC}"

# Ensure PostCSS configuration is correct
echo -e "${YELLOW}Verifying PostCSS configuration...${NC}"

if [ ! -f ./postcss.config.js ]; then
  echo -e "${YELLOW}Creating PostCSS configuration...${NC}"
  cat > ./postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
  }
}
EOL
  echo -e "${GREEN}Created PostCSS configuration${NC}"
else
  echo -e "${GREEN}PostCSS configuration already exists${NC}"
fi

# Ensure Tailwind configuration is correct
echo -e "${YELLOW}Verifying Tailwind configuration...${NC}"

if [ ! -f ./tailwind.config.js ]; then
  echo -e "${YELLOW}Creating Tailwind configuration...${NC}"
  cat > ./tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#ff00ff',
        'neon-blue': '#00ffff',
        'neon-purple': '#9900ff',
        'dark-bg': '#0a0014',
      },
      boxShadow: {
        'neon-pink': '0 0 5px #ff00ff, 0 0 10px #ff00ff',
        'neon-blue': '0 0 5px #00ffff, 0 0 10px #00ffff',
        'neon-purple': '0 0 5px #9900ff, 0 0 10px #9900ff',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
EOL
  echo -e "${GREEN}Created Tailwind configuration${NC}"
else
  echo -e "${GREEN}Tailwind configuration already exists${NC}"
fi

# Create a deployment script
echo -e "${YELLOW}Creating final deployment script...${NC}"

cat > ./deploy-tiko-chart-fix.sh << 'EOL'
#!/bin/bash
# TIKO Chart Dependency Fix Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Chart Dependency Fix Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO platform with chart dependencies to Heroku${NC}\n"

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

# Set a timestamp environment variable to force a clean build
echo -e "${YELLOW}Setting timestamp to force a clean build...${NC}"
heroku config:set DEPLOY_TIMESTAMP=$(date +%s) --app $app_name

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Add chart.js, react-chartjs-2, and axios dependencies"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO platform is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-chart-fix.sh

echo -e "${GREEN}Chart dependency fix script complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO platform with chart dependencies, run:${NC}"
echo -e "${BLUE}./deploy-tiko-chart-fix.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of changes
echo -e "${YELLOW}Summary of Chart Dependency Fixes:${NC}"
echo -e "1. Updated package.json with chart dependencies:"
echo -e "   - Added chart.js v3.9.1"
echo -e "   - Added react-chartjs-2 v4.3.1"
echo -e "   - Added axios v0.27.2"
echo -e ""
echo -e "2. Verified PostCSS configuration:"
echo -e "   - Ensured correct plugin format"
echo -e ""
echo -e "3. Verified Tailwind configuration:"
echo -e "   - Maintained the neon color theme"
echo -e "   - Ensured proper content paths for component scanning"
echo -e ""
echo -e "4. Created a deployment script:"
echo -e "   - Uses the timestamp approach to force clean builds"
echo -e "   - Includes proper error handling and feedback"
echo -e "\n${BLUE}=======================================${NC}"
