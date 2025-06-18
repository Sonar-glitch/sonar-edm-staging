import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

// Enhanced caching for temporal data
const scoreCache = new Map();
const userProfileCache = new Map();
const temporalDataCache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { lat = '43.65', lon = '-79.38', city = 'Toronto', radius = '50' } = req.query;
    const userId = session.user.id || session.user.email;

    console.log(`🎯 Enhanced Events API called for ${city} (${lat}, ${lon}) by user ${userId}`);

    // Get enhanced user profile with temporal data
    const enhancedUserProfile = await getEnhancedUserProfile(session, userId);

    let realEvents = [];
    let apiError = null;

    // Try to fetch real events from Ticketmaster with retry logic
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}: Fetching Ticketmaster events...`);
        
        const ticketmasterUrl = `${TICKETMASTER_BASE_URL}/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${lat},${lon}&radius=${radius}&unit=km&classificationName=music&size=50&sort=date,asc`;
        
        const response = await fetch(ticketmasterUrl, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SonarEDM/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`Ticketmaster API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data._embedded && data._embedded.events) {
          realEvents = data._embedded.events.map(event => {
            const venue = event._embedded?.venues?.[0];
            const artists = event._embedded?.attractions?.map(a => a.name) || [];
            
            // Extract genres from event
            const eventGenres = [];
            if (event.classifications) {
              event.classifications.forEach(classification => {
                if (classification.genre?.name) eventGenres.push(classification.genre.name);
                if (classification.subGenre?.name) eventGenres.push(classification.subGenre.name);
              });
            }
            
            // ENHANCED: Use sophisticated temporal matching
            const enhancedMatchScore = calculateEnhancedTemporalMatchScore(
              event, 
              eventGenres, 
              artists, 
              venue, 
              enhancedUserProfile,
              city,
              userId
            );
            
            return {
              id: event.id,
              name: event.name,
              date: event.dates?.start?.localDate,
              time: event.dates?.start?.localTime,
              venue: venue?.name || 'Venue TBA',
              address: venue?.address?.line1 || venue?.city?.name || 'Address TBA',
              city: venue?.city?.name || city,
              ticketUrl: event.url,
              priceRange: event.priceRanges?.[0] ? `$${event.priceRanges[0].min}-${event.priceRanges[0].max}` : 'Price TBA',
              headliners: artists.slice(0, 3),
              genres: eventGenres,
              matchScore: enhancedMatchScore, // ENHANCED TEMPORAL SCORING
              source: 'ticketmaster',
              venueType: venue?.name?.toLowerCase().includes('club') ? 'Club' : 
                        venue?.name?.toLowerCase().includes('festival') ? 'Festival' : 'Venue'
            };
          });

          console.log(`✅ Successfully fetched ${realEvents.length} real events from Ticketmaster`);
          break; // Success, exit retry loop
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        apiError = error;
        if (attempt === 3) {
          console.error('🚨 All Ticketmaster API attempts failed');
        }
      }
    }

    // Enhanced fallback logic
    let finalEvents = realEvents;
    
    if (realEvents.length === 0) {
      console.log('⚠️ No real events found, using emergency fallback samples');
      
      const emergencyEvents = [
        {
          id: 'emergency-1',
          name: 'Emergency EDM Night',
          date: '2025-07-15',
          venue: 'Local Club',
          address: 'Downtown Area',
          city: city,
          ticketUrl: '#',
          matchScore: calculateEmergencyEventScore(enhancedUserProfile),
          source: 'emergency',
          headliners: ['Local DJ'],
          venueType: 'Club'
        }
      ];
      
      finalEvents = emergencyEvents;
    }

    // Sort by enhanced match score (stable sorting)
    finalEvents.sort((a, b) => {
      if (a.source === 'ticketmaster' && b.source !== 'ticketmaster') return -1;
      if (b.source === 'ticketmaster' && a.source !== 'ticketmaster') return 1;
      return b.matchScore - a.matchScore;
    });

    console.log(`🎯 Returning ${finalEvents.length} events with enhanced temporal matching`);

    res.status(200).json({
      events: finalEvents,
      total: finalEvents.length,
      realCount: realEvents.length,
      source: realEvents.length > 0 ? 'ticketmaster' : 'emergency',
      location: { city, lat, lon },
      userProfile: enhancedUserProfile ? 'enhanced' : 'default',
      temporalFactors: enhancedUserProfile?.temporal ? 'active' : 'inactive'
    });

  } catch (error) {
    console.error('🚨 Enhanced Events API critical error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch events',
      error: error.message,
      events: [],
      total: 0
    });
  }
}

/**
 * ENHANCED: Calculate sophisticated temporal match score
 * Includes time-weighted preferences, negative signals, taste evolution, and seasonal context
 */
function calculateEnhancedTemporalMatchScore(event, eventGenres, artists, venue, enhancedUserProfile, city, userId) {
  // Create cache key for stable scoring
  const cacheKey = `${event.id}_${userId}_${enhancedUserProfile?.lastUpdated || 'default'}`;
  
  // Return cached score if available
  if (scoreCache.has(cacheKey)) {
    return scoreCache.get(cacheKey);
  }
  
  let totalScore = 0;
  
  // Enhanced weight distribution
  const weights = {
    genreMatching: 0.30,        // 30% (reduced from 40%)
    artistMatching: 0.20,       // 20% (reduced from 25%)
    venueQuality: 0.15,         // 15% (reduced from 20%)
    edmRelevance: 0.10,         // 10% (reduced from 15%)
    timeWeightedPrefs: 0.15,    // 15% - NEW: Recent vs historical preferences
    negativeSignals: 0.10,      // 10% - NEW: Penalty for negative signals
    tasteEvolution: 0.05,       // 5% - NEW: Trending preferences
    seasonalContext: 0.05       // 5% - NEW: Seasonal preference patterns
  };
  
  // 1. Core Genre Matching (30%)
  const genreScore = calculateGenreMatch(eventGenres, enhancedUserProfile?.genres || []);
  totalScore += genreScore * weights.genreMatching;
  
  // 2. Artist Matching (20%)
  const artistScore = calculateArtistMatch(event.name, enhancedUserProfile?.topArtists || []);
  totalScore += artistScore * weights.artistMatching;
  
  // 3. Venue Quality (15%)
  const venueScore = calculateVenueScore(venue);
  totalScore += venueScore * weights.venueQuality;
  
  // 4. EDM Relevance (10%)
  const edmScore = calculateEDMRelevance(event, eventGenres, artists);
  totalScore += edmScore * weights.edmRelevance;
  
  // 5. NEW: Time-Weighted Preferences (15%)
  const timeWeightedScore = calculateTimeWeightedPreferences(eventGenres, enhancedUserProfile?.temporal);
  totalScore += timeWeightedScore * weights.timeWeightedPrefs;
  
  // 6. NEW: Negative Signals (-10% penalty)
  const negativeScore = calculateNegativeSignals(event, eventGenres, artists, enhancedUserProfile?.negative);
  totalScore -= negativeScore * weights.negativeSignals;
  
  // 7. NEW: Taste Evolution (5%)
  const evolutionScore = calculateTasteEvolution(eventGenres, enhancedUserProfile?.trends);
  totalScore += evolutionScore * weights.tasteEvolution;
  
  // 8. NEW: Seasonal Context (5%)
  const seasonalScore = calculateSeasonalContext(eventGenres, enhancedUserProfile?.seasonal);
  totalScore += seasonalScore * weights.seasonalContext;
  
  // Convert to 0-99 scale and ensure stability
  const finalScore = Math.max(0, Math.min(99, Math.round(totalScore)));
  
  // Cache the score for stability
  scoreCache.set(cacheKey, finalScore);
  
  console.log(`🎯 Enhanced scoring for "${event.name}": ${finalScore}% (genre:${Math.round(genreScore)}, artist:${Math.round(artistScore)}, venue:${Math.round(venueScore)}, temporal:${Math.round(timeWeightedScore)}, negative:-${Math.round(negativeScore)}, evolution:${Math.round(evolutionScore)})`);
  
  return finalScore;
}

/**
 * NEW: Calculate time-weighted preferences
 * Recent activity weighted more heavily than historical data
 */
function calculateTimeWeightedPreferences(eventGenres, temporalData) {
  if (!temporalData || !eventGenres || eventGenres.length === 0) {
    return 50; // Default score
  }
  
  let weightedScore = 0;
  const timeWeights = {
    recent: 0.6,    // 60% weight for last 30 days
    medium: 0.3,    // 30% weight for 3-6 months
    longTerm: 0.1   // 10% weight for 6+ months
  };
  
  // Recent activity (last 30 days) - highest weight
  if (temporalData.recent) {
    const recentMatch = calculateGenreMatch(eventGenres, temporalData.recent.genres || []);
    weightedScore += recentMatch * timeWeights.recent;
  }
  
  // Medium-term activity (3-6 months)
  if (temporalData.medium) {
    const mediumMatch = calculateGenreMatch(eventGenres, temporalData.medium.genres || []);
    weightedScore += mediumMatch * timeWeights.medium;
  }
  
  // Long-term activity (6+ months)
  if (temporalData.longTerm) {
    const longTermMatch = calculateGenreMatch(eventGenres, temporalData.longTerm.genres || []);
    weightedScore += longTermMatch * timeWeights.longTerm;
  }
  
  return Math.min(100, weightedScore);
}

/**
 * NEW: Calculate negative signals penalty
 * Tracks removed, skipped content, abandoned playlists
 */
function calculateNegativeSignals(event, eventGenres, artists, negativeData) {
  if (!negativeData) {
    return 0; // No penalty if no negative data
  }
  
  let penaltyScore = 0;
  
  // Tracks removed from likes - strong negative signal
  if (negativeData.removedTracks && negativeData.removedTracks.length > 0) {
    const removedGenres = negativeData.removedTracks.flatMap(track => track.genres || []);
    const genreOverlap = calculateGenreOverlap(eventGenres, removedGenres);
    penaltyScore += genreOverlap * 50; // Heavy penalty
  }
  
  // Consistently skipped artists - medium negative signal
  if (negativeData.skippedArtists && negativeData.skippedArtists.length > 0) {
    const skippedNames = negativeData.skippedArtists.map(a => a.toLowerCase());
    const eventArtistNames = artists.map(a => a.toLowerCase());
    
    for (const skippedArtist of skippedNames) {
      for (const eventArtist of eventArtistNames) {
        if (eventArtist.includes(skippedArtist) || skippedArtist.includes(eventArtist)) {
          penaltyScore += 25; // Medium penalty
        }
      }
    }
  }
  
  // Abandoned playlists - light negative signal
  if (negativeData.abandonedPlaylists && negativeData.abandonedPlaylists.length > 0) {
    const abandonedGenres = negativeData.abandonedPlaylists.flatMap(playlist => playlist.genres || []);
    const playlistOverlap = calculateGenreOverlap(eventGenres, abandonedGenres);
    penaltyScore += playlistOverlap * 15; // Light penalty
  }
  
  return Math.min(penaltyScore, 75); // Cap penalty at 75 points
}

/**
 * NEW: Calculate taste evolution bonus/penalty
 * Trending up/down genres, new discoveries
 */
function calculateTasteEvolution(eventGenres, trendsData) {
  if (!trendsData || !eventGenres || eventGenres.length === 0) {
    return 0; // Neutral if no trends data
  }
  
  let evolutionScore = 0;
  
  // Trending up genres - user is discovering/increasing interest
  if (trendsData.trendingUp && trendsData.trendingUp.length > 0) {
    const trendingUpOverlap = calculateGenreOverlap(eventGenres, trendsData.trendingUp);
    evolutionScore += trendingUpOverlap * 20; // Bonus for emerging interests
  }
  
  // Trending down genres - user is losing interest
  if (trendsData.trendingDown && trendsData.trendingDown.length > 0) {
    const trendingDownOverlap = calculateGenreOverlap(eventGenres, trendsData.trendingDown);
    evolutionScore -= trendingDownOverlap * 10; // Penalty for declining interests
  }
  
  // New discoveries - recently added artists/genres
  if (trendsData.newDiscoveries && trendsData.newDiscoveries.length > 0) {
    const discoveryOverlap = calculateGenreOverlap(eventGenres, trendsData.newDiscoveries);
    evolutionScore += discoveryOverlap * 15; // Bonus for new interests
  }
  
  return Math.max(-30, Math.min(evolutionScore, 50)); // Cap between -30 and +50
}

/**
 * NEW: Calculate seasonal context score
 * Seasonal preference patterns
 */
function calculateSeasonalContext(eventGenres, seasonalData) {
  if (!seasonalData || !eventGenres || eventGenres.length === 0) {
    return 50; // Neutral score
  }
  
  const currentSeason = getCurrentSeason();
  const seasonalPrefs = seasonalData[currentSeason];
  
  if (!seasonalPrefs || !seasonalPrefs.preferredGenres) {
    return 50; // Neutral if no seasonal data for current season
  }
  
  return calculateGenreMatch(eventGenres, seasonalPrefs.preferredGenres);
}

/**
 * Helper: Calculate genre overlap percentage
 */
function calculateGenreOverlap(genres1, genres2) {
  if (!genres1 || !genres2 || genres1.length === 0 || genres2.length === 0) {
    return 0;
  }
  
  const normalized1 = genres1.map(g => g.toLowerCase().trim());
  const normalized2 = genres2.map(g => g.toLowerCase().trim());
  
  let overlapCount = 0;
  for (const genre1 of normalized1) {
    for (const genre2 of normalized2) {
      if (genre1.includes(genre2) || genre2.includes(genre1)) {
        overlapCount++;
        break; // Count each genre1 only once
      }
    }
  }
  
  return (overlapCount / normalized1.length) * 100;
}

/**
 * Helper: Get current season
 */
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * Enhanced user profile with temporal data
 */
async function getEnhancedUserProfile(session, userId) {
  // Check cache first
  const cacheKey = `enhanced_${userId}`;
  if (userProfileCache.has(cacheKey)) {
    const cached = userProfileCache.get(cacheKey);
    // Use cache if less than 30 minutes old
    if (Date.now() - cached.timestamp < 1800000) {
      return cached.profile;
    }
  }
  
  try {
    if (!session || !session.accessToken) {
      return getDefaultEnhancedProfile();
    }
    
    console.log("🎵 Fetching enhanced user profile with temporal data...");
    
    // Get basic profile data
    const basicProfile = await getBasicUserProfile(session);
    
    // Get temporal data (recent, medium, long-term)
    const temporalData = await getTemporalUserData(session);
    
    // Get negative signals (removed tracks, skipped content)
    const negativeData = await getNegativeSignals(session);
    
    // Calculate taste evolution trends
    const trendsData = await calculateTasteEvolutionTrends(temporalData);
    
    // Get seasonal preferences
    const seasonalData = await getSeasonalPreferences(temporalData);
    
    const enhancedProfile = {
      ...basicProfile,
      temporal: temporalData,
      negative: negativeData,
      trends: trendsData,
      seasonal: seasonalData,
      lastUpdated: Date.now()
    };
    
    // Cache the enhanced profile
    userProfileCache.set(cacheKey, {
      profile: enhancedProfile,
      timestamp: Date.now()
    });
    
    console.log(`✅ Enhanced profile loaded: ${basicProfile?.genres?.length || 0} genres, temporal data: ${!!temporalData}, trends: ${!!trendsData}`);
    
    return enhancedProfile;
  } catch (error) {
    console.error('❌ Error fetching enhanced user profile:', error.message);
    return getDefaultEnhancedProfile();
  }
}

/**
 * Get basic user profile from Spotify
 */
async function getBasicUserProfile(session) {
  try {
    // Get top artists
    const artistsResponse = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      params: { limit: 20, time_range: 'medium_term' },
      timeout: 5000
    });
    
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
    console.error('Error fetching basic profile:', error.message);
  }
  
  return null;
}

/**
 * Get temporal user data (recent, medium, long-term)
 */
async function getTemporalUserData(session) {
  try {
    // Get recent tracks (last 30 days approximation using short_term)
    const recentResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      params: { limit: 20, time_range: 'short_term' },
      timeout: 5000
    });
    
    // Get medium-term tracks (3-6 months)
    const mediumResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      params: { limit: 20, time_range: 'medium_term' },
      timeout: 5000
    });
    
    // Get long-term tracks (6+ months)
    const longTermResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      params: { limit: 20, time_range: 'long_term' },
      timeout: 5000
    });
    
    const extractGenresFromTracks = (tracks) => {
      if (!tracks || !tracks.items) return [];
      const genres = tracks.items.flatMap(track => 
        track.artists.flatMap(artist => artist.genres || [])
      );
      return [...new Set(genres)];
    };
    
    return {
      recent: {
        genres: extractGenresFromTracks(recentResponse.data),
        tracks: recentResponse.data.items || []
      },
      medium: {
        genres: extractGenresFromTracks(mediumResponse.data),
        tracks: mediumResponse.data.items || []
      },
      longTerm: {
        genres: extractGenresFromTracks(longTermResponse.data),
        tracks: longTermResponse.data.items || []
      }
    };
  } catch (error) {
    console.error('Error fetching temporal data:', error.message);
    return null;
  }
}

/**
 * Get negative signals (placeholder - would need more sophisticated tracking)
 */
async function getNegativeSignals(session) {
  // Placeholder implementation
  // In a real system, this would track:
  // - Tracks removed from saved tracks
  // - Artists unfollowed
  // - Playlists deleted or abandoned
  // - Skip patterns from recently played
  
  return {
    removedTracks: [],
    skippedArtists: [],
    abandonedPlaylists: []
  };
}

/**
 * Calculate taste evolution trends
 */
async function calculateTasteEvolutionTrends(temporalData) {
  if (!temporalData) return null;
  
  try {
    const recentGenres = new Set(temporalData.recent?.genres || []);
    const mediumGenres = new Set(temporalData.medium?.genres || []);
    const longTermGenres = new Set(temporalData.longTerm?.genres || []);
    
    // Trending up: genres in recent but not in long-term
    const trendingUp = [...recentGenres].filter(genre => !longTermGenres.has(genre));
    
    // Trending down: genres in long-term but not in recent
    const trendingDown = [...longTermGenres].filter(genre => !recentGenres.has(genre));
    
    // New discoveries: genres in recent but not in medium-term
    const newDiscoveries = [...recentGenres].filter(genre => !mediumGenres.has(genre));
    
    return {
      trendingUp,
      trendingDown,
      newDiscoveries
    };
  } catch (error) {
    console.error('Error calculating taste evolution:', error.message);
    return null;
  }
}

/**
 * Get seasonal preferences (placeholder)
 */
async function getSeasonalPreferences(temporalData) {
  // Placeholder implementation
  // In a real system, this would analyze historical data by season
  
  return {
    spring: { preferredGenres: ['house', 'progressive house'] },
    summer: { preferredGenres: ['edm', 'festival', 'dance'] },
    fall: { preferredGenres: ['techno', 'deep house'] },
    winter: { preferredGenres: ['trance', 'ambient', 'downtempo'] }
  };
}

/**
 * Default enhanced profile for users without Spotify data
 */
function getDefaultEnhancedProfile() {
  return {
    genres: ['electronic', 'house', 'techno'],
    topArtists: [],
    temporal: null,
    negative: null,
    trends: null,
    seasonal: null,
    lastUpdated: Date.now()
  };
}

// Existing helper functions (calculateGenreMatch, calculateArtistMatch, etc.)
// ... (keeping the existing implementations from the previous version)

function calculateGenreMatch(eventGenres, userGenres) {
  if (!eventGenres || !userGenres || eventGenres.length === 0 || userGenres.length === 0) {
    return 50;
  }
  
  const normalizedEventGenres = eventGenres.map(g => g.toLowerCase().trim());
  const normalizedUserGenres = userGenres.map(g => g.toLowerCase().trim());
  
  let totalScore = 30;
  
  for (const userGenre of normalizedUserGenres) {
    if (normalizedEventGenres.includes(userGenre)) {
      totalScore += 25;
    }
  }
  
  for (const userGenre of normalizedUserGenres) {
    for (const eventGenre of normalizedEventGenres) {
      if (eventGenre === userGenre) continue;
      if (eventGenre.includes(userGenre) || userGenre.includes(eventGenre)) {
        totalScore += 15;
      }
    }
  }
  
  return Math.min(100, totalScore);
}

function calculateArtistMatch(eventName, userArtists) {
  if (!eventName || !userArtists || userArtists.length === 0) {
    return 50;
  }
  
  const normalizedEventName = eventName.toLowerCase();
  let totalScore = 30;
  
  for (const artist of userArtists) {
    const normalizedArtist = artist.name.toLowerCase();
    if (normalizedEventName.includes(normalizedArtist)) {
      totalScore += 40 * (artist.popularity / 100);
    }
  }
  
  return Math.min(100, totalScore);
}

function calculateVenueScore(venue) {
  if (!venue || !venue.name) return 50;
  
  const venueName = venue.name.toLowerCase();
  const premiumVenues = {
    'coda': 95, 'rebel': 90, 'the opera house': 85,
    'danforth music hall': 80, 'phoenix concert theatre': 75, 'the mod club': 70
  };
  
  for (const [name, score] of Object.entries(premiumVenues)) {
    if (venueName.includes(name)) return score;
  }
  
  if (venueName.includes('club')) return 65;
  if (venueName.includes('hall') || venueName.includes('theatre')) return 70;
  if (venueName.includes('arena') || venueName.includes('stadium')) return 75;
  
  return 60;
}

function calculateEDMRelevance(event, eventGenres, artists) {
  const eventText = `${event.name} ${artists.join(' ')} ${eventGenres.join(' ')}`.toLowerCase();
  const edmKeywords = ['house', 'techno', 'electronic', 'edm', 'dance', 'trance', 'dubstep', 'drum', 'bass'];
  
  let relevanceScore = 40;
  for (const keyword of edmKeywords) {
    if (eventText.includes(keyword)) {
      relevanceScore += 12;
    }
  }
  
  return Math.min(100, relevanceScore);
}

function calculateEmergencyEventScore(enhancedUserProfile) {
  return enhancedUserProfile ? 65 : 60;
}
