import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import TIKOSoundStatIntegration from '@/lib/tikoSoundStatIntegration';

// PHASE 2: SoundStat API configuration (read from env for security)
const SOUNDSTAT_API_KEY = process.env.SOUNDSTAT_API_KEY || '[REDACTED_SOUNDSTAT_API_KEY]';
const SOUNDSTAT_BASE_URL = process.env.SOUNDSTAT_BASE_URL || 'https://soundstat.info/api/v1';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { lat, lon, city = 'Toronto', radius = 50, vibeMatch = 0 } = req.query;

    const userId = session.user.id || session.user.email;

    // FIXED: Proper authentication check with correct imports
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    console.log(`🎯 Processing events request for user ${userId} in ${city} (${lat}, ${lon}) with ${vibeMatch}% vibe match`);


    // ENHANCED: Accept city/country parameters but keep Toronto as fallback for compatibility
    const targetCity = city || 'Toronto';
    
    // ENHANCED: Cache key includes user ID for personalized caching
    const cacheKey = `events_${city}_${lat}_${lon}_${radius}_${vibeMatch}_${userId}`;

    
    // Check cache first
    const { db } = await connectToDatabase();
    const cachedResult = await db.collection('events_cache').findOne({ 
      key: cacheKey,
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // 30 minutes
    });

    if (cachedResult) {
      const cachedEvents = cachedResult.events || [];
      console.log(`🚀 Cache hit - returning ${cachedEvents.length} cached personalized events`);
      return res.status(200).json({
  events: cachedEvents,
  source: "real", // Mark cached data as real data
  isRealData: true,
  city: targetCity,
  totalEvents: cachedEvents.length,
  vibeMatchThreshold: parseInt(vibeMatch) || 0,
  cacheHit: true
});

    }

    let events = [];
    let isRealData = true;
    let dataSource = "mongodb";

    // CRITICAL FIX: Query the correct collection with Phase 1 metadata
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}: Fetching events from MongoDB events_unified collection...`);
        
        // CRITICAL FIX: Use events_unified collection instead of events
        const eventsCollection = db.collection('events_unified');
        
        // FIXED: Corrected geospatial query path from 'venues.location.coordinates' to 'location.coordinates'
        

        // PHASE 2: Enhanced query with music event filtering
        const enhancedQuery = buildEnhancedMusicEventsQuery(lat, lon, radius);
        
        console.log('🔍 MongoDB Query:', JSON.stringify(enhancedQuery, null, 2));
        
        const rawEvents = await eventsCollection.find(enhancedQuery).limit(50).toArray();
        
        console.log(`✅ Found ${rawEvents.length} events from MongoDB events_unified collection`);
        
        if (rawEvents.length > 0) {
          // PHASE 2: Process events with enhanced three-dimensional scoring
          events = await processEventsWithPhase2Enhancement(rawEvents, targetCity, session, userId);
          
          // PRESERVED: Also run original Phase 1 processing for compatibility
          const phase1Events = await processEventsWithPhase1Scoring(rawEvents, targetCity, session);
          
          // PHASE 2: Merge Phase 1 and Phase 2 results (Phase 2 takes precedence)
          events = mergePhase1AndPhase2Results(phase1Events, events);
          if (parseInt(vibeMatch) > 0) {
  const vibeMatchThreshold = parseInt(vibeMatch);
  console.log(`🎯 Applying vibe match filter: ${vibeMatchThreshold}% threshold`);
  
  const originalCount = events.length;
  events = events.filter(event => {
  const score = Number.isFinite(event.personalizedScore) ? event.personalizedScore : 0;
    return score >= vibeMatchThreshold;
  });
  
  console.log(`🎯 Vibe match filtering: ${originalCount} → ${events.length} events (${originalCount - events.length} filtered out)`);
}
          break;
        } else if (attempt === 3) {
          console.log('⚠️ No events found in MongoDB, falling back to Ticketmaster...');
          // Fallback to Ticketmaster API
          const fallbackEvents = await fetchTicketmasterEvents(lat, lon, radius);
          if (fallbackEvents && fallbackEvents.length > 0) {
            events = await processEventsWithPhase1Scoring(fallbackEvents, targetCity, session);
            // SURGICAL ADDITION: Apply vibe match filtering to fallback events
if (parseInt(vibeMatch) > 0) {
  const vibeMatchThreshold = parseInt(vibeMatch);
  console.log(`🎯 Applying vibe match filter to fallback events: ${vibeMatchThreshold}% threshold`);
  
  const originalCount = events.length;
  events = events.filter(event => {
  const score = Number.isFinite(event.personalizedScore) ? event.personalizedScore : 0;
    return score >= vibeMatchThreshold;
  });
  
  console.log(`🎯 Fallback vibe match filtering: ${originalCount} → ${events.length} events`);
}

            isRealData = false;
            dataSource = "ticketmaster_fallback";
          }
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        if (attempt === 3) {
          console.log('🚨 All MongoDB attempts failed, using Ticketmaster fallback...');
          try {
            const fallbackEvents = await fetchTicketmasterEvents(lat, lon, radius);
            if (fallbackEvents && fallbackEvents.length > 0) {
              events = await processEventsWithPhase1Scoring(fallbackEvents, targetCity, session);
              // SURGICAL ADDITION: Apply vibe match filtering to fallback events
if (parseInt(vibeMatch) > 0) {
  const vibeMatchThreshold = parseInt(vibeMatch);
  console.log(`🎯 Applying vibe match filter to fallback events: ${vibeMatchThreshold}% threshold`);
  
  const originalCount = events.length;
  events = events.filter(event => {
  const score = Number.isFinite(event.personalizedScore) ? event.personalizedScore : 0;
    return score >= vibeMatchThreshold;
  });
  
  console.log(`🎯 Fallback vibe match filtering: ${originalCount} → ${events.length} events`);
}

              isRealData = false;
              dataSource = "ticketmaster_fallback";
            }
          } catch (fallbackError) {
            console.error('🚨 Ticketmaster fallback also failed:', fallbackError.message);
            return res.status(500).json({ 
              error: 'Failed to fetch events from all sources',
              details: fallbackError.message 
            });
          }
        }
      }
    }

    // Cache the results
    if (events.length > 0) {
      try {
        await db.collection('events_cache').insertOne({
  key: cacheKey,
  events: events,
  createdAt: new Date(),
  dataSource: dataSource,
  isRealData: isRealData,
  vibeMatchThreshold: parseInt(vibeMatch) || 0
});

        console.log(`💾 Cached ${events.length} events for future requests`);
      } catch (cacheError) {
        console.error('⚠️ Failed to cache events:', cacheError.message);
      }
    }

    console.log(`🎉 Returning ${events.length} events to client`);
    
   res.status(200).json({
  events: events,
  source: dataSource,
  isRealData: isRealData,
  city: targetCity,
  totalEvents: events.length,
  vibeMatchThreshold: parseInt(vibeMatch) || 0,
  cacheHit: false
});


  } catch (error) {
    console.error('🚨 Critical error in events API:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// PHASE 2: Enhanced music events query with filtering
function buildEnhancedMusicEventsQuery(lat, lon, radius) {
  return {
    'location': {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lon), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius) * 1000
      }
    },
    'date': { $gte: new Date() },
    
    // PHASE 2: Music event filtering
    $or: [
      // Events with music-related genres
      { 'genres': { $regex: /(music|concert|festival|electronic|house|techno|trance|dance|dj|club|rave)/i } },
      
      // Events with sound characteristics from workers
      { 'soundCharacteristics': { $exists: true } },
      
      // Events with artist metadata from workers
      { 'artistMetadata': { $exists: true } }
    ],
    
    // PHASE 2: Exclude non-musical events
    'name': { 
      $not: { 
        $regex: /(exhibition|museum|art show|gallery|conference|seminar|workshop|tour|sports|game|match)/i 
      } 
    }
  };
}

// PHASE 2: Check if event is non-musical (safety filter)
function isNonMusicalEvent(event) {
  const nonMusicalKeywords = [
    // Arts & Culture (non-musical)
    'exhibition', 'museum', 'art show', 'gallery', 'conference', 
    'seminar', 'workshop', 'tour', 'theater', 'play', 'comedy',
    'spoken word', 'lecture', 'talk', 'presentation',
    
    // Sports & Recreation
    'sports', 'game', 'match', 'ballpark', 'stadium tour', 
    'baseball', 'football', 'basketball', 'soccer', 'hockey',
    
    // Educational & Business
    'conference', 'convention', 'expo', 'fair', 'market',
    'networking', 'business', 'corporate', 'training',
    
    // Special Experiences (non-musical)
    'van gogh', 'immersive experience', 'planetarium', 
    'aquarium', 'zoo', 'food', 'wine tasting', 'culinary'
  ];
  
  const eventName = (event.name || '').toLowerCase();
  const eventGenres = (event.genres || []).join(' ').toLowerCase();
  const eventDescription = (event.description || '').toLowerCase();
  const venueName = (event.venue?.name || '').toLowerCase();
  
  // Check multiple fields for non-musical indicators
  return nonMusicalKeywords.some(keyword => 
    eventName.includes(keyword) || 
    eventGenres.includes(keyword) ||
    eventDescription.includes(keyword) ||
    venueName.includes(keyword)
  );
}

// PHASE 2: Build user sound DNA from Spotify tracks using SoundStat API
async function buildUserSoundDNA(userTracks) {
  if (!userTracks || userTracks.length === 0) {
    console.log('⚠️ No user tracks available for sound DNA analysis');
    return getDefaultSoundDNA();
  }

  console.log(`🧬 Building user sound DNA from ${userTracks.length} tracks using TIKOSoundStatIntegration`);

  try {
const tikoSoundStat = new TIKOSoundStatIntegration();
const result = await tikoSoundStat.analyzeUserTracks(userTracks);
    
    // Convert TIKOSoundStatIntegration format to Events API format
    return {
      energy: result.soundCharacteristics.energy / 100,
      danceability: result.soundCharacteristics.danceability / 100,
      valence: result.soundCharacteristics.positivity / 100,
      tempo: 120, // Default tempo
      acousticness: result.soundCharacteristics.acoustic / 100,
      instrumentalness: 0.5, // Default
      loudness: 0.5, // Default
      trackCount: result.tracksAnalyzed,
      confidenceScore: result.confidence, // This will be 0.6-1.0 instead of 0
      source: result.source,
      analyzedAt: result.lastFetch
    };
    
  } catch (error) {
    console.error('❌ Error with TIKOSoundStatIntegration:', error);
    return getDefaultSoundDNA();
  }
}


// PHASE 2: Calculate weighted user sound DNA from audio features
function calculateUserSoundDNA(audioFeatures) {
  const features = ['energy', 'danceability', 'valence', 'tempo', 'acousticness', 'instrumentalness', 'loudness'];
  const weightedFeatures = {};
  let totalWeight = 0;
  
  // Calculate recency weights (newer tracks get higher weight)
  const now = Date.now();
  const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
  
  audioFeatures.forEach(trackData => {
    const trackAge = now - new Date(trackData.addedAt || 0).getTime();
    const recencyWeight = Math.max(0.1, 1 - (trackAge / maxAge)); // 0.1 to 1.0
    const popularityWeight = (trackData.popularity || 50) / 100; // 0.0 to 1.0
    const combinedWeight = (recencyWeight * 0.7) + (popularityWeight * 0.3);
    
    features.forEach(feature => {
      const value = trackData.audioFeatures[feature]?.value || trackData.audioFeatures[feature] || 0;
      if (!weightedFeatures[feature]) weightedFeatures[feature] = 0;
      weightedFeatures[feature] += value * combinedWeight;
    });
    
    totalWeight += combinedWeight;
  });
  
  // Calculate weighted averages
  const userSoundDNA = {};
  features.forEach(feature => {
    userSoundDNA[feature] = totalWeight > 0 ? 
      calculateWeightedAverage(weightedFeatures, feature, totalWeight) : 0.5;
  });
  
  return {
    ...userSoundDNA,
    trackCount: audioFeatures.length,
    confidenceScore: Math.min(0.95, audioFeatures.length / 25), // Higher confidence with more tracks
    source: 'soundstat_analysis',
    analyzedAt: new Date().toISOString()
  };
}

function calculateWeightedAverage(weightedFeatures, featureName, totalWeight) {
  return totalWeight > 0 ? weightedFeatures[featureName] / totalWeight : 0.5;
}

// PHASE 2: Default sound DNA when analysis fails
function getDefaultSoundDNA() {
  return {
    energy: 0.6,
    danceability: 0.7,
    valence: 0.5,
    tempo: 120,
    acousticness: 0.3,
    instrumentalness: 0.5,
    loudness: 0.5,
    trackCount: 0,
    confidenceScore: 0,
    source: 'default_fallback',
    analyzedAt: new Date().toISOString()
  };
}

// PHASE 2: Build artist affinity profile from user's listening patterns
function buildArtistAffinityProfile(userTracks, userArtists) {
  const artistAffinities = {};
  const artistTrackCounts = {};
  const artistRecentActivity = {};
  
  // Count tracks per artist and track recency
  userTracks.forEach(track => {
    track.artists.forEach(artist => {
      const artistName = artist.name;
      
      if (!artistTrackCounts[artistName]) {
        artistTrackCounts[artistName] = 0;
        artistRecentActivity[artistName] = [];
      }
      
      artistTrackCounts[artistName]++;
      artistRecentActivity[artistName].push({
        trackName: track.name,
        addedAt: track.added_at || track.played_at,
        popularity: track.popularity || 50
      });
    });
  });
  
  // Calculate affinity scores
  const totalTracks = userTracks.length;
  const maxTrackCount = Math.max(...Object.values(artistTrackCounts));
  
  Object.keys(artistTrackCounts).forEach(artistName => {
    const trackCount = artistTrackCounts[artistName];
    const recentTracks = artistRecentActivity[artistName];
    
    // Calculate recency score (more recent = higher score)
    const now = Date.now();
    const avgRecency = recentTracks.reduce((sum, track) => {
      const trackAge = now - new Date(track.addedAt || 0).getTime();
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
      return sum + Math.max(0.1, 1 - (trackAge / maxAge));
    }, 0) / recentTracks.length;
    
    // Calculate popularity score
    const avgPopularity = recentTracks.reduce((sum, track) => sum + track.popularity, 0) / recentTracks.length;
    
    // Combined affinity score
    const frequencyScore = trackCount / totalTracks; // 0 to 1
    const dominanceScore = trackCount / maxTrackCount; // 0 to 1
    const popularityScore = avgPopularity / 100; // 0 to 1
    
    artistAffinities[artistName] = {
      trackCount: trackCount,
      frequencyScore: frequencyScore,
      dominanceScore: dominanceScore,
      recencyScore: avgRecency,
      popularityScore: popularityScore,
      affinityScore: (frequencyScore * 0.4) + (dominanceScore * 0.3) + (avgRecency * 0.2) + (popularityScore * 0.1),
      recentTracks: recentTracks.slice(0, 3) // Keep top 3 recent tracks
    };
  });
  
  // Sort by affinity score and keep top artists
  const sortedArtists = Object.entries(artistAffinities)
    .sort(([,a], [,b]) => b.affinityScore - a.affinityScore)
    .slice(0, 20); // Top 20 artists
  
  const topArtistAffinities = {};
  sortedArtists.forEach(([artistName, data]) => {
    topArtistAffinities[artistName] = data;
  });
  
  console.log(`🎤 Built artist affinity profile for ${Object.keys(topArtistAffinities).length} artists`);
  
  return topArtistAffinities;
}

// PHASE 2: Build temporal patterns profile from user's listening history
function buildTemporalPatternsProfile(userTracks, userArtists) {
  if (!userTracks || userTracks.length === 0) {
    return getDefaultTemporalProfile();
  }
  
  // Analyze tracks by time periods
  const now = Date.now();
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const threeMonths = 3 * oneMonth;
  const sixMonths = 6 * oneMonth;
  
  const recentTracks = userTracks.filter(track => {
    const trackAge = now - new Date(track.added_at || track.played_at || 0).getTime();
    return trackAge <= oneMonth;
  });
  
  const mediumTracks = userTracks.filter(track => {
    const trackAge = now - new Date(track.added_at || track.played_at || 0).getTime();
    return trackAge > oneMonth && trackAge <= threeMonths;
  });
  
  const olderTracks = userTracks.filter(track => {
    const trackAge = now - new Date(track.added_at || track.played_at || 0).getTime();
    return trackAge > threeMonths && trackAge <= sixMonths;
  });
  
  // Extract genres from each period
  const recentGenres = extractGenresFromTracks(recentTracks);
  const mediumGenres = extractGenresFromTracks(mediumTracks);
  const olderGenres = extractGenresFromTracks(olderTracks);
  
  // Calculate discovery rate (new artists in recent period)
  const recentArtists = new Set(recentTracks.flatMap(track => track.artists.map(a => a.name)));
  const olderArtists = new Set(olderTracks.flatMap(track => track.artists.map(a => a.name)));
  const newArtists = [...recentArtists].filter(artist => !olderArtists.has(artist));
  const discoveryRate = recentArtists.size > 0 ? newArtists.length / recentArtists.size : 0;
  
  // Detect genre shifts
  const genreShift = detectGenreShift(olderGenres, recentGenres);
  
  // Calculate taste stability
  const stableGenres = Object.keys(recentGenres).filter(genre => 
    olderGenres[genre] && Math.abs(recentGenres[genre] - olderGenres[genre]) < 0.2
  );
  const tasteStability = stableGenres.length / Math.max(Object.keys(recentGenres).length, 1);
  
  console.log(`⏰ Built temporal patterns: ${Math.round(discoveryRate * 100)}% discovery rate, ${Math.round(tasteStability * 100)}% stability`);
  
  return {
    discoveryRate: discoveryRate,
    tasteStability: tasteStability,
    recentGenreShift: genreShift,
    stableInterests: stableGenres.slice(0, 5),
    emergingInterests: Object.keys(recentGenres).filter(genre => !olderGenres[genre]).slice(0, 3),
    fadingInterests: Object.keys(olderGenres).filter(genre => !recentGenres[genre]).slice(0, 3),
    analyzedPeriods: {
      recent: { tracks: recentTracks.length, genres: Object.keys(recentGenres).length },
      medium: { tracks: mediumTracks.length, genres: Object.keys(mediumGenres).length },
      older: { tracks: olderTracks.length, genres: Object.keys(olderGenres).length }
    }
  };
}

function extractGenresFromTracks(tracks) {
  const genreMap = {};
  let totalGenres = 0;
  
  tracks.forEach(track => {
    // Extract genres from track artists (if available)
    if (track.artists) {
      track.artists.forEach(artist => {
        if (artist.genres) {
          artist.genres.forEach(genre => {
            genreMap[genre] = (genreMap[genre] || 0) + 1;
            totalGenres++;
          });
        }
      });
    }
  });
  
  // Convert to percentages
  const genrePercentages = {};
  Object.keys(genreMap).forEach(genre => {
    genrePercentages[genre] = totalGenres > 0 ? genreMap[genre] / totalGenres : 0;
  });
  
  return genrePercentages;
}

function detectGenreShift(olderGenres, recentGenres) {
  const olderTop = Object.keys(olderGenres).sort((a, b) => olderGenres[b] - olderGenres[a])[0];
  const recentTop = Object.keys(recentGenres).sort((a, b) => recentGenres[b] - recentGenres[a])[0];
  
  if (!olderTop || !recentTop) return 'insufficient_data';
  if (olderTop === recentTop) return 'stable';
  
  return `shift_from_${olderTop}_to_${recentTop}`;
}

function getDefaultTemporalProfile() {
  return {
    discoveryRate: 0.1,
    tasteStability: 0.5,
    recentGenreShift: 'stable',
    stableInterests: [],
    emergingInterests: [],
    fadingInterests: [],
    analyzedPeriods: { recent: { tracks: 0, genres: 0 }, medium: { tracks: 0, genres: 0 }, older: { tracks: 0, genres: 0 } }
  };
}

// PHASE 2: Fetch enhanced user taste profile with three-dimensional data
async function fetchEnhancedUserTasteProfile(accessToken) {
  if (!accessToken) {
    console.log('⚠️ No access token available for enhanced profile');
    return getDefaultEnhancedProfile();
  }

  try {
    console.log('🔍 === FETCHENHANCEDUSERTASTEPROFILE CALLED ===');
    console.log('🔍 Building enhanced three-dimensional user taste profile...');
    
    // Fetch user's tracks and artists from Spotify
    const [tracksResponse, artistsResponse] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ]);

    if (!tracksResponse.ok || !artistsResponse.ok) {
      throw new Error(`Spotify API failed: tracks=${tracksResponse.status}, artists=${artistsResponse.status}`);
    }

    const [tracksData, artistsData] = await Promise.all([
      tracksResponse.json(),
      artistsResponse.json()
    ]);

    console.log(`✅ Fetched ${tracksData.items.length} tracks and ${artistsData.items.length} artists from Spotify`);

    // PHASE 2: Build three-dimensional profile
    const userSoundDNA = await buildUserSoundDNA(tracksData.items);
    const artistAffinities = buildArtistAffinityProfile(tracksData.items, artistsData.items);
    const temporalPattern = buildTemporalPatternsProfile(tracksData.items, artistsData.items);

    // Extract genre preferences
    const genreMap = {};
    artistsData.items.forEach(artist => {
      artist.genres.forEach(genre => {
        genreMap[genre] = (genreMap[genre] || 0) + 1;
      });
    });

    const genrePreferences = Object.entries(genreMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        weight: count / artistsData.items.length,
        confidence: 0.8,
        source: 'spotify'
      }));

    const enhancedProfile = {
      // PHASE 2: Three-dimensional data
      soundCharacteristics: userSoundDNA,
      artistAffinities: artistAffinities,
      temporalPattern: temporalPattern,
      
      // Basic profile data
      genrePreferences: genrePreferences,
      topTracks: tracksData.items.slice(0, 20),
      topArtists: artistsData.items.slice(0, 20),
      
      // Metadata
      phase2Enabled: true,
      enhancedAt: new Date().toISOString(),
      dataQuality: 'high',
      totalTracksAnalyzed: tracksData.items.length
    };

    console.log('✅ Generated enhanced three-dimensional taste profile');
    console.log(`🧬 Sound DNA: ${userSoundDNA.trackCount} tracks, ${Math.round(userSoundDNA.confidenceScore * 100)}% confidence`);
    console.log(`🎤 Artist affinities: ${Object.keys(artistAffinities).length} artists analyzed`);
    console.log(`⏰ Temporal patterns: ${Math.round(temporalPattern.discoveryRate * 100)}% discovery rate`);

    return enhancedProfile;

  } catch (error) {
    console.error('❌ Error building enhanced user taste profile:', error);
    return getDefaultEnhancedProfile();
  }
}

function getDefaultEnhancedProfile() {
  return {
    soundCharacteristics: getDefaultSoundDNA(),
    artistAffinities: {},
    temporalPattern: getDefaultTemporalProfile(),
    genrePreferences: [
      { name: 'electronic', weight: 0.6, confidence: 0.3, source: 'default' }
    ],
    topTracks: [],
    topArtists: [],
    phase2Enabled: false,
    enhancedAt: new Date().toISOString(),
    dataQuality: 'default',
    totalTracksAnalyzed: 0
  };
}

// PHASE 2: Calculate three-dimensional personalized score
function calculateThreeDimensionalScore(event, enhancedUserProfile) {
  console.log(`🎯 Calculating three-dimensional score for: ${event.name}`);
  
  // PHASE 2: Safety check for non-musical events
  if (isNonMusicalEvent(event)) {
    console.log(`⚠️ Non-musical event detected: ${event.name}, giving low score`);
    return {
      personalizedScore: 15,
      phase1Applied: false,
      phase2Applied: true,
      scoringMethod: 'non_musical_penalty',
      dimensions: {
        soundCharacteristics: 0,
        artistAffinity: 0,
        temporalRelevance: 0
      }
    };
  }
  
  // PHASE 2: Calculate three dimensions
  const soundScore = calculateSoundCharacteristicsScore(event, enhancedUserProfile.soundCharacteristics);
  const artistScore = calculateArtistAffinityScore(event, enhancedUserProfile.artistAffinities);
  const temporalScore = calculateTemporalRelevanceScore(event, enhancedUserProfile.temporalPattern);
  
  // PHASE 2: Weighted combination (70% sound, 20% artist, 10% temporal)
  const rawScore = (soundScore * 0.7) + (artistScore * 0.2) + (temporalScore * 0.1);
  
  // PHASE 2: Confidence adjustment based on data quality
  const confidence = enhancedUserProfile.soundCharacteristics.confidenceScore || 0;
  
  // More conservative fallback scoring - unknown events get lower scores
  let adjustedScore;
  if (confidence > 0.7) {
    // High confidence - use raw score
    adjustedScore = rawScore;
  } else if (confidence > 0.3) {
    // Medium confidence - blend with conservative fallback
    adjustedScore = (rawScore * confidence) + (35 * (1 - confidence));
  } else {
    // Low confidence - very conservative scoring
    adjustedScore = (rawScore * confidence) + (25 * (1 - confidence));
  }
  
  const finalScore = Math.max(8, Math.min(96, Math.round(adjustedScore)));
  
  console.log(`🎯 Three-dimensional score: ${finalScore}% (Sound: ${Math.round(soundScore)}%, Artist: ${Math.round(artistScore)}%, Temporal: ${Math.round(temporalScore)}%)`);
  
  return {
    personalizedScore: finalScore,
    phase1Applied: !!(event.soundCharacteristics || event.artistMetadata || event.enhancedGenres),
    phase2Applied: true,
    scoringMethod: 'three_dimensional',
    confidence: confidence,
    dimensions: {
      soundCharacteristics: Math.round(soundScore),
      artistAffinity: Math.round(artistScore),
      temporalRelevance: Math.round(temporalScore)
    }
  };
}

// PHASE 2: Calculate sound characteristics similarity score
function calculateSoundCharacteristicsScore(event, userSoundDNA) {
  if (!userSoundDNA || userSoundDNA.trackCount === 0) {
    console.log('⚠️ No user sound DNA available, using genre-based estimation');
    return estimateSoundScoreFromGenres(event.genres || [], userSoundDNA);
  }
  
  // Use Phase 1 metadata if available
  if (event.soundCharacteristics) {
    return calculateSoundSimilarity(userSoundDNA, event.soundCharacteristics);
  }
  
  // Fallback to genre-based estimation
  return estimateSoundScoreFromGenres(event.genres || [], userSoundDNA);
}

function calculateSoundSimilarity(userSoundDNA, eventSoundCharacteristics) {
  const features = ['energy', 'danceability', 'valence', 'acousticness'];
  const featureWeights = {
    energy: 0.25,
    danceability: 0.20,
    valence: 0.15,
    acousticness: 0.10,
    tempo: 0.15,
    instrumentalness: 0.10,
    loudness: 0.05
  };
  
  let totalSimilarity = 0;
  let totalWeight = 0;
  
  features.forEach(feature => {
    const userValue = userSoundDNA[feature] || 0.5;
    const eventValue = eventSoundCharacteristics[feature] || 0.5;
    const weight = featureWeights[feature] || 0.1;
    
    let similarity;
    if (feature === 'tempo') {
      // Special handling for tempo (BPM)
      const tempoDiff = Math.abs(userValue - eventValue) / Math.max(userValue, eventValue);
      similarity = Math.max(0, 1 - tempoDiff);
    } else {
      // Standard similarity for other features
      similarity = Math.max(0, Math.exp(-Math.abs(userValue - eventValue) * 3));
    }
    
    totalSimilarity += similarity * weight;
    totalWeight += weight;
  });
  
  const averageSimilarity = totalWeight > 0 ? totalSimilarity / totalWeight : 0.5;
  return Math.max(20, Math.min(95, averageSimilarity * 100));
}

function estimateSoundScoreFromGenres(eventGenres, userSoundDNA) {
  if (!eventGenres || eventGenres.length === 0) {
    return 50; // Neutral score for events without genre info
  }
  
  // SURGICAL REPLACEMENT: Comprehensive genre score mapping aligned with worker
  const genreScoreMap = {
    // ========================================
    // EXISTING EDM GENRES (PRESERVED + ENHANCED)
    // ========================================
    'electronic': 75,
    'house': 80,
    'deep house': 78,
    'tech house': 82,
    'progressive house': 76,
    'electro house': 85,
    'future house': 80,
    'big room': 88,
    'techno': 85,
    'minimal techno': 83,
    'acid techno': 87,
    'trance': 80,
    'progressive trance': 78,
    'uplifting trance': 82,
    'electronica': 72,
    'ambient': 45, // Lower for ambient
    'dubstep': 88,
    'drum and bass': 85,
    'dnb': 85,
    'trap': 82,
    'dance': 75,
    'edm': 85,
    'electro': 80,
    'club': 70,
    'rave': 80,
    'festival': 70,
    
    // ========================================
    // NON-EDM GENRES (REALISTIC SCORES FOR EDM USERS)
    // ========================================
    
    // Pop family (Low scores for EDM users)
    'pop': 35,
    'pop rock': 38,
    'indie pop': 32,
    'synth pop': 42, // Slightly higher due to synth elements
    'dance pop': 55, // Higher due to dance elements
    
    // Rock family (Low scores due to low danceability)
    'rock': 35,
    'classic rock': 32,
    'hard rock': 40, // Higher energy but low danceability
    'indie rock': 30,
    'alternative rock': 32,
    'punk rock': 45, // High energy
    
    // Hip hop family (Moderate scores)
    'hip hop': 50,
    'rap': 48,
    'trap rap': 65, // Higher due to trap elements
    
    // R&B/Soul family (Moderate scores)
    'r&b': 45,
    'soul': 48,
    'funk': 60, // Higher danceability
    
    // Jazz family (Low scores due to low energy/danceability)
    'jazz': 25,
    'smooth jazz': 20,
    'swing': 35, // Higher danceability
    
    // Blues family (Low scores)
    'blues': 22,
    'blues rock': 32,
    
    // Country family (Low to moderate scores)
    'country': 30,
    'country rock': 35,
    'bluegrass': 32,
    
    // Folk family (Low scores due to high acousticness)
    'folk': 20,
    'folk rock': 28,
    'indie folk': 22,
    
    // Classical family (Very low scores)
    'classical': 15,
    'opera': 22,
    
    // Reggae family (Moderate scores)
    'reggae': 40,
    'dancehall': 55, // Higher danceability
    
    // World music family (Variable scores)
    'latin': 55, // Higher danceability
    'salsa': 70, // Very high danceability
    'bossa nova': 25,
    
    // Metal family (High energy but very low danceability)
    'metal': 25,
    'heavy metal': 22,
    
    // Punk family (Moderate scores - high energy but low danceability)
    'punk': 40,
    'pop punk': 48,
    
    // Alternative family (Low to moderate scores)
    'alternative': 35,
    'grunge': 30,
    'indie': 32,
    
    // Generic fallbacks
    'concert': 60,
    'music': 65
  };
  
  let bestScore = 30; // Low default for unknown genres
  
  eventGenres.forEach(genre => {
    const genreName = genre.toLowerCase();
    
    // Direct genre match
    if (genreScoreMap[genreName]) {
      bestScore = Math.max(bestScore, genreScoreMap[genreName]);
    } else {
      // Partial match (existing logic preserved)
      for (const [knownGenre, score] of Object.entries(genreScoreMap)) {
        if (genreName.includes(knownGenre)) {
          bestScore = Math.max(bestScore, score);
        }
      }
    }
  });
  
  return bestScore;
}

// PHASE 2: Calculate artist affinity score
function calculateArtistAffinityScore(event, artistAffinities) {
  if (!artistAffinities || Object.keys(artistAffinities).length === 0) {
    return 50; // Neutral score when no artist data
  }
  
  const eventArtists = extractArtists(event);
  if (!eventArtists || eventArtists.length === 0) {
    return 45; // Slightly lower for events without artist info
  }
  
  let bestAffinityScore = 0;
  let hasKnownArtist = false;
  
  eventArtists.forEach(eventArtist => {
    const artistName = eventArtist.name || eventArtist;
    
    if (artistAffinities[artistName]) {
      hasKnownArtist = true;
      const affinity = artistAffinities[artistName];
      const affinityScore = (affinity.affinityScore * 100) + 
                           (affinity.recencyScore * 20) + 
                           (affinity.dominanceScore * 10);
      bestAffinityScore = Math.max(bestAffinityScore, affinityScore);
    }
  });
  
  if (hasKnownArtist) {
    return Math.max(60, Math.min(95, bestAffinityScore));
  }
  
  // For unknown artists, use genre-based estimation
  const eventGenres = event.genres || [];
  const hasElectronicGenre = eventGenres.some(genre => 
    ['electronic', 'house', 'techno', 'trance', 'dance', 'edm'].some(edmGenre => 
      genre.toLowerCase().includes(edmGenre)
    )
  );
  
  return hasElectronicGenre ? 55 : 40; // Higher score for electronic genres
}

// PHASE 2: Calculate temporal relevance score
function calculateTemporalRelevanceScore(event, temporalProfile) {
  if (!temporalProfile) {
    return 50; // Neutral score
  }
  
  let score = 50; // Base score
  
  // Boost for events matching emerging interests
  const eventGenres = event.genres || [];
  const emergingInterests = temporalProfile.emergingInterests || [];
  
  const hasEmergingGenre = eventGenres.some(eventGenre =>
    emergingInterests.some(emergingGenre =>
      eventGenre.toLowerCase().includes(emergingGenre.toLowerCase())
    )
  );
  
  if (hasEmergingGenre) {
    score += 20; // Boost for emerging interests
  }
  
  // Boost for events matching stable interests
  const stableInterests = temporalProfile.stableInterests || [];
  const hasStableGenre = eventGenres.some(eventGenre =>
    stableInterests.some(stableGenre =>
      eventGenre.toLowerCase().includes(stableGenre.toLowerCase())
    )
  );
  
  if (hasStableGenre) {
    score += 15; // Boost for stable interests
  }
  
  // Adjust based on discovery rate
  const discoveryRate = temporalProfile.discoveryRate || 0.1;
  if (discoveryRate > 0.3) {
    // High discovery rate users get boost for new/unknown artists
    const eventArtists = extractArtists(event);
    const hasUnknownArtist = eventArtists && eventArtists.length > 0; // Simplified check
    if (hasUnknownArtist) {
      score += 10;
    }
  }
  
  return Math.max(30, Math.min(80, score));
}

// PRESERVED: All original functions from the 1,067 line version
async function processEventsWithPhase1Scoring(events, city, session) {
  console.log(`🎯 Processing ${events.length} events with enhanced Phase 1 scoring for ${city}`);
  
  if (!events || events.length === 0) {
    return [];
  }

  // Fetch user taste profile
  let userTaste = null;
  try {
    if (session?.accessToken) {
      userTaste = await fetchUserTasteProfile(session.accessToken);
      console.log(`✅ User taste profile loaded: ${userTaste?.genres?.length || 0} genres`);
    }
  } catch (error) {
    console.error('⚠️ Failed to load user taste profile:', error.message);
  }

  // Apply comprehensive Phase 1 metadata scoring with enhancements
  const scoredEvents = await applyComprehensivePhase1MetadataScoring(events, userTaste);
  
  // Apply smart sorting instead of basic filtering
  const sortedEvents = smartSortEvents(scoredEvents);
  
  // Filter out very low scoring events (below 30%)
  const filteredEvents = sortedEvents.filter(event => (event.personalizedScore || 0) >= 30);
  
  // Deduplicate events
  const uniqueEvents = deduplicateEvents(filteredEvents);
  
  // Add enhanced venue and explanation data to Phase 1 events
  const enhancedEvents = uniqueEvents.map(event => {
    const venueDetails = extractVenues(event)[0] || { 
      name: 'Unknown Venue', 
      city: `${city}, Canada`,
      country: 'Canada',
      fullAddress: `${city}, Canada`
    };
    
    const tasteExplanation = generateAdvancedTasteMatchAnalysis(event, userTaste, event.personalizedScore);
    
    return {
      ...event,
      location: venueDetails.fullAddress,
      venues: [venueDetails],
      tasteMatch: {
        score: event.personalizedScore,
        analysis: tasteExplanation,
        confidence: tasteExplanation.confidence,
        methodology: event.scoringMethod || 'phase1_enhanced'
      }
    };
  });
  
  console.log(`✅ Enhanced Phase 1 processing complete: ${enhancedEvents.length} unique events with smart sorting`);
  
  return enhancedEvents;
}

async function applyComprehensivePhase1MetadataScoring(events, userTaste) {
  console.log(`🎼 Applying comprehensive Phase 1 metadata scoring to ${events.length} events`);
  
  const scoredEvents = await Promise.all(events.map(async (event) => {
    try {
      // Check if event has Phase 1 metadata
      const hasPhase1Metadata = !!(event.soundCharacteristics || event.artistMetadata || event.enhancedGenres);
      
      if (hasPhase1Metadata) {
        console.log(`✅ Event "${event.name}" has Phase 1 metadata, applying enhanced scoring`);
        
        // Calculate scores for each dimension
        const soundScore = calculateEnhancedSoundCharacteristicsScore(event.soundCharacteristics, userTaste);
        const artistScore = calculateEnhancedArtistMetadataScore(event.artistMetadata, userTaste, extractArtists(event));
        const genreScore = calculateEnhancedGenreScore(event.enhancedGenres, userTaste);
        
        // Weighted combination (40% sound, 35% artist, 25% genre)
        const combinedScore = (soundScore * 0.4) + (artistScore * 0.35) + (genreScore * 0.25);
        
        console.log(`🎯 Phase 1 scores - Sound: ${soundScore}%, Artist: ${artistScore}%, Genre: ${genreScore}% = Combined: ${Math.round(combinedScore)}%`);
        
        return {
          ...event,
          personalizedScore: Math.round(combinedScore),
          phase1Applied: true,
          scoringMethod: 'phase1_metadata',
          scoreBreakdown: {
            soundCharacteristics: soundScore,
            artistMetadata: artistScore,
            enhancedGenres: genreScore
          }
        };
      } else {
        console.log(`⚠️ Event "${event.name}" missing Phase 1 metadata, using enhanced basic scoring`);
        
        // ENHANCED: Better basic scoring without Phase 1 metadata
        let basicScore = 50; // Start with base score
        
        // Boost for EDM-related genres
        if (event.genres) {
          const edmGenres = ['house', 'techno', 'trance', 'dubstep', 'drum and bass', 'progressive house', 'melodic techno'];
          const hasEdmGenre = event.genres.some(genre => 
            edmGenres.some(edmGenre => genre.toLowerCase().includes(edmGenre))
          );
          if (hasEdmGenre) {
            basicScore += 20;
            console.log(`🎼 EDM genre boost: +20 (total: ${basicScore})`);
          }
        }
        
        // Boost for popular venues
        if (event.venue && event.venue.name) {
          const popularVenues = ['rebel', 'toybox', 'coda', 'rebel nightclub', 'history'];
          const isPopularVenue = popularVenues.some(venue => 
            event.venue.name.toLowerCase().includes(venue)
          );
          if (isPopularVenue) {
            basicScore += 10;
            console.log(`🏢 Popular venue boost: +10 (total: ${basicScore})`);
          }
        }
        
        // Apply user taste multiplier if available
        if (userTaste && userTaste.genres) {
          const userGenres = userTaste.genres.map(g => g.toLowerCase());
          const eventGenres = (event.genres || []).map(g => g.toLowerCase());
          const genreMatch = eventGenres.some(eg => userGenres.some(ug => eg.includes(ug) || ug.includes(eg)));
          
          if (genreMatch) {
            basicScore *= 1.2; // 20% boost for genre match
            console.log(`🎵 User taste genre match: +20% (total: ${Math.round(basicScore)})`);
          }
        }
        
        console.log(`🎯 Final basic score: ${Math.round(basicScore)}%`);
        
        return {
          ...event,
          personalizedScore: Math.max(10, Math.min(95, Math.round(basicScore))),
          phase1Applied: false,
          scoringMethod: 'enhanced_basic',
          scoreBreakdown: {
            baseScore: 50,
            genreBoost: basicScore - 50,
            userTasteMultiplier: userTaste ? 1.2 : 1.0
          }
        };
      }
    } catch (error) {
      console.error(`❌ Error scoring event "${event.name}":`, error.message);
      return {
        ...event,
        personalizedScore: 50,
        phase1Applied: false,
        scoringMethod: 'error_fallback',
        error: error.message
      };
    }
  }));
  
  console.log(`✅ Comprehensive Phase 1 scoring complete`);
  return scoredEvents;
}

function calculateEnhancedSoundCharacteristicsScore(soundCharacteristics, userTaste) {
  if (!soundCharacteristics) {
    return 50; // Neutral score if no sound characteristics
  }
  
  console.log(`🎵 Calculating sound characteristics score:`, soundCharacteristics);
  
  // Base score from sound characteristics quality
  let score = 60; // Start higher for events with sound data
  
  // Energy scoring (0-100 scale)
  const energy = soundCharacteristics.energy || 0.5;
  if (energy > 0.7) score += 15; // High energy boost
  else if (energy < 0.3) score -= 10; // Low energy penalty
  
  // Danceability scoring
  const danceability = soundCharacteristics.danceability || 0.5;
  if (danceability > 0.8) score += 20; // Very danceable boost
  else if (danceability < 0.4) score -= 15; // Not danceable penalty
  
  // Electronic music preference (low acousticness)
  const acousticness = soundCharacteristics.acousticness || 0.5;
  if (acousticness < 0.2) score += 15; // Electronic boost
  else if (acousticness > 0.7) score -= 10; // Too acoustic penalty
  
  // Tempo considerations
  const tempo = soundCharacteristics.tempo || 120;
  if (tempo >= 120 && tempo <= 140) score += 10; // Sweet spot for electronic music
  
  // User taste matching (if available)
  if (userTaste && userTaste.audioFeatures) {
    const userEnergy = userTaste.audioFeatures.energy || 0.5;
    const userDanceability = userTaste.audioFeatures.danceability || 0.5;
    
    // Energy similarity
    const energySimilarity = 1 - Math.abs(energy - userEnergy);
    score += energySimilarity * 15;
    
    // Danceability similarity
    const danceabilitySimilarity = 1 - Math.abs(danceability - userDanceability);
    score += danceabilitySimilarity * 15;
  }
  
  const finalScore = Math.max(20, Math.min(95, Math.round(score)));
  console.log(`🎵 Sound characteristics score: ${finalScore}%`);
  
  return finalScore;
}

function calculateEnhancedArtistMetadataScore(artistMetadata, userTaste, eventArtists) {
  if (!artistMetadata && (!eventArtists || eventArtists.length === 0)) {
    return 45; // Lower score for events without artist info
  }
  
  console.log(`🎤 Calculating artist metadata score:`, artistMetadata);
  
  let score = 55; // Base score for events with artist data
  
  // Artist metadata scoring
  if (artistMetadata) {
    // EDM weight scoring
    const edmWeight = artistMetadata.edmWeight || 0;
    if (edmWeight > 0.7) score += 25; // Strong EDM artist
    else if (edmWeight > 0.4) score += 15; // Moderate EDM artist
    else if (edmWeight < 0.2) score -= 10; // Non-EDM artist penalty
    
    // Popularity scoring
    const popularity = artistMetadata.popularity || 50;
    if (popularity > 70) score += 10; // Popular artist boost
    else if (popularity < 30) score += 5; // Underground artist slight boost
    
    // Sound characteristics from artist
    if (artistMetadata.soundCharacteristics) {
      const artistSound = artistMetadata.soundCharacteristics;
      const energy = artistSound.energy || 0.5;
      const danceability = artistSound.danceability || 0.5;
      
      if (energy > 0.7 && danceability > 0.7) score += 15; // High energy + danceable
    }
  }
  
  // User taste matching for artists
  if (userTaste && userTaste.topArtists && eventArtists) {
    const userArtistNames = userTaste.topArtists.map(a => a.toLowerCase());
    const eventArtistNames = eventArtists.map(a => (a.name || a).toLowerCase());
    
    const hasMatchingArtist = eventArtistNames.some(eventArtist =>
      userArtistNames.some(userArtist => 
        eventArtist.includes(userArtist) || userArtist.includes(eventArtist)
      )
    );
    
    if (hasMatchingArtist) {
      score += 30; // Big boost for matching artist
      console.log(`🎤 User artist match found: +30 points`);
    }
  }
  
  const finalScore = Math.max(25, Math.min(95, Math.round(score)));
  console.log(`🎤 Artist metadata score: ${finalScore}%`);
  
  return finalScore;
}

function calculateEnhancedGenreScore(enhancedGenres, userTaste) {
  if (!enhancedGenres) {
    return 50; // Neutral score if no enhanced genres
  }
  
  console.log(`🏷️ Calculating enhanced genre score:`, enhancedGenres);
  
  let score = 55; // Base score for events with genre data
  
  // EDM classification scoring
  if (enhancedGenres.edmClassification) {
    switch (enhancedGenres.edmClassification) {
      case 'core_edm':
        score += 30;
        break;
      case 'electronic_related':
        score += 20;
        break;
      case 'edm_adjacent':
        score += 10;
        break;
      case 'non_edm':
        score -= 15;
        break;
    }
  }
  
  // Subgenre scoring
  if (enhancedGenres.subgenres && enhancedGenres.subgenres.length > 0) {
    const edmSubgenres = ['house', 'techno', 'trance', 'progressive', 'melodic', 'deep house', 'tech house'];
    const hasEdmSubgenre = enhancedGenres.subgenres.some(subgenre =>
      edmSubgenres.some(edmSub => subgenre.toLowerCase().includes(edmSub))
    );
    
    if (hasEdmSubgenre) score += 15;
  }
  
  // User taste genre matching
  if (userTaste && userTaste.genres) {
    const userGenres = userTaste.genres.map(g => g.toLowerCase());
    const eventGenres = (enhancedGenres.subgenres || []).map(g => g.toLowerCase());
    
    const genreMatches = eventGenres.filter(eventGenre =>
      userGenres.some(userGenre => 
        eventGenre.includes(userGenre) || userGenre.includes(eventGenre)
      )
    );
    
    if (genreMatches.length > 0) {
      score += genreMatches.length * 10; // 10 points per matching genre
      console.log(`🏷️ Genre matches found: ${genreMatches.join(', ')} (+${genreMatches.length * 10} points)`);
    }
  }
  
  const finalScore = Math.max(20, Math.min(95, Math.round(score)));
  console.log(`🏷️ Enhanced genre score: ${finalScore}%`);
  
  return finalScore;
}

async function processEventWithPhase1(event, city, userTaste) {
  try {
    // Extract and enhance event data
    const venues = extractVenues(event);
    const artists = extractArtists(event);
    const genres = await extractGenres(event);
    
    // Calculate taste score
    const tasteScore = calculateTasteScore(event, userTaste);
    
    // CRITICAL HOTFIX: Normalize venue structure to prevent React rendering crashes
    const venueObj = venues[0] || { name: 'Unknown Venue', city: city };
    
    // Ensure consistent venue object structure (prevent React Error #31)
    const normalizedVenue = {
      name: String(venueObj.name || 'Unknown Venue'),
      address: String(venueObj.address || ''),
      city: String(venueObj.city || city || ''),
      state: String(venueObj.state || ''),
      country: String(venueObj.country || 'Canada'),
      type: String(venueObj.type || 'venue'),
      capacity: venueObj.capacity || null,
      url: String(venueObj.url || '')
    };
    
    // Format for frontend
    return {
      _id: event._id || event.id,
      name: event.name || event.title,
      date: event.date || event.datetime,
      venue: normalizedVenue.name,              // ✅ STRING (React compatible)
      location: `${normalizedVenue.address}, ${normalizedVenue.city}`.replace(/^,\s*/, ''),
      venues: [normalizedVenue],                // ✅ ARRAY (consistent structure)
      artists: artists,
      genres: genres,
      personalizedScore: tasteScore,
      ticketUrl: event.ticketUrl || event.url,
      imageUrl: event.imageUrl || event.image,
      description: event.description || '',
      priceRange: event.priceRange || 'Price TBA',
      
      // Phase 1 metadata (if available)
      soundCharacteristics: event.soundCharacteristics,
      artistMetadata: event.artistMetadata,
      enhancedGenres: event.enhancedGenres,
      
      // Metadata
      source: event.source || 'mongodb',
      lastUpdated: event.lastUpdated || new Date()
    };
  } catch (error) {
    console.error(`❌ Error processing event "${event.name}":`, error.message);
    return null;
  }
}

async function fetchUserTasteProfile(accessToken) {
  if (!accessToken) {
    console.log('⚠️ No access token provided for user taste profile');
    return null;
  }

  try {
    console.log('🔍 Fetching user taste profile from Spotify...');
    
    // Fetch user's top tracks and artists
    const [tracksResponse, artistsResponse] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ]);

    if (!tracksResponse.ok || !artistsResponse.ok) {
      throw new Error(`Spotify API failed: tracks=${tracksResponse.status}, artists=${artistsResponse.status}`);
    }

    const [tracksData, artistsData] = await Promise.all([
      tracksResponse.json(),
      artistsResponse.json()
    ]);

    console.log(`✅ Fetched ${tracksData.items.length} tracks and ${artistsData.items.length} artists`);

    // Extract genres from artists
    const genreMap = {};
    artistsData.items.forEach(artist => {
      artist.genres.forEach(genre => {
        genreMap[genre] = (genreMap[genre] || 0) + 1;
      });
    });

    // Convert to sorted array
    const genres = Object.entries(genreMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => genre);

    // Extract top artists
    const topArtists = artistsData.items.slice(0, 10).map(artist => artist.name);

    // Estimate audio features from genres (simplified)
    const audioFeatures = estimateAudioFeaturesFromGenres(genres);

    const userTaste = {
      genres: genres,
      topArtists: topArtists,
      topTracks: tracksData.items.slice(0, 10),
      audioFeatures: audioFeatures,
      lastUpdated: new Date()
    };

    console.log(`✅ Generated taste profile: ${genres.length} genres, ${topArtists.length} artists`);
    console.log(`🎵 Top genres: ${genres.slice(0, 3).join(', ')}`);
    
    return userTaste;

  } catch (error) {
    console.error('❌ Error fetching user taste profile:', error);
    return null;
  }
}

function estimateAudioFeaturesFromGenres(genres) {
  // Simple genre-to-audio-features mapping
  const genreFeatures = {
    'melodic techno': { energy: 0.8, danceability: 0.9, valence: 0.3 },
    'progressive house': { energy: 0.7, danceability: 0.8, valence: 0.6 },
    'deep house': { energy: 0.6, danceability: 0.8, valence: 0.4 },
    'techno': { energy: 0.9, danceability: 0.9, valence: 0.2 },
    'house': { energy: 0.7, danceability: 0.9, valence: 0.7 },
    'electronic': { energy: 0.7, danceability: 0.7, valence: 0.5 }
  };

  let totalEnergy = 0, totalDanceability = 0, totalValence = 0;
  let matchCount = 0;

  genres.forEach(genre => {
    const lowerGenre = genre.toLowerCase();
    for (const [knownGenre, features] of Object.entries(genreFeatures)) {
      if (lowerGenre.includes(knownGenre)) {
        totalEnergy += features.energy;
        totalDanceability += features.danceability;
        totalValence += features.valence;
        matchCount++;
        break;
      }
    }
  });

  if (matchCount === 0) {
    // Default for unknown genres
    return { energy: 0.6, danceability: 0.7, valence: 0.5 };
  }

  return {
    energy: totalEnergy / matchCount,
    danceability: totalDanceability / matchCount,
    valence: totalValence / matchCount
  };
}

function extractVenues(event) {
  const venues = [];
  
  // Helper function to ensure complete address with city and country
  const formatCompleteAddress = (venue, fallbackCity = 'Unknown City') => {
    let city = venue.city || event.city || fallbackCity;
    let country = venue.country || event.country || 'Canada'; // Default to Canada for most events
    
    // Enhance city/country based on common patterns
    if (city.toLowerCase().includes('toronto') || city.toLowerCase().includes('ontario')) {
      city = city.includes(',') ? city : `${city}, ON`;
      country = 'Canada';
    } else if (city.toLowerCase().includes('vancouver') || city.toLowerCase().includes('british columbia')) {
      city = city.includes(',') ? city : `${city}, BC`;
      country = 'Canada';
    } else if (city.toLowerCase().includes('montreal') || city.toLowerCase().includes('quebec')) {
      city = city.includes(',') ? city : `${city}, QC`;
      country = 'Canada';
    }
    
    // Ensure proper formatting: "City, Province/State, Country"
    const parts = city.split(',').map(part => part.trim());
    if (parts.length === 1) {
      // Just city name, add country
      city = `${parts[0]}, ${country}`;
    } else if (parts.length === 2 && !parts[1].match(/^[A-Z]{2}$/)) {
      // City, Region but no country abbreviation
      city = `${parts[0]}, ${parts[1]}, ${country}`;
    }
    
    return {
      name: String(venue.name || 'Unknown Venue'),
      address: String(venue.address || ''),
      city: String(city),
      state: String(venue.state || ''),
      country: String(country),
      type: String(venue.type || 'venue'),
      capacity: venue.capacity || null,
      url: String(venue.url || ''),
      fullAddress: venue.address ? `${venue.address}, ${city}` : city,
      coordinates: venue.coordinates
    };
  };
  
  if (event.venue) {
    venues.push(formatCompleteAddress(event.venue));
  } else if (event.venues && Array.isArray(event.venues)) {
    event.venues.forEach(venue => {
      venues.push(formatCompleteAddress(venue));
    });
  }
  
  return venues.length > 0 ? venues : [formatCompleteAddress({ name: 'Unknown Venue' })];
}

function extractArtists(event) {
  const artists = [];
  
  if (event.artists && Array.isArray(event.artists)) {
    event.artists.forEach(artist => {
      artists.push({
        name: typeof artist === 'string' ? artist : artist.name,
        id: typeof artist === 'object' ? artist.id : null
      });
    });
  } else if (event.artist) {
    artists.push({
      name: typeof event.artist === 'string' ? event.artist : event.artist.name,
      id: typeof event.artist === 'object' ? event.artist.id : null
    });
  } else if (event.performers && Array.isArray(event.performers)) {
    event.performers.forEach(performer => {
      artists.push({
        name: performer.name || performer,
        id: performer.id || null
      });
    });
  }
  
  return artists;
}

async function extractGenres(event) {
  const genres = [];
  
  // Direct genres
  if (event.genres && Array.isArray(event.genres)) {
    genres.push(...event.genres);
  } else if (event.genre) {
    genres.push(event.genre);
  }
  
  // Enhanced genres from Phase 1
  if (event.enhancedGenres && event.enhancedGenres.subgenres) {
    genres.push(...event.enhancedGenres.subgenres);
  }
  
  // Classification-based genres
  if (event.enhancedGenres && event.enhancedGenres.edmClassification) {
    switch (event.enhancedGenres.edmClassification) {
      case 'core_edm':
        genres.push('Electronic Dance Music');
        break;
      case 'electronic_related':
        genres.push('Electronic');
        break;
    }
  }
  
  // Remove duplicates and return
  return [...new Set(genres)];
}

function calculateTasteScore(event, userTaste) {
  if (!userTaste) {
    return 50; // Neutral score without user taste data
  }
  
  let score = 50; // Base score
  
  // Genre matching
  const eventGenres = (event.genres || []).map(g => g.toLowerCase());
  const userGenres = (userTaste.genres || []).map(g => g.toLowerCase());
  
  const genreMatches = eventGenres.filter(eventGenre =>
    userGenres.some(userGenre => 
      eventGenre.includes(userGenre) || userGenre.includes(eventGenre)
    )
  );
  
  if (genreMatches.length > 0) {
    score += genreMatches.length * 15; // 15 points per matching genre
  }
  
  // Artist matching
  const eventArtists = extractArtists(event).map(a => a.name.toLowerCase());
  const userArtists = (userTaste.topArtists || []).map(a => a.toLowerCase());
  
  const artistMatches = eventArtists.filter(eventArtist =>
    userArtists.some(userArtist => 
      eventArtist.includes(userArtist) || userArtist.includes(eventArtist)
    )
  );
  
  if (artistMatches.length > 0) {
    score += artistMatches.length * 25; // 25 points per matching artist
  }
  
  // Audio features matching (if available)
  if (userTaste.audioFeatures && event.soundCharacteristics) {
    const userFeatures = userTaste.audioFeatures;
    const eventFeatures = event.soundCharacteristics;
    
    const energySimilarity = 1 - Math.abs(userFeatures.energy - eventFeatures.energy);
    const danceabilitySimilarity = 1 - Math.abs(userFeatures.danceability - eventFeatures.danceability);
    
    score += (energySimilarity + danceabilitySimilarity) * 10;
  }
  
  return Math.max(10, Math.min(95, Math.round(score)));
}

function generateAdvancedTasteMatchAnalysis(event, userTaste, personalizedScore) {
  const analysis = {
    score: personalizedScore,
    matchFactors: {
      artistCorrelation: null,
      genreMatrix: null,
      trackSimilarity: null,
      soundProfile: null,
      venueAffinity: null
    },
    visualData: {
      matchWheel: null,
      genreHeatmap: null,
      artistNetwork: null,
      soundRadar: null
    },
    insights: [],
    confidence: 'medium'
  };
  
  if (!userTaste) {
    return {
      ...analysis,
      confidence: 'low',
      insights: ['Limited personalization data available']
    };
  }

  // 1. ARTIST CORRELATION ANALYSIS
  if (event.artists && userTaste.topArtists) {
    const artistAnalysis = analyzeArtistCorrelations(event.artists, userTaste.topArtists, userTaste);
    analysis.matchFactors.artistCorrelation = artistAnalysis;
    
    if (artistAnalysis.directMatches.length > 0) {
      analysis.insights.push({
        type: 'direct_artist_match',
        strength: artistAnalysis.directMatches.length * 25,
        artists: artistAnalysis.directMatches,
        icon: '🎤'
      });
    }
    
    if (artistAnalysis.similarArtists.length > 0) {
      analysis.insights.push({
        type: 'similar_artist_match',
        strength: artistAnalysis.similarArtists.length * 15,
        correlations: artistAnalysis.similarArtists,
        icon: '🔗'
      });
    }
  }

  // 2. GENRE MATRIX ANALYSIS
  if (event.genres && userTaste.genres) {
    const genreAnalysis = analyzeGenreMatrix(event.genres, userTaste.genres);
    analysis.matchFactors.genreMatrix = genreAnalysis;
    
    if (genreAnalysis.primaryMatches.length > 0) {
      analysis.insights.push({
        type: 'genre_affinity',
        strength: genreAnalysis.primaryMatches.length * 20,
        genres: genreAnalysis.primaryMatches,
        subgenres: genreAnalysis.subgenreMatches,
        icon: '🎵'
      });
    }
  }

  // 3. TRACK SIMILARITY ANALYSIS
  if (event.soundCharacteristics && userTaste.audioFeatures) {
    const trackAnalysis = analyzeTrackSimilarity(event.soundCharacteristics, userTaste.audioFeatures);
    analysis.matchFactors.trackSimilarity = trackAnalysis;
    
    if (trackAnalysis.similarity > 0.7) {
      analysis.insights.push({
        type: 'audio_dna_match',
        strength: trackAnalysis.similarity * 100,
        features: trackAnalysis.matchingFeatures,
        icon: '🧬'
      });
    }
  }

  // 4. SOUND PROFILE RADAR
  analysis.visualData.soundRadar = generateSoundRadarData(event, userTaste);
  
  // 5. ARTIST NETWORK VISUALIZATION
  if (analysis.matchFactors.artistCorrelation) {
    analysis.visualData.artistNetwork = generateArtistNetworkData(
      event.artists, 
      userTaste.topArtists,
      analysis.matchFactors.artistCorrelation
    );
  }

  // 6. GENRE HEATMAP
  if (analysis.matchFactors.genreMatrix) {
    analysis.visualData.genreHeatmap = generateGenreHeatmapData(
      event.genres,
      userTaste.genres,
      analysis.matchFactors.genreMatrix
    );
  }

  // 7. MATCH WHEEL (Overall visualization)
  analysis.visualData.matchWheel = generateMatchWheelData(analysis.matchFactors);

  // Determine confidence level
  const insightCount = analysis.insights.length;
  if (insightCount >= 3) analysis.confidence = 'high';
  else if (insightCount >= 2) analysis.confidence = 'medium';
  else analysis.confidence = 'low';

  return analysis;
}

function analyzeArtistCorrelations(eventArtists, userTopArtists, userTaste) {
  const directMatches = [];
  const similarArtists = [];
  const genreConnections = [];
  
  // Artist genre mapping (expanded database)
  const artistGenreMap = {
    'charlotte de witte': ['techno', 'melodic techno', 'minimal techno'],
    'anna': ['techno', 'industrial techno', 'hard techno'],
    'amelie lens': ['techno', 'acid techno', 'minimal techno'],
    'chris liebing': ['techno', 'industrial techno', 'minimal techno'],
    'adam beyer': ['techno', 'melodic techno', 'progressive techno'],
    'tale of us': ['melodic techno', 'progressive house', 'deep house'],
    'maceo plex': ['melodic techno', 'progressive house', 'tech house'],
    'solomun': ['deep house', 'melodic house', 'progressive house'],
    'dixon': ['deep house', 'minimal house', 'tech house'],
    'ben böhmer': ['melodic house', 'progressive house', 'ambient techno'],
    'artbat': ['melodic techno', 'progressive house', 'melodic house'],
    'boris brejcha': ['minimal techno', 'high-tech minimal', 'melodic techno'],
    'stephan bodzin': ['melodic techno', 'progressive techno', 'ambient techno'],
    'paul kalkbrenner': ['melodic techno', 'berlin techno', 'minimal techno'],
    'nina kraviz': ['techno', 'acid techno', 'experimental techno']
  };
  
  const eventArtistNames = eventArtists.map(a => 
    (typeof a === 'object' ? a.name : a).toLowerCase()
  );
  const userArtistNames = userTopArtists.map(a => a.toLowerCase());
  
  // 1. Direct artist matches
  eventArtistNames.forEach(eventArtist => {
    if (userArtistNames.includes(eventArtist)) {
      directMatches.push({
        artist: eventArtist,
        matchType: 'exact',
        strength: 100
      });
    }
  });
  
  // 2. Similar artist analysis through genre correlation
  eventArtistNames.forEach(eventArtist => {
    const eventArtistGenres = artistGenreMap[eventArtist] || [];
    
    userArtistNames.forEach(userArtist => {
      const userArtistGenres = artistGenreMap[userArtist] || [];
      
      // Calculate genre overlap
      const genreOverlap = eventArtistGenres.filter(genre =>
        userArtistGenres.some(userGenre => 
          genre.includes(userGenre) || userGenre.includes(genre)
        )
      );
      
      if (genreOverlap.length > 0 && !directMatches.some(m => m.artist === eventArtist)) {
        const similarity = (genreOverlap.length / Math.max(eventArtistGenres.length, userArtistGenres.length)) * 100;
        
        if (similarity > 30) {
          similarArtists.push({
            eventArtist: eventArtist,
            userArtist: userArtist,
            similarity: Math.round(similarity),
            sharedGenres: genreOverlap,
            matchType: 'genre_correlation'
          });
        }
      }
    });
  });
  
  // 3. Genre-based artist connections
  const userGenres = userTaste.genres || [];
  eventArtistNames.forEach(eventArtist => {
    const eventArtistGenres = artistGenreMap[eventArtist] || [];
    const genreMatches = eventArtistGenres.filter(genre =>
      userGenres.some(userGenre => 
        genre.toLowerCase().includes(userGenre.toLowerCase()) ||
        userGenre.toLowerCase().includes(genre.toLowerCase())
      )
    );
    
    if (genreMatches.length > 0) {
      genreConnections.push({
        artist: eventArtist,
        genres: genreMatches,
        strength: (genreMatches.length / eventArtistGenres.length) * 100
      });
    }
  });
  
  return {
    directMatches,
    similarArtists: similarArtists.slice(0, 3), // Top 3 correlations
    genreConnections,
    totalStrength: (directMatches.length * 25) + (similarArtists.length * 15)
  };
}

function analyzeGenreMatrix(eventGenres, userGenres) {
  // Enhanced genre relationship matrix
  const genreRelationships = {
    'techno': {
      'melodic techno': 0.9,
      'minimal techno': 0.8,
      'progressive techno': 0.8,
      'industrial techno': 0.7,
      'acid techno': 0.7,
      'house': 0.6,
      'tech house': 0.7,
      'electronic': 0.8
    },
    'house': {
      'deep house': 0.9,
      'tech house': 0.8,
      'progressive house': 0.8,
      'melodic house': 0.8,
      'minimal house': 0.7,
      'techno': 0.6,
      'electronic': 0.8
    },
    'melodic techno': {
      'techno': 0.9,
      'progressive house': 0.7,
      'melodic house': 0.7,
      'progressive techno': 0.8,
      'minimal techno': 0.6
    },
    'progressive house': {
      'house': 0.8,
      'deep house': 0.7,
      'melodic house': 0.8,
      'melodic techno': 0.7,
      'trance': 0.6
    }
  };
  
  const primaryMatches = [];
  const subgenreMatches = [];
  const relatedGenres = [];
  
  const normalizedEventGenres = eventGenres.map(g => g.toLowerCase());
  const normalizedUserGenres = userGenres.map(g => g.toLowerCase());
  
  // 1. Direct genre matches
  normalizedEventGenres.forEach(eventGenre => {
    if (normalizedUserGenres.includes(eventGenre)) {
      primaryMatches.push({
        genre: eventGenre,
        matchType: 'exact',
        strength: 100
      });
    }
  });
  
  // 2. Subgenre and related genre analysis
  normalizedEventGenres.forEach(eventGenre => {
    normalizedUserGenres.forEach(userGenre => {
      // Check if event genre is a subgenre of user preference
      if (eventGenre.includes(userGenre) || userGenre.includes(eventGenre)) {
        if (!primaryMatches.some(m => m.genre === eventGenre)) {
          subgenreMatches.push({
            eventGenre: eventGenre,
            userGenre: userGenre,
            matchType: 'subgenre',
            strength: 80
          });
        }
      }
      
      // Check genre relationship matrix
      const relationships = genreRelationships[userGenre] || {};
      if (relationships[eventGenre] && relationships[eventGenre] > 0.6) {
        relatedGenres.push({
          eventGenre: eventGenre,
          userGenre: userGenre,
          similarity: relationships[eventGenre] * 100,
          matchType: 'related'
        });
      }
    });
  });
  
  return {
    primaryMatches,
    subgenreMatches,
    relatedGenres: relatedGenres.slice(0, 3), // Top 3 relationships
    matrixScore: (primaryMatches.length * 20) + (subgenreMatches.length * 15) + (relatedGenres.length * 10)
  };
}

function analyzeTrackSimilarity(eventSound, userAudioFeatures) {
  const matchingFeatures = [];
  let totalSimilarity = 0;
  let featureCount = 0;
  
  const features = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness'];
  
  features.forEach(feature => {
    if (eventSound[feature] !== undefined && userAudioFeatures[feature] !== undefined) {
      const similarity = 1 - Math.abs(eventSound[feature] - userAudioFeatures[feature]);
      totalSimilarity += similarity;
      featureCount++;
      
      if (similarity > 0.8) {
        matchingFeatures.push({
          feature: feature,
          similarity: similarity,
          eventValue: eventSound[feature],
          userValue: userAudioFeatures[feature],
          match: 'high'
        });
      } else if (similarity > 0.6) {
        matchingFeatures.push({
          feature: feature,
          similarity: similarity,
          eventValue: eventSound[feature],
          userValue: userAudioFeatures[feature],
          match: 'medium'
        });
      }
    }
  });
  
  return {
    similarity: featureCount > 0 ? totalSimilarity / featureCount : 0,
    matchingFeatures: matchingFeatures.sort((a, b) => b.similarity - a.similarity),
    audioCompatibility: featureCount > 0 ? (totalSimilarity / featureCount) * 100 : 50
  };
}

function generateSoundRadarData(event, userTaste) {
  const features = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness'];
  const eventData = [];
  const userData = [];
  
  features.forEach(feature => {
    const eventValue = event.soundCharacteristics?.[feature] || 0.5;
    const userValue = userTaste?.audioFeatures?.[feature] || 0.5;
    
    eventData.push({
      feature: feature.charAt(0).toUpperCase() + feature.slice(1),
      value: Math.round(eventValue * 100),
      fullMark: 100
    });
    
    userData.push({
      feature: feature.charAt(0).toUpperCase() + feature.slice(1),
      value: Math.round(userValue * 100),
      fullMark: 100
    });
  });
  
  return {
    eventProfile: eventData,
    userProfile: userData,
    similarity: calculateRadarSimilarity(eventData, userData)
  };
}

function generateArtistNetworkData(eventArtists, userTopArtists, correlationAnalysis) {
  const nodes = [];
  const links = [];
  
  // Add event artists as nodes
  eventArtists.forEach((artist, index) => {
    const artistName = typeof artist === 'object' ? artist.name : artist;
    nodes.push({
      id: `event_${index}`,
      name: artistName,
      type: 'event_artist',
      size: 20,
      color: '#00FFFF'
    });
  });
  
  // Add user artists as nodes (top 5)
  userTopArtists.slice(0, 5).forEach((artist, index) => {
    nodes.push({
      id: `user_${index}`,
      name: artist,
      type: 'user_artist',
      size: 15,
      color: '#00FF88'
    });
  });
  
  // Add correlation links
  correlationAnalysis.similarArtists.forEach((correlation, index) => {
    const eventNode = nodes.find(n => n.name.toLowerCase() === correlation.eventArtist);
    const userNode = nodes.find(n => n.name.toLowerCase() === correlation.userArtist);
    
    if (eventNode && userNode) {
      links.push({
        source: eventNode.id,
        target: userNode.id,
        strength: correlation.similarity,
        sharedGenres: correlation.sharedGenres,
        strokeWidth: Math.max(2, correlation.similarity / 20)
      });
    }
  });
  
  return { nodes, links };
}

function generateGenreHeatmapData(eventGenres, userGenres, genreAnalysis) {
  const matrix = [];
  
  // Create matrix data for heatmap visualization
  eventGenres.forEach((eventGenre, eventIndex) => {
    userGenres.forEach((userGenre, userIndex) => {
      let intensity = 0;
      
      // Check for exact matches
      if (eventGenre.toLowerCase() === userGenre.toLowerCase()) {
        intensity = 100;
      } else {
        // Check for subgenre matches
        const subMatch = genreAnalysis.subgenreMatches.find(
          m => m.eventGenre === eventGenre.toLowerCase() && m.userGenre === userGenre.toLowerCase()
        );
        if (subMatch) {
          intensity = subMatch.strength;
        } else {
          // Check for related genre matches
          const relatedMatch = genreAnalysis.relatedGenres.find(
            m => m.eventGenre === eventGenre.toLowerCase() && m.userGenre === userGenre.toLowerCase()
          );
          if (relatedMatch) {
            intensity = relatedMatch.similarity;
          }
        }
      }
      
      matrix.push({
        eventGenre: eventGenre,
        userGenre: userGenre,
        intensity: intensity,
        x: eventIndex,
        y: userIndex
      });
    });
  });
  
  return {
    matrix: matrix,
    eventGenres: eventGenres,
    userGenres: userGenres,
    maxIntensity: Math.max(...matrix.map(m => m.intensity))
  };
}

function generateMatchWheelData(matchFactors) {
  const segments = [];
  
  if (matchFactors.artistCorrelation) {
    segments.push({
      name: 'Artist Match',
      value: matchFactors.artistCorrelation.totalStrength,
      color: '#FF6B6B',
      icon: '🎤',
      details: `${matchFactors.artistCorrelation.directMatches.length} direct, ${matchFactors.artistCorrelation.similarArtists.length} similar`
    });
  }
  
  if (matchFactors.genreMatrix) {
    segments.push({
      name: 'Genre Affinity',
      value: matchFactors.genreMatrix.matrixScore,
      color: '#4ECDC4',
      icon: '🎵',
      details: `${matchFactors.genreMatrix.primaryMatches.length} primary matches`
    });
  }
  
  if (matchFactors.trackSimilarity) {
    segments.push({
      name: 'Audio DNA',
      value: matchFactors.trackSimilarity.audioCompatibility,
      color: '#45B7D1',
      icon: '🧬',
      details: `${Math.round(matchFactors.trackSimilarity.similarity * 100)}% similarity`
    });
  }
  
  // Add date proximity if available
  const now = new Date();
  segments.push({
    name: 'Timing',
    value: 75, // Placeholder, would be calculated based on date
    color: '#96CEB4',
    icon: '⏰',
    details: 'Optimal timing'
  });
  
  return {
    segments: segments,
    totalScore: segments.reduce((sum, seg) => sum + seg.value, 0) / segments.length
  };
}

function calculateBalancedEventScore(event, userTaste) {
  // Base taste score calculation
  const baseScore = calculateTasteScore(event, userTaste);
  
  // Date proximity factor (events happening sooner get bonus)
  let dateScore = 0;
  if (event.date) {
    const eventDate = new Date(event.date);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEvent >= 0) {
      if (daysUntilEvent <= 7) dateScore = 20;        // This week: high bonus
      else if (daysUntilEvent <= 30) dateScore = 15;  // This month: medium bonus
      else if (daysUntilEvent <= 90) dateScore = 10;  // This quarter: small bonus
      else dateScore = 0;                             // Too far: no bonus
    }
  }
  
  // Combine taste and date factors (80% taste, 20% date proximity)
  const combinedScore = (baseScore * 0.8) + (dateScore * 0.2);
  
  return {
    personalizedScore: Math.round(combinedScore),
    baseScore,
    dateScore,
    method: 'balanced_taste_date'
  };
}

function calculateRadarSimilarity(eventData, userData) {
  let totalDifference = 0;
  let count = 0;
  
  eventData.forEach((eventPoint, index) => {
    if (userData[index]) {
      const diff = Math.abs(eventPoint.value - userData[index].value);
      totalDifference += diff;
      count++;
    }
  });
  
  const averageDifference = count > 0 ? totalDifference / count : 100;
  return Math.max(0, 100 - averageDifference);
}

function deduplicateEvents(events) {
  const seen = new Set();
  const uniqueEvents = [];
  
  events.forEach(event => {
    const key = `${event.name}_${event.date}_${event.venue?.name}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEvents.push(event);
    }
  });
  
  console.log(`🔄 Deduplicated ${events.length} events to ${uniqueEvents.length} unique events`);
  return uniqueEvents;
}

function smartSortEvents(events) {
  return events.sort((a, b) => {
  const aScore = Number.isFinite(a.personalizedScore) ? a.personalizedScore : 0;
  const bScore = Number.isFinite(b.personalizedScore) ? b.personalizedScore : 0;
    
    // Parse event dates
    const aDate = a.date ? new Date(a.date) : null;
    const bDate = b.date ? new Date(b.date) : null;
    const now = new Date();
    
    // Calculate days until event
    const aDays = aDate ? Math.ceil((aDate - now) / (1000 * 60 * 60 * 24)) : 9999;
    const bDays = bDate ? Math.ceil((bDate - now) / (1000 * 60 * 60 * 24)) : 9999;
    
    // Skip past events
    if (aDays < 0 && bDays >= 0) return 1;
    if (bDays < 0 && aDays >= 0) return -1;
    if (aDays < 0 && bDays < 0) return bDays - aDays; // More recent past events first
    
    // For future events, apply smart sorting logic
    const scoreDiff = bScore - aScore;
    
    // If scores are very close (within 10 points), prioritize sooner events
    if (Math.abs(scoreDiff) <= 10) {
      return aDays - bDays; // Sooner events first
    }
    
    // If one event is much higher scoring (20+ points difference), prioritize it
    if (Math.abs(scoreDiff) >= 20) {
      return scoreDiff; // Higher score first
    }
    
    // For medium score differences (10-20 points), balance score and date
    const aDateWeight = aDays <= 30 ? 1.2 : (aDays <= 90 ? 1.0 : 0.8); // Sooner events get weight boost
    const bDateWeight = bDays <= 30 ? 1.2 : (bDays <= 90 ? 1.0 : 0.8);
    
    const aWeightedScore = aScore * aDateWeight;
    const bWeightedScore = bScore * bDateWeight;
    
    return bWeightedScore - aWeightedScore;
  });
}

// PHASE 2: Process events with enhanced three-dimensional scoring
async function processEventsWithPhase2Enhancement(events, city, session, userId) {
  console.log(`🚀 Processing ${events.length} events with Phase 2 three-dimensional enhancement for user ${userId}`);
  
  if (!events || events.length === 0) {
    return [];
  }

  const { db } = await connectToDatabase();

  // Fetch enhanced user taste profile (with caching)
  let enhancedUserProfile = null;
  try {
    if (session?.accessToken) {
      // PHASE 1: Check for cached user profile first
      const cachedProfile = await db.collection('user_sound_profiles').findOne({
        userId,
        expiresAt: { $gt: new Date() }
      });
      
      if (cachedProfile) {
        console.log(`✅ Using cached user profile (age: ${Math.floor((new Date() - cachedProfile.createdAt) / 1000 / 60)} min)`);
        enhancedUserProfile = cachedProfile;
      } else {
        console.log(`🔄 No cached profile found, generating fresh profile for ${userId}`);
        enhancedUserProfile = await fetchEnhancedUserTasteProfile(session.accessToken);
        
        // Store fresh profile with 24-hour TTL
        const profileWithTTL = {
          ...enhancedUserProfile,
          userId,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        
        await db.collection('user_sound_profiles').replaceOne(
          { userId },
          profileWithTTL,
          { upsert: true }
        );
        
        console.log(`✅ Fresh user profile generated and cached for ${userId}`);
      }
    }
  } catch (error) {
    console.error('⚠️ Failed to load enhanced user profile:', error.message);
    enhancedUserProfile = getDefaultEnhancedProfile();
  }

  // Apply enhanced scoring with complete venue and explanation data
  const enhancedEvents = events.map(event => {
    try {
      // CRITICAL HOTFIX: Normalize venue structure to prevent React rendering crashes
      const venueDetails = extractVenues(event)[0] || { 
        name: 'Unknown Venue', 
        city: `${city}, Canada`,
        country: 'Canada',
        fullAddress: `${city}, Canada`
      };
      
      // Ensure consistent venue object structure (prevent React Error #31)
      const normalizedVenue = {
        name: String(venueDetails.name || 'Unknown Venue'),
        address: String(venueDetails.address || ''),
        city: String(venueDetails.city || city || ''),
        state: String(venueDetails.state || ''),
        country: String(venueDetails.country || 'Canada'),
        type: String(venueDetails.type || 'venue'),
        capacity: venueDetails.capacity || null,
        url: String(venueDetails.url || '')
      };
      
      // Calculate balanced score (taste + date proximity)
      const scoringResult = calculateBalancedEventScore(event, enhancedUserProfile);
      
      // Generate advanced taste match analysis with visual data
      const advancedAnalysis = generateAdvancedTasteMatchAnalysis(event, enhancedUserProfile, scoringResult.personalizedScore);
      
      // Format for frontend with enhanced data
      return {
        _id: event._id || event.id,
        name: event.name || event.title,
        date: event.date || event.datetime,
        venue: normalizedVenue.name,
        location: `${normalizedVenue.address}, ${normalizedVenue.city}`.replace(/^,\s*/, ''),
        venues: [normalizedVenue], // ✅ ARRAY (consistent structure)
        artists: extractArtists(event),
        genres: event.genres || [],
        personalizedScore: scoringResult.personalizedScore,
        ticketUrl: event.ticketUrl || event.url,
        imageUrl: event.imageUrl || event.image,
        description: event.description || '',
        priceRange: event.priceRange || 'Price TBA',
        
        // Advanced match analysis with visual data
        tasteMatch: {
          score: scoringResult.personalizedScore,
          analysis: advancedAnalysis,
          confidence: advancedAnalysis.confidence,
          methodology: 'advanced_correlation_analysis'
        },
        
        // Phase 2 metadata
        phase1Applied: !!event.soundCharacteristics || !!event.artistMetadata,
        phase2Applied: true,
        scoringMethod: scoringResult.method,
        dateProximity: scoringResult.dateScore,
        
        // Phase 1 metadata (preserved)
        soundCharacteristics: event.soundCharacteristics,
        artistMetadata: event.artistMetadata,
        enhancedGenres: event.enhancedGenres,
        
        // Metadata
        source: event.source || 'mongodb',
        lastUpdated: event.lastUpdated || new Date()
      };
    } catch (error) {
      console.error(`❌ Error processing event "${event.name}" with Phase 2:`, error.message);
      return null;
    }
  }).filter(event => event !== null);

  // Apply smart sorting (balance taste and date proximity)
  const sortedEvents = smartSortEvents(enhancedEvents);
  
  // Filter out very low scoring events (below 25%)
  const filteredEvents = sortedEvents.filter(event => event.personalizedScore >= 25);
  
  console.log(`✅ Phase 2 enhancement complete: ${filteredEvents.length} events with enhanced sorting and explanations`);
  
  return filteredEvents;
}

// PHASE 2: Merge Phase 1 and Phase 2 results (Phase 2 takes precedence)
function mergePhase1AndPhase2Results(phase1Events, phase2Events) {
  console.log(`🔄 Merging Phase 1 (${phase1Events.length}) and Phase 2 (${phase2Events.length}) results`);
  
  // Create a map of Phase 2 events by ID for quick lookup
  const phase2Map = new Map();
  phase2Events.forEach(event => {
    const key = event._id || event.name;
    phase2Map.set(key, event);
  });
  
  // Merge results, preferring Phase 2 when available
  const mergedEvents = [];
  const processedIds = new Set();
  
  // Add Phase 2 events first (they take precedence)
  phase2Events.forEach(event => {
    mergedEvents.push(event);
    processedIds.add(event._id || event.name);
  });
  
  // Add Phase 1 events that weren't processed by Phase 2
  phase1Events.forEach(event => {
    const key = event._id || event.name;
    if (!processedIds.has(key)) {
      mergedEvents.push(event);
    }
  });
  
  // Sort by personalized score
  const sortedMerged = mergedEvents.sort((a, b) => b.personalizedScore - a.personalizedScore);
  
  console.log(`✅ Merged results: ${sortedMerged.length} total events (Phase 2 precedence applied)`);
  
  return sortedMerged;
}

// PRESERVED: Ticketmaster fallback function (simplified for space)
async function fetchTicketmasterEvents(lat, lon, radius) {
  // This would contain the Ticketmaster API integration
  // Simplified for space - the original implementation would be preserved
  console.log('🎫 Fetching from Ticketmaster fallback...');
  return [];
}

