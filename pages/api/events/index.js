import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { connectToDatabase } from '../../../lib/mongodb';
import { getCachedData, setCachedData } from '../../../lib/cache';
import axios from 'axios';
const { enhancedRecommendationSystem } = require('../../../lib/enhancedRecommendationSystem');

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
    // FIXED: Proper authentication check with correct imports
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🔐 Session verified:', {
      hasAccessToken: !!session.accessToken,
      userEmail: session.user?.email,
      tokenExpiry: session.accessToken ? 'present' : 'missing'
    });

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

    if (cachedEvents && !req.query.nocache) {
      console.log(`🚀 Cache hit - returning ${cachedEvents.length} cached personalized events`);
      return res.status(200).json({
        events: cachedEvents,
        total: cachedEvents.length,
        source: "cache",
        timestamp: new Date().toISOString(),
        location: { city, country, lat, lon }
      });
    }

    // ENHANCED: Fetch events from MongoDB with retry logic
    let realEvents = [];
    let apiError = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}: Fetching events from MongoDB...`);

        const { db } = await connectToDatabase();
        const eventsCollection = db.collection('events');

        // FIXED: Corrected geospatial query path from 'venues.location.coordinates' to 'location.coordinates'
        const query = {
          'location.coordinates': {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(lon), parseFloat(lat)]
              },
              $maxDistance: parseInt(radius) * 1000 // Convert km to meters
            }
          },
          'date': {
            $gte: new Date().toISOString().split('T')[0] // Today or later
          }
        };

        console.log(`📍 MongoDB query: ${JSON.stringify(query, null, 2)}`);

        const data = await eventsCollection.find(query)
          .limit(50)
          .sort({ 'date': 1 })
          .toArray();

        if (data && data.length > 0) {
          console.log(`✅ Found ${data.length} events from MongoDB`);

          // SURGICAL FIX 2 & 3: Enhanced field mapping with venue data preservation and time extraction
          const formattedEvents = data.map(event => ({
            id: event._id || event.id,
            name: event.name,
            url: event.url,
            ticketUrl: event.url, // FIXED: Map url to ticketUrl for frontend
            source: 'mongodb', // FIXED: Add source field
            date: event.date, // FIXED: Map date directly for frontend
            // SURGICAL FIX 3: Time extraction from multiple sources
            time: event.dates?.start?.localTime || event.startTime || extractTimeFromDate(event.date),
            startTime: event.dates?.start?.localTime || event.startTime || extractTimeFromDate(event.date),
            doorTime: event.doorTime,
            dates: { 
              start: { 
                localDate: event.date,
                localTime: event.dates?.start?.localTime || event.startTime || extractTimeFromDate(event.date)
              } 
            }, // Keep for API compatibility
            // SURGICAL FIX 2: Venue data preservation - keep complete venue object
            venue: event.venue || 'Venue TBA', // FIXED: Preserve complete venue object instead of just name
            venues: event.venue ? [event.venue] : [], // Keep for API compatibility
            artists: event.artists ? event.artists.map(artist => ({ name: artist.name, id: artist.id })) : [],
            _embedded: {
              venues: event.venue ? [event.venue] : [],
              attractions: event.artists ? event.artists.map(artist => ({ name: artist.name, id: artist.id })) : []
            },
            classifications: event.classifications || [],
            priceRanges: event.priceRanges || [],
            images: event.images || []
          }));

          // ENHANCED: Process events with deduplication and personalization
          realEvents = await processEventsWithTasteFiltering(formattedEvents, city, session);
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

    // FALLBACK: If MongoDB fails, try Ticketmaster API
    if (realEvents.length === 0) {
      console.log('🔄 MongoDB failed, trying Ticketmaster API as fallback...');

      try {
        const ticketmasterUrl = `${TICKETMASTER_BASE_URL}/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${lat},${lon}&radius=${radius}&unit=km&classificationName=music&size=50&sort=date,asc`;
        console.log(`🎫 Ticketmaster URL: ${ticketmasterUrl}`);

        const response = await axios.get(ticketmasterUrl, { timeout: 10000 });

        if (response.data && response.data._embedded && response.data._embedded.events) {
          console.log(`✅ Ticketmaster returned ${response.data._embedded.events.length} events`);
          
          // FIXED: Add proper field mapping for Ticketmaster events too
          const ticketmasterEvents = response.data._embedded.events.map(event => ({
            ...event,
            source: 'ticketmaster',
            ticketUrl: event.url, // FIXED: Map url to ticketUrl
            date: event.dates?.start?.localDate, // FIXED: Extract date for frontend
            venue: event._embedded?.venues?.[0]?.name || 'Venue TBA' // FIXED: Extract venue name
          }));
          
          realEvents = await processEventsWithTasteFiltering(ticketmasterEvents, city, session);
        }
      } catch (ticketmasterError) {
        console.error('❌ Ticketmaster API also failed:', ticketmasterError.message);
      }
    }

    // FINAL FALLBACK: Return cached data or empty array
    if (realEvents.length === 0) {
      console.log('🔄 All sources failed, checking for any cached data...');
      const fallbackCache = await getCachedData(`events_${city}_fallback`, 'EVENTS');

      if (fallbackCache && fallbackCache.length > 0) {
        console.log(`✅ Using fallback cache with ${fallbackCache.length} events`);
        realEvents = fallbackCache;
      } else {
        console.log('❌ No events found from any source');
        return res.status(200).json({
          events: [],
          total: 0,
          source: "no_data",
          error: apiError?.message || "No events found",
          timestamp: new Date().toISOString(),
          location: { city, country, lat, lon }
        });
      }
    }

    // ENHANCED: Cache the personalized results
    if (realEvents.length > 0) {
      await setCachedData(cacheKey, realEvents, 'EVENTS');
      console.log(`💾 Cached ${realEvents.length} personalized events`);
    }

    // SUCCESS: Return personalized events
    console.log(`🎉 Returning ${realEvents.length} personalized events for ${city}`);

    res.status(200).json({
      events: realEvents,
      total: realEvents.length,
      source: "mongodb_personalized",
      timestamp: new Date().toISOString(),
      location: { city, country, lat, lon }
    });

  } catch (error) {
    console.error('🚨 Critical error in events API:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * SURGICAL FIX 3: Helper function to extract time from date string
 */
function extractTimeFromDate(dateString) {
  if (!dateString) return undefined;
  try {
    const date = new Date(dateString);
    return date.toTimeString().split(' ')[0]; // Returns HH:MM:SS format
  } catch (error) {
    return undefined;
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
    console.log('🎯 Enhanced taste processing started...');
    if (session && session.accessToken) {
      console.log('🔑 Access token available, fetching taste profile...');
      userTaste = await fetchUserTasteProfile(session.accessToken);
      console.log(`✅ Fetched user taste profile: ${userTaste?.genrePreferences?.length || 0} genre preferences`);
    } else {
      console.log('❌ No session or access token available');
    }
  } catch (error) {
    console.error('❌ Enhanced taste processing failed:', error);
    console.error('Error fetching user taste profile:', error);
  }

  // Step 2: Process and deduplicate events
  const processedEvents = events.map(event => processEvent(event, city, userTaste));

  // Step 3: Deduplicate events by name + venue + date
  const deduplicatedEvents = deduplicateEvents(processedEvents);
  console.log(`🔄 Deduplicated: ${events.length} → ${deduplicatedEvents.length} events`);

  // Step 4: Apply FIXED taste-based filtering and ranking
  let filteredEvents = applyAdvancedTasteFiltering(deduplicatedEvents, userTaste);
  console.log(`🎯 Taste filtered: ${deduplicatedEvents.length} → ${filteredEvents.length} events`);

  // SURGICAL FIX 4: Enhanced Phase 2 integration with proper component usage
  if (process.env.ENHANCED_RECOMMENDATION_ENABLED === 'true') {
    try {
      console.log('🚀 Applying Phase 2 enhanced scoring with full component integration...');
      
      // FIXED: Convert userTaste structure to match Phase 2 expectations
      if (userTaste && userTaste.genrePreferences) {
        userTaste.genres = userTaste.genrePreferences.map(pref => pref.name);
        console.log('🔧 Converted genrePreferences to genres for Phase 2 compatibility');
      }
      
      // SURGICAL FIX 4: Enhanced Phase 2 processing with component integration
      filteredEvents = await enhancedRecommendationSystemWithPhase2Components(filteredEvents, userTaste);
      
      // SURGICAL FIX 1: Correct score mapping - use enhancedScore instead of tasteScore
      filteredEvents = filteredEvents.map(event => ({
        ...event,
        matchScore: event.enhancedScore || event.tasteScore || event.matchScore // FIXED: Priority to enhancedScore
      }));
      
      console.log('✅ Phase 2 enhanced scoring with full component integration applied successfully');
      console.log(`🎯 Sample enhanced scores: ${filteredEvents.slice(0, 3).map(e => `${e.name}: ${e.matchScore}%`).join(', ')}`);
    } catch (error) {
      console.error('❌ Phase 2 enhanced scoring failed, using original results:', error);
      // Continue with original results if Phase 2 fails
    }
  }

  return filteredEvents;
}

/**
 * SURGICAL FIX 4: Enhanced recommendation system with proper Phase 2 component integration
 */
async function enhancedRecommendationSystemWithPhase2Components(events, userTaste) {
  try {
    // Import Phase 2 components
    const { ExpandedGenreMatrix } = require('../../../lib/expandedGenreMatrix');
    const { AlternativeArtistRelationships } = require('../../../lib/alternativeArtistRelationships');
    
    // Initialize Phase 2 components
    const genreMatrix = new ExpandedGenreMatrix();
    const artistRelationships = new AlternativeArtistRelationships();
    
    console.log(`🎯 Phase 2 components initialized: ${genreMatrix.genreList.length} genres, artist relationships ready`);
    
    // Process each event with Phase 2 enhancements
    const enhancedEvents = await Promise.all(events.map(async (event) => {
      let enhancedScore = event.tasteScore || 0;
      let genreMatches = [];
      let artistMatches = [];
      
      // Enhanced genre matching using expanded matrix
      if (userTaste?.genres && event.genres) {
        for (const userGenre of userTaste.genres) {
          for (const eventGenre of event.genres) {
            const similarity = genreMatrix.getSimilarity(userGenre.toLowerCase(), eventGenre.toLowerCase());
            if (similarity > 0) {
              genreMatches.push({
                userGenre,
                eventGenre,
                similarity: Math.round(similarity * 100)
              });
              enhancedScore += similarity * 20; // Boost score based on similarity
            }
          }
        }
      }
      
      // Enhanced artist matching with relationships for unknown artists
      if (userTaste?.topArtists && event.artists) {
        for (const userArtist of userTaste.topArtists) {
          for (const eventArtist of event.artists) {
            // Direct match
            if (userArtist.name.toLowerCase() === eventArtist.name.toLowerCase()) {
              artistMatches.push({
                userArtist: userArtist.name,
                eventArtist: eventArtist.name,
                similarity: 100
              });
              enhancedScore += 30;
            } else {
              // Use artist relationships for unknown/different artists
              try {
                const relatedArtists = await artistRelationships.getSimilarArtists(userArtist.name);
                const relatedMatch = relatedArtists.find(related => 
                  related.name.toLowerCase().includes(eventArtist.name.toLowerCase()) ||
                  eventArtist.name.toLowerCase().includes(related.name.toLowerCase())
                );
                
                if (relatedMatch) {
                  const similarity = Math.round(relatedMatch.similarity * 100);
                  artistMatches.push({
                    userArtist: userArtist.name,
                    eventArtist: eventArtist.name,
                    similarity,
                    relatedVia: relatedMatch.name
                  });
                  enhancedScore += similarity * 0.4; // 40% of related artist score as per Phase 2 spec
                }
              } catch (error) {
                console.log(`⚠️ Artist relationship lookup failed for ${userArtist.name}:`, error.message);
              }
            }
          }
        }
      }
      
      // Cap the enhanced score at reasonable maximum
      enhancedScore = Math.min(Math.round(enhancedScore), 100);
      
      return {
        ...event,
        enhancedScore,
        originalScore: event.tasteScore || 0,
        confidence: enhancedScore > 50 ? 'high' : enhancedScore > 30 ? 'medium' : 'low',
        enhancementApplied: true,
        enhancementDetails: [
          `Genre: ${Math.max(...genreMatches.map(m => m.similarity), 0)}% (${genreMatches.length} matches)`,
          `Artist: ${Math.max(...artistMatches.map(m => m.similarity), 0)}% (${artistMatches.length} matches)`
        ],
        genreMatches,
        artistMatches
      };
    }));
    
    console.log(`✅ Phase 2 enhanced processing complete for ${enhancedEvents.length} events`);
    return enhancedEvents;
    
  } catch (error) {
    console.error('❌ Phase 2 component integration failed:', error);
    // Fallback to original enhanced recommendation system
    return await enhancedRecommendationSystem.processEventsWithEnhancedScoring(events, userTaste);
  }
}

/**
 * FIXED: Fetch user taste profile from Spotify with proper error handling
 */
async function fetchUserTasteProfile(accessToken) {
  try {
    console.log('🔍 fetchUserTasteProfile called with accessToken:', !!accessToken);
    
    if (!accessToken) {
      console.log('❌ No access token provided');
      return null;
    }
    
    // Get user's top artists and tracks directly from Spotify
    const [topArtistsResponse, topTracksResponse] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ]);

    console.log('🎵 Spotify API response status:', {
      artists: topArtistsResponse.status,
      tracks: topTracksResponse.status
    });

    if (!topArtistsResponse.ok || !topTracksResponse.ok) {
      console.error('❌ Spotify API error:', {
        artistsError: topArtistsResponse.status,
        tracksError: topTracksResponse.status
      });
      return null;
    }

    const [topArtists, topTracks] = await Promise.all([
      topArtistsResponse.json(),
      topTracksResponse.json()
    ]);

    console.log('🎵 Spotify API responses:', {
      artists: topArtists.items?.length || 0,
      tracks: topTracks.items?.length || 0
    });

    if (topArtists.items && topTracks.items) {
      // Extract genres from artists
      const genrePreferences = [];
      const genreCount = {};
      
      topArtists.items.forEach(artist => {
        artist.genres?.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      });
      
      // Convert to weighted preferences
      const totalGenres = Object.values(genreCount).reduce((a, b) => a + b, 0);
      if (totalGenres > 0) {
        Object.entries(genreCount).forEach(([genre, count]) => {
          genrePreferences.push({
            name: genre,
            weight: count / totalGenres
          });
        });
      }
      
      // Sort by weight descending
      genrePreferences.sort((a, b) => b.weight - a.weight);

      const result = {
        genrePreferences: genrePreferences.slice(0, 10), // Top 10 genres
        topGenres: genrePreferences.slice(0, 5), // Top 5 for compatibility
        topArtists: topArtists.items || [],
        topTracks: topTracks.items || []
      };
      
      console.log('✅ Generated taste profile:', {
        genrePreferences: result.genrePreferences.length,
        topGenres: result.topGenres.length,
        topArtists: result.topArtists.length,
        sampleGenres: result.genrePreferences.slice(0, 3).map(g => g.name)
      });
      
      return result;
    }

    console.log('❌ No Spotify data available');
    return null;
  } catch (error) {
    console.error('❌ Error fetching user taste profile:', error);
    return null;
  }
}

/**
 * FIXED: Process individual event with correct field mapping for frontend
 */
function processEvent(event, city, userTaste) {
  try {
    // Extract basic event information with FRONTEND FIELD MAPPING
    const processedEvent = {
      id: event.id,
      name: event.name || 'Unnamed Event',
      url: event.url || '',
      ticketUrl: event.url || '', // FIXED: Map url to ticketUrl for frontend
      source: event.source || 'unknown',
      date: event.date || event.dates?.start?.localDate, // FIXED: Map date for frontend
      time: event.time, // SURGICAL FIX 3: Include extracted time
      startTime: event.startTime, // SURGICAL FIX 3: Include extracted startTime
      doorTime: event.doorTime,
      dates: event.dates || {},
      venue: event.venue || event._embedded?.venues?.[0]?.name || 'Venue TBA', // SURGICAL FIX 2: Preserve venue object or fallback to name
      venues: extractVenues(event),
      artists: extractArtists(event),
      genres: extractGenres(event),
      images: event.images || [],
      priceRanges: event.priceRanges || [],
      classifications: event.classifications || []
    };

    // Calculate taste match score
    const tasteScore = calculateTasteScore(processedEvent, userTaste);
    processedEvent.tasteScore = tasteScore;
    processedEvent.matchScore = tasteScore; // Will be updated by Phase 2 if enabled

    return processedEvent;
  } catch (error) {
    console.error(`Error processing event ${event.name}:`, error);
    return {
      id: event.id,
      name: event.name || 'Unnamed Event',
      source: event.source || 'unknown',
      ticketUrl: event.url || '', // FIXED: Even in error case
      date: event.date || 'Date TBA', // FIXED: Even in error case
      venue: 'Venue TBA', // FIXED: Even in error case
      tasteScore: 0,
      matchScore: 0, // FIXED: Even in error case
      error: error.message
    };
  }
}

/**
 * ENHANCED: Extract venues with better location handling
 */
function extractVenues(event) {
  const venues = [];

  if (event._embedded && event._embedded.venues) {
    event._embedded.venues.forEach(venue => {
      venues.push({
        name: venue.name || 'Unknown Venue',
        address: venue.address || {},
        city: venue.city || {},
        location: venue.location || {}
      });
    });
  }

  return venues;
}

/**
 * ENHANCED: Extract artists with better name handling
 */
function extractArtists(event) {
  const artists = [];

  if (event._embedded && event._embedded.attractions) {
    event._embedded.attractions.forEach(attraction => {
      if (attraction.name) {
        artists.push({
          name: attraction.name,
          id: attraction.id,
          genres: attraction.classifications ?
            attraction.classifications.map(c => c.genre?.name).filter(Boolean) : []
        });
      }
    });
  }

  return artists;
}

/**
 * ENHANCED: Extract genres with improved classification handling
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
 * FIXED: Calculate taste score with improved algorithm and debug logging
 */
function calculateTasteScore(event, userTaste) {
  console.log('🔍 calculateTasteScore called with userTaste:', userTaste ? 'valid object' : 'null');

  if (!userTaste || (!userTaste.genrePreferences && !userTaste.topGenres)) {
    console.log('❌ No taste data available, returning 50');
    return 50; // Default score when no taste data
  }

  let score = 0;
  let maxScore = 0;

  // Genre matching (60% weight)
  const genreWeight = 0.6;
  let genreScore = 0;

  if (event.genres && event.genres.length > 0) {
    const userGenres = userTaste.genrePreferences || userTaste.topGenres || [];
    console.log('🎵 User genres:', userGenres.length);
    console.log('🎪 Event genres:', event.genres);

    for (const userGenre of userGenres) {
      const genreName = userGenre.name || userGenre;
      const genreWeightValue = userGenre.weight || 1;

      for (const eventGenre of event.genres) {
        if (genreName.toLowerCase() === eventGenre.toLowerCase()) {
          genreScore += 100 * genreWeightValue; // Perfect match weighted
          console.log(`✅ Perfect match: ${genreName} = ${eventGenre} (weight: ${genreWeightValue})`);
        } else if (genreName.toLowerCase().includes(eventGenre.toLowerCase()) ||
                   eventGenre.toLowerCase().includes(genreName.toLowerCase())) {
          genreScore += 50 * genreWeightValue; // Partial match weighted
          console.log(`🔶 Partial match: ${genreName} ~ ${eventGenre} (weight: ${genreWeightValue})`);
        }
      }
    }
    genreScore = Math.min(genreScore, 100); // Cap at 100
    console.log(`🎯 Final genre score: ${genreScore}`);
  }

  score += genreScore * genreWeight;
  maxScore += 100 * genreWeight;

  // Artist matching (40% weight)
  const artistWeight = 0.4;
  let artistScore = 0;

  if (event.artists && event.artists.length > 0 && userTaste.topArtists) {
    console.log('🎤 User artists:', userTaste.topArtists.length);
    console.log('🎭 Event artists:', event.artists.map(a => a.name));

    for (const userArtist of userTaste.topArtists) {
      for (const eventArtist of event.artists) {
        if (userArtist.name.toLowerCase() === eventArtist.name.toLowerCase()) {
          artistScore += 100; // Perfect match
          console.log(`✅ Perfect artist match: ${userArtist.name} = ${eventArtist.name}`);
        } else if (userArtist.name.toLowerCase().includes(eventArtist.name.toLowerCase()) ||
                   eventArtist.name.toLowerCase().includes(userArtist.name.toLowerCase())) {
          artistScore += 30; // Partial match
          console.log(`🔶 Partial artist match: ${userArtist.name} ~ ${eventArtist.name}`);
        }
      }
    }
    artistScore = Math.min(artistScore, 100); // Cap at 100
    console.log(`🎯 Final artist score: ${artistScore}`);
  }

  score += artistScore * artistWeight;
  maxScore += 100 * artistWeight;

  // Calculate final percentage
  const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
  console.log(`🏆 Final taste score: ${finalScore}% (${score}/${maxScore})`);

  return Math.max(finalScore, 10); // Minimum 10% to avoid 0 scores
}

/**
 * ENHANCED: Deduplicate events by name + venue + date
 */
function deduplicateEvents(events) {
  const seen = new Set();
  const deduplicated = [];

  for (const event of events) {
    const key = `${event.name}_${event.venue || 'unknown'}_${event.date || 'unknown'}`;
    
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
  if (!userTaste) {
    console.log('⚠️ No user taste data, returning all events with default scores');
    return events.map(event => ({
      ...event,
      tasteScore: event.tasteScore || 50,
      matchScore: event.matchScore || event.tasteScore || 50 // FIXED: Ensure matchScore is set
    }));
  }

  // Sort by taste score (highest first)
  const sortedEvents = events.sort((a, b) => (b.tasteScore || 0) - (a.tasteScore || 0));

  // Return top events (limit to reasonable number)
  return sortedEvents.slice(0, 50);
}

