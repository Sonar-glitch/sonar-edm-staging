#!/bin/bash

# TIKO Platform Image Fix Script
# This script fixes the image loading errors while maintaining Ticketmaster API integration
# Created: April 26, 2025

echo "Starting TIKO image fix at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
BACKUP_DIR="./backups/image-fix-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory created: $BACKUP_DIR"

# Backup key files
echo "Backing up key files..."
mkdir -p "$BACKUP_DIR/pages/api/events"
mkdir -p "$BACKUP_DIR/public/images"

cp -f pages/api/events/index.js "$BACKUP_DIR/pages/api/events/index.js" 2>/dev/null || echo "Warning: Could not backup events API file"
cp -f pages/dashboard.js "$BACKUP_DIR/pages/dashboard.js" 2>/dev/null || echo "Warning: Could not backup dashboard.js"

# 1. Create placeholder images directory
echo "Creating placeholder images directory..."
mkdir -p public/images/placeholders

# 2. Create placeholder images using base64 data
echo "Creating placeholder images..."
cat > public/images/placeholders/create-placeholders.js << 'EOL'
const fs = require('fs');
const path = require('path');

// Create the placeholders directory if it doesn't exist
const placeholdersDir = path.join(__dirname);
if (!fs.existsSync(placeholdersDir)) {
  fs.mkdirSync(placeholdersDir, { recursive: true });
}

// Base64 encoded 16:9 placeholder image (blue gradient)
const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAD6CAYAAABXq7VOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABQSURBVHhe7cExAQAAAMKg9U/tbwagAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBnDV+AAWCzfJYAAAAASUVORK5CYII=';

// Create different sizes of placeholder images
const sizes = [
  { name: 'event_placeholder_small.jpg', width: 100, height: 56 },
  { name: 'event_placeholder_medium.jpg', width: 300, height: 169 },
  { name: 'event_placeholder_large.jpg', width: 800, height: 450 }
];

// Extract the base64 data (remove the data:image/png;base64, part)
const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
const buffer = Buffer.from(base64Data, 'base64');

// Save the images
sizes.forEach(size => {
  const filePath = path.join(placeholdersDir, size.name);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created placeholder image: ${size.name}`);
});

console.log('All placeholder images created successfully');
EOL

# Run the placeholder creation script
echo "Running placeholder creation script..."
node public/images/placeholders/create-placeholders.js

# 3. Fix the events API to use local placeholder images
echo "Fixing events API to use local placeholder images..."

mkdir -p pages/api/events
cat > pages/api/events/index.js << 'EOL'
import axios from 'axios';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Sample events for Toronto as fallback with local placeholder images
const TORONTO_SAMPLE_EVENTS = [
  {
    id: "toronto-event-1",
    name: "Electric Nights: Toronto House Edition",
    url: "https://www.ticketmaster.ca/electric-nights-toronto-house-edition-toronto-ontario-05-15-2025/event/10005E8B9A3A1234",
    images: [{ url: "/images/placeholders/event_placeholder_large.jpg" }],
    dates: {
      start: {
        localDate: "2025-05-15",
        localTime: "20:00:00"
      }
    },
    priceRanges: [
      {
        min: 45.00,
        max: 120.00,
        currency: "CAD"
      }
    ],
    _embedded: {
      venues: [{
        name: "REBEL",
        address: {
          line1: "11 Polson St"
        },
        city: {
          name: "Toronto"
        },
        postalCode: "M5A 1A4",
        location: {
          latitude: "43.644444",
          longitude: "-79.365556"
        }
      }],
      attractions: [{
        name: "DJ TechHouse",
        classifications: [
          {
            segment: {
              name: "Music"
            },
            genre: {
              name: "Electronic"
            },
            subGenre: {
              name: "House"
            }
          }
        ]
      }]
    },
    matchScore: 92
  },
  {
    id: "toronto-event-2",
    name: "Deep Techno Underground",
    url: "https://www.ticketmaster.ca/deep-techno-underground-toronto-ontario-05-22-2025/event/10005E8B9A3A5678",
    images: [{ url: "/images/placeholders/event_placeholder_large.jpg" }],
    dates: {
      start: {
        localDate: "2025-05-22",
        localTime: "22:00:00"
      }
    },
    priceRanges: [
      {
        min: 35.00,
        max: 85.00,
        currency: "CAD"
      }
    ],
    _embedded: {
      venues: [{
        name: "CODA",
        address: {
          line1: "794 Bathurst St"
        },
        city: {
          name: "Toronto"
        },
        postalCode: "M5R 3G1",
        location: {
          latitude: "43.665833",
          longitude: "-79.411944"
        }
      }],
      attractions: [{
        name: "Techno Collective",
        classifications: [
          {
            segment: {
              name: "Music"
            },
            genre: {
              name: "Electronic"
            },
            subGenre: {
              name: "Techno"
            }
          }
        ]
      }]
    },
    matchScore: 88
  },
  {
    id: "toronto-event-3",
    name: "Progressive House Showcase",
    url: "https://www.ticketmaster.ca/progressive-house-showcase-toronto-ontario-05-29-2025/event/10005E8B9A3A9012",
    images: [{ url: "/images/placeholders/event_placeholder_large.jpg" }],
    dates: {
      start: {
        localDate: "2025-05-29",
        localTime: "21:00:00"
      }
    },
    priceRanges: [
      {
        min: 40.00,
        max: 95.00,
        currency: "CAD"
      }
    ],
    _embedded: {
      venues: [{
        name: "The Danforth Music Hall",
        address: {
          line1: "147 Danforth Ave"
        },
        city: {
          name: "Toronto"
        },
        postalCode: "M4K 1N2",
        location: {
          latitude: "43.676667",
          longitude: "-79.353056"
        }
      }],
      attractions: [{
        name: "Progressive Sound",
        classifications: [
          {
            segment: {
              name: "Music"
            },
            genre: {
              name: "Electronic"
            },
            subGenre: {
              name: "Progressive House"
            }
          }
        ]
      }]
    },
    matchScore: 85
  }
];

// Function to ensure events have valid image URLs
function ensureValidImageUrls(events) {
  if (!events || !Array.isArray(events)) return [];
  
  return events.map(event => {
    // Check if event has valid images
    if (!event.images || !Array.isArray(event.images) || event.images.length === 0) {
      // If no images or invalid images, add placeholder
      event.images = [{ url: "/images/placeholders/event_placeholder_large.jpg" }];
    } else {
      // Check each image URL and replace if invalid
      event.images = event.images.map(img => {
        if (!img.url || img.url.includes('undefined') || img.url.includes('null')) {
          return { url: "/images/placeholders/event_placeholder_large.jpg" };
        }
        return img;
      });
    }
    return event;
  });
}

// Function to calculate match score based on user's music taste
function calculateMatchScore(event, userTaste) {
  // Default score if we can't determine
  let score = 70;
  
  try {
    // Extract genre information from event
    const attractions = event._embedded?.attractions || [];
    const genres = attractions.flatMap(attraction => 
      attraction.classifications?.map(c => ({
        genre: c.genre?.name?.toLowerCase(),
        subGenre: c.subGenre?.name?.toLowerCase()
      })) || []
    );
    
    // If we have user taste data, calculate a more accurate score
    if (userTaste && userTaste.genres && userTaste.genres.length > 0) {
      const userGenres = userTaste.genres.map(g => g.toLowerCase());
      
      // Check for direct matches
      const directMatches = genres.filter(g => 
        userGenres.includes(g.genre) || userGenres.includes(g.subGenre)
      ).length;
      
      if (directMatches > 0) {
        // Higher score for direct matches
        score = 75 + (directMatches * 5);
      } else {
        // Check for partial matches
        const partialMatches = genres.filter(g => 
          userGenres.some(ug => g.genre?.includes(ug) || g.subGenre?.includes(ug) || ug.includes(g.genre) || ug.includes(g.subGenre))
        ).length;
        
        if (partialMatches > 0) {
          score = 70 + (partialMatches * 3);
        }
      }
    }
    
    // Cap the score at 95
    return Math.min(score, 95);
  } catch (error) {
    console.error("Error calculating match score:", error);
    return score;
  }
}

export default async function handler(req, res) {
  console.log("Events API handler called with query:", req.query);
  
  // Get user session
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    console.log("No session found, returning 401");
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // Get location from query parameters
  let { lat, lon, city } = req.query;
  console.log(`Original location parameters: lat=${lat}, lon=${lon}, city=${city}`);
  
  // Validate and fix location parameters
  if (lat === 'undefined' || lon === 'undefined' || !lat || !lon) {
    // If we have a city, use that
    if (city && city !== 'undefined') {
      console.log(`Using city parameter: ${city}`);
      // City is valid, continue with it
    } else if (city === 'Toronto' || city?.includes('Toronto')) {
      // For Toronto, set specific coordinates
      lat = '43.65';
      lon = '-79.38';
      city = 'Toronto';
      console.log(`Setting Toronto coordinates: lat=${lat}, lon=${lon}`);
    } else {
      // Default to Toronto if no valid location
      lat = '43.65';
      lon = '-79.38';
      city = 'Toronto';
      console.log(`No valid location, defaulting to Toronto: lat=${lat}, lon=${lon}`);
    }
  }
  
  // Check if we have a Toronto request
  const isTorontoRequest = city?.toLowerCase().includes('toronto') || 
                          (lat && lon && Math.abs(parseFloat(lat) - 43.65) < 0.5 && Math.abs(parseFloat(lon) - (-79.38)) < 0.5);
  
  console.log(`Is Toronto request: ${isTorontoRequest}`);
  
  try {
    // Prepare API request parameters
    let params = {
      apikey: process.env.TICKETMASTER_API_KEY,
      classificationName: "music",
      keyword: "electronic OR dance OR dj OR festival OR rave",
      size: 20,
      sort: "date,asc",
      startDateTime: new Date().toISOString()
    };
    
    // Add location parameters
    if (lat && lon && lat !== 'undefined' && lon !== 'undefined') {
      params.latlong = `${lat},${lon}`;
      params.radius = "50";
      params.unit = "miles";
      console.log(`Using coordinates for Ticketmaster API: ${params.latlong}`);
    } else if (city && city !== 'undefined') {
      params.city = city;
      console.log(`Using city for Ticketmaster API: ${params.city}`);
    }
    
    console.log("Making Ticketmaster API request with params:", params);
    
    // Make request to Ticketmaster API
    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
      params,
      timeout: 8000 // 8 second timeout
    });
    
    // Check if we have events
    if (response.data._embedded && response.data._embedded.events && response.data._embedded.events.length > 0) {
      console.log(`Found ${response.data._embedded.events.length} events from Ticketmaster API`);
      
      // Process events
      let events = response.data._embedded.events.map(event => {
        // Calculate match score
        const matchScore = calculateMatchScore(event, {
          genres: ["electronic", "house", "techno", "dance", "trance", "dubstep"]
        });
        
        return {
          ...event,
          matchScore
        };
      });
      
      // Ensure all events have valid image URLs
      events = ensureValidImageUrls(events);
      
      // Sort by match score
      events.sort((a, b) => b.matchScore - a.matchScore);
      
      return res.status(200).json({
        events,
        source: "ticketmaster"
      });
    } else {
      console.log("No events found from Ticketmaster API, trying simplified query...");
      
      // Try again with a simpler query
      const simplifiedParams = {
        ...params,
        keyword: "music", // More generic keyword
        classificationName: "music",
        size: 30
      };
      
      try {
        const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
          params: simplifiedParams,
          timeout: 8000
        });
        
        if (retryResponse.data._embedded && retryResponse.data._embedded.events && retryResponse.data._embedded.events.length > 0) {
          console.log(`Found ${retryResponse.data._embedded.events.length} events from simplified Ticketmaster API query`);
          
          // Process events
          let events = retryResponse.data._embedded.events.map(event => {
            // Calculate match score
            const matchScore = calculateMatchScore(event, {
              genres: ["electronic", "house", "techno", "dance", "trance", "dubstep"]
            });
            
            return {
              ...event,
              matchScore
            };
          });
          
          // Ensure all events have valid image URLs
          events = ensureValidImageUrls(events);
          
          // Sort by match score
          events.sort((a, b) => b.matchScore - a.matchScore);
          
          return res.status(200).json({
            events,
            source: "ticketmaster_simplified"
          });
        }
      } catch (retryError) {
        console.error("Error with simplified Ticketmaster query:", retryError);
      }
      
      // If still no events or retry failed, use sample events for Toronto
      if (isTorontoRequest) {
        console.log("Using Toronto sample events as fallback");
        return res.status(200).json({
          events: TORONTO_SAMPLE_EVENTS,
          source: "sample"
        });
      } else {
        // For non-Toronto locations with no events, return empty array
        console.log("No events found and not Toronto, returning empty array");
        return res.status(200).json({
          events: [],
          source: "ticketmaster_empty"
        });
      }
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    
    // If error and it's a Toronto request, return sample events
    if (isTorontoRequest) {
      console.log("Error fetching events, using Toronto sample events as fallback");
      return res.status(200).json({
        events: TORONTO_SAMPLE_EVENTS,
        source: "sample_fallback"
      });
    }
    
    // Otherwise return empty array with error
    return res.status(200).json({ 
      events: [],
      error: "Failed to fetch events",
      message: error.message,
      source: "error_fallback"
    });
  }
}
EOL
echo "Created improved events API with local placeholder images"

# 4. Update the dashboard.js file to handle image errors
echo "Updating dashboard.js to handle image errors..."
cat > pages/dashboard.js.temp << 'EOL'
// Find this section in the dashboard.js file
{events.map((event) => (
  <div 
    key={event.id} 
    className={styles.eventCard}
    onClick={() => window.open(event.url, '_blank')}
  >
    <img 
      src={event.images?.[0]?.url || '/placeholder-event.jpg'} 
      alt={event.name} 
      className={styles.eventImage} 
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/images/placeholders/event_placeholder_medium.jpg';
      }}
    />
    <div className={styles.eventInfo}>
      <h3 className={styles.eventTitle}>{event.name}</h3>
      <p className={styles.eventDetails}>
        {event._embedded?.venues?.[0]?.name}, {event._embedded?.venues?.[0]?.city?.name}<br />
        {event._embedded?.venues?.[0]?.address?.line1}<br />
        {new Date(event.dates?.start?.localDate).toLocaleDateString()} at {event.dates?.start?.localTime}
      </p>
    </div>
    <span className={styles.eventMatch}>{event.matchScore}% Match</span>
  </div>
))}
EOL
echo "Created dashboard.js update template"

# Apply the update to dashboard.js
echo "Applying update to dashboard.js..."
cp -f pages/dashboard.js "$BACKUP_DIR/dashboard.js.bak"

# Use sed to find and replace the event card section
sed -i '/{events.map((event) => (/,/))}/c\
            {events.map((event) => (\
              <div \
                key={event.id} \
                className={styles.eventCard}\
                onClick={() => window.open(event.url, "_blank")}\
              >\
                <img \
                  src={event.images?.[0]?.url || "/images/placeholders/event_placeholder_medium.jpg"} \
                  alt={event.name} \
                  className={styles.eventImage} \
                  onError={(e) => {\
                    e.target.onerror = null;\
                    e.target.src = "/images/placeholders/event_placeholder_medium.jpg";\
                  }}\
                />\
                <div className={styles.eventInfo}>\
                  <h3 className={styles.eventTitle}>{event.name}</h3>\
                  <p className={styles.eventDetails}>\
                    {event._embedded?.venues?.[0]?.name}, {event._embedded?.venues?.[0]?.city?.name}<br />\
                    {event._embedded?.venues?.[0]?.address?.line1}<br />\
                    {new Date(event.dates?.start?.localDate).toLocaleDateString()} at {event.dates?.start?.localTime}\
                  </p>\
                </div>\
                <span className={styles.eventMatch}>{event.matchScore}% Match</span>\
              </div>\
            ))}' pages/dashboard.js

echo "Applied update to dashboard.js"

# Create a deployment script
echo "Creating deployment script..."

cat > deploy-image-fix.sh << 'EOL'
#!/bin/bash

# TIKO Platform Image Fix Deployment Script
# This script deploys the application with image loading fixes

echo "Starting image fix deployment at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Clear Heroku build cache
echo "Clearing Heroku build cache..."
heroku plugins:install heroku-builds 2>/dev/null || echo "Heroku builds plugin already installed"
heroku builds:cache:purge -a sonar-edm-staging --confirm sonar-edm-staging

# Commit changes
echo "Committing changes..."
git add pages/api/events/index.js pages/dashboard.js public/images/placeholders
git commit -m "Fix image loading errors and maintain Ticketmaster API integration"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
EOL

chmod +x deploy-image-fix.sh

echo "Image fix script completed successfully!"
echo "To fix the image loading errors:"
echo "1. Copy this script to /c/sonar/users/sonar-edm-user/"
echo "2. Make it executable: chmod +x tiko-image-fix.sh"
echo "3. Run it: ./tiko-image-fix.sh"
echo "4. Deploy with the image fix script: ./deploy-image-fix.sh"
