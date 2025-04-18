#!/bin/bash
# TIKO Final Adjustments Script
# This script adjusts the TIKO font thickness and bullet alignment

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Final Adjustments Script ===${NC}"
echo -e "${BLUE}This script adjusts the TIKO font thickness and bullet alignment${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/final_adjustments_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./pages/index.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/Home.module.css $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Update the Home.module.css file with final adjustments
echo -e "${YELLOW}Updating Home.module.css with final adjustments...${NC}"

cat > ./styles/Home.module.css << 'EOL'
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 1rem;
  background-color: #0a0014;
  background-image: radial-gradient(circle at 50% 0%, #1a0033 0%, #0a0014 70%);
  color: #fff;
  font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.container.loaded {
  opacity: 1;
  transform: translateY(0);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 0;
}

.logoContainer {
  margin-bottom: 2rem;
  text-align: center;
}

.logo {
  font-size: 8rem;
  font-weight: 400; /* Thinner font weight */
  margin: 0;
  color: #ff00ff;
  text-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
  letter-spacing: 0.01em;
  line-height: 0.8;
  font-family: 'Anton', 'Archivo Black', sans-serif;
  will-change: text-shadow;
  transform: translateZ(0);
  animation: glow 3s infinite ease-in-out;
  text-transform: uppercase;
  height: auto;
  padding-bottom: 0.1em;
  font-stretch: expanded; /* Make the font thinner by stretching */
}

.taglineContainer {
  margin-bottom: 2.5rem;
  text-align: center;
}

.tagline {
  font-size: 1.75rem;
  color: #00e5ff;
  margin: 0;
  line-height: 1.4;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.spotifyButton {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 2rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(90deg, #4776E6 0%, #8E54E9 100%);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  margin-bottom: 3rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  max-width: 320px;
  font-family: 'Inter', sans-serif;
  will-change: transform;
  transform: translateZ(0);
}

.spotifyButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(142, 84, 233, 0.3);
}

.spotifyButton:active {
  transform: translateY(0);
}

.spotifyIcon {
  display: inline-flex;
  margin-right: 0.75rem;
  color: white;
  width: 24px;
  height: 24px;
}

.featuresContainer {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 320px;
  margin: 0 auto; /* Center the container */
}

.featureItem {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.bullet {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 1rem;
  flex-shrink: 0;
}

.purpleBullet {
  background-color: #9966ff;
}

.pinkBullet {
  background-color: #ff00ff;
}

.blueBullet {
  background-color: #00e5ff;
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
}

/* Media Queries for Responsive Design */
@media (min-width: 640px) {
  .main {
    padding: 4rem 0;
  }
  
  .logo {
    font-size: 10rem;
  }
  
  .tagline {
    font-size: 2rem;
  }
  
  .spotifyButton {
    font-size: 1.5rem;
    padding: 1rem 2.5rem;
  }
  
  .featuresContainer {
    max-width: 400px;
  }
  
  .featureItem {
    font-size: 1.25rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
  
  .logo {
    font-size: 12rem;
  }
  
  .tagline {
    font-size: 2.25rem;
  }
  
  .spotifyButton {
    max-width: 400px;
  }
  
  .featuresContainer {
    max-width: 500px;
  }
}

/* Animation for the logo glow effect */
@keyframes glow {
  0% {
    text-shadow: 0 0 10px rgba(255, 0, 255, 0.7);
  }
  50% {
    text-shadow: 0 0 20px rgba(255, 0, 255, 0.9), 0 0 30px rgba(255, 0, 255, 0.6);
  }
  100% {
    text-shadow: 0 0 10px rgba(255, 0, 255, 0.7);
  }
}

/* Optimize for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .container {
    transition: none;
  }
  
  .logo {
    animation: none;
    text-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
  }
}
EOL

# Create a deployment script for the final adjustments
echo -e "${YELLOW}Creating deployment script for the final adjustments...${NC}"

cat > ./deploy-tiko-final-adjustments.sh << 'EOL'
#!/bin/bash
# TIKO Final Adjustments Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Final Adjustments Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO design with final adjustments to Heroku${NC}\n"

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

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Apply final adjustments to TIKO design"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO design with final adjustments is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-final-adjustments.sh

echo -e "${GREEN}Final adjustments complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO design with final adjustments to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-final-adjustments.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of final adjustments
echo -e "${YELLOW}Summary of Final Adjustments:${NC}"
echo -e "1. Made the TIKO font thinner by changing font-weight to 400 and adding font-stretch"
echo -e "2. Kept the TIKO font height as requested"
echo -e "3. Aligned the bullets in the middle along the lines of the Spotify button by centering the features container"
echo -e "\n${BLUE}=======================================${NC}"
