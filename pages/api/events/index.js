import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import { getCachedData, setCachedData } from '../../../lib/cache';
import axios from 'axios';

// Import city request utilities (PRESERVED)
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

    // ENHANCED: Cache key includes user ID for personalized caching
    const userId = session.user?.id || session.user?.email || 'anonymous';
    const cacheKey = `events_${city}_${lat}_${lon}_${radius}_${userId}`;
    const cachedEvents = await getCachedData(cacheKey, 'EVENTS');
    
    if (cachedEvents) {
      console.log(`🚀 Cache hit - returning ${cachedEvents.length} cached personalized events`);
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
        .limit(100) // ENHANCED: Fetch more events for better deduplication
        .sort({ date: 1 })
        .toArray();

        console.log(`📊 Found ${mongoEvents.length} events in MongoDB for ${city}, ${country}`);

        // NEW: If no events found AND not Toronto, trigger automatic city request
        if (mongoEvents.length === 0 && city.toLowerCase() !== 'toronto') {
          console.log(`🌍 No events found for ${city}, ${country} - triggering automatic city request`);
          cityRequestInfo = await handleAutomaticCityRequest(city, country, latitude, longitude);
        }

        // ENHANCED: Process events with deduplication and taste filtering
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
                // CRITICAL: Preserve source labeling
                unifiedProcessing: event.unifiedProcessing,
                source: event.source
              }))
            }
          };
          
          // ENHANCED: Process events with deduplication and personalization
          realEvents = await processEventsWithTasteFiltering(data._embedded.events, city, session);
          console.log(`✅ Successfully processed ${realEvents.length} personalized events from MongoDB`);
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

    // ENHANCED: Sorting logic with taste-based ranking
    if (finalEvents.length > 0 && finalEvents[0].matchScore !== undefined && !finalEvents[0].isPlaceholder) {
      finalEvents.sort((a, b) => {
        // Primary sort by taste score (if available)
        if (b.tasteScore !== undefined && a.tasteScore !== undefined && b.tasteScore !== a.tasteScore) {
          return b.tasteScore - a.tasteScore;
        }
        // Secondary sort by match score
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // Tertiary sort by date
        const dateA = a.date ? new Date(a.date) : new Date(9999, 11, 31);
        const dateB = b.date ? new Date(b.date) : new Date(9999, 11, 31);
        return dateA - dateB;
      });
    }

    console.log(`🎯 Returning ${finalEvents.length} personalized events (${realEvents.length} real, source: ${responseSource})`);

    // ENHANCED: Cache personalized results
    if (finalEvents.length > 0 && responseSource !== 'fetching') {
      await setCachedData(cacheKey, finalEvents, 'EVENTS');
      console.log(`💾 Cached ${finalEvents.length} personalized events for ${city}, ${country}`);
    }

    // PRESERVED: Original response format with enhancements
    const response = {
      events: finalEvents,
      total: finalEvents.length,
      realCount: realEvents.length,
      source: responseSource,
      timestamp: new Date().toISOString(),
      location: { city, country, lat, lon },
      personalized: realEvents.length > 0 // NEW: Indicate if results are personalized
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
 * NEW: Enhanced event processing with deduplication and taste filtering
 */
async function processEventsWithTasteFiltering(events, city, session) {
  console.log(`🎵 Processing ${events.length} events with taste filtering...`);
  
  // Step 1: Get user taste profile
  let userTaste = null;
  try {
    if (session && session.accessToken) {
      userTaste = await fetchUserTasteProfile(session.accessToken);
      console.log(`✅ Fetched user taste profile: ${userTaste?.genres?.length || 0} genres`);
    }
  } catch (error) {
    console.error('❌ Failed to fetch user taste profile:', error.message);
  }

  // Step 2: Process and deduplicate events
  const processedEvents = events.map(event => processEvent(event, city, userTaste));
  
  // Step 3: Deduplicate events by name + venue + date
  const deduplicatedEvents = deduplicateEvents(processedEvents);
  console.log(`🔄 Deduplicated: ${events.length} → ${deduplicatedEvents.length} events`);
  
  // Step 4: Apply FIXED taste-based filtering and ranking
  const filteredEvents = applyAdvancedTasteFiltering(deduplicatedEvents, userTaste);
  console.log(`🎯 Taste filtered: ${deduplicatedEvents.length} → ${filteredEvents.length} events`);
  
  return filteredEvents;
}

/**
 * Enhanced fetchUserTasteProfile using sophisticated taste processor
 */
async function fetchUserTasteProfile(accessToken) {
  try {
    // Import sophisticated processor
    const { processAndSaveUserTaste } = require('../../../lib/spotifyTasteProcessor');
    
    // Create session object for the processor
    const session = { 
      accessToken, 
      user: { email: 'recommendation-user' }
    };
    
    console.log('🎵 Using sophisticated taste processor for recommendations...');
    
    // Get comprehensive taste profile
    const tasteProfile = await processAndSaveUserTaste(session);
    
    if (tasteProfile && tasteProfile.genreProfile) {
      const genres = Object.keys(tasteProfile.genreProfile);
      const topArtists = tasteProfile.topArtists || [];
      
      console.log(`✅ Sophisticated taste profile: ${genres.length} genres, ${topArtists.length} artists`);
      
      return {
        genres: genres,
        topArtists: topArtists
      };
    } else {
      // Fallback to basic API
      return await fetchBasicTasteProfile(accessToken);
    }
    
  } catch (error) {
    console.error('❌ Sophisticated processor failed:', error.message);
    return await fetchBasicTasteProfile(accessToken);
  }
}

/**
 * Fallback function - basic Spotify API call
 */
async function fetchBasicTasteProfile(accessToken) {
  try {
    const artistsResponse = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 20, time_range: 'medium_term' },
      timeout: 5000
    } );

    if (artistsResponse.status === 200 && artistsResponse.data.items) {
      const topArtists = artistsResponse.data.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        popularity: artist.popularity,
        genres: artist.genres || []
      }));

      const allGenres = topArtists.flatMap(artist => artist.genres);
      const uniqueGenres = [...new Set(allGenres)];

      return {
        genres: uniqueGenres,
        topArtists: topArtists
      };
    }
  } catch (error) {
    console.error('❌ Basic Spotify API failed:', error.message);
  }

  return null;
}

/**
 * NEW: Deduplicate events by name + venue + date
 */
function deduplicateEvents(events) {
  const seen = new Set();
  const deduplicated = [];
  
  for (const event of events) {
    // Create a unique key for deduplication
    const key = `${event.name.toLowerCase().trim()}_${event.venue.toLowerCase().trim()}_${event.date}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(event);
    } else {
      console.log(`🔄 Duplicate removed: ${event.name} at ${event.venue}`);
    }
  }
  
  return deduplicated;
}

/**
 * FIXED: Advanced multi-level genre matching (from correlated-events.js)
 */
function normalizeGenre(genre) {
  if (!genre) return '';
  return genre.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateGenreMatchScore(eventGenres, userGenres) {
  if (!eventGenres || !userGenres || eventGenres.length === 0 || userGenres.length === 0) {
    return 0;
  }
  
  // Normalize all genres
  const normalizedEventGenres = eventGenres.map(normalizeGenre);
  const normalizedUserGenres = userGenres.map(normalizeGenre);
  
  let totalScore = 0;
  
  // Check for exact matches (highest weight)
  for (const userGenre of normalizedUserGenres) {
    if (normalizedEventGenres.includes(userGenre)) {
      totalScore += 30; // Exact match is worth 30 points
    }
  }
  
  // Check for partial matches
  for (const userGenre of normalizedUserGenres) {
    for (const eventGenre of normalizedEventGenres) {
      // Skip if already counted as exact match
      if (eventGenre === userGenre) continue;
      
      // Check if one contains the other
      if (eventGenre.includes(userGenre) || userGenre.includes(eventGenre)) {
        totalScore += 15; // Partial match is worth 15 points
      }
      // Check for word-level matches
      else {
        const userWords = userGenre.split(' ');
        const eventWords = eventGenre.split(' ');
        
        for (const userWord of userWords) {
          if (userWord.length < 3) continue; // Skip short words
          
          if (eventWords.includes(userWord)) {
            totalScore += 5; // Word match is worth 5 points
          }
        }
      }
    }
  }
  
  // Cap the score at 100
  return Math.min(totalScore, 100);
}

function calculateArtistMatchScore(eventName, userArtists) {
  if (!eventName || !userArtists || userArtists.length === 0) {
    return 0;
  }
  
  const normalizedEventName = eventName.toLowerCase();
  let totalScore = 0;
  
  // Check for artist name matches
  for (const artist of userArtists) {
    const normalizedArtist = artist.name.toLowerCase();
    
    // Exact artist match
    if (normalizedEventName.includes(normalizedArtist)) {
      // Higher weight for more popular artists
      totalScore += 40 * (artist.popularity / 100);
    }
  }
  
  // Cap the score at 100
  return Math.min(totalScore, 100);
}

/**
 * FIXED: Advanced taste filtering with multi-level genre matching
 */
function applyAdvancedTasteFiltering(events, userTaste) {
  if (!userTaste || !userTaste.genres || userTaste.genres.length === 0) {
    console.log('⚠️ No user taste data available, returning events with base scores');
    // Return events with base scores instead of filtering them out
    return events.map(event => ({
      ...event,
      tasteScore: 25 // Base score for unknown taste
    }));
  }
  
  const userGenres = userTaste.genres;
  const userArtists = userTaste.topArtists || [];
  
  console.log(`🎵 Applying advanced taste filtering with ${userGenres.length} genres and ${userArtists.length} artists`);
  
  // Calculate taste scores for each event using advanced matching
  const eventsWithTasteScores = events.map(event => {
    let tasteScore = 0;
    
    // FIXED: Use advanced genre matching (50% weight)
    const genreScore = calculateGenreMatchScore(event.detectedGenres, userGenres);
    tasteScore += genreScore * 0.5;
    
    // FIXED: Use advanced artist matching (30% weight)
    const artistScore = calculateArtistMatchScore(event.name, userArtists);
    tasteScore += artistScore * 0.3;
    
    // EDM relevance bonus (20% weight)
    const edmKeywords = ['house', 'techno', 'electronic', 'edm', 'dance', 'trance', 'dubstep'];
    const eventText = `${event.name} ${event.headliners.join(' ')}`.toLowerCase();
    const edmMatches = edmKeywords.filter(keyword => eventText.includes(keyword)).length;
    
    if (edmMatches > 0) {
      tasteScore += Math.min(edmMatches * 4, 20); // Max 20 points for EDM relevance
    }
    
    // FIXED: Ensure minimum score for all events
    tasteScore = Math.max(tasteScore, 15); // Minimum 15 points
    
    return {
      ...event,
      tasteScore: Math.round(tasteScore)
    };
  });
  
  // FIXED: Lower threshold - only filter out very low scores
  const filteredEvents = eventsWithTasteScores.filter(event => 
    event.tasteScore >= 5 || event.matchScore >= 70
  );
  
  console.log(`🎯 Advanced taste scoring complete: ${eventsWithTasteScores.length} → ${filteredEvents.length} events after filtering`);
  
  return filteredEvents;
}

/**
 * ENHANCED: Event processing with improved genre detection
 */
function processEvent(event, city, userTaste) {
  const venue = event._embedded?.venues?.[0];
  const artists = event._embedded?.attractions?.map(a => a.name) || [];
  
  // ENHANCED: Multi-source genre detection
  const detectedGenres = detectGenresFromMultipleSources(event, artists, venue);
  
  // Enhanced relevance scoring
  const edmKeywords = ['house', 'techno', 'electronic', 'edm', 'dance', 'trance', 'dubstep', 'drum', 'bass'];
  const eventText = `${event.name} ${artists.join(' ')} ${event.classifications?.[0]?.genre?.name || ''}`.toLowerCase();
  const edmMatches = edmKeywords.filter(keyword => eventText.includes(keyword)).length;
  
  const baseScore = Math.min(70 + (edmMatches * 3), 85);
  const genreBonus = detectedGenres.length > 0 ? Math.min(detectedGenres.length * 2, 14) : 0;
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
    // CRITICAL: Preserve source labeling
    source: event.unifiedProcessing?.sourceEvents?.[0]?.source?.toLowerCase() || event.source || 'unknown',
    venueType: venueType,
    detectedGenres: detectedGenres
  };
}

/**
 * ENHANCED: Multi-source genre detection
 */
function detectGenresFromMultipleSources(event, artists, venue) {
  const detectedGenres = new Set();
  
  // 1. Artist-based genre detection (expanded)
  const artistGenres = detectGenresFromArtists(artists);
  artistGenres.forEach(genre => detectedGenres.add(genre));
  
  // 2. Event name keyword detection
  const eventNameGenres = detectGenresFromEventName(event.name);
  eventNameGenres.forEach(genre => detectedGenres.add(genre));
  
  // 3. Venue-based genre inference
  const venueGenres = detectGenresFromVenue(venue?.name || '');
  venueGenres.forEach(genre => detectedGenres.add(genre));
  
  // 4. Ticketmaster classification
  if (event.classifications?.[0]?.genre?.name) {
    const tmGenre = event.classifications[0].genre.name.toLowerCase();
    detectedGenres.add(tmGenre);
  }
  
  return Array.from(detectedGenres);
}

function detectGenresFromEventName(eventName) {
  if (!eventName) return [];
  
  const name = eventName.toLowerCase();
  const genres = [];
  
  // Electronic music keywords
  if (name.includes('house')) genres.push('house');
  if (name.includes('techno')) genres.push('techno');
  if (name.includes('trance')) genres.push('trance');
  if (name.includes('progressive')) genres.push('progressive');
  if (name.includes('deep')) genres.push('deep house');
  if (name.includes('electronic')) genres.push('electronic');
  if (name.includes('edm')) genres.push('edm');
  if (name.includes('dance')) genres.push('dance');
  if (name.includes('dubstep')) genres.push('dubstep');
  if (name.includes('drum') && name.includes('bass')) genres.push('drum and bass');
  
  return genres;
}

function detectGenresFromVenue(venueName) {
  if (!venueName) return [];
  
  const venue = venueName.toLowerCase();
  const genres = [];
  
  // Toronto venue mappings
  if (venue.includes('coda')) genres.push('house', 'techno');
  if (venue.includes('rebel')) genres.push('edm', 'progressive house');
  if (venue.includes('toybox')) genres.push('house', 'techno');
  if (venue.includes('vertigo')) genres.push('techno', 'underground');
  if (venue.includes('dprtmnt')) genres.push('house', 'deep house');
  
  return genres;
}

function detectGenresFromArtists(artists) {
  // ENHANCED: Expanded artist database
  const artistGenreMap = {
    // Progressive House
    'deadmau5': ['progressive house', 'electro house'],
    'eric prydz': ['progressive house', 'techno'],
    'kaskade': ['progressive house', 'deep house'],
    'martin garrix': ['big room', 'progressive house'],
    'tiesto': ['big room', 'progressive house'],
    'above & beyond': ['trance', 'progressive trance'],
    'armin van buuren': ['trance', 'progressive trance'],
    
    // Techno
    'carl cox': ['techno', 'house'],
    'richie hawtin': ['minimal techno', 'techno'],
    'charlotte de witte': ['techno', 'dark techno'],
    'amelie lens': ['techno', 'hard techno'],
    'adam beyer': ['techno', 'hard techno'],
    'nina kraviz': ['techno', 'acid techno'],
    
    // House
    'calvin harris': ['electro house', 'progressive house'],
    'david guetta': ['electro house', 'progressive house'],
    'disclosure': ['deep house', 'uk garage'],
    'duke dumont': ['deep house', 'tech house'],
    'fisher': ['tech house', 'house'],
    'chris lake': ['tech house', 'house'],
    
    // Bass Music
    'skrillex': ['dubstep', 'bass house'],
    'diplo': ['trap', 'moombahton'],
    'flume': ['future bass', 'electronic'],
    'odesza': ['future bass', 'electronic'],
    
    // Trance
    'paul van dyk': ['trance', 'progressive trance'],
    'ferry corsten': ['trance', 'progressive trance'],
    'aly & fila': ['trance', 'uplifting trance']
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

/**
 * PRESERVED: All original helper functions
 */
async function handleAutomaticCityRequest(city, country, latitude, longitude) {
  try {
    if (!isCountrySupported(country)) {
      console.log(`❌ Country not supported: ${country}`);
      return {
        success: false,
        error: `Country "${country}" is not supported by Ticketmaster`
      };
    }

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
      detectedGenres: ['house', 'techno'],
      tasteScore: 25
    }
  ];
}

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
