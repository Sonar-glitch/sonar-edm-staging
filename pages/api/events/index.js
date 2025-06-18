import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

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

    console.log(`🎯 Events API called for ${city} (${lat}, ${lon})`);

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
            
            // FIXED: Enhanced relevance scoring with proper cap at 99%
            const edmKeywords = ['house', 'techno', 'electronic', 'edm', 'dance', 'trance', 'dubstep', 'drum', 'bass'];
            const eventText = `${event.name} ${artists.join(' ')} ${event.classifications?.[0]?.genre?.name || ''}`.toLowerCase();
            const edmMatches = edmKeywords.filter(keyword => eventText.includes(keyword)).length;
            
            // Calculate base score (70-85) + EDM bonus (0-15) + random (0-9) = max 99%
            const baseScore = Math.min(70 + (edmMatches * 3), 85);
            const randomBonus = Math.floor(Math.random() * 10);
            const finalScore = Math.min(baseScore + randomBonus, 99);
            
            return {
              id: event.id,
              name: event.name,
              date: event.dates?.start?.localDate,
              time: event.dates?.start?.localTime,
              venue: venue?.name || 'Venue TBA',
              address: venue?.address?.line1 || venue?.city?.name || 'Address TBA',
              city: venue?.city?.name || city,
              ticketUrl: event.url, // FIXED: Use actual Ticketmaster URL
              priceRange: event.priceRanges?.[0] ? `$${event.priceRanges[0].min}-${event.priceRanges[0].max}` : 'Price TBA',
              headliners: artists.slice(0, 3),
              matchScore: finalScore, // FIXED: Properly capped at 99%
              source: 'ticketmaster', // FIXED: Correct source labeling
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

    // Enhanced fallback logic - only use emergency samples if NO real events
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
          matchScore: 75,
          source: 'emergency', // FIXED: Proper source for emergency events
          headliners: ['Local DJ'],
          venueType: 'Club'
        }
      ];
      
      finalEvents = emergencyEvents;
    }

    // Sort by relevance score and date
    finalEvents.sort((a, b) => {
      if (a.source === 'ticketmaster' && b.source !== 'ticketmaster') return -1;
      if (b.source === 'ticketmaster' && a.source !== 'ticketmaster') return 1;
      return b.matchScore - a.matchScore;
    });

    console.log(`🎯 Returning ${finalEvents.length} events (${realEvents.length} real, ${finalEvents.length - realEvents.length} emergency)`);

    res.status(200).json({
      events: finalEvents,
      total: finalEvents.length,
      realCount: realEvents.length,
      source: realEvents.length > 0 ? 'ticketmaster' : 'emergency',
      location: { city, lat, lon }
    });

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
