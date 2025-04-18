#!/bin/bash
# TIKO Final Landing Page Deployment Script
# This script deploys the complete TIKO landing page with the yellow theme and all configuration files

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Final Landing Page Deployment Script ===${NC}"
echo -e "${BLUE}This script deploys the complete TIKO landing page with all configuration files${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/final_landing_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./pages/index.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/_document.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/Home.module.css $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/globals.css $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Create pages directory if it doesn't exist
mkdir -p ./pages
mkdir -p ./styles

# Update the index.js file with yellow theme and exact pixel measurements
echo -e "${YELLOW}Creating index.js with yellow theme and exact pixel measurements...${NC}"

cat > ./pages/index.js << 'EOL'
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import styles from '../styles/Home.module.css';

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
        <title>TIKO | Find your next night out</title>
        <meta name="description" content="Find your next night out. Powered by your vibe." />
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
          <p className={styles.tagline}>
            Find your next night out.<br />
            Powered by your vibe.
          </p>
        </div>
        
        <div className={styles.buttonContainer}>
          <button 
            onClick={handleSpotifyConnect} 
            className={styles.spotifyButton}
            aria-label="Connect with Spotify"
          >
            <span className={styles.spotifyIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="currentColor"/>
              </svg>
            </span>
            Connect with Spotify
          </button>
        </div>
        
        <div className={styles.featuresContainer}>
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.yellowBullet}`} aria-hidden="true"></span>
            <p>Real events, matched to your taste</p>
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.yellowBullet}`} aria-hidden="true"></span>
            <p>Your vibe, not just your genre</p>
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.yellowBullet}`} aria-hidden="true"></span>
            <p>No flyers, no fluff – just your scene</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>by sonar</p>
      </footer>
    </div>
  );
}
EOL

# Create _document.js file for font preloading
echo -e "${YELLOW}Creating _document.js for font preloading...${NC}"

cat > ./pages/_document.js << 'EOL'
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
EOL

# Update the Home.module.css file with the user's yellow theme CSS
echo -e "${YELLOW}Creating Home.module.css with the yellow theme...${NC}"

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
  display: inline-flex;
  margin-right: 0.75rem;
  color: white;
  width: 24px;
  height: 24px;
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

.yellowBullet {
  background-color: #ffd54f;
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

# Update the globals.css file with the user's configuration
echo -e "${YELLOW}Creating globals.css with the user's configuration...${NC}"

cat > ./styles/globals.css << 'EOL'
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap');

html, body {
  padding: 0;
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #0a0014;
  color: #fff;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
EOL

# Create a deployment script for the final landing page
echo -e "${YELLOW}Creating deployment script for the final landing page...${NC}"

cat > ./deploy-tiko-final.sh << 'EOL'
#!/bin/bash
# TIKO Final Landing Page Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Final Landing Page Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your complete TIKO landing page to Heroku${NC}\n"

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
git commit -m "Deploy final TIKO landing page with yellow theme"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO landing page is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-final.sh

echo -e "${GREEN}Final landing page deployment script complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO landing page to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-final.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of final landing page deployment
echo -e "${YELLOW}Summary of Final Landing Page Deployment:${NC}"
echo -e "1. Created index.js with the yellow theme and exact pixel measurements"
echo -e "2. Created _document.js for proper font preloading"
echo -e "3. Created Home.module.css with the yellow theme styling"
echo -e "4. Created globals.css with the user's font configuration"
echo -e "5. Created a deployment script that clears Heroku's build cache"
echo -e "6. Added timestamp environment variable to force full rebuild"
echo -e "\n${BLUE}=======================================${NC}"
