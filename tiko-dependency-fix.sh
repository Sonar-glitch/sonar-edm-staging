#!/bin/bash
# TIKO Dependency and Syntax Fix Script
# This script installs Chakra UI and fixes the EventCard.js syntax error

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Dependency and Syntax Fix Script ===${NC}"
echo -e "${BLUE}This script installs Chakra UI and fixes the EventCard.js syntax error${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/dependency_fix_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./components/EventCard.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./package.json $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Install Chakra UI
echo -e "${YELLOW}Installing Chakra UI...${NC}"
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion

# Fix EventCard.js syntax error
echo -e "${YELLOW}Fixing EventCard.js syntax error...${NC}"

cat > ./components/EventCard.js << 'EOL'
import React from 'react';
import { Box, Image, Heading, Text, Link, Badge, Flex } from '@chakra-ui/react';
import SafeContent from './common/SafeContent';

const EventCard = ({ event }) => {
  // Ensure event is an object
  if (!event || typeof event !== 'object') {
    return null;
  }
  
  // Extract properties with fallbacks
  const {
    name = 'Unknown Event',
    images = [],
    date = '',
    venue = {},
    ticketUrl = '#',
    artists = []
  } = event;
  
  // Safely get image URL
  const imageUrl = images && images.length > 0 && images[0].url 
    ? images[0].url 
    : 'https://via.placeholder.com/300?text=No+Image';
  
  // Format date safely
  const formattedDate = date ? new Date(date).toLocaleDateString() : 'Date TBA';
  
  // Safely get venue info
  const venueName = venue && venue.name ? venue.name : 'Venue TBA';
  const venueLocation = venue && venue.location ? venue.location : 'Location TBA';
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      bg="rgba(0, 0, 0, 0.3)"
      transition="transform 0.3s"
      _hover={{ transform: 'translateY(-5px)' }}
    >
      <Image 
        src={imageUrl} 
        alt={`${name} event image`}
        fallbackSrc="https://via.placeholder.com/300?text=Loading..."
        width="100%"
        height="200px"
        objectFit="cover"
        loading="lazy"
      />
      
      <Box p={4}>
        <Heading as="h3" size="md" mb={2} isTruncated>
          {name}
        </Heading>
        
        <Text fontSize="sm" mb={2}>
          <strong>Date:</strong> {formattedDate}
        </Text>
        
        <Text fontSize="sm" mb={2}>
          <strong>Venue:</strong> {venueName}
        </Text>
        
        <Text fontSize="sm" mb={3}>
          <strong>Location:</strong> {venueLocation}
        </Text>
        
        {artists && artists.length > 0 && (
          <Flex flexWrap="wrap" mb={3}>
            {artists.slice(0, 3).map((artist, index) => (
              <Badge key={index} colorScheme="purple" mr={1} mb={1}>
                {typeof artist === 'string' ? artist : (artist.name || 'Unknown Artist')}
              </Badge>
            ))}
          </Flex>
        )}
        
        <Link 
          href={ticketUrl}
          isExternal
          color="cyan.400"
          fontWeight="bold"
          fontSize="sm"
        >
          Get Tickets
        </Link>
      </Box>
    </Box>
  );
};

export default EventCard;
EOL

# Create a deployment script
echo -e "${YELLOW}Creating dependency fix deployment script...${NC}"

cat > ./deploy-tiko-dependency-fix.sh << 'EOL'
#!/bin/bash
# TIKO Dependency Fix Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Dependency Fix Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO platform with dependency fixes to Heroku${NC}\n"

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
git commit -m "Fix dependency issues and EventCard.js syntax error"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO platform is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-dependency-fix.sh

echo -e "${GREEN}Dependency and syntax fix script complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO platform with dependency fixes to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-dependency-fix.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of fixes
echo -e "${YELLOW}Summary of Dependency and Syntax Fixes:${NC}"
echo -e "1. Installed Chakra UI and its dependencies:"
echo -e "   - @chakra-ui/react: UI component library"
echo -e "   - @emotion/react and @emotion/styled: Required for Chakra UI styling"
echo -e "   - framer-motion: Required for Chakra UI animations"
echo -e ""
echo -e "2. Fixed EventCard.js syntax error:"
echo -e "   - Corrected the unterminated string constant"
echo -e "   - Ensured all quotes and brackets are properly closed"
echo -e ""
echo -e "3. Created a deployment script:"
echo -e "   - Uses the timestamp approach to force clean builds"
echo -e "   - Includes proper error handling and feedback"
echo -e "\n${BLUE}=======================================${NC}"
