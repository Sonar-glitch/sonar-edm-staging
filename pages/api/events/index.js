import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import { getCachedData, setCachedData } from '../../../lib/cache';

// Import city request utilities (NEW - for dynamic city expansion)
const { addCityRequest, isCountrySupported } = require('../../../lib/cityRequestQueue');

// PRESERVED: Original Ticketmaster constants
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // PRESERVED: Original authentication check
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ENHANCED: Accept city/country parameters but keep Toronto as fallback for compatibility
    const { 
      lat = '43.65', 
      lon = '-79.38', 
      city = 'Toronto', 
      country = 'Canada', 
      radius = '50' 
    } = req.query;

    console.log(`🎯 Events API called for ${city}, ${country} (${lat}, ${lon})`);

    // PRESERVED: Original cache key format for compatibility
    const cacheKey = `events_${city}_${lat}_${lon}_${radius}`;
    const cachedEvents = await getCachedData(cacheKey, 'EVENTS');
    
    if (cachedEvents) {
      console.log(`🚀 Cache hit - returning ${cachedEvents.length} cached events`);
      return res.status(200).json({
        events: cachedEvents,
        total: cachedEvents.length,
        source: "cache",
        timestamp: new Date().toISOString(),
        location: { city, country, lat, lon }
      });
    }

    // PRESERVED: Original database connection
    const { db } = await connectToDatabase();

    let realEvents = [];
    let apiError = null;
    let cityRequestInfo = null;

    // PRESERVED: Original MongoDB query logic with retry
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}: Fetching MongoDB events...`);
        
        const eventsCollection = db.collection('events_unified');
        
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const radiusInMeters = parseInt(radius) * 1000;
        
        const mongoEvents = await eventsCollection.find({
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude]
              },
              $maxDistance: radiusInMeters
            }
          },
          date: { $gte: new Date() },
          status: { $ne: 'cancelled' }
        })
        .limit(50)
        .sort({ date: 1 })
        .toArray();

        console.log(`📊 Found ${mongoEvents.length} events in MongoDB for ${city}, ${country}`);

        // NEW: If no events found AND not Toronto, trigger automatic city request
        if (mongoEvents.length === 0 && city.toLowerCase() !== 'toronto') {
          console.log(`🌍 No events found for ${city}, ${country} - triggering automatic city request`);
          cityRequestInfo = await handleAutomaticCityRequest(city, country, latitude, longitude);
        }

        // PRESERVED: Original MongoDB data transformation
        if (mongoEvents.length > 0) {
          const data = {
            _embedded: {
              events: mongoEvents.map(event => ({
                id: event.sourceId || event._id.toString(),
                name: event.name,
                dates: {
                  start: {
                    localDate: event.date ? event.date.toISOString().split('T')[0] : null,
                    localTime: event.startTime
                  }
                },
                _embedded: {
                  venues: [{
                    name: event.venue?.name,
                    address: { line1: event.venue?.address },
                    city: { name: event.venue?.city }
                  }],
                  attractions: (event.artistList || event.artists?.map(a => a.name) || []).map(name => ({ name }))
                },
                url: event.url,
                priceRanges: event.priceRange ? [{ min: event.priceRange.min, max: event.priceRange.max }] : null,
                classifications: event.genres ? [{ genre: { name: event.genres[0] } }] : null,
                // CRITICAL: Preserve source labeling (the fix you spent hours on!)
                unifiedProcessing: event.unifiedProcessing,
                source: event.source
              }))
            }
          };
          
          realEvents = processEvents(data._embedded.events, city);
          console.log(`✅ Successfully processed ${realEvents.length} real events from MongoDB`);
          break; // Success, exit retry loop
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        apiError = error;
        if (attempt === 3) {
          console.error('🚨 All MongoDB attempts failed');
        }
      }
    }

    // ENHANCED: Response logic with city request handling
    let finalEvents = realEvents;
    let responseMessage = null;
    let responseSource = "unified";
    
    if (realEvents.length === 0) {
      if (cityRequestInfo && cityRequestInfo.success) {
        // City request was successfully created/updated
        console.log(`🌍 City request processed for ${city}, ${country}`);
        responseMessage = cityRequestInfo.isNew ? 
          `We're fetching events for ${city}, ${country}! Check back in 2-5 minutes for fresh events.` :
          `Updated request for ${city}, ${country}. Processing with higher priority.`;
        
        // Return informative placeholder
        finalEvents = [{
          id: 'fetching-placeholder',
          name: `Fetching events for ${city}...`,
          date: new Date().toISOString().split('T')[0],
          formattedDate: 'Coming Soon',
          formattedTime: 'Processing...',
          venue: 'Various Venues',
          address: `${city}, ${country}`,
          city: city,
          ticketUrl: '#',
          matchScore: 0,
          source: 'fetching',
          headliners: ['Loading events...'],
          venueType: 'Various',
          detectedGenres: [],
          isPlaceholder: true
        }];
        
        responseSource = "fetching";
      } else if (cityRequestInfo && !cityRequestInfo.success) {
        // Country not supported or other error
        responseMessage = cityRequestInfo.error || `Sorry, ${country} is not supported by Ticketmaster.`;
        finalEvents = [];
        responseSource = "unsupported";
      } else {
        // PRESERVED: Original emergency fallback
        console.log('⚠️ Using emergency fallback events');
        finalEvents = getEmergencyEvents(city, country);
        responseSource = "emergency";
      }
    }

    // PRESERVED: Original sorting logic
    if (finalEvents.length > 0 && finalEvents[0].matchScore !== undefined && !finalEvents[0].isPlaceholder) {
      finalEvents.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        const dateA = a.date ? new Date(a.date) : new Date(9999, 11, 31);
        const dateB = b.date ? new Date(b.date) : new Date(9999, 11, 31);
        return dateA - dateB;
      });
    }

    console.log(`🎯 Returning ${finalEvents.length} events (${realEvents.length} real, source: ${responseSource})`);

    // PRESERVED: Original caching logic
    if (finalEvents.length > 0 && responseSource !== 'fetching') {
      await setCachedData(cacheKey, finalEvents, 'EVENTS');
      console.log(`💾 Cached ${finalEvents.length} events for ${city}, ${country}`);
    }

    // PRESERVED: Original response format with enhancements
    const response = {
      events: finalEvents,
      total: finalEvents.length,
      realCount: realEvents.length,
      source: responseSource,
      timestamp: new Date().toISOString(),
      location: { city, country, lat, lon }
    };

    // NEW: Add city request info if applicable
    if (responseMessage) {
      response.message = responseMessage;
    }

    if (cityRequestInfo) {
      response.cityRequest = {
        queued: cityRequestInfo.success,
        isNew: cityRequestInfo.isNew,
        estimatedTime: cityRequestInfo.success ? '2-5 minutes' : null,
        error: cityRequestInfo.error
      };
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('🚨 Events API critical error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch events',
      error: error.message,
      events: [],
      total: 0
    });
  }
}

/**
 * NEW: Handle automatic city request when no events found
 */
async function handleAutomaticCityRequest(city, country, latitude, longitude) {
  try {
    // Check if country is supported
    if (!isCountrySupported(country)) {
      console.log(`❌ Country not supported: ${country}`);
      return {
        success: false,
        error: `Country "${country}" is not supported by Ticketmaster`
      };
    }

    // Add city request automatically
    const result = addCityRequest(city, country, latitude, longitude);
    
    if (result.success) {
      console.log(`✅ Automatic city request ${result.isNew ? 'created' : 'updated'}: ${city}, ${country}`);
      
      return {
        success: true,
        isNew: result.isNew,
        city: result.city,
        country: result.country,
        countryCode: result.countryCode
      };
    } else {
      console.error(`❌ Failed to create city request: ${result.error}`);
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    console.error('❌ Error in automatic city request:', error);
    return {
      success: false,
      error: 'Failed to process city request'
    };
  }
}

/**
 * PRESERVED: Original event processing function
 */
function processEvents(events, city) {
  return events.map(event => {
    const venue = event._embedded?.venues?.[0];
    const artists = event._embedded?.attractions?.map(a => a.name) || [];
    
    // Enhanced genre detection
    const artistGenres = detectGenresFromArtists(artists);
    
    // Enhanced relevance scoring
    const edmKeywords = ['house', 'techno', 'electronic', 'edm', 'dance', 'trance', 'dubstep', 'drum', 'bass'];
    const eventText = `${event.name} ${artists.join(' ')} ${event.classifications?.[0]?.genre?.name || ''}`.toLowerCase();
    const edmMatches = edmKeywords.filter(keyword => eventText.includes(keyword)).length;
    
    const baseScore = Math.min(70 + (edmMatches * 3), 85);
    const genreBonus = artistGenres.length > 0 ? Math.min(artistGenres.length * 2, 14) : 0;
    const finalScore = Math.min(baseScore + genreBonus, 99);
    
    // Better date/time formatting
    const eventDate = event.dates?.start?.localDate ? new Date(event.dates?.start?.localDate) : null;
    const formattedDate = eventDate ? 
      eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 
      'Date TBA';
    
    const formattedTime = event.dates?.start?.localTime ? 
      formatTime(event.dates?.start?.localTime) : 
      'Time TBA';
    
    const venueType = detectVenueType(venue?.name || '', event.name);
    
    return {
      id: event.id,
      name: event.name,
      date: event.dates?.start?.localDate,
      time: event.dates?.start?.localTime,
      formattedDate: formattedDate,
      formattedTime: formattedTime,
      venue: venue?.name || 'Venue TBA',
      address: venue?.address?.line1 || venue?.city?.name || 'Address TBA',
      city: venue?.city?.name || city,
      ticketUrl: event.url,
      priceRange: event.priceRanges?.[0] ? `$${event.priceRanges[0].min}-${event.priceRanges[0].max}` : 'Price TBA',
      headliners: artists.slice(0, 3),
      matchScore: finalScore,
      // CRITICAL: Preserve source labeling - This was the critical fix!
      source: event.unifiedProcessing?.sourceEvents?.[0]?.source?.toLowerCase() || event.source || 'unknown',
      venueType: venueType,
      detectedGenres: artistGenres
    };
  });
}

/**
 * PRESERVED: Original emergency fallback events
 */
function getEmergencyEvents(city, country) {
  return [
    {
      id: 'emergency-1',
      name: 'Local Electronic Music Night',
      date: '2025-07-15',
      formattedDate: 'Tue, Jul 15',
      formattedTime: '10:00 PM',
      venue: 'Local Venue',
      address: `${city}, ${country}`,
      city: city,
      ticketUrl: '#',
      matchScore: 75,
      source: 'emergency',
      headliners: ['Local Artists'],
      venueType: 'Club',
      detectedGenres: ['house', 'techno']
    }
  ];
}

// PRESERVED: All original helper functions
function formatTime(timeString) {
  if (!timeString) return 'Time TBA';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    return timeString;
  }
}

function detectVenueType(venueName, eventName) {
  const venueNameLower = venueName.toLowerCase();
  const eventNameLower = eventName.toLowerCase();
  
  if (venueNameLower.includes('club') || venueNameLower.includes('lounge') || venueNameLower.includes('bar')) {
    return 'Club';
  }
  
  if (venueNameLower.includes('hall') || venueNameLower.includes('theatre') || venueNameLower.includes('theater')) {
    return 'Concert Hall';
  }
  
  if (venueNameLower.includes('arena') || venueNameLower.includes('stadium') || venueNameLower.includes('centre') || venueNameLower.includes('center')) {
    return 'Arena';
  }
  
  if (venueNameLower.includes('festival') || eventNameLower.includes('festival') || eventNameLower.includes('fest')) {
    return 'Festival';
  }
  
  return 'Venue';
}

function detectGenresFromArtists(artists) {
  // Simplified genre detection (PRESERVED)
  const artistGenreMap = {
    'deadmau5': ['progressive house', 'electro house'],
    'eric prydz': ['progressive house', 'techno'],
    'kaskade': ['progressive house', 'deep house'],
    'skrillex': ['dubstep', 'bass house'],
    'martin garrix': ['big room', 'progressive house'],
    'tiesto': ['big room', 'progressive house']
  };
  
  const detectedGenres = new Set();
  
  artists.forEach(artist => {
    const artistLower = artist.toLowerCase();
    if (artistGenreMap[artistLower]) {
      artistGenreMap[artistLower].forEach(genre => detectedGenres.add(genre));
    }
  });
  
  return Array.from(detectedGenres);
}

