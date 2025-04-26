#!/bin/bash
# Implementation script for debug version of combined API
# This script will update the events API endpoint to always return sample events

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting TIKO platform API debug implementation...${NC}"

# Create backup of current implementation
echo -e "${YELLOW}Creating backup of current implementation...${NC}"
BACKUP_DIR="/c/sonar/users/sonar-edm-user/backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR/pages/api/events"

if [ -f "/c/sonar/users/sonar-edm-user/pages/api/events/index.js" ]; then
  cp "/c/sonar/users/sonar-edm-user/pages/api/events/index.js" "$BACKUP_DIR/pages/api/events/"
  echo -e "${GREEN}Backup created at $BACKUP_DIR${NC}"
else
  echo -e "${YELLOW}No existing events API file found, will create a new one${NC}"
fi

# Create directory if it doesn't exist
mkdir -p "/c/sonar/users/sonar-edm-user/pages/api/events"

# Create the debug API implementation
echo -e "${GREEN}Creating debug version of API implementation...${NC}"
cat > "/c/sonar/users/sonar-edm-user/pages/api/events/index.js" << 'EOL'
// Debug version of events API that always returns sample events
// This is a simplified version for troubleshooting

// Sample events with valid links
const sampleEvents = [
  {
    name: "House & Techno Night",
    venue: "CODA",
    city: "Toronto",
    address: "794 Bathurst St",
    date: "2025-05-03",
    time: "22:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/electronic-dance-music-tickets/category/10001",
    matchScore: 85,
    source: "sample"
  },
  {
    name: "Deep House Sessions",
    venue: "Rebel",
    city: "Toronto",
    address: "11 Polson St",
    date: "2025-05-10",
    time: "21:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/music-festivals-tickets/category/10005",
    matchScore: 80,
    source: "sample"
  },
  {
    name: "Techno Underground",
    venue: "Vertigo",
    city: "Toronto",
    address: "567 Queen St W",
    date: "2025-05-17",
    time: "23:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/club-passes-tickets/category/10007",
    matchScore: 75,
    source: "sample"
  }
];

// Main handler function
const handler = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log('DEBUG Events API called with query:', req.query);
  
  // Always return sample events for debugging
  return res.status(200).json({
    events: sampleEvents,
    source: 'debug_mode',
    location: { city: req.query.city || 'Toronto' },
    debug: true
  });
};

export default handler;
EOL

# Create deployment script
echo -e "${GREEN}Creating deployment script...${NC}"
cat > "/c/sonar/users/sonar-edm-user/deploy-debug-api.sh" << 'EOL'
#!/bin/bash
# Deployment script for debug API implementation

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of debug API implementation...${NC}"

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add pages/api/events/index.js
git commit -m "Add debug version of events API"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}To monitor logs, run: heroku logs --tail --app sonar-edm-user${NC}"
echo -e "${YELLOW}To verify the implementation, visit: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/dashboard${NC}"
EOL

# Make deployment script executable
chmod +x "/c/sonar/users/sonar-edm-user/deploy-debug-api.sh"

# Create a client-side debug script to help diagnose frontend issues
echo -e "${GREEN}Creating client-side debug script...${NC}"
mkdir -p "/c/sonar/users/sonar-edm-user/public/js"
cat > "/c/sonar/users/sonar-edm-user/public/js/events-debug.js" << 'EOL'
// Client-side debug script for events section
(function() {
  console.log('Events debug script loaded');
  
  // Function to fetch events from API
  async function fetchEvents() {
    try {
      console.log('Attempting to fetch events from API...');
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        console.error('API request failed with status', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('Events API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return null;
    }
  }
  
  // Function to check if events section exists
  function checkEventsSection() {
    console.log('Checking for events section in DOM...');
    const eventsSections = document.querySelectorAll('.events-section, [data-testid="events-section"], [class*="events"], [id*="events"]');
    
    if (eventsSections.length > 0) {
      console.log('Found potential events sections:', eventsSections.length);
      eventsSections.forEach((section, index) => {
        console.log(`Events section ${index}:`, section);
      });
    } else {
      console.log('No events section found in DOM');
    }
  }
  
  // Run diagnostics when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, running events diagnostics...');
    
    // Fetch events
    fetchEvents();
    
    // Check for events section
    setTimeout(checkEventsSection, 1000);
    
    // Add debug button to page
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Events';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.style.padding = '10px';
    debugButton.style.backgroundColor = '#ff5722';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '5px';
    debugButton.style.cursor = 'pointer';
    
    debugButton.addEventListener('click', function() {
      fetchEvents();
      checkEventsSection();
    });
    
    document.body.appendChild(debugButton);
  });
})();
EOL

# Create instructions for adding the debug script to the dashboard
echo -e "${GREEN}Creating instructions for adding debug script to dashboard...${NC}"
cat > "/c/sonar/users/sonar-edm-user/add-debug-script.md" << 'EOL'
# Adding Debug Script to Dashboard

To help diagnose why events aren't showing on the dashboard, add the debug script to your dashboard page:

## Option 1: Add to dashboard.js

Open your dashboard page file (likely at `pages/dashboard.js` or `pages/users/dashboard.js`) and add the following script tag:

```jsx
import Head from 'next/head';

// In your Dashboard component
return (
  <div>
    <Head>
      {/* Add this line */}
      <script src="/js/events-debug.js"></script>
    </Head>
    {/* Rest of your dashboard */}
  </div>
);
```

## Option 2: Add to _app.js

If you prefer to add it globally, open `pages/_app.js` and add:

```jsx
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Add this line */}
        <script src="/js/events-debug.js"></script>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
```

## After Adding the Script

1. Deploy the changes
2. Visit your dashboard
3. Open the browser console (F12 or right-click > Inspect > Console)
4. Look for debug messages about the events API
5. Use the "Debug Events" button in the bottom-right corner to run diagnostics

This will help identify if:
- The API is being called correctly
- The API is returning data
- The events section exists in the DOM
EOL

echo -e "${GREEN}Implementation complete!${NC}"
echo -e "${YELLOW}To deploy the changes, run: ./deploy-debug-api.sh${NC}"
echo -e "${YELLOW}To add the debug script to your dashboard, follow the instructions in add-debug-script.md${NC}"
echo -e "${YELLOW}If you need to restore the backup, the files are in: $BACKUP_DIR${NC}"
