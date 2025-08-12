// Enhanced Events API with Spotify/Apple Music Integration
// GET /api/events/enhanced - Returns events with rich music API data

const EnhancedMusicApiService = require('../../../lib/enhancedMusicApiService');

// Enhanced Events API that integrates all improvements:
// 1. Fixed frontend fallback
// 2. Spotify/Apple Music APIs  
// 3. Existing Essentia worker integration

const musicApiService = require('../../../lib/musicApiService');
const essentiaIntegration = require('../../../lib/essentiaIntegration');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      lat = '43.6532', 
      lon = '-79.3832', 
      city = 'Toronto',
      radius = '50',
      enhance = 'true',
      userId = 'default'
    } = req.query;

    console.log(`🎵 Enhanced events API called for ${city} with music API enhancement: ${enhance}`);

    // First, get base events from the main events API
    const baseEventsResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/events?lat=${lat}&lon=${lon}&city=${city}&radius=${radius}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!baseEventsResponse.ok) {
      throw new Error(`Base events API failed: ${baseEventsResponse.status}`);
    }

    const baseData = await baseEventsResponse.json();
    
    if (!baseData.events || baseData.events.length === 0) {
      return res.status(200).json({
        events: [],
        enhanced: false,
        message: 'No base events found to enhance',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🎵 Enhancing ${baseData.events.length} base events with music APIs...`);

    // Skip enhancement if disabled
    if (enhance === 'false') {
      return res.status(200).json({
        ...baseData,
        enhanced: false,
        message: 'Music API enhancement disabled'
      });
    }

    // Get user preferences (would typically come from user profile)
    const userPreferences = await musicApiService.getUserMusicPreferences(userId);

    // Enhance events with music API data (process top events first)
    const enhancedEvents = [];
    const maxEventsToEnhance = 10; // Limit to avoid rate limits and timeouts
    
    // Sort by existing score to enhance the most promising events first
    const sortedEvents = baseData.events
      .sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0))
      .slice(0, maxEventsToEnhance);

    for (const event of sortedEvents) {
      try {
        console.log(`🎵 Enhancing event: "${event.name}"`);
        
        const enhancement = await musicApiService.analyzeEventWithMusicApis(event, userPreferences);
        
        // Merge enhancement data with original event
        const enhancedEvent = {
          ...event,
          originalScore: event.personalizedScore || 0,
          personalizedScore: enhancement.enhancedScore,
          musicApiData: {
            confidence: enhancement.confidence,
            artistsAnalyzed: enhancement.artistsAnalyzed,
            dominantGenres: enhancement.combinedInsights.dominantGenres,
            audioProfile: enhancement.combinedInsights.audioProfile,
            popularityTier: enhancement.combinedInsights.popularityTier,
            recommendations: enhancement.recommendations,
            scoreBoosts: enhancement.scoreBoosts || [],
            totalBoost: enhancement.totalBoost || 0,
            processingTime: enhancement.processingTime
          },
          enhanced: true
        };

        enhancedEvents.push(enhancedEvent);

        // Add small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`❌ Failed to enhance event "${event.name}":`, error.message);
        
        // Include original event if enhancement fails
        enhancedEvents.push({
          ...event,
          enhanced: false,
          enhancementError: error.message
        });
      }
    }

    // Add remaining unenhanced events
    const remainingEvents = baseData.events.slice(maxEventsToEnhance).map(event => ({
      ...event,
      enhanced: false,
      reason: 'Rate limit - not enhanced'
    }));

    const allEvents = [...enhancedEvents, ...remainingEvents];

    // Re-sort by enhanced scores
    allEvents.sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));

    const response = {
      events: allEvents,
      enhanced: true,
      enhancementStats: {
        totalEvents: baseData.events.length,
        enhancedEvents: enhancedEvents.length,
        failedEnhancements: enhancedEvents.filter(e => e.enhancementError).length,
        averageBoost: enhancedEvents.reduce((sum, e) => 
          sum + (e.musicApiData?.totalBoost || 0), 0) / enhancedEvents.length || 0
      },
      userPreferences,
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - new Date(baseData.timestamp || Date.now()).getTime()
    };

    console.log(`✅ Enhanced events API complete: ${enhancedEvents.length}/${baseData.events.length} events enhanced`);
    console.log(`📊 Average score boost: +${response.enhancementStats.averageBoost.toFixed(1)} points`);

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Enhanced events API error:', error.message);
    res.status(500).json({
      error: 'Enhanced events API failed',
      message: error.message,
      enhanced: false,
      timestamp: new Date().toISOString()
    });
  }
}

// Utility function to check API key configuration
export function checkMusicApiConfiguration() {
  const config = {
    spotify: {
      configured: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
      clientId: process.env.SPOTIFY_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? 'Set' : 'Missing'
    },
    appleMusic: {
      configured: !!process.env.APPLE_MUSIC_API_KEY,
      apiKey: process.env.APPLE_MUSIC_API_KEY ? 'Set' : 'Missing'
    }
  };

  console.log('🎵 Music API Configuration Check:');
  console.log('   Spotify:', config.spotify.configured ? '✅ Configured' : '❌ Not configured');
  console.log('   Apple Music:', config.appleMusic.configured ? '✅ Configured' : '❌ Not configured');

  return config;
}
