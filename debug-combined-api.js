// Debug version of combined Ticketmaster and EDMTrain API with Caching for TIKO Platform
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
  
  try {
    // Always return sample events for debugging
    console.log('DEBUG MODE: Returning sample events');
    
    return res.status(200).json({
      events: sampleEvents,
      source: 'debug_fallback',
      location: { city: req.query.city || 'Toronto' },
      debug: true
    });
    
  } catch (error) {
    console.error('Error in events API:', error);
    
    // Always return sample events as last resort fallback
    return res.status(200).json({
      events: sampleEvents,
      source: 'error_fallback',
      error: error.message,
      location: { city: req.query.city || 'Toronto' }
    });
  }
};

export default handler;
