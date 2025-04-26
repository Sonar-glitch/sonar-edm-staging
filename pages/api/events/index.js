// Comprehensive API implementation for TIKO Platform
// This implementation fetches events from both Ticketmaster and EDMTrain APIs
// with robust error handling, caching, and fallback mechanisms

// Handler function for the API endpoint
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log API keys for debugging
  console.log('=== Events API Called ===');
  console.log('Ticketmaster API Key:', process.env.TICKETMASTER_API_KEY ? `Set (length: ${process.env.TICKETMASTER_API_KEY.length})` : 'Not set');
  console.log('EDMTrain API Key:', process.env.EDMTRAIN_API_KEY ? `Set (length: ${process.env.EDMTRAIN_API_KEY.length})` : 'Not set');

  try {
    // Get query parameters
    const { city = 'Toronto', genre = 'electronic' } = req.query;
    console.log(`Fetching events for city: ${city}, genre: ${genre}`);

    // Try to fetch events from both APIs
    const [ticketmasterEvents, edmtrainEvents] = await Promise.allSettled([
      fetchTicketmasterEvents(city, genre),
      fetchEDMTrainEvents(city)
    ]);

    // Process results from both APIs
    const ticketmasterData = ticketmasterEvents.status === 'fulfilled' ? ticketmasterEvents.value : [];
    const edmtrainData = edmtrainEvents.status === 'fulfilled' ? edmtrainEvents.value : [];
    
    // Log results
    console.log(`Ticketmaster events: ${ticketmasterData.length}`);
    console.log(`EDMTrain events: ${edmtrainData.length}`);

    // Combine events from both sources
    const combinedEvents = [...ticketmasterData, ...edmtrainData];

    // If we have events, return them
    if (combinedEvents.length > 0) {
      return res.status(200).json({
        events: combinedEvents,
        source: 'api'
      });
    }

    // If no events from APIs, use sample events
    console.log('No events from APIs, using sample events');
    return res.status(200).json({
      events: [...ticketmasterSampleEvents, ...edmtrainSampleEvents],
      source: 'sample'
    });
  } catch (error) {
    console.error('Error in events API:', error);
    
    // Return sample events on error
    return res.status(200).json({
      events: [...ticketmasterSampleEvents, ...edmtrainSampleEvents],
      source: 'error'
    });
  }
}

// Function to fetch events from Ticketmaster API
async function fetchTicketmasterEvents(city, genre) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.log('Ticketmaster API key not set');
    return [];
  }

  try {
    // Create cache key based on parameters
    const cacheKey = `ticketmaster_${city}_${genre}`;
    
    // Try to get from cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log('Using cached Ticketmaster data');
      return cachedData;
    }

    console.log('Fetching from Ticketmaster API');
    
    // Determine DMA ID based on city
    const dmaId = getDmaIdForCity(city);
    
    // Build API URL
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&classificationName=${genre}&city=${city}&sort=date,asc&size=10`;
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    // Check response status
    if (!response.ok) {
      console.log(`Ticketmaster API error: ${response.status}`);
      if (response.status === 429) {
        console.log('Ticketmaster rate limit exceeded');
      }
      return [];
    }
    
    const data = await response.json();
    
    // Process events
    const events = data._embedded?.events || [];
    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      venue: event._embedded?.venues?.[0]?.name || '',
      city: event._embedded?.venues?.[0]?.city?.name || city,
      address: event._embedded?.venues?.[0]?.address?.line1 || '',
      date: event.dates?.start?.localDate || '',
      time: event.dates?.start?.localTime || '',
      image: event.images?.[0]?.url || '',
      url: event.url || 'https://www.ticketmaster.ca/electronic-dance-music-tickets/category/10001',
      matchScore: Math.floor(Math.random() * 20) + 70, // Random score between 70-90
      source: 'ticketmaster'
    }));
    
    // Cache the results
    await cacheData(cacheKey, formattedEvents);
    
    return formattedEvents;
  } catch (error) {
    console.error('Error fetching from Ticketmaster:', error.message);
    return [];
  }
}

// Function to fetch events from EDMTrain API
async function fetchEDMTrainEvents(city) {
  const apiKey = process.env.EDMTRAIN_API_KEY;
  if (!apiKey) {
    console.log('EDMTrain API key not set');
    return [];
  }

  try {
    // Create cache key based on parameters
    const cacheKey = `edmtrain_${city}`;
    
    // Try to get from cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log('Using cached EDMTrain data');
      return cachedData;
    }

    console.log('Fetching from EDMTrain API');
    
    // Get location ID for city
    const locationId = getLocationIdForCity(city);
    if (!locationId) {
      console.log(`No EDMTrain location ID for city: ${city}`);
      return [];
    }
    
    // Build request options
    const options = {
      method: 'GET',
      headers: {
        'Authorization': apiKey
      }
    };
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const url = `https://edmtrain.com/api/events?locationIds=${locationId}`;
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    
    // Check response status
    if (!response.ok) {
      console.log(`EDMTrain API error: ${response.status}`);
      if (response.status === 429) {
        console.log('EDMTrain rate limit exceeded');
      }
      return [];
    }
    
    const data = await response.json();
    
    // Process events
    const events = data.data || [];
    const formattedEvents = events.map(event => ({
      id: `edmtrain-${event.id}`,
      name: event.artistList.map(artist => artist.name).join(', '),
      venue: event.venue.name,
      city: city,
      address: '',
      date: event.date,
      time: '20:00:00', // Default time if not provided
      image: event.artistList[0]?.img || 'https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png',
      url: `https://edmtrain.com/${city.toLowerCase()}`,
      matchScore: Math.floor(Math.random() * 20) + 70, // Random score between 70-90
      source: 'edmtrain'
    }));
    
    // Cache the results
    await cacheData(cacheKey, formattedEvents);
    
    return formattedEvents;
  } catch (error) {
    console.error('Error fetching from EDMTrain:', error.message);
    return [];
  }
}

// Simple in-memory cache
let cache = {};

// Function to get data from cache
async function getCachedData(key) {
  if (!cache[key]) return null;
  
  const { data, timestamp } = cache[key];
  const now = Date.now();
  
  // Cache valid for 1 hour
  if (now - timestamp < 60 * 60 * 1000) {
    return data;
  }
  
  // Cache expired but still usable as fallback (up to 24 hours)
  if (now - timestamp < 24 * 60 * 60 * 1000) {
    console.log(`Using expired cache for ${key}`);
    return data;
  }
  
  // Cache too old
  return null;
}

// Function to cache data
async function cacheData(key, data) {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
}

// Function to get DMA ID for city
function getDmaIdForCity(city) {
  const cityMap = {
    'Toronto': '527',
    'Vancouver': '528',
    'Montreal': '522',
    'Calgary': '530',
    'Ottawa': '521',
    'Edmonton': '529',
    'Winnipeg': '520',
    'Quebec City': '523',
    'Hamilton': '525',
    'London': '526',
    'New York': '345',
    'Los Angeles': '324',
    'Chicago': '249',
    'San Francisco': '382',
    'Boston': '235',
    'Seattle': '385',
    'Miami': '332',
    'Denver': '264',
    'Austin': '218',
    'Las Vegas': '319'
  };
  
  return cityMap[city] || '527'; // Default to Toronto if city not found
}

// Function to get EDMTrain location ID for city
function getLocationIdForCity(city) {
  const cityMap = {
    'Toronto': '146',
    'Vancouver': '147',
    'Montreal': '96',
    'Calgary': '28',
    'Ottawa': '106',
    'Edmonton': '47',
    'Winnipeg': '156',
    'New York': '99',
    'Los Angeles': '87',
    'Chicago': '35',
    'San Francisco': '125',
    'Boston': '23',
    'Seattle': '128',
    'Miami': '93',
    'Denver': '43',
    'Austin': '16',
    'Las Vegas': '85'
  };
  
  return cityMap[city] || '146'; // Default to Toronto if city not found
}

// Ticketmaster sample events with valid links
const ticketmasterSampleEvents = [
  {
    id: "ticketmaster-12345",
    name: "House & Techno Night",
    venue: "CODA",
    city: "Toronto",
    address: "794 Bathurst St",
    date: "2025-05-03",
    time: "22:00:00",
    image: "https://s1.ticketm.net/dam/a/1f6/0e4fe8ee-488a-46ba-9d6e-717fde4841f6_1339761_RETINA_PORTRAIT_16_9.jpg",
    url: "https://www.ticketmaster.ca/electronic-dance-music-tickets/category/10001",
    matchScore: 85,
    source: "ticketmaster_sample"
  },
  {
    id: "ticketmaster-23456",
    name: "Deep House Sessions",
    venue: "Rebel",
    city: "Toronto",
    address: "11 Polson St",
    date: "2025-05-10",
    time: "21:00:00",
    image: "https://s1.ticketm.net/dam/a/1f6/0e4fe8ee-488a-46ba-9d6e-717fde4841f6_1339761_RETINA_PORTRAIT_16_9.jpg",
    url: "https://www.ticketmaster.ca/club-passes-tickets/category/10007",
    matchScore: 80,
    source: "ticketmaster_sample"
  },
  {
    id: "ticketmaster-34567",
    name: "Electronic Music Festival",
    venue: "Echo Beach",
    city: "Toronto",
    address: "909 Lake Shore Blvd W",
    date: "2025-05-17",
    time: "16:00:00",
    image: "https://s1.ticketm.net/dam/a/1f6/0e4fe8ee-488a-46ba-9d6e-717fde4841f6_1339761_RETINA_PORTRAIT_16_9.jpg",
    url: "https://www.ticketmaster.ca/music-festivals-tickets/category/10005",
    matchScore: 75,
    source: "ticketmaster_sample"
  }
];

// EDMTrain sample events with valid links
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
