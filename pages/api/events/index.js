import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { connectToDatabase } from '../../../lib/mongodb';
import { getCachedData, setCachedData } from '../../../lib/cache';
import axios from 'axios';
const { enhancedRecommendationSystem } = require('../../../lib/enhancedRecommendationSystem');

// Import city request utilities (PRESERVED)
const { addCityRequest, isCountrySupported } = require('../../../lib/cityRequestQueue');

// ENHANCED: Import artist-based genre enhancement
const { AlternativeArtistRelationships } = require('../../../lib/alternativeArtistRelationships');

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
    const cacheDisabled = process.env.DISABLE_CACHE === 'true';
    const cachedEvents = !cacheDisabled ? await getCachedData(cacheKey, 'EVENTS') : null;

    if (!cacheDisabled && cachedEvents && !req.query.nocache) {
      console.log(`🚀 Cache hit - returning ${cachedEvents.length} cached personalized events`);
      return res.status(200).json({
        events: cachedEvents,
        total: cachedEvents.length,
        source: "cache",
        timestamp: new Date().toISOString(),
        location: { city, country, lat, lon }
      });
    }

    // CRITICAL FIX: Query the correct collection with Phase 1 metadata
    let realEvents = [];
    let apiError = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}: Fetching events from MongoDB events_unified collection...`);

        const { db } = await connectToDatabase();
        // CRITICAL FIX: Use events_unified collection instead of events
        const eventsCollection = db.collection('events_unified');

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
            $gte: new Date() // Today or later
          }
        };

        console.log(`📍 MongoDB query on events_unified: ${JSON.stringify(query, null, 2)}`);

        const data = await eventsCollection.find(query)
          .limit(50)
          .sort({ 'date': 1 })
          .toArray();

        if (data && data.length > 0) {
          console.log(`✅ Found ${data.length} events from MongoDB events_unified collection`);
          console.log(`🎵 Sample Phase 1 metadata check:`, {
            soundCharacteristics: !!data[0].soundCharacteristics,
            artistMetadata: !!data[0].artistMetadata,
            enhancedGenres: !!data[0].enhancedGenres,
            enhancementProcessed: data[0].enhancementProcessed
          });

          // ENHANCED: Convert MongoDB format to frontend-expected format with Phase 1 metadata preservation
          const formattedEvents = data.map(event => ({
            id: event._id || event.id,
            name: event.name,
            url: event.url,
            ticketUrl: event.url, // FIXED: Map url to ticketUrl for frontend
            source: 'mongodb_unified', // FIXED: Indicate unified collection source
            date: event.date, // FIXED: Map date directly for frontend
            dates: { start: { localDate: event.date } }, // Keep for API compatibility
            venue: event.venue?.name || 'Venue TBA', // FIXED: Map venue.name directly for frontend
            venues: event.venue ? [event.venue] : [], // Keep for API compatibility
            artists: event.artists ? event.artists.map(artist => ({ 
              name: artist.name || artist, 
              id: artist.id 
            })) : [],
            _embedded: {
              venues: event.venue ? [event.venue] : [],
              attractions: event.artists ? event.artists.map(artist => ({ 
                name: artist.name || artist, 
                id: artist.id 
              })) : []
            },
            classifications: event.classifications || [],
            priceRanges: event.priceRanges || [],
            images: event.images || [],
            
            // CRITICAL: Preserve Phase 1 metadata from backend
            soundCharacteristics: event.soundCharacteristics,
            artistMetadata: event.artistMetadata,
            enhancedGenres: event.enhancedGenres,
            enhancementProcessed: event.enhancementProcessed,
            
            // ENHANCED: Use existing tasteScore from backend if available
            tasteScore: event.recommendationMetrics?.tasteScore || 50,
            matchScore: event.recommendationMetrics?.tasteScore || 50
          }));

          // ENHANCED: Process events with Phase 1 metadata-aware scoring
          realEvents = await processEventsWithPhase1Scoring(formattedEvents, city, session);
          console.log(`✅ Successfully processed ${realEvents.length} events with Phase 1 metadata`);
          break; // Success, exit retry loop
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        apiError = error;
        if (attempt === 3) {
          console.error('🚨 All MongoDB events_unified attempts failed');
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
          
          realEvents = await processEventsWithPhase1Scoring(ticketmasterEvents, city, session);
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
    if (!cacheDisabled && realEvents.length > 0) {
      await setCachedData(cacheKey, realEvents, 'EVENTS');
      console.log(`💾 Cached ${realEvents.length} personalized events`);
    }

    // SUCCESS: Return personalized events with Phase 1 metadata
    console.log(`🎉 Returning ${realEvents.length} personalized events with Phase 1 metadata for ${city}`);

    res.status(200).json({
      events: realEvents,
      total: realEvents.length,
      source: "mongodb_unified_phase1",
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
 * ENHANCED: Process events with Phase 1 metadata-aware scoring
 */
async function processEventsWithPhase1Scoring(events, city, session) {
  console.log(`🎵 Processing ${events.length} events with Phase 1 metadata-aware scoring...`);

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
  const processedEvents = await Promise.all(events.map(event => processEventWithPhase1(event, city, userTaste)));

  // Step 3: Deduplicate events by name + venue + date
  const deduplicatedEvents = deduplicateEvents(processedEvents);
  console.log(`🔄 Deduplicated: ${events.length} → ${deduplicatedEvents.length} events`);

  // PHASE 1 ENHANCEMENT: Apply Phase 1 metadata-aware scoring
  let enhancedEvents = deduplicatedEvents;
  try {
    console.log('🚀 Applying Phase 1 metadata-aware scoring...');
    
    // Convert userTaste structure to match Phase 1 expectations
    if (userTaste && userTaste.genrePreferences) {
      userTaste.genres = userTaste.genrePreferences.map(pref => pref.name);
      console.log('🔧 Converted genrePreferences to genres for Phase 1 compatibility');
    }
    
    // Apply Phase 1 metadata-aware scoring
    enhancedEvents = await applyPhase1MetadataScoring(deduplicatedEvents, userTaste);
    
    console.log('✅ Phase 1 metadata-aware scoring applied successfully');
    console.log(`🎯 Sample Phase 1 scores: ${enhancedEvents.slice(0, 3).map(e => `${e.name}: ${e.personalizedScore}%`).join(', ')}`);
  } catch (error) {
    console.error('❌ Phase 1 metadata scoring failed, using original results:', error);
    // Continue with original results if Phase 1 fails
  }

  // Step 4: Apply taste-based filtering AFTER Phase 1 enhancement
  let filteredEvents = applyAdvancedTasteFiltering(enhancedEvents, userTaste);
  console.log(`🎯 Taste filtered: ${enhancedEvents.length} → ${filteredEvents.length} events`);

  return filteredEvents;
}

/**
 * FINAL FIX: Apply Phase 1 metadata-aware scoring with correct field mapping
 */
async function applyPhase1MetadataScoring(events, userTaste) {
  console.log(`🎵 Applying Phase 1 metadata scoring to ${events.length} events...`);
  
  const scoredEvents = events.map(event => {
    // Check if event has Phase 1 metadata
    const hasPhase1 = event.soundCharacteristics || event.artistMetadata || event.enhancedGenres;
    
    if (!hasPhase1) {
      console.log(`⚠️ Event ${event.name} missing Phase 1 metadata, using basic scoring`);
      return {
        ...event,
        personalizedScore: event.tasteScore || 50,
        recommendationScore: event.tasteScore || 50,
        score: event.tasteScore || 50,
        matchScore: event.tasteScore || 50, // Keep for backward compatibility
        phase1Applied: false
      };
    }
    
    // Calculate Phase 1 enhanced score
    let enhancedScore = 0;
    let totalWeight = 0;
    
    // Sound Characteristics Scoring (40% weight)
    if (event.soundCharacteristics && userTaste) {
      const soundScore = calculateSoundCharacteristicsScore(event.soundCharacteristics, userTaste);
      enhancedScore += soundScore * 0.4;
      totalWeight += 0.4;
      console.log(`🎵 Sound score for ${event.name}: ${soundScore}%`);
    }
    
    // Artist Metadata Scoring (35% weight)
    if (event.artistMetadata && userTaste) {
      const artistScore = calculateArtistMetadataScore(event.artistMetadata, userTaste);
      enhancedScore += artistScore * 0.35;
      totalWeight += 0.35;
      console.log(`👨‍🎤 Artist score for ${event.name}: ${artistScore}%`);
    }
    
    // Enhanced Genres Scoring (25% weight)
    if (event.enhancedGenres && userTaste) {
      const genreScore = calculateEnhancedGenreScore(event.enhancedGenres, userTaste);
      enhancedScore += genreScore * 0.25;
      totalWeight += 0.25;
      console.log(`🎼 Genre score for ${event.name}: ${genreScore}%`);
    }
    
    // Normalize score based on available metadata
    const finalScore = totalWeight > 0 ? Math.round(enhancedScore / totalWeight) : (event.tasteScore || 50);
    
    console.log(`🎯 Phase 1 enhanced score for ${event.name}: ${finalScore}% (weight: ${totalWeight})`);
    
    return {
      ...event,
      // CRITICAL FIX: Map to all expected field names
      personalizedScore: finalScore,
      recommendationScore: finalScore,
      score: finalScore,
      matchScore: finalScore, // Keep for backward compatibility
      phase1Applied: true,
      phase1Breakdown: {
        soundScore: event.soundCharacteristics ? calculateSoundCharacteristicsScore(event.soundCharacteristics, userTaste) : null,
        artistScore: event.artistMetadata ? calculateArtistMetadataScore(event.artistMetadata, userTaste) : null,
        genreScore: event.enhancedGenres ? calculateEnhancedGenreScore(event.enhancedGenres, userTaste) : null
      }
    };
  });
  
  console.log(`✅ Phase 1 metadata scoring complete. Average score: ${scoredEvents.reduce((sum, e) => sum + e.personalizedScore, 0) / scoredEvents.length}%`);
  
  return scoredEvents;
}

/**
 * NEW: Calculate sound characteristics score
 */
function calculateSoundCharacteristicsScore(soundCharacteristics, userTaste) {
  if (!soundCharacteristics || !userTaste) return 50;
  
  // For now, use a basic scoring algorithm
  // This can be enhanced with user's actual sound preferences
  let score = 50;
  
  // Boost score based on confidence
  if (soundCharacteristics.confidence > 0.7) {
    score += 20;
  } else if (soundCharacteristics.confidence > 0.5) {
    score += 10;
  }
  
  // Boost score for high energy electronic music (EDM preference)
  if (soundCharacteristics.energy > 0.7 && soundCharacteristics.danceability > 0.7) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

/**
 * NEW: Calculate artist metadata score
 */
function calculateArtistMetadataScore(artistMetadata, userTaste) {
  if (!artistMetadata || !userTaste) return 50;
  
  let score = 50;
  
  // Boost score based on EDM weight
  if (artistMetadata.edmWeight > 0.8) {
    score += 25;
  } else if (artistMetadata.edmWeight > 0.5) {
    score += 15;
  }
  
  // Boost score based on popularity (but not too much)
  if (artistMetadata.popularity > 70) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * NEW: Calculate enhanced genre score
 */
function calculateEnhancedGenreScore(enhancedGenres, userTaste) {
  if (!enhancedGenres || !userTaste || !userTaste.genres) return 50;
  
  let score = 50;
  
  // Check for genre matches
  if (enhancedGenres.primary) {
    for (const genre of enhancedGenres.primary) {
      if (userTaste.genres.some(userGenre => 
        userGenre.toLowerCase().includes(genre.toLowerCase()) ||
        genre.toLowerCase().includes(userGenre.toLowerCase())
      )) {
        score += 20;
        break;
      }
    }
  }
  
  // Boost for EDM classification
  if (enhancedGenres.edmClassification === 'core_edm') {
    score += 15;
  } else if (enhancedGenres.edmClassification === 'electronic_related') {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * ENHANCED: Process individual event with Phase 1 metadata preservation
 */
async function processEventWithPhase1(event, city, userTaste) {
  try {
    // Extract basic event information with FRONTEND FIELD MAPPING
    const processedEvent = {
      id: event.id,
      name: event.name || 'Unnamed Event',
      url: event.url || '',
      ticketUrl: event.url || '', // FIXED: Map url to ticketUrl for frontend
      source: event.source || 'unknown',
      date: event.date || event.dates?.start?.localDate, // FIXED: Map date for frontend
      dates: event.dates || {},
      venue: event.venue || event._embedded?.venues?.[0]?.name || 'Venue TBA', // FIXED: Map venue for frontend
      venues: extractVenues(event),
      artists: extractArtists(event),
      genres: await extractGenres(event), // ENHANCED: Now async for artist-based genre enhancement
      images: event.images || [],
      priceRanges: event.priceRanges || [],
      classifications: event.classifications || [],
      
      // CRITICAL: Preserve Phase 1 metadata
      soundCharacteristics: event.soundCharacteristics,
      artistMetadata: event.artistMetadata,
      enhancedGenres: event.enhancedGenres,
      enhancementProcessed: event.enhancementProcessed
    };

    // Calculate taste match score (will be enhanced by Phase 1 scoring later)
    const tasteScore = calculateTasteScore(processedEvent, userTaste);
    processedEvent.tasteScore = tasteScore;
    processedEvent.matchScore = tasteScore; // FIXED: Map tasteScore to matchScore for frontend

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
 * ENHANCED: Extract genres with artist-based enhancement for generic classifications
 */
async function extractGenres(event) {
  const genres = new Set();
  const genericGenres = ['dance/electronic', 'electronic', 'music', 'other', 'undefined'];

  // Step 1: Extract initial genres from classifications
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

  // Step 2: Extract genres from artist classifications
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

  const initialGenres = Array.from(genres);
  
  // Step 3: ENHANCED - Check if we have only generic genres
  const hasOnlyGenericGenres = initialGenres.length === 0 || 
    initialGenres.every(genre => genericGenres.includes(genre));

  // Step 4: ENHANCED - If generic genres, enhance with artist-based genres
  if (hasOnlyGenericGenres && event._embedded && event._embedded.attractions) {
    console.log('🎵 Generic genres detected, enhancing with artist-based genres...');
    
    try {
      const artistRelationships = new AlternativeArtistRelationships();
      const enhancedGenres = new Set();
      
      // Get genres from each artist
      for (const attraction of event._embedded.attractions) {
        if (attraction.name) {
          const artistGenres = await artistRelationships.inferGenresFromArtist(attraction.name);
          artistGenres.forEach(genre => enhancedGenres.add(genre.toLowerCase()));
          
          // Also try to get similar artists and their genres
          try {
            const similarArtists = await artistRelationships.getSimilarArtists(attraction.name, 2);
            similarArtists.forEach(similar => {
              if (similar.genres) {
                similar.genres.forEach(genre => enhancedGenres.add(genre.toLowerCase()));
              }
            });
          } catch (error) {
            console.log(`⚠️ Could not get similar artists for ${attraction.name}:`, error.message);
          }
        }
      }
      
      if (enhancedGenres.size > 0) {
        console.log('✅ Enhanced genres from artists:', Array.from(enhancedGenres));
        // Replace generic genres with enhanced ones
        genres.clear();
        enhancedGenres.forEach(genre => genres.add(genre));
      } else {
        console.log('⚠️ No enhanced genres found, keeping original genres');
      }
    } catch (error) {
      console.log('❌ Error enhancing genres with artist data:', error.message);
    }
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
      personalizedScore: event.personalizedScore || event.tasteScore || 50, // FIXED: Ensure personalizedScore is set
      recommendationScore: event.recommendationScore || event.tasteScore || 50,
      score: event.score || event.tasteScore || 50,
      matchScore: event.matchScore || event.tasteScore || 50
    }));
  }

  // Sort by personalized score (highest first) - now using Phase 1 enhanced scores
  const sortedEvents = events.sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));

  // Return top events (limit to reasonable number)
  return sortedEvents.slice(0, 50);
}

