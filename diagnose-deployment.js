#!/usr/bin/env node

/**
 * Sonar EDM Platform Deployment Diagnostic Script
 * 
 * This script diagnoses issues with the Sonar EDM Platform deployment
 * and provides recommendations for fixing the landing page.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Color codes for better readability
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// Define the components to check
const components = [
  { name: 'Main Platform', dir: '.', app: 'sonar-edm-platform' },
  { name: 'User Dashboard', dir: './sonar-edm-user', app: 'sonar-edm-user' },
  { name: 'Promoter Dashboard', dir: './sonar-edm-promoter', app: 'sonar-edm-promoter' },
  { name: 'Backend API', dir: './sonar-edm-api', app: 'sonar-edm-api' }
];

// Function to check if Heroku CLI is installed
function checkHerokuCLI() {
  try {
    execSync('heroku --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if user is logged in to Heroku
function checkHerokuLogin() {
  try {
    execSync('heroku whoami', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if a file exists
async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if a directory exists
async function dirExists(dirPath) {
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

// Function to check if a component has a package.json file
async function hasPackageJson(componentDir) {
  return await fileExists(path.join(componentDir, 'package.json'));
}

// Function to check if a component has a pages directory
async function hasPagesDir(componentDir) {
  return await dirExists(path.join(componentDir, 'pages'));
}

// Function to check if a component has an index.js file in pages directory
async function hasIndexPage(componentDir) {
  return await fileExists(path.join(componentDir, 'pages', 'index.js'));
}

// Function to check if a component has a _app.js file in pages directory
async function hasAppFile(componentDir) {
  return await fileExists(path.join(componentDir, 'pages', '_app.js'));
}

// Function to check if a component has a styles directory
async function hasStylesDir(componentDir) {
  return await dirExists(path.join(componentDir, 'styles'));
}

// Function to check if a component has a public directory
async function hasPublicDir(componentDir) {
  return await dirExists(path.join(componentDir, 'public'));
}

// Function to check if a component has a components directory
async function hasComponentsDir(componentDir) {
  return await dirExists(path.join(componentDir, 'components'));
}

// Function to check if a component has a next.config.js file
async function hasNextConfig(componentDir) {
  return await fileExists(path.join(componentDir, 'next.config.js'));
}

// Function to check if a component has a Procfile
async function hasProcfile(componentDir) {
  return await fileExists(path.join(componentDir, 'Procfile'));
}

// Function to check Heroku logs for a component
function checkHerokuLogs(appName) {
  try {
    const logs = execSync(`heroku logs --app ${appName} --num 50`).toString();
    return logs;
  } catch (error) {
    return `Error fetching logs: ${error.message}`;
  }
}

// Function to check Heroku config for a component
function checkHerokuConfig(appName) {
  try {
    const config = execSync(`heroku config --app ${appName}`).toString();
    return config;
  } catch (error) {
    return `Error fetching config: ${error.message}`;
  }
}

// Function to check if a component has the required environment variables
function hasRequiredEnvVars(config, isMainPlatform, isUserDashboard, isPromoterDashboard, isBackendAPI) {
  const requiredVars = [];
  
  if (isMainPlatform || isUserDashboard) {
    requiredVars.push('SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'NEXTAUTH_URL');
  }
  
  if (isPromoterDashboard) {
    requiredVars.push('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_URL');
  }
  
  if (isBackendAPI) {
    requiredVars.push('MONGODB_URI', 'CORS_ORIGIN');
  }
  
  const missingVars = [];
  
  for (const requiredVar of requiredVars) {
    if (!config.includes(requiredVar)) {
      missingVars.push(requiredVar);
    }
  }
  
  return {
    hasAll: missingVars.length === 0,
    missing: missingVars
  };
}

// Function to check the content of the index.js file
async function checkIndexContent(componentDir) {
  try {
    const indexPath = path.join(componentDir, 'pages', 'index.js');
    const content = await readFile(indexPath, 'utf8');
    
    // Check if the index.js file has content
    if (content.trim().length === 0) {
      return { valid: false, issue: 'Empty index.js file' };
    }
    
    // Check if the index.js file exports a component
    if (!content.includes('export default') && !content.includes('module.exports')) {
      return { valid: false, issue: 'No default export in index.js' };
    }
    
    return { valid: true, content };
  } catch (error) {
    return { valid: false, issue: `Error reading index.js: ${error.message}` };
  }
}

// Function to check the content of the _app.js file
async function checkAppContent(componentDir) {
  try {
    const appPath = path.join(componentDir, 'pages', '_app.js');
    const content = await readFile(appPath, 'utf8');
    
    // Check if the _app.js file has content
    if (content.trim().length === 0) {
      return { valid: false, issue: 'Empty _app.js file' };
    }
    
    // Check if the _app.js file exports a component
    if (!content.includes('export default') && !content.includes('module.exports')) {
      return { valid: false, issue: 'No default export in _app.js' };
    }
    
    // Check if the _app.js file imports global styles
    if (!content.includes('import') || !content.includes('styles') || !content.includes('.css')) {
      return { valid: false, issue: 'No global styles imported in _app.js' };
    }
    
    return { valid: true, content };
  } catch (error) {
    return { valid: false, issue: `Error reading _app.js: ${error.message}` };
  }
}

// Function to check the content of the next.config.js file
async function checkNextConfigContent(componentDir) {
  try {
    const configPath = path.join(componentDir, 'next.config.js');
    const content = await readFile(configPath, 'utf8');
    
    // Check if the next.config.js file has content
    if (content.trim().length === 0) {
      return { valid: false, issue: 'Empty next.config.js file' };
    }
    
    // Check if the next.config.js file exports a configuration object
    if (!content.includes('module.exports')) {
      return { valid: false, issue: 'No module.exports in next.config.js' };
    }
    
    return { valid: true, content };
  } catch (error) {
    return { valid: false, issue: `Error reading next.config.js: ${error.message}` };
  }
}

// Function to check the content of the Procfile
async function checkProcfileContent(componentDir) {
  try {
    const procfilePath = path.join(componentDir, 'Procfile');
    const content = await readFile(procfilePath, 'utf8');
    
    // Check if the Procfile has content
    if (content.trim().length === 0) {
      return { valid: false, issue: 'Empty Procfile' };
    }
    
    // Check if the Procfile has a web process
    if (!content.includes('web:')) {
      return { valid: false, issue: 'No web process in Procfile' };
    }
    
    return { valid: true, content };
  } catch (error) {
    return { valid: false, issue: `Error reading Procfile: ${error.message}` };
  }
}

// Function to generate a landing page component
function generateLandingPage() {
  return `import React from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Discover Your <span className={styles.highlight}>EDM</span> Experience
        </h1>
        
        <p className={styles.description}>
          Connect your music taste with the perfect events and discover new artists
        </p>
        
        <div className={styles.grid}>
          <Link href="/users/dashboard" className={styles.card}>
            <h2>Music Fan Dashboard &rarr;</h2>
            <p>Access your personalized music recommendations and event matches.</p>
          </Link>
          
          <Link href="https://sonar-edm-promoter.herokuapp.com" className={styles.card}>
            <h2>Promoter Dashboard &rarr;</h2>
            <p>Analyze audience data and optimize your event promotions.</p>
          </Link>
          
          <Link href="/auth/signin" className={styles.card}>
            <h2>Sign In &rarr;</h2>
            <p>Connect with Spotify to get personalized recommendations.</p>
          </Link>
          
          <a href="https://github.com/Sonar-glitch/sonar-edm-platform" className={styles.card} target="_blank" rel="noopener noreferrer">
            <h2>Documentation &rarr;</h2>
            <p>Learn more about the Sonar EDM Platform and its features.</p>
          </a>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <a href="https://github.com/Sonar-glitch/sonar-edm-platform" target="_blank" rel="noopener noreferrer">
          Powered by Sonar EDM Platform
        </a>
      </footer>
    </div>
  );
}
`;
}

// Function to generate CSS for the landing page
function generateLandingPageCSS() {
  return `.container {
  min-height: 100vh;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #121212 0%, #1e1e1e 100%);
  color: white;
}

.main {
  padding: 5rem 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 1200px;
}

.footer {
  width: 100%;
  height: 100px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer a {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #00f0ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer a:hover {
  color: #f0f;
}

.title {
  margin: 0;
  line-height: 1.15;
  font-size: 4rem;
  text-align: center;
}

.title,
.description {
  text-align: center;
}

.highlight {
  background: linear-gradient(90deg, #f0f 0%, #00f0ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.description {
  line-height: 1.5;
  font-size: 1.5rem;
  margin: 2rem 0;
}

.grid {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 800px;
  margin-top: 3rem;
}

.card {
  margin: 1rem;
  padding: 1.5rem;
  text-align: left;
  color: white;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: color 0.15s ease, border-color 0.15s ease, transform 0.3s ease, box-shadow 0.3s ease;
  width: 45%;
  background: rgba(30, 30, 30, 0.5);
  backdrop-filter: blur(5px);
}

.card:hover,
.card:focus,
.card:active {
  color: #f0f;
  border-color: #f0f;
  transform: translateY(-5px);
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
}

.card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.card p {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .grid {
    width: 100%;
    flex-direction: column;
  }
  
  .card {
    width: 100%;
  }
  
  .title {
    font-size: 2.5rem;
  }
  
  .description {
    font-size: 1.2rem;
  }
}
`;
}

// Function to generate a fix script for the landing page
function generateFixScript() {
  return `#!/bin/bash
# Landing Page Fix Script for Sonar EDM Platform
# This script fixes the landing page for the Sonar EDM Platform

# Color codes for better readability
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
RED='\\033[0;31m'
NC='\\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform Landing Page Fix Script ===${NC}"
echo -e "${BLUE}This script will fix the landing page for the Sonar EDM Platform${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "./pages" ]; then
  echo -e "${YELLOW}Warning: pages directory not found in current directory.${NC}"
  echo -e "${YELLOW}Please run this script from the root of the Sonar EDM Platform project.${NC}"
  exit 1
fi

# Create or update the index.js file
echo -e "${GREEN}Creating landing page component...${NC}"
cat > ./pages/index.js << 'EOL'
import React from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Discover Your <span className={styles.highlight}>EDM</span> Experience
        </h1>
        
        <p className={styles.description}>
          Connect your music taste with the perfect events and discover new artists
        </p>
        
        <div className={styles.grid}>
          <Link href="/users/dashboard" className={styles.card}>
            <h2>Music Fan Dashboard &rarr;</h2>
            <p>Access your personalized music recommendations and event matches.</p>
          </Link>
          
          <Link href="https://sonar-edm-promoter.herokuapp.com" className={styles.card}>
            <h2>Promoter Dashboard &rarr;</h2>
            <p>Analyze audience data and optimize your event promotions.</p>
          </Link>
          
          <Link href="/auth/signin" className={styles.card}>
            <h2>Sign In &rarr;</h2>
            <p>Connect with Spotify to get personalized recommendations.</p>
          </Link>
          
          <a href="https://github.com/Sonar-glitch/sonar-edm-platform" className={styles.card} target="_blank" rel="noopener noreferrer">
            <h2>Documentation &rarr;</h2>
            <p>Learn more about the Sonar EDM Platform and its features.</p>
          </a>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <a href="https://github.com/Sonar-glitch/sonar-edm-platform" target="_blank" rel="noopener noreferrer">
          Powered by Sonar EDM Platform
        </a>
      </footer>
    </div>
  );
}
EOL

# Create or update the CSS file
echo -e "${GREEN}Creating landing page styles...${NC}"
mkdir -p ./styles
cat > ./styles/Home.module.css << 'EOL'
.container {
  min-height: 100vh;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #121212 0%, #1e1e1e 100%);
  color: white;
}

.main {
  padding: 5rem 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 1200px;
}

.footer {
  width: 100%;
  height: 100px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer a {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #00f0ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer a:hover {
  color: #f0f;
}

.title {
  margin: 0;
  line-height: 1.15;
  font-size: 4rem;
  text-align: center;
}

.title,
.description {
  text-align: center;
}

.highlight {
  background: linear-gradient(90deg, #f0f 0%, #00f0ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.description {
  line-height: 1.5;
  font-size: 1.5rem;
  margin: 2rem 0;
}

.grid {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 800px;
  margin-top: 3rem;
}

.card {
  margin: 1rem;
  padding: 1.5rem;
  text-align: left;
  color: white;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: color 0.15s ease, border-color 0.15s ease, transform 0.3s ease, box-shadow 0.3s ease;
  width: 45%;
  background: rgba(30, 30, 30, 0.5);
  backdrop-filter: blur(5px);
}

.card:hover,
.card:focus,
.card:active {
  color: #f0f;
  border-color: #f0f;
  transform: translateY(-5px);
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
}

.card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.card p {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .grid {
    width: 100%;
    flex-direction: column;
  }
  
  .card {
    width: 100%;
  }
  
  .title {
    font-size: 2.5rem;
  }
  
  .description {
    font-size: 1.2rem;
  }
}
EOL

# Check if _app.js exists, create if not
if [ ! -f "./pages/_app.js" ]; then
  echo -e "${GREEN}Creating _app.js file...${NC}"
  cat > ./pages/_app.js << 'EOL'
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
EOL
fi

# Check if globals.css exists, create if not
if [ ! -f "./styles/globals.css" ]; then
  echo -e "${GREEN}Creating globals.css file...${NC}"
  cat > ./styles/globals.css << 'EOL'
html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}
EOL
fi

# Check if next.config.js exists, create if not
if [ ! -f "./next.config.js" ]; then
  echo -e "${GREEN}Creating next.config.js file...${NC}"
  cat > ./next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
EOL
fi

# Check if Procfile exists, create if not
if [ ! -f "./Procfile" ]; then
  echo -e "${GREEN}Creating Procfile...${NC}"
  echo "web: npm start" > ./Procfile
fi

# Check if package.json exists, update if needed
if [ -f "./package.json" ]; then
  echo -e "${GREEN}Updating package.json...${NC}"
  # Add start script if not present
  if ! grep -q '"start"' ./package.json; then
    sed -i 's/"scripts": {/"scripts": {\n    "start": "next start -p $PORT",/g' ./package.json
  fi
  # Add build script if not present
  if ! grep -q '"build"' ./package.json; then
    sed -i 's/"scripts": {/"scripts": {\n    "build": "next build",/g' ./package.json
  fi
  # Add dev script if not present
  if ! grep -q '"dev"' ./package.json; then
    sed -i 's/"scripts": {/"scripts": {\n    "dev": "next dev",/g' ./package.json
  fi
else
  echo -e "${RED}Error: package.json not found. Please create a package.json file.${NC}"
  exit 1
fi

echo -e "\n${GREEN}=== Landing page fix completed! ===${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Commit the changes: git add . && git commit -m \"Fix landing page\""
echo -e "2. Deploy the changes: git push heroku main"
echo -e "3. Open the app: heroku open --app sonar-edm-platform"
`;
}

// Main function to run the diagnostic
async function runDiagnostic() {
  console.log(`${BLUE}=== Sonar EDM Platform Deployment Diagnostic ===${RESET}`);
  console.log(`${BLUE}This script will diagnose issues with your Sonar EDM Platform deployment${RESET}`);
  console.log('');
  
  // Check if Heroku CLI is installed
  const herokuInstalled = checkHerokuCLI();
  if (!herokuInstalled) {
    console.log(`${RED}Error: Heroku CLI is not installed.${RESET}`);
    console.log(`${YELLOW}Please install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli${RESET}`);
    return;
  }
  
  // Check if user is logged in to Heroku
  const herokuLoggedIn = checkHerokuLogin();
  if (!herokuLoggedIn) {
    console.log(`${RED}Error: Not logged in to Heroku.${RESET}`);
    console.log(`${YELLOW}Please log in to Heroku using 'heroku login'${RESET}`);
    return;
  }
  
  console.log(`${GREEN}✓ Heroku CLI is installed and logged in${RESET}`);
  console.log('');
  
  // Check each component
  for (const component of components) {
    console.log(`${BLUE}=== Checking ${component.name} (${component.app}) ===${RESET}`);
    
    // Check if component directory exists
    const componentDirExists = await dirExists(component.dir);
    if (!componentDirExists) {
      console.log(`${RED}✗ Component directory ${component.dir} does not exist${RESET}`);
      continue;
    }
    
    // Check if component has a package.json file
    const hasPackage = await hasPackageJson(component.dir);
    console.log(`${hasPackage ? GREEN + '✓' : RED + '✗'} package.json${RESET}`);
    
    // Check if component has a pages directory
    const hasPages = await hasPagesDir(component.dir);
    console.log(`${hasPages ? GREEN + '✓' : RED + '✗'} pages directory${RESET}`);
    
    // Check if component has an index.js file in pages directory
    const hasIndex = hasPages ? await hasIndexPage(component.dir) : false;
    console.log(`${hasIndex ? GREEN + '✓' : RED + '✗'} pages/index.js${RESET}`);
    
    // Check if component has a _app.js file in pages directory
    const hasApp = hasPages ? await hasAppFile(component.dir) : false;
    console.log(`${hasApp ? GREEN + '✓' : RED + '✗'} pages/_app.js${RESET}`);
    
    // Check if component has a styles directory
    const hasStyles = await hasStylesDir(component.dir);
    console.log(`${hasStyles ? GREEN + '✓' : RED + '✗'} styles directory${RESET}`);
    
    // Check if component has a public directory
    const hasPublic = await hasPublicDir(component.dir);
    console.log(`${hasPublic ? GREEN + '✓' : RED + '✗'} public directory${RESET}`);
    
    // Check if component has a components directory
    const hasComponents = await hasComponentsDir(component.dir);
    console.log(`${hasComponents ? GREEN + '✓' : RED + '✗'} components directory${RESET}`);
    
    // Check if component has a next.config.js file
    const hasConfig = await hasNextConfig(component.dir);
    console.log(`${hasConfig ? GREEN + '✓' : RED + '✗'} next.config.js${RESET}`);
    
    // Check if component has a Procfile
    const hasProcfile = await hasProcfile(component.dir);
    console.log(`${hasProcfile ? GREEN + '✓' : RED + '✗'} Procfile${RESET}`);
    
    // Check Heroku logs for component
    console.log(`\n${BLUE}Checking Heroku logs for ${component.app}...${RESET}`);
    const logs = checkHerokuLogs(component.app);
    
    // Check for common errors in logs
    if (logs.includes('Error R10 (Boot timeout)')) {
      console.log(`${RED}✗ Boot timeout error detected${RESET}`);
    }
    
    if (logs.includes('Error H10 (App crashed)')) {
      console.log(`${RED}✗ App crash detected${RESET}`);
    }
    
    if (logs.includes('Error H14 (No web processes running)')) {
      console.log(`${RED}✗ No web processes running${RESET}`);
    }
    
    // Check Heroku config for component
    console.log(`\n${BLUE}Checking Heroku config for ${component.app}...${RESET}`);
    const config = checkHerokuConfig(component.app);
    
    // Check if component has the required environment variables
    const isMainPlatform = component.name === 'Main Platform';
    const isUserDashboard = component.name === 'User Dashboard';
    const isPromoterDashboard = component.name === 'Promoter Dashboard';
    const isBackendAPI = component.name === 'Backend API';
    
    const envVarCheck = hasRequiredEnvVars(config, isMainPlatform, isUserDashboard, isPromoterDashboard, isBackendAPI);
    
    if (envVarCheck.hasAll) {
      console.log(`${GREEN}✓ All required environment variables are set${RESET}`);
    } else {
      console.log(`${RED}✗ Missing environment variables: ${envVarCheck.missing.join(', ')}${RESET}`);
    }
    
    // Check the content of the index.js file if it exists
    if (hasIndex) {
      const indexCheck = await checkIndexContent(component.dir);
      if (indexCheck.valid) {
        console.log(`${GREEN}✓ index.js content is valid${RESET}`);
      } else {
        console.log(`${RED}✗ index.js issue: ${indexCheck.issue}${RESET}`);
      }
    }
    
    // Check the content of the _app.js file if it exists
    if (hasApp) {
      const appCheck = await checkAppContent(component.dir);
      if (appCheck.valid) {
        console.log(`${GREEN}✓ _app.js content is valid${RESET}`);
      } else {
        console.log(`${RED}✗ _app.js issue: ${appCheck.issue}${RESET}`);
      }
    }
    
    // Check the content of the next.config.js file if it exists
    if (hasConfig) {
      const configCheck = await checkNextConfigContent(component.dir);
      if (configCheck.valid) {
        console.log(`${GREEN}✓ next.config.js content is valid${RESET}`);
      } else {
        console.log(`${RED}✗ next.config.js issue: ${configCheck.issue}${RESET}`);
      }
    }
    
    // Check the content of the Procfile if it exists
    if (hasProcfile) {
      const procfileCheck = await checkProcfileContent(component.dir);
      if (procfileCheck.valid) {
        console.log(`${GREEN}✓ Procfile content is valid${RESET}`);
      } else {
        console.log(`${RED}✗ Procfile issue: ${procfileCheck.issue}${RESET}`);
      }
    }
    
    console.log('');
  }
  
  // Generate recommendations
  console.log(`${BLUE}=== Recommendations ===${RESET}`);
  
  // Check if the main platform has an index.js file
  const mainPlatformHasIndex = await hasIndexPage('.');
  if (!mainPlatformHasIndex) {
    console.log(`${YELLOW}1. Create an index.js file in the pages directory of the main platform${RESET}`);
    console.log(`${YELLOW}   This is likely why you're seeing "There's nothing here, yet" message${RESET}`);
    
    // Generate a landing page component
    console.log(`\n${BLUE}Here's a landing page component you can use:${RESET}`);
    console.log(`\n${YELLOW}// pages/index.js${RESET}`);
    console.log(generateLandingPage());
    
    console.log(`\n${YELLOW}// styles/Home.module.css${RESET}`);
    console.log(generateLandingPageCSS());
    
    // Generate a fix script
    console.log(`\n${BLUE}I've also generated a fix script that you can run to automatically fix the landing page:${RESET}`);
    const fixScript = generateFixScript();
    const fixScriptPath = path.join(__dirname, 'fix-landing-page.sh');
    
    try {
      await writeFile(fixScriptPath, fixScript, { mode: 0o755 });
      console.log(`${GREEN}✓ Fix script saved to ${fixScriptPath}${RESET}`);
      console.log(`${YELLOW}   Run it with: bash ${fixScriptPath}${RESET}`);
    } catch (error) {
      console.log(`${RED}✗ Error saving fix script: ${error.message}${RESET}`);
      console.log(`${YELLOW}   You can manually create the script with the content above${RESET}`);
    }
  }
  
  // Check if any component is missing required environment variables
  const mainPlatformConfig = checkHerokuConfig('sonar-edm-platform');
  const userDashboardConfig = checkHerokuConfig('sonar-edm-user');
  const promoterDashboardConfig = checkHerokuConfig('sonar-edm-promoter');
  const backendAPIConfig = checkHerokuConfig('sonar-edm-api');
  
  const mainPlatformEnvVarCheck = hasRequiredEnvVars(mainPlatformConfig, true, false, false, false);
  const userDashboardEnvVarCheck = hasRequiredEnvVars(userDashboardConfig, false, true, false, false);
  const promoterDashboardEnvVarCheck = hasRequiredEnvVars(promoterDashboardConfig, false, false, true, false);
  const backendAPIEnvVarCheck = hasRequiredEnvVars(backendAPIConfig, false, false, false, true);
  
  if (!mainPlatformEnvVarCheck.hasAll || !userDashboardEnvVarCheck.hasAll || !promoterDashboardEnvVarCheck.hasAll || !backendAPIEnvVarCheck.hasAll) {
    console.log(`${YELLOW}2. Set the missing environment variables for your Heroku apps${RESET}`);
    
    if (!mainPlatformEnvVarCheck.hasAll) {
      console.log(`${YELLOW}   Main Platform: ${mainPlatformEnvVarCheck.missing.join(', ')}${RESET}`);
    }
    
    if (!userDashboardEnvVarCheck.hasAll) {
      console.log(`${YELLOW}   User Dashboard: ${userDashboardEnvVarCheck.missing.join(', ')}${RESET}`);
    }
    
    if (!promoterDashboardEnvVarCheck.hasAll) {
      console.log(`${YELLOW}   Promoter Dashboard: ${promoterDashboardEnvVarCheck.missing.join(', ')}${RESET}`);
    }
    
    if (!backendAPIEnvVarCheck.hasAll) {
      console.log(`${YELLOW}   Backend API: ${backendAPIEnvVarCheck.missing.join(', ')}${RESET}`);
    }
    
    console.log(`${YELLOW}   Use the setup-environment.sh script to set these variables${RESET}`);
  }
  
  // Check if any component is missing a Procfile
  const mainPlatformHasProcfile = await hasProcfile('.');
  const userDashboardHasProcfile = await hasProcfile('./sonar-edm-user');
  const promoterDashboardHasProcfile = await hasProcfile('./sonar-edm-promoter');
  const backendAPIHasProcfile = await hasProcfile('./sonar-edm-api');
  
  if (!mainPlatformHasProcfile || !userDashboardHasProcfile || !promoterDashboardHasProcfile || !backendAPIHasProcfile) {
    console.log(`${YELLOW}3. Create a Procfile for each component that's missing one${RESET}`);
    console.log(`${YELLOW}   The Procfile should contain: web: npm start${RESET}`);
    
    if (!mainPlatformHasProcfile) {
      console.log(`${YELLOW}   Main Platform: Create a Procfile${RESET}`);
    }
    
    if (!userDashboardHasProcfile) {
      console.log(`${YELLOW}   User Dashboard: Create a Procfile${RESET}`);
    }
    
    if (!promoterDashboardHasProcfile) {
      console.log(`${YELLOW}   Promoter Dashboard: Create a Procfile${RESET}`);
    }
    
    if (!backendAPIHasProcfile) {
      console.log(`${YELLOW}   Backend API: Create a Procfile${RESET}`);
    }
  }
  
  // Check if any component is missing a next.config.js file
  const mainPlatformHasNextConfig = await hasNextConfig('.');
  const userDashboardHasNextConfig = await hasNextConfig('./sonar-edm-user');
  const promoterDashboardHasNextConfig = await hasNextConfig('./sonar-edm-promoter');
  
  if (!mainPlatformHasNextConfig || !userDashboardHasNextConfig || !promoterDashboardHasNextConfig) {
    console.log(`${YELLOW}4. Create a next.config.js file for each component that's missing one${RESET}`);
    console.log(`${YELLOW}   The next.config.js file should contain:${RESET}`);
    console.log(`${YELLOW}   /** @type {import('next').NextConfig} */${RESET}`);
    console.log(`${YELLOW}   const nextConfig = {${RESET}`);
    console.log(`${YELLOW}     reactStrictMode: true,${RESET}`);
    console.log(`${YELLOW}     swcMinify: true,${RESET}`);
    console.log(`${YELLOW}   }${RESET}`);
    console.log(`${YELLOW}   module.exports = nextConfig${RESET}`);
    
    if (!mainPlatformHasNextConfig) {
      console.log(`${YELLOW}   Main Platform: Create a next.config.js file${RESET}`);
    }
    
    if (!userDashboardHasNextConfig) {
      console.log(`${YELLOW}   User Dashboard: Create a next.config.js file${RESET}`);
    }
    
    if (!promoterDashboardHasNextConfig) {
      console.log(`${YELLOW}   Promoter Dashboard: Create a next.config.js file${RESET}`);
    }
  }
  
  console.log(`\n${BLUE}=== Next Steps ===${RESET}`);
  console.log(`${YELLOW}1. Fix the issues identified above${RESET}`);
  console.log(`${YELLOW}2. Commit and push the changes to Heroku${RESET}`);
  console.log(`${YELLOW}3. Restart the Heroku dynos${RESET}`);
  console.log(`${YELLOW}4. Test the application${RESET}`);
  
  console.log(`\n${GREEN}=== Diagnostic completed! ===${RESET}`);
}

// Run the diagnostic
runDiagnostic().catch(error => {
  console.error(`${RED}Error:${RESET}`, error.message);
  process.exit(1);
});
