#!/bin/bash
# Implementation script for full combined Ticketmaster and EDMTrain API
# This script will update the events API endpoint to fetch real events from both APIs

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting TIKO platform full API implementation...${NC}"

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

# Create the full combined API implementation
echo -e "${GREEN}Creating full combined Ticketmaster and EDMTrain API implementation...${NC}"
cat > "/c/sonar/users/sonar-edm-user/pages/api/events/index.js" << 'EOL'
// Combined Ticketmaster and EDMTrain API with Caching for TIKO Platform
// This file should replace pages/api/events/index.js

// Cache storage for both APIs
let eventCache = {
  ticketmaster: {
    data: null,
    timestamp: 0,
    city: ''
  },
  edmtrain: {
    data: null,
    timestamp: 0,
    city: ''
  },
  combined: {
    data: null,
    timestamp: 0,
    city: ''
  }
};

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

// Sample events for absolute fallback
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

// Check if cache is valid
const isCacheValid = (cacheType, city) => {
  const now = Date.now();
  return (
    eventCache[cacheType].data !== null &&
    eventCache[cacheType].city === city &&
    now - eventCache[cacheType].timestamp < CACHE_DURATION
  );
};

// Direct Ticketmaster API call function with no external dependencies
const directTicketmasterApiCall = async (apiKey, city = 'Toronto') => {
  console.log(`Making direct API call to Ticketmaster for city: ${city}`);
  
  try {
    // Use a simple, direct URL that's most likely to work
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=${encodeURIComponent(city)}&classificationName=music&size=10`;
    
    console.log(`Ticketmaster API URL: ${url}`);
    
    // Use native fetch (available in Next.js)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Ticketmaster API request failed with status ${response.status}`);
      
      // If rate limited, throw specific error
      if (response.status === 429) {
        throw new Error('Ticketmaster rate limit exceeded');
      }
      
      throw new Error(`Ticketmaster API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Ticketmaster API response received successfully');
    
    return data;
  } catch (error) {
    console.error('Direct Ticketmaster API call failed:', error.message);
    return null;
  }
};

// Direct EDMTrain API call function with no external dependencies
const directEDMTrainApiCall = async (apiKey, city = 'Toronto') => {
  console.log(`Making direct API call to EDMTrain for city: ${city}`);
  
  try {
    // Get the current date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // EDMTrain API requires location IDs, so we need to map city names to IDs
    // Toronto is ID 142
    let locationId = 142; // Default to Toronto
    
    // Map common cities to their EDMTrain location IDs
    const cityMap = {
      'toronto': 142,
      'new york': 1,
      'los angeles': 2,
      'chicago': 3,
      'miami': 4,
      'las vegas': 5,
      'san francisco': 6,
      'denver': 8,
      'seattle': 9,
      'boston': 10
    };
    
    // Try to match the city name to a known location ID
    const lowerCity = city.toLowerCase();
    for (const [key, value] of Object.entries(cityMap)) {
      if (lowerCity.includes(key)) {
        locationId = value;
        break;
      }
    }
    
    // Use a simple, direct URL that's most likely to work
    const url = `https://edmtrain.com/api/events?locationIds=${locationId}&startDate=${formattedDate}&endDate=&artistIds=&client=${apiKey}`;
    
    console.log(`EDMTrain API URL: ${url} (with location ID: ${locationId})`);
    
    // Use native fetch (available in Next.js)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`EDMTrain API request failed with status ${response.status}`);
      
      // If rate limited, throw specific error
      if (response.status === 429) {
        throw new Error('EDMTrain rate limit exceeded');
      }
      
      throw new Error(`EDMTrain API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('EDMTrain API response received successfully');
    
    return data;
  } catch (error) {
    console.error('Direct EDMTrain API call failed:', error.message);
    return null;
  }
};

// Process Ticketmaster events into our format
const processTicketmasterEvents = (data) => {
  if (!data || !data._embedded || !data._embedded.events || data._embedded.events.length === 0) {
    console.log('No events found in Ticketmaster API response');
    return [];
  }
  
  console.log(`Processing ${data._embedded.events.length} events from Ticketmaster`);
  
  return data._embedded.events.map(event => {
    // Extract venue info
    const venue = event._embedded?.venues?.[0]?.name || 'Unknown Venue';
    const city = event._embedded?.venues?.[0]?.city?.name || 'Unknown City';
    const address = event._embedded?.venues?.[0]?.address?.line1 || '';
    
    // Extract image with fallback
    let image = 'https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg';
    if (event.images && event.images.length > 0) {
      // Find a suitable image
      const suitableImage = event.images.find(img => 
        img.url && img.url.startsWith('http') && 
        (img.width > 300 && img.width < 800)
      );
      
      if (suitableImage) {
        image = suitableImage.url;
      } else if (event.images[0].url) {
        image = event.images[0].url;
      }
    }
    
    // Extract date and time
    const date = event.dates?.start?.localDate || 'TBD';
    const time = event.dates?.start?.localTime || 'TBD';
    
    // Generate a match score
    const matchScore = Math.floor(Math.random() * 20) + 70; // Between 70-90
    
    return {
      id: event.id,
      name: event.name,
      venue,
      city,
      address,
      date,
      time,
      image,
      url: event.url || 'https://www.ticketmaster.ca/electronic-dance-music-tickets/category/10001',
      matchScore,
      source: 'ticketmaster'
    };
  });
};

// Process EDMTrain events into our format
const processEDMTrainEvents = (data) => {
  if (!data || !data.data || data.data.length === 0) {
    console.log('No events found in EDMTrain API response');
    return [];
  }
  
  console.log(`Processing ${data.data.length} events from EDMTrain`);
  
  return data.data.map(event => {
    // Extract venue info
    const venue = event.venue?.name || 'Unknown Venue';
    const city = event.venue?.location || 'Unknown City';
    const address = ''; // EDMTrain doesn't provide detailed address
    
    // Extract date and time
    const eventDate = new Date(event.date);
    const date = eventDate.toISOString().split('T')[0];
    const time = event.startTime || '20:00:00';
    
    // Default image for EDM events
    const image = 'https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png';
    
    // Generate a match score
    const matchScore = Math.floor(Math.random() * 20) + 70; // Between 70-90
    
    // Create event name from artists
    let name = 'EDM Event';
    if (event.artistList && event.artistList.length > 0) {
      const artists = event.artistList.map(artist => artist.name);
      if (artists.length === 1) {
        name = artists[0];
      } else if (artists.length === 2) {
        name = `${artists[0]} & ${artists[1]}`;
      } else if (artists.length > 2) {
        name = `${artists[0]} with ${artists.length - 1} more`;
      }
    }
    
    // Create URL to EDMTrain event page
    const url = `https://edmtrain.com/event/${event.id}`;
    
    return {
      id: `edmtrain-${event.id}`,
      name,
      venue,
      city,
      address,
      date,
      time,
      image,
      url,
      matchScore,
      source: 'edmtrain'
    };
  });
};

// Combine events from both APIs and sort by match score
const combineEvents = (ticketmasterEvents, edmtrainEvents) => {
  const combined = [...ticketmasterEvents, ...edmtrainEvents];
  
  // Sort by match score (highest first)
  combined.sort((a, b) => b.matchScore - a.matchScore);
  
  // Limit to 10 events
  return combined.slice(0, 10);
};

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
  
  console.log('Events API called with query:', req.query);
  
  // Extract location parameters with fallbacks
  const city = req.query.city || 'Toronto';
  
  // Check for force refresh parameter
  const forceRefresh = req.query.refresh === 'true';
  
  try {
    // Check if we have valid combined cache
    if (!forceRefresh && isCacheValid('combined', city)) {
      console.log(`Using combined cached events data for ${city}, cache age: ${(Date.now() - eventCache.combined.timestamp) / 1000} seconds`);
      
      return res.status(200).json({
        events: eventCache.combined.data,
        source: 'combined_cache',
        location: { city },
        cached: true,
        cacheAge: (Date.now() - eventCache.combined.timestamp) / 1000
      });
    }
    
    // Get API keys directly from environment variables
    const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
    const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
    
    if (!ticketmasterApiKey && !edmtrainApiKey) {
      console.error('Neither Ticketmaster nor EDMTrain API keys found in environment variables');
      throw new Error('API keys not configured');
    }
    
    // Initialize arrays for events from each API
    let ticketmasterEvents = [];
    let edmtrainEvents = [];
    
    // Try to get Ticketmaster events
    if (ticketmasterApiKey) {
      console.log('Using Ticketmaster API key:', ticketmasterApiKey.substring(0, 4) + '...');
      
      // Check if we have valid Ticketmaster cache
      if (!forceRefresh && isCacheValid('ticketmaster', city)) {
        console.log(`Using cached Ticketmaster events data for ${city}`);
        ticketmasterEvents = eventCache.ticketmaster.data;
      } else {
        // Make direct API call
        const ticketmasterData = await directTicketmasterApiCall(ticketmasterApiKey, city);
        
        // Process events if we got data
        if (ticketmasterData) {
          ticketmasterEvents = processTicketmasterEvents(ticketmasterData);
          
          if (ticketmasterEvents.length > 0) {
            console.log(`Successfully processed ${ticketmasterEvents.length} events from Ticketmaster`);
            
            // Update Ticketmaster cache
            eventCache.ticketmaster = {
              data: ticketmasterEvents,
              timestamp: Date.now(),
              city
            };
          }
        } else if (eventCache.ticketmaster.data !== null && 
                  eventCache.ticketmaster.city === city && 
                  (Date.now() - eventCache.ticketmaster.timestamp < 24 * 60 * 60 * 1000)) {
          // Use expired cache as fallback (up to 24 hours old)
          console.log('Using expired Ticketmaster cache as fallback');
          ticketmasterEvents = eventCache.ticketmaster.data;
        }
      }
    }
    
    // Try to get EDMTrain events
    if (edmtrainApiKey) {
      console.log('Using EDMTrain API key:', edmtrainApiKey.substring(0, 4) + '...');
      
      // Check if we have valid EDMTrain cache
      if (!forceRefresh && isCacheValid('edmtrain', city)) {
        console.log(`Using cached EDMTrain events data for ${city}`);
        edmtrainEvents = eventCache.edmtrain.data;
      } else {
        // Make direct API call
        const edmtrainData = await directEDMTrainApiCall(edmtrainApiKey, city);
        
        // Process events if we got data
        if (edmtrainData) {
          edmtrainEvents = processEDMTrainEvents(edmtrainData);
          
          if (edmtrainEvents.length > 0) {
            console.log(`Successfully processed ${edmtrainEvents.length} events from EDMTrain`);
            
            // Update EDMTrain cache
            eventCache.edmtrain = {
              data: edmtrainEvents,
              timestamp: Date.now(),
              city
            };
          }
        } else if (eventCache.edmtrain.data !== null && 
                  eventCache.edmtrain.city === city && 
                  (Date.now() - eventCache.edmtrain.timestamp < 24 * 60 * 60 * 1000)) {
          // Use expired cache as fallback (up to 24 hours old)
          console.log('Using expired EDMTrain cache as fallback');
          edmtrainEvents = eventCache.edmtrain.data;
        }
      }
    }
    
    // Combine events from both APIs
    const totalEvents = ticketmasterEvents.length + edmtrainEvents.length;
    
    if (totalEvents > 0) {
      console.log(`Combining ${ticketmasterEvents.length} Ticketmaster events and ${edmtrainEvents.length} EDMTrain events`);
      
      const combinedEvents = combineEvents(ticketmasterEvents, edmtrainEvents);
      
      // Update combined cache
      eventCache.combined = {
        data: combinedEvents,
        timestamp: Date.now(),
        city
      };
      
      // Return the combined events
      return res.status(200).json({
        events: combinedEvents,
        source: 'combined_api',
        location: { city },
        cached: false,
        ticketmasterCount: ticketmasterEvents.length,
        edmtrainCount: edmtrainEvents.length
      });
    }
    
    // If we get here, both API calls failed or returned no events
    console.log('Both API calls failed or returned no events, checking combined cache before using sample events');
    
    // Try to use slightly expired combined cache as fallback (up to 24 hours old)
    if (eventCache.combined.data !== null && 
        eventCache.combined.city === city && 
        (Date.now() - eventCache.combined.timestamp < 24 * 60 * 60 * 1000)) {
      console.log('Using expired combined cache as fallback');
      
      return res.status(200).json({
        events: eventCache.combined.data,
        source: 'expired_combined_cache',
        location: { city },
        cached: true,
        cacheAge: (Date.now() - eventCache.combined.timestamp) / 1000
      });
    }
    
    // Return sample events as last resort fallback
    console.log('No cache available, using sample events');
    
    return res.status(200).json({
      events: sampleEvents,
      source: 'fallback',
      location: { city }
    });
    
  } catch (error) {
    console.error('Error in events API:', error);
    
    // Try to use cache even if expired (up to 24 hours) when errors occur
    if (eventCache.combined.data !== null && 
        eventCache.combined.city === city && 
        (Date.now() - eventCache.combined.timestamp < 24 * 60 * 60 * 1000)) {
      console.log('Error occurred, using combined cached data as fallback');
      
      return res.status(200).json({
        events: eventCache.combined.data,
        source: 'error_cache_fallback',
        location: { city },
        cached: true,
        cacheAge: (Date.now() - eventCache.combined.timestamp) / 1000,
        error: error.message
      });
    }
    
    // Always return sample events as last resort fallback
    return res.status(200).json({
      events: sampleEvents,
      source: 'error_fallback',
      error: error.message,
      location: { city }
    });
  }
};

export default handler;
EOL

# Create deployment script
echo -e "${GREEN}Creating deployment script...${NC}"
cat > "/c/sonar/users/sonar-edm-user/deploy-full-api.sh" << 'EOL'
#!/bin/bash
# Deployment script for full combined API implementation

# Set script to exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of full combined API implementation...${NC}"

# Verify API keys are set
echo -e "${YELLOW}Verifying environment variables...${NC}"
TICKETMASTER_KEY=$(heroku config:get TICKETMASTER_API_KEY --app sonar-edm-user)
EDMTRAIN_KEY=$(heroku config:get EDMTRAIN_API_KEY --app sonar-edm-user)

if [ -z "$TICKETMASTER_KEY" ]; then
  echo -e "${RED}Ticketmaster API key not set. Setting it now...${NC}"
  heroku config:set TICKETMASTER_API_KEY=gjGKNoTGeWl8HF2FAgYQVCf25D5ap7yw --app sonar-edm-user
else
  echo -e "${GREEN}Ticketmaster API key is set${NC}"
fi

if [ -z "$EDMTRAIN_KEY" ]; then
  echo -e "${RED}EDMTrain API key not set. Setting it now...${NC}"
  heroku config:set EDMTRAIN_API_KEY=b5143e2e-21f2-4b45-b537-0b5b9ec9bdad --app sonar-edm-user
else
  echo -e "${GREEN}EDMTrain API key is set${NC}"
fi

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add pages/api/events/index.js
git commit -m "Implement full combined Ticketmaster and EDMTrain API with caching"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}To monitor logs, run: heroku logs --tail --app sonar-edm-user${NC}"
echo -e "${YELLOW}To verify the implementation, visit: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/dashboard${NC}"
EOL

# Make deployment script executable
chmod +x "/c/sonar/users/sonar-edm-user/deploy-full-api.sh"

# Create a client-side debug script to help monitor API responses
echo -e "${GREEN}Creating client-side monitoring script...${NC}"
mkdir -p "/c/sonar/users/sonar-edm-user/public/js"
cat > "/c/sonar/users/sonar-edm-user/public/js/events-monitor.js" << 'EOL'
// Client-side monitoring script for events API
(function() {
  console.log('Events monitoring script loaded');
  
  // Function to fetch events from API
  async function fetchEvents() {
    try {
      console.log('Fetching events from API...');
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        console.error('API request failed with status', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('Events API response:', data);
      
      // Log source and counts
      console.log('Events source:', data.source);
      if (data.ticketmasterCount !== undefined) {
        console.log('Ticketmaster events:', data.ticketmasterCount);
      }
      if (data.edmtrainCount !== undefined) {
        console.log('EDMTrain events:', data.edmtrainCount);
      }
      
      // Log individual events with their sources
      if (data.events && data.events.length > 0) {
        console.log('Events by source:');
        const sources = {};
        data.events.forEach(event => {
          sources[event.source] = (sources[event.source] || 0) + 1;
        });
        console.table(sources);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return null;
    }
  }
  
  // Run when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, running events monitoring...');
    
    // Fetch events
    setTimeout(fetchEvents, 1000);
    
    // Add monitor button to page
    const monitorButton = document.createElement('button');
    monitorButton.textContent = 'Monitor Events';
    monitorButton.style.position = 'fixed';
    monitorButton.style.bottom = '10px';
    monitorButton.style.right = '10px';
    monitorButton.style.zIndex = '9999';
    monitorButton.style.padding = '10px';
    monitorButton.style.backgroundColor = '#4CAF50';
    monitorButton.style.color = 'white';
    monitorButton.style.border = 'none';
    monitorButton.style.borderRadius = '5px';
    monitorButton.style.cursor = 'pointer';
    
    monitorButton.addEventListener('click', function() {
      fetchEvents();
    });
    
    document.body.appendChild(monitorButton);
  });
})();
EOL

# Create instructions for adding the monitoring script to the dashboard
echo -e "${GREEN}Creating instructions for adding monitoring script to dashboard...${NC}"
cat > "/c/sonar/users/sonar-edm-user/add-monitor-script.md" << 'EOL'
# Adding Monitoring Script to Dashboard

To help monitor the events API and see which sources (Ticketmaster or EDMTrain) are providing events, add the monitoring script to your dashboard page:

## Option 1: Add to dashboard.js

Open your dashboard page file (likely at `pages/dashboard.js` or `pages/users/dashboard.js`) and add the following script tag:

```jsx
import Head from 'next/head';

// In your Dashboard component
return (
  <div>
    <Head>
      {/* Add this line */}
      <script src="/js/events-monitor.js"></script>
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
        <script src="/js/events-monitor.js"></script>
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
4. Look for monitoring messages about the events API
5. Use the "Monitor Events" button in the bottom-right corner to refresh the data

This will help you see:
- Which API sources are providing events (Ticketmaster, EDMTrain, or sample)
- How many events are coming from each source
- The full API response with all event details
EOL

echo -e "${GREEN}Implementation complete!${NC}"
echo -e "${YELLOW}To deploy the changes, run: ./deploy-full-api.sh${NC}"
echo -e "${YELLOW}To add the monitoring script to your dashboard, follow the instructions in add-monitor-script.md${NC}"
echo -e "${YELLOW}If you need to restore the backup, the files are in: $BACKUP_DIR${NC}"
