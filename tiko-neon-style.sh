#!/bin/bash
# TIKO Neon Style Implementation Script
# This script implements the neon style from the provided CSS file while preserving authentication

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Neon Style Implementation Script ===${NC}"
echo -e "${BLUE}This script implements the neon style while preserving authentication${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/neon_style_${TIMESTAMP}"
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

# Update the index.js file with neon style
echo -e "${YELLOW}Updating index.js with neon style...${NC}"

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

# Update the CSS to implement neon style
echo -e "${YELLOW}Updating CSS to implement neon style...${NC}"

cat > ./styles/Home.module.css << 'EOL'
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0;
  background-color: #0a0014;
  background-image: radial-gradient(circle at 50% 0%, rgba(255, 0, 255, 0.1) 0%, rgba(10, 0, 20, 0) 70%);
  color: #fff;
  font-family: 'Inter', sans-serif;
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
  color: #ff00ff;
  text-shadow: 0 0 20px rgba(255, 0, 255, 0.8);
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
  color: #00f0ff;
  margin: 0;
  line-height: 1.4;
  text-align: center;
  font-family: 'Inter', sans-serif;
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
  background: linear-gradient(90deg, #00f0ff 0%, #8c54ff 100%);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  width: 100%;
  max-width: 320px;
  font-family: 'Inter', sans-serif;
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
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  gap: 0.75rem;
  line-height: 1.5;
}

.bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.purpleBullet {
  background-color: #a07bff;
  box-shadow: 0 0 10px rgba(160, 123, 255, 0.7);
}

.pinkBullet {
  background-color: #ff00ff;
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.7);
}

.cyanBullet {
  background-color: #00f0ff;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.7);
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Inter', sans-serif;
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

# Create a deployment script for the neon style
echo -e "${YELLOW}Creating deployment script for the neon style...${NC}"

cat > ./deploy-tiko-neon.sh << 'EOL'
#!/bin/bash
# TIKO Neon Style Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Neon Style Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO design with neon style to Heroku${NC}\n"

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
# This replaces the invalid builds:cache:purge command
echo -e "${YELLOW}Setting timestamp to force a clean build...${NC}"
heroku config:set DEPLOY_TIMESTAMP=$(date +%s) --app $app_name

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Implement neon style while preserving authentication"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO design with neon style is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-neon.sh

echo -e "${GREEN}Neon style implementation complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO design with neon style to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-neon.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of neon style implementation
echo -e "${YELLOW}Summary of Neon Style Implementation:${NC}"
echo -e "1. Updated CSS to use neon colors (pink logo, cyan tagline, gradient button)"
echo -e "2. Added neon glow effects to elements"
echo -e "3. Maintained React Icons integration for the Spotify button"
echo -e "4. Preserved authentication functionality to music-taste page"
echo -e "5. Created fixed deployment script for Heroku that doesn't use the invalid cache purge command"
echo -e "\n${BLUE}=======================================${NC}"
