#!/bin/bash
# TIKO Design Refinements Script with Google Fonts
# This script refines the TIKO landing page design based on user feedback using Google Fonts

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Design Refinements Script with Google Fonts ===${NC}"
echo -e "${BLUE}This script will refine the TIKO landing page design using Google Fonts${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/design_refinements_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./pages/index.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/Home.module.css $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/globals.css $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Update the index.js file with refined design using Google Fonts
echo -e "${YELLOW}Updating index.js with refined design using Google Fonts...${NC}"

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
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content="TIKO | Find your next night out" />
        <meta property="og:description" content="Find your next night out. Powered by your vibe." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sonar-edm-user-50e4fb038f6e.herokuapp.com/" />
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
        
        <div className={styles.featuresContainer}>
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.purpleBullet}`} aria-hidden="true"></span>
            <p>Real events, matched to your taste</p>
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.pinkBullet}`} aria-hidden="true"></span>
            <p>Your vibe, not just your genre</p>
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.blueBullet}`} aria-hidden="true"></span>
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

# Update the Home.module.css file with refined styling using Google Fonts
echo -e "${YELLOW}Updating Home.module.css with refined styling using Google Fonts...${NC}"

cat > ./styles/Home.module.css << 'EOL'
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 1rem;
  background-color: #0a0014;
  background-image: radial-gradient(circle at 50% 0%, #1a0033 0%, #0a0014 70%);
  color: #fff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
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
  font-weight: 800;
  margin: 0;
  color: #ff00ff;
  text-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
  letter-spacing: -0.02em;
  line-height: 1;
  font-family: 'Archivo Black', 'Anton', sans-serif;
  will-change: text-shadow;
  transform: translateZ(0);
  animation: glow 3s infinite ease-in-out;
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
  gap: 1.5rem;
  width: 100%;
  max-width: 320px;
  margin-left: 1rem;
}

.featureItem {
  display: flex;
  align-items: flex-start;
  font-size: 1.125rem;
  font-family: 'Inter', sans-serif;
}

.bullet {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 1rem;
  margin-top: 0.4rem;
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
  font-family: 'Inter', sans-serif;
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

# Update the globals.css file with refined styling
echo -e "${YELLOW}Updating globals.css with refined styling...${NC}"

cat > ./styles/globals.css << 'EOL'
html,
body {
  padding: 0;
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  background-color: #0a0014;
  color: #fff;
}

* {
  box-sizing: border-box;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
}

/* Improve mobile experience */
input, 
button, 
textarea, 
select {
  font-family: inherit;
  font-size: 100%;
}

/* Remove tap highlight on mobile */
a, button {
  -webkit-tap-highlight-color: transparent;
}

/* Improve scrolling experience */
html {
  scroll-behavior: smooth;
}

/* Optimize font rendering */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Prevent content from being hidden under the status bar on iOS */
@supports (-webkit-touch-callout: none) {
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}

/* Loading indicator styles */
body.loading::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #00e5ff, #ff00ff);
  z-index: 9999;
  animation: loading-progress 1s infinite linear;
}

@keyframes loading-progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Optimize animations for reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  body.loading::after {
    animation: none;
    width: 100%;
    opacity: 0.7;
  }
}

/* Content-visibility for better rendering performance */
.below-fold {
  content-visibility: auto;
  contain-intrinsic-size: 1px 5000px;
}

/* Optimize image rendering */
img {
  image-rendering: auto;
}
EOL

# Create a deployment script for the refined design with Google Fonts
echo -e "${YELLOW}Creating deployment script for the refined design with Google Fonts...${NC}"

cat > ./deploy-tiko-google-fonts.sh << 'EOL'
#!/bin/bash
# TIKO Refined Design Deployment Script with Google Fonts

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Refined Design Deployment Script with Google Fonts ===${NC}"
echo -e "${BLUE}This script will deploy your refined TIKO design with Google Fonts to Heroku${NC}\n"

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
git commit -m "Refine TIKO design with Google Fonts"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your refined TIKO design with Google Fonts is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-google-fonts.sh

echo -e "${GREEN}Design refinements with Google Fonts complete!${NC}"
echo -e "${YELLOW}To deploy your refined TIKO design with Google Fonts to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-google-fonts.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of refinements
echo -e "${YELLOW}Summary of Design Refinements with Google Fonts:${NC}"
echo -e "1. Updated Spotify button gradient to blue-to-purple"
echo -e "2. Fixed bullet point alignment in the features list"
echo -e "3. Added Google Fonts: Archivo Black and Anton as alternatives for the logo font"
echo -e "4. Using Inter from Google Fonts for the body text"
echo -e "5. Enhanced background with deep violet color and soft gradients"
echo -e "6. Improved typography with proper font weights and spacing"
echo -e "7. Refined the overall visual appearance to match the mockup"
echo -e "\n${BLUE}=======================================${NC}"
