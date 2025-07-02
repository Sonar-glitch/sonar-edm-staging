import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { getCachedData, setCachedData } from '../../../lib/cache';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// ENHANCED: Import enhanced recommendation system
const { enhancedRecommendationSystem } = require('../../../lib/enhancedRecommendationSystem');

/**
 * ENHANCED: Main events API handler with improved personalization
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // ENHANCED: Accept city/country parameters but keep Toronto as fallback for compatibility
    const { 
      lat = '43.6532', 
      lon = '-79.3832', 
      city = 'Toronto', 
      country = 'Canada',
      radius = '50',
      nocache = 'false',
      force = 'false'
    } = req.query;

    console.log(`🎯 Events API called for ${city}, ${country} (${lat}, ${lon}) radius: ${radius}km`);

    // ENHANCED: Get user session for personalization
    const session = await getServerSession(req, res, authOptions);
    console.log(`👤 Session status: ${session ? 'authenticated' : 'anonymous'}`);

    // ENHANCED: Fetch user taste profile for personalization
    let userTaste = null;
    if (session && session.accessToken) {
      try {
        userTaste = await fetchUserTasteProfile(session.accessToken);
        console.log(`🎵 User taste profile: ${userTaste ? Object.keys(userTaste.genres || {}).length : 0} genres`);
      } catch (error) {
        console.error('Error fetching user taste profile:', error.message);
        userTaste = null;
      }
    }

    // ENHANCED: Check cache first (unless nocache is true)
    const cacheKey = `events_${city}_${lat}_${lon}_${radius}_${session?.user?.email || 'anonymous'}`;
    
    if (nocache !== 'true' && force !== 'true') {
      const cachedEvents = await getCachedData(cacheKey, 'EVENTS');
      if (cachedEvents && cachedEvents.length > 0) {
        console.log(`🚀 Cache hit - returning ${cachedEvents.length} cached personalized events`);
        return res.status(200).json({
          events: cachedEvents,
          count: cachedEvents.length,
          source: 'cache',
          city,
          country
        });
      }
    }

    console.log('🔍 Cache miss - fetching fresh events...');

    // ENHANCED: Try MongoDB first, then Ticketmaster API as fallback
    let realEvents = [];
    
    try {
      const { db } = await connectToDatabase();
      const eventsCollection = db.collection('events');
      
      // ENHANCED: Geospatial query with improved filtering
      const geoQuery = {
        location: {
          $geoNear: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lon), parseFloat(lat)]
            },
            $maxDistance: parseInt(radius) * 1000, // Convert km to meters
            $spherical: true
          }
        },
        'dates.start.dateTime': { 
          $gte: new Date().toISOString(),
          $lte: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Next year
        },
        'classifications.segment.name': { $regex: /music/i }
      };

      console.log('🔍 Querying MongoDB for events...');
      
      // ENHANCED: Retry mechanism for MongoDB queries
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && realEvents.length === 0) {
        attempts++;
        try {
          realEvents = await eventsCollection.find(geoQuery.location ? geoQuery : {
            'dates.start.dateTime': geoQuery['dates.start.dateTime'],
            'classifications.segment.name': geoQuery['classifications.segment.name']
          }).limit(50).toArray();
          
          if (realEvents.length > 0) {
            console.log(`✅ MongoDB query successful on attempt ${attempts}: ${realEvents.length} events`);
            break;
          }
        } catch (mongoError) {
          console.log(`❌ Attempt ${attempts} failed: ${mongoError.message}`);
          if (attempts === maxAttempts) {
            throw mongoError;
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }

    } catch (mongoError) {
      console.log('🔄 MongoDB failed, trying Ticketmaster API as fallback...');
      
      // ENHANCED: Fallback to cached data if available
      const fallbackCache = await getCachedData(`events_${city}_fallback`, 'EVENTS');
      if (fallbackCache && fallbackCache.length > 0) {
        console.log(`✅ Using fallback cache with ${fallbackCache.length} events`);
        realEvents = fallbackCache;
      } else {
        // ENHANCED: Use Ticketmaster API as last resort
        try {
          realEvents = await fetchTicketmasterEvents(lat, lon, radius);
          console.log(`✅ Ticketmaster API returned ${realEvents.length} events`);
          
          // Cache the fallback data
          if (realEvents.length > 0) {
            await setCachedData(`events_${city}_fallback`, realEvents, 'EVENTS', 3600); // 1 hour cache
          }
        } catch (tmError) {
          console.error('❌ Ticketmaster API also failed:', tmError.message);
          realEvents = [];
        }
      }
    }

    if (realEvents.length === 0) {
      console.log('⚠️ No events found, returning empty result');
      return res.status(200).json({
        events: [],
        count: 0,
        source: 'empty',
        city,
        country
      });
    }

    console.log(`🎵 Processing ${realEvents.length} events with taste filtering...`);

    // ENHANCED: Process events with taste-based scoring
    const processedEvents = await processEventsWithTasteFiltering(realEvents, userTaste, session);
    
    // ENHANCED: Apply advanced filtering and ranking
    const finalEvents = applyAdvancedTasteFiltering(processedEvents, userTaste);
    
    console.log(`🎯 Taste filtered: ${realEvents.length} → ${finalEvents.length} events`);

    // ENHANCED: Cache the personalized results
    if (finalEvents.length > 0) {
      await setCachedData(cacheKey, finalEvents, 'EVENTS', 1800); // 30 minutes cache for personalized results
    }

    return res.status(200).json({
      events: finalEvents,
      count: finalEvents.length,
      source: 'fresh',
      city,
      country,
      personalized: !!userTaste
    });

  } catch (error) {
    console.error('❌ Events API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

/**
 * ENHANCED: Fetch user taste profile from Spotify
 */
async function fetchUserTasteProfile(accessToken) {
  try {
    // Import the taste processor
    const { processUserTaste } = require('../../../lib/spotifyTasteProcessor');
    
    // Get user's top artists and tracks
    const [topArtists, topTracks] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()),
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json())
    ]);

    if (topArtists.items && topTracks.items) {
      // Process the taste profile
      const tasteProfile = await processUserTaste({
        topArtists: topArtists.items,
        topTracks: topTracks.items
      });
      
      return {
        genres: tasteProfile.genres || [],
        topArtists: tasteProfile.topArtists || [],
        audioFeatures: tasteProfile.audioFeatures || {},
        genrePreferences: tasteProfile.genrePreferences || [],
        topGenres: tasteProfile.topGenres || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in fetchUserTasteProfile:', error);
    return null;
  }
}

/**
 * ENHANCED: Process events with taste-based filtering and scoring
 */
async function processEventsWithTasteFiltering(events, userTaste, session) {
  if (!events || events.length === 0) {
    return [];
  }

  console.log(`✅ Fetched user taste profile: ${userTaste ? Object.keys(userTaste.genres || {}).length : 0} genres`);

  // ENHANCED: Check if enhanced recommendation system is enabled
  const enhancedEnabled = process.env.ENHANCED_RECOMMENDATION_ENABLED === 'true';
  
  if (enhancedEnabled && userTaste) {
    try {
      console.log('🚀 Using enhanced recommendation system...');
      const enhancedEvents = await enhancedRecommendationSystem.processEvents(events, userTaste, session);
      return enhancedEvents;
    } catch (enhancedError) {
      console.error('❌ Enhanced recommendation failed, falling back to basic processing:', enhancedError.message);
    }
  }

  // ENHANCED: Basic processing with improved taste scoring
  const processedEvents = events.map(event => {
    const processedEvent = processEvent(event, userTaste);
    return processedEvent;
  });

  // ENHANCED: Deduplicate events
  const deduplicatedEvents = deduplicateEvents(processedEvents);
  
  return deduplicatedEvents;
}

/**
 * ENHANCED: Process individual event with taste scoring
 */
function processEvent(event, userTaste) {
  try {
    const processedEvent = {
      id: event.id || event._id,
      name: event.name || 'Unnamed Event',
      url: event.url || '',
      dates: event.dates || {},
      venues: extractVenues(event),
      artists: extractArtists(event),
      genres: extractGenres(event),
      images: event.images || [],
      priceRanges: event.priceRanges || [],
      classifications: event.classifications || []
    };

    // Calculate taste match score
    processedEvent.tasteScore = calculateTasteScore(processedEvent, userTaste);
    processedEvent.matchScore = processedEvent.tasteScore; // For compatibility

    return processedEvent;
  } catch (error) {
    console.error(`Error processing event ${event.name}:`, error);
    return {
      id: event.id,
      name: event.name || 'Unnamed Event',
      tasteScore: 0,
      matchScore: 0,
      error: true
    };
  }
}

/**
 * ENHANCED: Extract venue information
 */
function extractVenues(event) {
  const venues = [];
  
  if (event.venues) {
    venues.push(...event.venues);
  } else if (event._embedded && event._embedded.venues) {
    venues.push(...event._embedded.venues);
  }
  
  return venues.map(venue => ({
    name: venue.name || 'Unknown Venue',
    address: venue.address || {},
    city: venue.city || {},
    location: venue.location || {}
  }));
}

/**
 * ENHANCED: Extract artist information
 */
function extractArtists(event) {
  const artists = [];
  
  if (event.artists) {
    artists.push(...event.artists);
  } else if (event._embedded && event._embedded.attractions) {
    artists.push(...event._embedded.attractions);
  }
  
  return artists.map(artist => ({
    name: artist.name || 'Unknown Artist',
    id: artist.id || '',
    genres: artist.classifications ? 
      artist.classifications.map(c => c.genre?.name).filter(Boolean) : []
  }));
}

/**
 * ENHANCED: Extract genre information
 */
function extractGenres(event) {
  const genres = new Set();
  
  // From classifications
  if (event.classifications) {
    event.classifications.forEach(classification => {
      if (classification.genre && classification.genre.name) {
        genres.add(classification.genre.name.toLowerCase());
      }
      if (classification.subGenre && classification.subGenre.name) {
        genres.add(classification.subGenre.name.toLowerCase());
      }
    });
  }
  
  // From artist classifications
  if (event._embedded && event._embedded.attractions) {
    event._embedded.attractions.forEach(attraction => {
      if (attraction.classifications) {
        attraction.classifications.forEach(classification => {
          if (classification.genre && classification.genre.name) {
            genres.add(classification.genre.name.toLowerCase());
          }
        });
      }
    });
  }
  
  return Array.from(genres);
}

/**
 * ENHANCED: Calculate taste score with improved algorithm
 */
function calculateTasteScore(event, userTaste) {
  if (!userTaste || (!userTaste.genrePreferences && !userTaste.topGenres)) {
    return 50; // Default score when no taste data
  }

  let score = 0;
  let maxScore = 0;

  // Genre matching (60% weight)
  const genreWeight = 0.6;
  let genreScore = 0;
  
  if (event.genres && event.genres.length > 0) {
    const userGenres = userTaste.genrePreferences || userTaste.topGenres || [];
    for (const userGenre of userGenres) {
      const genreName = userGenre.name || userGenre;
      const genreWeightValue = userGenre.weight || 1;
      
      for (const eventGenre of event.genres) {
        if (genreName.toLowerCase() === eventGenre.toLowerCase()) {
          genreScore += 100 * genreWeightValue; // Perfect match weighted
        } else if (genreName.toLowerCase().includes(eventGenre.toLowerCase()) || 
                   eventGenre.toLowerCase().includes(genreName.toLowerCase())) {
          genreScore += 50 * genreWeightValue; // Partial match weighted
        }
      }
    }
    genreScore = Math.min(genreScore, 100); // Cap at 100
  }
  
  score += genreScore * genreWeight;
  maxScore += 100 * genreWeight;

  // Artist matching (40% weight)
  const artistWeight = 0.4;
  let artistScore = 0;
  
  if (event.artists && event.artists.length > 0 && userTaste.topArtists) {
    for (const userArtist of userTaste.topArtists) {
      for (const eventArtist of event.artists) {
        if (userArtist.name.toLowerCase() === eventArtist.name.toLowerCase()) {
          artistScore += 100; // Perfect match
        } else if (userArtist.name.toLowerCase().includes(eventArtist.name.toLowerCase()) || 
                   eventArtist.name.toLowerCase().includes(userArtist.name.toLowerCase())) {
          artistScore += 30; // Partial match
        }
      }
    }
    artistScore = Math.min(artistScore, 100); // Cap at 100
  }
  
  score += artistScore * artistWeight;
  maxScore += 100 * artistWeight;

  // Calculate final percentage
  const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
  return Math.max(0, Math.min(100, finalScore));
}

/**
 * ENHANCED: Deduplicate events by name, venue, and date
 */
function deduplicateEvents(events) {
  const seen = new Set();
  const deduplicated = [];
  
  for (const event of events) {
    // Create a unique key based on name, venue, and date
    const venueName = event.venues?.[0]?.name || 'unknown';
    const eventDate = event.dates?.start?.localDate || 'unknown';
    const key = `${event.name.toLowerCase()}_${venueName.toLowerCase()}_${eventDate}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(event);
    }
  }
  
  return deduplicated;
}

/**
 * ENHANCED: Apply advanced taste-based filtering and ranking
 */
function applyAdvancedTasteFiltering(events, userTaste) {
  if (!events || events.length === 0) {
    return [];
  }

  // Filter out events with very low taste scores (below 20%)
  const filtered = events.filter(event => (event.tasteScore || 0) >= 20);
  
  // Sort by taste score (descending) and then by date (ascending)
  const sorted = filtered.sort((a, b) => {
    const scoreDiff = (b.tasteScore || 0) - (a.tasteScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    
    // If scores are equal, sort by date
    const dateA = new Date(a.dates?.start?.localDate || '9999-12-31');
    const dateB = new Date(b.dates?.start?.localDate || '9999-12-31');
    return dateA - dateB;
  });

  // Return top 20 events
  return sorted.slice(0, 20);
}

/**
 * ENHANCED: Fetch events from Ticketmaster API as fallback
 */
async function fetchTicketmasterEvents(lat, lon, radius) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error('Ticketmaster API key not configured');
  }

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&latlong=${lat},${lon}&radius=${radius}&unit=km&classificationName=music&size=50&sort=date,asc`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data._embedded?.events || [];
}

