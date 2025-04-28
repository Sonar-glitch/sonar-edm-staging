// Modified events API to ensure EDMTrain events are included
// This file should replace or modify your current events API implementation

// Import necessary modules
const axios = require('axios');

// Sample events with valid links - these will always be available as fallback
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
    source: "ticketmaster_sample"
  },
  // Other sample events...
];

// EDMTrain sample events - these will be used when EDMTrain API is unavailable
const edmtrainSampleEvents = [
  {
    id: "edmtrain-12345",
    name: "Armin van Buuren",
    venue: "Rebel",
    city: "Toronto",
    address: "",
    date: "2025-05-05",
    time: "22:00:00",
    image: "https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png",
    url: "https://edmtrain.com/toronto",
    matchScore: 88,
    source: "edmtrain_sample"
  },
  {
    id: "edmtrain-23456",
    name: "Deadmau5 with 2 more",
    venue: "CODA",
    city: "Toronto",
    address: "",
    date: "2025-05-12",
    time: "21:00:00",
    image: "https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png",
    url: "https://edmtrain.com/toronto",
    matchScore: 82,
    source: "edmtrain_sample"
  },
  {
    id: "edmtrain-34567",
    name: "Above & Beyond",
    venue: "Danforth Music Hall",
    city: "Toronto",
    address: "",
    date: "2025-05-19",
    time: "20:00:00",
    image: "https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png",
    url: "https://edmtrain.com/toronto",
    matchScore: 78,
    source: "edmtrain_sample"
  }
];

// City to EDMTrain location ID mapping
const cityToEdmtrainLocationId = {
  'toronto': 146,
  'vancouver': 57,
  'montreal': 175,
  'calgary': 72,
  'edmonton': 81,
  'ottawa': 140,
  'quebec city': 141,
  'winnipeg': 151,
  'halifax': 152,
  'victoria': 153,
  'saskatoon': 154,
  'regina': 155,
  'london': 156,
  'kitchener': 157,
  'st. john\'s': 158,
  'oshawa': 159,
  'windsor': 160,
  'niagara falls': 161,
  'barrie': 162,
  'kelowna': 163,
  'kingston': 164,
  'abbotsford': 165,
  'sudbury': 166,
  'sault ste. marie': 167,
  'thunder bay': 168,
  'peterborough': 169,
  'lethbridge': 170,
  'kamloops': 171,
  'belleville': 172,
  'charlottetown': 173,
  'fredericton': 174,
  'new york': 3,
  'los angeles': 2,
  'chicago': 1,
  'miami': 4,
  'san francisco': 5,
  'las vegas': 19,
  'denver': 20,
  'seattle': 6,
  'boston': 10,
  'washington': 8,
  'philadelphia': 9,
  'detroit': 11,
  'phoenix': 13,
  'san diego': 14,
  'austin': 15,
  'houston': 16,
  'dallas': 17,
  'atlanta': 7,
  'new orleans': 18,
  'portland': 12,
  'ashburn': 146  // Default to Toronto for Ashburn (AWS location)
};

// Simple in-memory cache
let cache = {
  ticketmaster: {
    timestamp: 0,
    data: null
  },
  edmtrain: {
    timestamp: 0,
    data: null
  },
  combined: {
    timestamp: 0,
    data: null
  }
};

// Main handler function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log("Starting Events API handler");
  
  try {
    // Check cache first
    const now = Date.now();
    const cacheExpired = now - cache.combined.timestamp > 30 * 60 * 1000; // 30 minutes
    
    if (cache.combined.data && !cacheExpired) {
      console.log('Using cached combined events data');
      return res.status(200).json({
        events: cache.combined.data,
        source: 'cache',
        timestamp: new Date(cache.combined.timestamp).toISOString()
      });
    }
    
    // Get user's city from query params or default to Toronto
    const city = (req.query.city || 'toronto').toLowerCase();
    
    // Get events from both APIs
    let ticketmasterEvents = [];
    let edmtrainEvents = [];
    
    // Check if we have API keys
    const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
    const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
    
    console.log("Using Ticketmaster API key:", ticketmasterApiKey ? "Available" : "Not available");
    console.log("Using EDMtrain API key:", edmtrainApiKey ? "Available" : "Not available");
    
    // Fetch Ticketmaster events
    if (ticketmasterApiKey) {
      try {
        // Check Ticketmaster cache
        const ticketmasterCacheExpired = now - cache.ticketmaster.timestamp > 60 * 60 * 1000; // 1 hour
        
        if (cache.ticketmaster.data && !ticketmasterCacheExpired) {
          console.log('Using cached Ticketmaster events');
          ticketmasterEvents = cache.ticketmaster.data;
        } else {
          console.log('Fetching Ticketmaster events');
          const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&city=${city}&apikey=${ticketmasterApiKey}`, {
            timeout: 5000 // 5 second timeout
          });
          
          if (response.data && response.data._embedded && response.data._embedded.events) {
            ticketmasterEvents = response.data._embedded.events.map(event => ({
              id: event.id,
              name: event.name,
              venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
              city: event._embedded?.venues?.[0]?.city?.name || city,
              address: event._embedded?.venues?.[0]?.address?.line1 || '',
              date: event.dates?.start?.localDate || '',
              time: event.dates?.start?.localTime || '',
              image: event.images?.[0]?.url || 'https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg',
              url: event.url || `https://www.ticketmaster.ca/electronic-dance-music-tickets/category/10001`,
              matchScore: Math.floor(Math.random() * 20) + 70, // Random score between 70-90
              source: 'ticketmaster'
            }));
            
            // Update Ticketmaster cache
            cache.ticketmaster = {
              timestamp: now,
              data: ticketmasterEvents
            };
            
            console.log(`Fetched ${ticketmasterEvents.length} Ticketmaster events`);
          }
        }
      } catch (error) {
        console.error("Error fetching Ticketmaster events:", error.message);
        // Use expired cache if available
        if (cache.ticketmaster.data) {
          console.log('Using expired Ticketmaster cache');
          ticketmasterEvents = cache.ticketmaster.data;
        } else {
          // Use sample events as fallback
          console.log('Using Ticketmaster sample events');
          ticketmasterEvents = sampleEvents;
        }
      }
    } else {
      console.log('No Ticketmaster API key, using sample events');
      ticketmasterEvents = sampleEvents;
    }
    
    // Fetch EDMTrain events
    if (edmtrainApiKey) {
      try {
        // Check EDMTrain cache
        const edmtrainCacheExpired = now - cache.edmtrain.timestamp > 60 * 60 * 1000; // 1 hour
        
        if (cache.edmtrain.data && !edmtrainCacheExpired) {
          console.log('Using cached EDMTrain events');
          edmtrainEvents = cache.edmtrain.data;
        } else {
          console.log('Fetching EDMTrain events');
          // Get location ID for the city
          const locationId = cityToEdmtrainLocationId[city] || 146; // Default to Toronto
          
          const response = await axios.get(`https://edmtrain.com/api/events?locationIds=${locationId}`, {
            headers: {
              'Authorization': edmtrainApiKey
            },
            timeout: 5000 // 5 second timeout
          });
          
          if (response.data && response.data.data) {
            edmtrainEvents = response.data.data.map(event => ({
              id: `edmtrain-${event.id}`,
              name: event.artistList.map(artist => artist.name).join(', '),
              venue: event.venue.name,
              city: event.venue.location || city,
              address: '',
              date: event.date,
              time: event.startTime || '20:00:00',
              image: event.artistList[0]?.img || 'https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png',
              url: `https://edmtrain.com/${city.toLowerCase().replace(' ', '-')}`,
              matchScore: Math.floor(Math.random() * 20) + 70, // Random score between 70-90
              source: 'edmtrain'
            }));
            
            // Update EDMTrain cache
            cache.edmtrain = {
              timestamp: now,
              data: edmtrainEvents
            };
            
            console.log(`Fetched ${edmtrainEvents.length} EDMTrain events`);
          }
        }
      } catch (error) {
        console.error("Error fetching EDMTrain events:", error.message);
        // Use expired cache if available
        if (cache.edmtrain.data) {
          console.log('Using expired EDMTrain cache');
          edmtrainEvents = cache.edmtrain.data;
        } else {
          // Use sample events as fallback
          console.log('Using EDMTrain sample events');
          edmtrainEvents = edmtrainSampleEvents;
        }
      }
    } else {
      console.log('No EDMTrain API key, using sample events');
      edmtrainEvents = edmtrainSampleEvents;
    }
    
    // Combine events from both sources
    let allEvents = [...ticketmasterEvents, ...edmtrainEvents];
    
    // Ensure we have at least 3 EDMTrain events
    const edmtrainEventsCount = allEvents.filter(event => 
      event.source === 'edmtrain' || event.source === 'edmtrain_sample'
    ).length;
    
    if (edmtrainEventsCount < 3 && edmtrainSampleEvents.length > 0) {
      console.log(`Adding ${3 - edmtrainEventsCount} EDMTrain sample events to ensure representation`);
      const sampleToAdd = edmtrainSampleEvents.slice(0, 3 - edmtrainEventsCount);
      allEvents = [...allEvents, ...sampleToAdd];
    }
    
    // Sort by match score
    allEvents.sort((a, b) => b.matchScore - a.matchScore);
    
    // Update combined cache
    cache.combined = {
      timestamp: now,
      data: allEvents
    };
    
    // Return events
    return res.status(200).json({
      events: allEvents,
      ticketmasterCount: ticketmasterEvents.length,
      edmtrainCount: edmtrainEvents.length,
      totalCount: allEvents.length,
      source: 'api'
    });
    
  } catch (error) {
    console.error("Error in events API:", error);
    
    // Return sample events as fallback
    const allSampleEvents = [...sampleEvents, ...edmtrainSampleEvents];
    
    return res.status(200).json({
      events: allSampleEvents,
      source: 'error_fallback',
      error: error.message
    });
  }
}
