#!/bin/bash
# TIKO Multi-Color Bullets Style Implementation Script
# This script implements the style with different colored bullets while preserving authentication

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Multi-Color Bullets Style Implementation Script ===${NC}"
echo -e "${BLUE}This script implements the style with different colored bullets while preserving authentication${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/multi_color_bullets_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./pages/index.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/Home.module.css $BACKUP_DIR/ 2>/dev/null || :
cp -r ./package.json $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Install react-icons package if not already installed
echo -e "${YELLOW}Ensuring react-icons package is installed...${NC}"
if ! grep -q "react-icons" package.json; then
  npm install --save react-icons
  echo -e "${GREEN}react-icons package installed${NC}"
else
  echo -e "${GREEN}react-icons package already installed${NC}"
fi

# Update the index.js file with multi-color bullets style
echo -e "${YELLOW}Updating index.js with multi-color bullets style...${NC}"

cat > ./pages/index.js << 'EOL'
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import styles from '../styles/Home.module.css';
import { FaSpotify } from 'react-icons/fa';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Mark as loaded after component mounts
    setIsLoaded(true);
    
    // Preload the music-taste page
    const prefetchMusicTaste = () => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/users/music-taste';
      document.head.appendChild(link);
    };
    
    // Delay prefetch to prioritize current page rendering
    const timer = setTimeout(prefetchMusicTaste, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSpotifyConnect = (e) => {
    e.preventDefault();
    signIn('spotify', { callbackUrl: '/users/music-taste' });
  };

  return (
    <div className={`${styles.container} ${isLoaded ? styles.loaded : ''}`}>
      <Head>
        <title>TIKO by Sonar</title>
        <meta name="description" content="EDM events tailored to your vibe" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Cache busting meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>

      <main className={styles.main}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logo}>TIKO</h1>
        </div>
        
        <div className={styles.taglineContainer}>
          <h2 className={styles.tagline}>
            Find your next night out.<br />
            Powered by your vibe.
          </h2>
        </div>
        
        <div className={styles.buttonContainer}>
          <button 
            onClick={handleSpotifyConnect} 
            className={styles.spotifyButton}
            aria-label="Connect with Spotify"
          >
            <FaSpotify className={styles.spotifyIcon} />
            Connect with Spotify
          </button>
        </div>
        
        <div className={styles.featuresContainer}>
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.purpleBullet}`} aria-hidden="true"></span>
            Real events, matched to your taste
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.pinkBullet}`} aria-hidden="true"></span>
            Your vibe, not just your genre
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.cyanBullet}`} aria-hidden="true"></span>
            No flyers, no fluff – just your scene
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        by sonar
      </footer>
    </div>
  );
}
EOL

# Update the CSS to support multi-color bullets
echo -e "${YELLOW}Updating CSS to support multi-color bullets...${NC}"

cat > ./styles/Home.module.css << 'EOL'
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0;
  background-color: #0a0014;
  background-image: radial-gradient(circle at 50% 0%, rgba(255, 213, 79, 0.1) 0%, rgba(10, 0, 20, 0) 70%);
  color: #fff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.logoContainer {
  margin-bottom: 1.5rem;
  text-align: center;
  width: 100%;
}

.logo {
  font-size: 8rem;
  font-weight: 500;
  margin: 0;
  color: #ffd54f;
  text-shadow: 0 0 20px rgba(255, 213, 79, 0.8);
  letter-spacing: -0.01em;
  line-height: 0.9;
  font-family: 'Anton', sans-serif;
  text-transform: uppercase;
}

.taglineContainer {
  margin-bottom: 2rem;
  text-align: center;
  width: 100%;
}

.tagline {
  font-size: 1.75rem;
  color: #ffd54f;
  margin: 0;
  line-height: 1.4;
  text-align: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
}

.buttonContainer {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 3.5rem;
}

.spotifyButton {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 2rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: white;
  background: linear-gradient(90deg, #ffd54f 0%, #ffca28 100%);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  width: 100%;
  max-width: 320px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.spotifyIcon {
  margin-right: 0.75rem;
  color: white;
  font-size: 1.5rem;
}

.featuresContainer {
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
  width: 100%;
  max-width: 320px;
  padding: 0 1rem;
}

.featureItem {
  gap: 0.75rem;
  line-height: 1.5;
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
}

.bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 1rem;
  flex-shrink: 0;
}

.purpleBullet {
  background-color: #9966ff;
  box-shadow: 0 0 10px rgba(153, 102, 255, 0.7);
}

.pinkBullet {
  background-color: #ff00ff;
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.7);
}

.cyanBullet {
  background-color: #00e5ff;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.7);
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
  width: 100%;
  margin-top: auto;
}

@media (min-width: 640px) {
  .logo {
    font-size: 10rem;
  }

  .tagline {
    font-size: 2rem;
  }
}
EOL

# Create a deployment script for the multi-color bullets style
echo -e "${YELLOW}Creating deployment script for the multi-color bullets style...${NC}"

cat > ./deploy-tiko-multi-color.sh << 'EOL'
#!/bin/bash
# TIKO Multi-Color Bullets Style Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Multi-Color Bullets Style Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO design with multi-color bullets to Heroku${NC}\n"

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
heroku config:set DEPLOY_TIMESTAMP=$(date +%s) --app $app_name

# Clear Heroku build cache
echo -e "${YELLOW}Clearing Heroku build cache...${NC}"
heroku builds:cache:purge --app $app_name --confirm $app_name

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Implement multi-color bullets style while preserving authentication"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO design with multi-color bullets is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-multi-color.sh

echo -e "${GREEN}Multi-color bullets style implementation complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO design with multi-color bullets to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-multi-color.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of multi-color bullets style implementation
echo -e "${YELLOW}Summary of Multi-Color Bullets Style Implementation:${NC}"
echo -e "1. Updated index.js to use different colored bullets for each feature item"
echo -e "2. Added CSS styles for purple, pink, and cyan bullets with glow effects"
echo -e "3. Maintained React Icons integration for the Spotify button"
echo -e "4. Preserved authentication functionality to music-taste page"
echo -e "5. Created deployment script for Heroku"
echo -e "\n${BLUE}=======================================${NC}"
