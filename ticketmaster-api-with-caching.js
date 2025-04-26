// Enhanced Ticketmaster API with Caching for TIKO Platform
// This file should replace pages/api/events/index.js

// Import required modules
import fetch from 'node-fetch';

// Cache storage
let eventCache = {
  data: null,
  timestamp: 0,
  city: ''
};

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

// Sample events for absolute fallback (only used if API completely fails)
const sampleEvents = [
  {
    name: "House & Techno Night",
    venue: "CODA",
    city: "Toronto",
    address: "794 Bathurst St",
    date: "2025-05-03",
    time: "22:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/event/10005E3B8A991F8B",
    matchScore: 85
  },
  {
    name: "Deep House Sessions",
    venue: "Rebel",
    city: "Toronto",
    address: "11 Polson St",
    date: "2025-05-10",
    time: "21:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/event/10005E3B8A991F8C",
    matchScore: 80
  },
  {
    name: "Techno Underground",
    venue: "Vertigo",
    city: "Toronto",
    address: "567 Queen St W",
    date: "2025-05-17",
    time: "23:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/event/10005E3B8A991F8D",
    matchScore: 75
  }
];

// Check if cache is valid
const isCacheValid = (city) => {
  const now = Date.now();
  return (
    eventCache.data !== null &&
    eventCache.city === city &&
    now - eventCache.timestamp < CACHE_DURATION
  );
};

// Direct API call function with no dependencies on external libraries
const directTicketmasterApiCall = async (apiKey, city = 'Toronto') => {
  console.log(`Making direct API call to Ticketmaster for city: ${city}`);
  
  try {
    // Use a simple, direct URL that's most likely to work
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=${encodeURIComponent(city)}&classificationName=music&size=3`;
    
    console.log(`API URL: ${url}`);
    
    // Set a timeout for the fetch request
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
      console.error(`API request failed with status ${response.status}`);
      
      // If rate limited, throw specific error
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API response received successfully');
    
    return data;
  } catch (error) {
    console.error('Direct API call failed:', error.message);
    return null;
  }
};

// Process Ticketmaster events into our format
const processTicketmasterEvents = (data) => {
  if (!data || !data._embedded || !data._embedded.events || data._embedded.events.length === 0) {
    console.log('No events found in API response');
    return null;
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
      url: event.url || 'https://www.ticketmaster.ca',
      matchScore
    };
  });
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
    // Check if we have valid cached data
    if (!forceRefresh && isCacheValid(city)) {
      console.log(`Using cached events data for ${city}, cache age: ${(Date.now() - eventCache.timestamp) / 1000} seconds`);
      
      return res.status(200).json({
        events: eventCache.data,
        source: 'cache',
        location: { city },
        cached: true,
        cacheAge: (Date.now() - eventCache.timestamp) / 1000
      });
    }
    
    // Get API key directly from environment variable
    const apiKey = process.env.TICKETMASTER_API_KEY;
    
    if (!apiKey) {
      console.error('Ticketmaster API key not found in environment variables');
      throw new Error('API key not configured');
    }
    
    console.log('Using Ticketmaster API key:', apiKey.substring(0, 4) + '...');
    
    // Make direct API call
    const data = await directTicketmasterApiCall(apiKey, city);
    
    // Process events if we got data
    if (data) {
      const events = processTicketmasterEvents(data);
      
      if (events && events.length > 0) {
        console.log('Successfully processed events from Ticketmaster');
        
        // Update cache
        eventCache = {
          data: events,
          timestamp: Date.now(),
          city
        };
        
        // Return the events
        return res.status(200).json({
          events,
          source: 'ticketmaster',
          location: { city },
          cached: false
        });
      }
    }
    
    // If we get here, the API call failed or returned no events
    console.log('API call failed or returned no events, checking cache before using sample events');
    
    // Try to use slightly expired cache as fallback (up to 24 hours old)
    if (eventCache.data !== null && eventCache.city === city && (Date.now() - eventCache.timestamp < 24 * 60 * 60 * 1000)) {
      console.log('Using expired cache as fallback');
      
      return res.status(200).json({
        events: eventCache.data,
        source: 'expired_cache',
        location: { city },
        cached: true,
        cacheAge: (Date.now() - eventCache.timestamp) / 1000
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
    if (eventCache.data !== null && eventCache.city === city && (Date.now() - eventCache.timestamp < 24 * 60 * 60 * 1000)) {
      console.log('Error occurred, using cached data as fallback');
      
      return res.status(200).json({
        events: eventCache.data,
        source: 'error_cache_fallback',
        location: { city },
        cached: true,
        cacheAge: (Date.now() - eventCache.timestamp) / 1000,
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
