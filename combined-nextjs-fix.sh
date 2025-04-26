#!/bin/bash
# Combined Next.js Deployment Fix for TIKO Platform
# This script combines user-provided instructions with additional recommendations

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting combined Next.js deployment fix...${NC}"

# Create a backup of package.json
echo -e "${YELLOW}Creating backup of package.json...${NC}"
cp package.json package.json.bak

# Uninstall and reinstall Next.js with specific version
echo -e "${YELLOW}Reinstalling Next.js with version 13.4.19...${NC}"
npm uninstall next
npm install next@13.4.19 react@18.2.0 react-dom@18.2.0

# Update package.json to ensure specific versions
echo -e "${YELLOW}Updating package.json...${NC}"
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Ensure specific versions for core dependencies
packageJson.dependencies = {
  ...packageJson.dependencies,
  'next': '13.4.19',
  'react': '18.2.0',
  'react-dom': '18.2.0'
};

// Update scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'dev': 'next dev',
  'build': 'next build',
  'start': 'next start -p \$PORT',
  'heroku-postbuild': 'npm run build'
};

// Ensure proper Node.js version
packageJson.engines = {
  'node': '18.x',
  'npm': '8.x'
};

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
"

# Create .npmrc file with recommended settings
echo -e "${YELLOW}Creating .npmrc file with recommended settings...${NC}"
cat > ".npmrc" << 'EOL'
# Use legacy peer deps to avoid compatibility issues
legacy-peer-deps=true
# Force clean installs
force=true
EOL

# Create or update .gitignore file
echo -e "${YELLOW}Updating .gitignore file...${NC}"
cat > ".gitignore" << 'EOL'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel
EOL

# Create optimized next.config.js
echo -e "${YELLOW}Creating optimized next.config.js...${NC}"
cat > "next.config.js" << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Disable experimental features that might cause issues
    appDir: false,
    serverComponentsExternalPackages: []
  }
};

module.exports = nextConfig;
EOL

# Create Procfile for Heroku
echo -e "${YELLOW}Creating Procfile...${NC}"
cat > "Procfile" << 'EOL'
web: npm run start
EOL

# Remove node_modules from git if they were accidentally added
echo -e "${YELLOW}Removing node_modules from git if present...${NC}"
git rm -r --cached node_modules 2>/dev/null || true
git rm -r --cached .next 2>/dev/null || true

# Create deployment script
echo -e "${GREEN}Creating combined deployment script...${NC}"
cat > "deploy-combined-fix.sh" << 'EOL'
#!/bin/bash
# Combined deployment script for Next.js on Heroku

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting combined deployment process...${NC}"

# Set memory configuration
echo -e "${YELLOW}Setting memory configuration...${NC}"
heroku config:set NODE_OPTIONS="--max_old_space_size=2560" --app sonar-edm-user

# Set build environment variables
echo -e "${YELLOW}Setting build environment variables...${NC}"
heroku config:set NPM_CONFIG_PRODUCTION=false --app sonar-edm-user

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Combined Next.js deployment fix"

# Option 1: Standard deployment with repo reset
deploy_standard() {
  echo -e "${YELLOW}Resetting Heroku repository...${NC}"
  heroku repo:reset --app sonar-edm-user
  
  echo -e "${YELLOW}Pushing to Heroku...${NC}"
  git push heroku main
}

# Option 2: Deploy from a new branch
deploy_new_branch() {
  echo -e "${YELLOW}Creating deployment branch...${NC}"
  git checkout -b deployment-fix
  
  echo -e "${YELLOW}Pushing to Heroku from deployment branch...${NC}"
  git push heroku deployment-fix:main
}

# Option 3: Use specific buildpacks
deploy_with_buildpacks() {
  echo -e "${YELLOW}Clearing and setting buildpacks...${NC}"
  heroku buildpacks:clear --app sonar-edm-user
  heroku buildpacks:set heroku/nodejs --app sonar-edm-user
  
  echo -e "${YELLOW}Pushing to Heroku...${NC}"
  git push heroku main
}

# Ask which deployment method to use
echo -e "${GREEN}Choose deployment method:${NC}"
echo -e "1) Standard deployment with repo reset"
echo -e "2) Deploy from a new branch"
echo -e "3) Use specific buildpacks"
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    deploy_standard
    ;;
  2)
    deploy_new_branch
    ;;
  3)
    deploy_with_buildpacks
    ;;
  *)
    echo -e "${RED}Invalid choice. Using standard deployment.${NC}"
    deploy_standard
    ;;
esac

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}To monitor logs, run: heroku logs --tail --app sonar-edm-user${NC}"
echo -e "${YELLOW}To verify the implementation, visit: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/dashboard${NC}"
EOL

# Make deployment script executable
chmod +x "deploy-combined-fix.sh"

echo -e "${GREEN}Combined fix preparation complete!${NC}"
echo -e "${YELLOW}To deploy with the combined fix, run: ./deploy-combined-fix.sh${NC}"
echo -e "${YELLOW}This script combines your approach with our additional recommendations.${NC}"
echo -e "${YELLOW}It offers three deployment methods to choose from based on your preference.${NC}"
