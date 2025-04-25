import axios from 'axios';
import { getUserLocation } from '@/lib/locationUtils';
import { getCachedData, cacheData } from '@/lib/cache';

// Default Toronto coordinates
const DEFAULT_LAT = 43.6532;
const DEFAULT_LON = -79.3832;

export default async function handler(req, res) {
  console.log('Starting Events API handler');
  
  // Check if API keys are available
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
  const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
  
  console.log(`Using Ticketmaster API key: ${ticketmasterApiKey ? 'Available' : 'Missing'}`);
  console.log(`Using EDMtrain API key: ${edmtrainApiKey ? 'Available' : 'Missing'}`);
  
  // Get user location
  let userLocation;
  try {
    userLocation = await getUserLocation(req);
    console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
  } catch (locationError) {
    console.error('Error getting user location:', locationError);
    userLocation = {
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LON,
      city: 'Toronto',
      region: 'ON',
      country: 'Canada'
    };
  }
  
  // Ensure location coordinates are valid numbers
  if (isNaN(parseFloat(userLocation.latitude)) || isNaN(parseFloat(userLocation.longitude))) {
    console.log('Invalid location coordinates, using defaults');
    userLocation.latitude = DEFAULT_LAT;
    userLocation.longitude = DEFAULT_LON;
  }
  
  // Try to get cached events first
  const cacheKey = 'events/all';
  const cacheParams = { 
    lat: userLocation.latitude,
    lon: userLocation.longitude
  };
  
  const cachedEvents = await getCachedData(cacheKey, cacheParams);
  
  if (cachedEvents) {
    console.log('Using cached events data');
    return res.status(200).json({
      success: true,
      events: cachedEvents,
      userLocation,
      source: 'cache'
    });
  }
  
  // Arrays to store events from different sources
  let ticketmasterEvents = [];
  let edmtrainEvents = [];
  let ticketmasterError = null;
  let edmtrainError = null;
  
  // Fetch events from Ticketmaster
  if (ticketmasterApiKey) {
    try {
      // Check for cached Ticketmaster events
      const cachedTicketmasterEvents = await getCachedData('ticketmaster/events', {
        lat: userLocation.latitude,
        lon: userLocation.longitude
      });
      
      if (cachedTicketmasterEvents) {
        console.log('Using cached Ticketmaster events');
        ticketmasterEvents = cachedTicketmasterEvents;
      } else {
        console.log('Fetching events from Ticketmaster API...');
        
        // Prepare parameters for Ticketmaster API
        const params = {
          apikey: ticketmasterApiKey,
          classificationName: 'music',
          genreId: 'KnvZfZ7vAvF', // Electronic music genre ID
          size: 50, // Number of events to return
          sort: 'date,asc',
          startDateTime: new Date().toISOString().slice(0, 19) + 'Z' // Current date in ISO format
        };
        
        // Add location filter if available
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          params.latlong = `${userLocation.latitude},${userLocation.longitude}`;
          params.radius = '100'; // 100 mile radius
          params.unit = 'miles';
          console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
        } else {
          console.log('No valid location data available, skipping location filter');
        }
        
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
          params,
          timeout: 15000 // 15 second timeout
        });
        
        if (response.data._embedded && response.data._embedded.events) {
          ticketmasterEvents = response.data._embedded.events;
          
          // Cache Ticketmaster events for 12 hours (43200 seconds)
          await cacheData('ticketmaster/events', {
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, ticketmasterEvents, 43200);
          
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster API`);
        } else {
          console.log('No events found in Ticketmaster response');
        }
      }
    } catch (error) {
      console.error('Ticketmaster API request failed:', error.message);
      ticketmasterError = error.message;
      
      // Retry with simpler query
      console.log('Retrying with simpler query after error...');
      try {
        const retryParams = {
          apikey: ticketmasterApiKey,
          keyword: 'electronic',
          size: 50,
          sort: 'date,asc',
          startDateTime: new Date().toISOString().slice(0, 19) + 'Z'
        };
        
        // Only add location if we have valid coordinates
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          retryParams.latlong = `${userLocation.latitude},${userLocation.longitude}`;
          retryParams.radius = '100';
          retryParams.unit = 'miles';
        }
        
        console.log('Ticketmaster retry params:', JSON.stringify(retryParams));
        
        const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
          params: retryParams,
          timeout: 15000
        });
        
        if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
          ticketmasterEvents = retryResponse.data._embedded.events;
          
          // Cache Ticketmaster events for 12 hours (43200 seconds)
          await cacheData('ticketmaster/events', {
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, ticketmasterEvents, 43200);
          
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
          ticketmasterError = null;
        } else {
          console.log('No events found in Ticketmaster retry response after error');
        }
      } catch (retryError) {
        console.error('Ticketmaster retry also failed:', retryError.message);
        ticketmasterError = `${error.message} (retry also failed: ${retryError.message})`;
      }
    }
  } else {
    console.log('Skipping Ticketmaster API due to missing API key');
  }
  
  // Fetch events from EDMtrain
  if (edmtrainApiKey) {
    try {
      // Check for cached EDMtrain events
      const cachedEdmtrainEvents = await getCachedData('edmtrain/events', {
        lat: userLocation.latitude,
        lon: userLocation.longitude
      });
      
      if (cachedEdmtrainEvents) {
        console.log('Using cached EDMtrain events');
        edmtrainEvents = cachedEdmtrainEvents;
      } else {
        console.log('Fetching events from EDMtrain API...');
        
        // Prepare parameters for EDMtrain API
        const params = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 100 // 100 mile radius
        };
        
        const response = await axios.get('https://edmtrain.com/api/events', { 
          params,
          headers: {
            'Authorization': edmtrainApiKey
          },
          timeout: 15000 // 15 second timeout
        });
        
        if (response.data && response.data.data) {
          edmtrainEvents = response.data.data;
          
          // Cache EDMtrain events for 12 hours (43200 seconds)
          await cacheData('edmtrain/events', {
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, edmtrainEvents, 43200);
          
          console.log(`Found ${edmtrainEvents.length} events from EDMtrain API`);
        } else {
          console.log('No events found in EDMtrain response');
        }
      }
    } catch (error) {
      console.error('EDMtrain API request failed:', error.message);
      edmtrainError = error.message;
    }
  } else {
    console.log('Skipping EDMtrain API due to missing API key');
  }
  
  // Process Ticketmaster events
  const processedTicketmasterEvents = ticketmasterEvents.map(event => {
    // Extract venue information
    const venue = event._embedded?.venues?.[0] || {};
    const venueLocation = venue.location ? {
      latitude: parseFloat(venue.location.latitude),
      longitude: parseFloat(venue.location.longitude)
    } : null;
    
    // Extract artist information
    const artists = event._embedded?.attractions?.map(attraction => attraction.name) || [];
    
    // Extract genre information
    const genres = event.classifications?.map(classification => 
      classification.genre?.name || classification.subGenre?.name || 'Electronic'
    ).filter(Boolean) || ['Electronic'];
    
    // Extract ticket information
    const ticketUrl = event.url || null;
    
    // Extract image
    const image = event.images?.find(img => img.ratio === '16_9' && img.width > 500)?.url || 
                 event.images?.[0]?.url || null;
    
    return {
      id: event.id,
      name: event.name,
      date: event.dates?.start?.dateTime || null,
      venue: venue.name || 'Unknown Venue',
      venueType: getVenueType(venue.name, event.name),
      address: formatAddress(venue),
      headliners: artists,
      genres,
      ticketUrl,
      image,
      location: venueLocation,
      source: 'ticketmaster'
    };
  });
  
  // Process EDMtrain events
  const processedEdmtrainEvents = edmtrainEvents.map(event => {
    // Extract venue information
    const venue = event.venue || {};
    const venueLocation = venue.latitude && venue.longitude ? {
      latitude: venue.latitude,
      longitude: venue.longitude
    } : null;
    
    // Extract artist information
    const artists = event.artistList?.map(artist => artist.name) || [];
    
    return {
      id: `edmtrain-${event.id}`,
      name: event.name || artists.join(', '),
      date: event.date,
      venue: venue.name || 'Unknown Venue',
      venueType: getVenueType(venue.name, event.name),
      address: venue.address ? `${venue.address}, ${venue.city}, ${venue.state}` : null,
      headliners: artists,
      genres: ['Electronic'], // EDMtrain doesn't provide genre information
      ticketUrl: event.ticketLink || null,
      image: null, // EDMtrain doesn't provide images
      location: venueLocation,
      source: 'edmtrain'
    };
  });
  
  // Combine events from all sources
  let allEvents = [...processedTicketmasterEvents, ...processedEdmtrainEvents];
  
  // If we have no events, add Toronto-specific sample events
  if (allEvents.length === 0) {
    console.log('No events found from APIs, adding sample events');
    
    // Check if user is near Toronto
    const isNearToronto = userLocation.city === 'Toronto' || 
                          userLocation.country === 'Canada' ||
                          (userLocation.latitude > 42 && userLocation.latitude < 45 && 
                           userLocation.longitude > -81 && userLocation.longitude < -78);
    
    // Add sample events based on location
    if (isNearToronto) {
      allEvents = getTorontoSampleEvents();
    } else {
      allEvents = getGenericSampleEvents(userLocation);
    }
  }
  
  // Sort events by date
  allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Cache the combined events for 12 hours (43200 seconds)
  await cacheData(cacheKey, cacheParams, allEvents, 43200);
  
  // Return the events
  return res.status(200).json({
    success: true,
    events: allEvents,
    userLocation,
    errors: {
      ticketmaster: ticketmasterError,
      edmtrain: edmtrainError
    },
    source: 'api'
  });
}

/**
 * Format venue address
 * @param {Object} venue - Venue object from Ticketmaster API
 * @returns {string|null} Formatted address or null
 */
function formatAddress(venue) {
  if (!venue) return null;
  
  const addressLine = venue.address?.line1;
  const city = venue.city?.name;
  const state = venue.state?.stateCode || venue.state?.name;
  
  if (!addressLine && !city && !state) return null;
  
  let address = '';
  
  if (addressLine) address += addressLine;
  if (city) {
    if (address) address += ', ';
    address += city;
  }
  if (state) {
    if (address) address += ', ';
    address += state;
  }
  
  return address;
}

/**
 * Determine venue type based on venue name and event name
 * @param {string} venueName - Name of the venue
 * @param {string} eventName - Name of the event
 * @returns {string} Venue type (Club, Warehouse, Festival, Rooftop, Other)
 */
function getVenueType(venueName, eventName) {
  if (!venueName && !eventName) return 'Other';
  
  const venueNameLower = (venueName || '').toLowerCase();
  const eventNameLower = (eventName || '').toLowerCase();
  
  // Check for festival
  if (eventNameLower.includes('festival') || 
      eventNameLower.includes('fest') || 
      venueNameLower.includes('festival') ||
      venueNameLower.includes('grounds')) {
    return 'Festival';
  }
  
  // Check for warehouse
  if (venueNameLower.includes('warehouse') || 
      venueNameLower.includes('factory') || 
      eventNameLower.includes('warehouse')) {
    return 'Warehouse';
  }
  
  // Check for rooftop
  if (venueNameLower.includes('rooftop') || 
      venueNameLower.includes('terrace') || 
      eventNameLower.includes('rooftop')) {
    return 'Rooftop';
  }
  
  // Check for club
  if (venueNameLower.includes('club') || 
      venueNameLower.includes('lounge') || 
      venueNameLower.includes('bar') ||
      venueNameLower.includes('hall')) {
    return 'Club';
  }
  
  // Default to Other
  return 'Other';
}

/**
 * Get sample events for Toronto
 * @returns {Array} Array of sample events
 */
function getTorontoSampleEvents() {
  const now = new Date();
  
  return [
    {
      id: 'sample-toronto-1',
      name: 'Techno Warehouse Night',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'REBEL',
      venueType: 'Club',
      address: '11 Polson St, Toronto, ON, Canada',
      headliners: ['Charlotte de Witte', 'Amelie Lens', 'FJAAK'],
      genres: ['Techno', 'Hard Techno'],
      ticketUrl: 'https://www.ticketmaster.ca/rebel-tickets-toronto/venue/132037',
      image: null,
      location: {
        latitude: 43.6442,
        longitude: -79.3551
      },
      source: 'sample'
    },
    {
      id: 'sample-toronto-2',
      name: 'Melodic Techno Night',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'CODA',
      venueType: 'Club',
      address: '794 Bathurst St, Toronto, ON, Canada',
      headliners: ['Tale Of Us', 'Mind Against', 'Mathame'],
      genres: ['Melodic Techno', 'Progressive House'],
      ticketUrl: 'https://codatoronto.electrostub.com/events/',
      image: null,
      location: {
        latitude: 43.6651,
        longitude: -79.4111
      },
      source: 'sample'
    },
    {
      id: 'sample-toronto-3',
      name: 'Summer House Festival',
      date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'The Danforth Music Hall',
      venueType: 'Festival',
      address: '147 Danforth Ave, Toronto, ON, Canada',
      headliners: ['Disclosure', 'Kaytranada', 'The Blessed Madonna'],
      genres: ['House', 'Tech House'],
      ticketUrl: 'https://www.ticketmaster.ca/the-danforth-music-hall-tickets-toronto/venue/131326',
      image: null,
      location: {
        latitude: 43.6765,
        longitude: -79.3531
      },
      source: 'sample'
    },
    {
      id: 'sample-toronto-4',
      name: 'Progressive Dreams',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Velvet Underground',
      venueType: 'Club',
      address: '508 Queen St W, Toronto, ON, Canada',
      headliners: ['Hernan Cattaneo', 'Nick Warren', 'Guy J'],
      genres: ['Progressive House', 'Deep House'],
      ticketUrl: 'https://www.ticketweb.ca/venue/velvet-underground-toronto-on/23681',
      image: null,
      location: {
        latitude: 43.6481,
        longitude: -79.3998
      },
      source: 'sample'
    }
  ];
}

/**
 * Get generic sample events based on user location
 * @param {Object} userLocation - User location object
 * @returns {Array} Array of sample events
 */
function getGenericSampleEvents(userLocation) {
  const now = new Date();
  
  // Create events with locations near the user
  return [
    {
      id: 'sample-1',
      name: 'Techno Warehouse Night',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'The Underground',
      venueType: 'Warehouse',
      address: `123 Industrial Ave, ${userLocation.city || 'Downtown'}, ${userLocation.region || ''}`,
      headliners: ['Charlotte de Witte', 'Amelie Lens', 'FJAAK'],
      genres: ['Techno', 'Hard Techno'],
      ticketUrl: 'https://www.ticketmaster.com/event/sample1',
      image: null,
      location: {
        latitude: userLocation.latitude + 0.02,
        longitude: userLocation.longitude - 0.01
      },
      source: 'sample'
    },
    {
      id: 'sample-2',
      name: 'Summer House Festival',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Sunset Park',
      venueType: 'Festival',
      address: `456 Parkway Dr, ${userLocation.city || 'Downtown'}, ${userLocation.region || ''}`,
      headliners: ['Disclosure', 'Kaytranada', 'The Blessed Madonna'],
      genres: ['House', 'Tech House'],
      ticketUrl: 'https://www.ticketmaster.com/event/sample2',
      image: null,
      location: {
        latitude: userLocation.latitude - 0.03,
        longitude: userLocation.longitude + 0.02
      },
      source: 'sample'
    },
    {
      id: 'sample-3',
      name: 'Progressive Dreams',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Club Horizon',
      venueType: 'Club',
      address: `789 Downtown Blvd, ${userLocation.city || 'Downtown'}, ${userLocation.region || ''}`,
      headliners: ['Hernan Cattaneo', 'Nick Warren', 'Guy J'],
      genres: ['Progressive House', 'Deep House'],
      ticketUrl: 'https://www.ticketmaster.com/event/sample3',
      image: null,
      location: {
        latitude: userLocation.latitude + 0.01,
        longitude: userLocation.longitude + 0.01
      },
      source: 'sample'
    },
    {
      id: 'sample-4',
      name: 'Melodic Techno Night',
      date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'The Loft',
      venueType: 'Rooftop',
      address: `101 Skyline Ave, ${userLocation.city || 'Downtown'}, ${userLocation.region || ''}`,
      headliners: ['Tale Of Us', 'Mind Against', 'Mathame'],
      genres: ['Melodic Techno', 'Progressive House'],
      ticketUrl: 'https://www.ticketmaster.com/event/sample4',
      image: null,
      location: {
        latitude: userLocation.latitude - 0.02,
        longitude: userLocation.longitude - 0.02
      },
      source: 'sample'
    }
  ];
}
