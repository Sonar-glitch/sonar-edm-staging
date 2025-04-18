import { getSession } from 'next-auth/react';
import axios from 'axios';
import { getCachedData, cacheData } from '../../../lib/cache';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get user ID for caching
    const userId = session.user.id || session.user.email || 'anonymous';
    
    // Try to get cached data first
    const cacheKey = `spotify/user-taste`;
    const cacheParams = { userId };
    const cachedData = await getCachedData(cacheKey, cacheParams);
    
    if (cachedData) {
      console.log('Using cached user taste data');
      return res.status(200).json(cachedData);
    }
    
    // Get base URL for API calls
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Get user location for event suggestions
    let userLocation = null;
    try {
      // Try to get cached location data
      const cachedLocation = await getCachedData('ipapi/location', {});
      
      if (cachedLocation) {
        userLocation = cachedLocation;
      } else {
        const ipResponse = await axios.get('https://ipapi.co/json/');
        userLocation = {
          latitude: ipResponse.data.latitude,
          longitude: ipResponse.data.longitude,
          city: ipResponse.data.city,
          region: ipResponse.data.region,
          country: ipResponse.data.country_name
        };
        
        // Cache location data for 24 hours (86400 seconds)
        await cacheData('ipapi/location', {}, userLocation, 86400);
      }
      
      console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    } catch (error) {
      console.error('Error getting user location:', error.message);
      // Use fallback location
      userLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: "New York",
        region: "NY",
        country: "United States"
      };
      console.log('Using fallback location:', userLocation.city);
    }
    
    // Try to get real Spotify data if available
    let spotifyData = null;
    let usingRealData = false;
    
    if (session.accessToken) {
      try {
        // Check for cached Spotify data
        const cachedSpotify = await getCachedData('spotify/real-data', { userId });
        
        if (cachedSpotify) {
          spotifyData = cachedSpotify;
          usingRealData = true;
        } else {
          // Make parallel requests to Spotify API
          const [topArtistsRes, topTracksRes, userProfileRes] = await Promise.all([
            axios.get('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            }),
            axios.get('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term', {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            }),
            axios.get('https://api.spotify.com/v1/me', {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            })
          ]);
          
          // Process top artists
          const topArtists = topArtistsRes.data.items.map((artist, index) => ({
            id: artist.id,
            name: artist.name,
            images: artist.images,
            genres: artist.genres,
            popularity: artist.popularity,
            rank: index + 1,
            correlation: 1 - (index * 0.1), // Decreasing correlation based on rank
            similarArtists: [] // Will be populated later
          }));
          
          // Process top tracks
          const topTracks = topTracksRes.data.items.map((track, index) => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            image: track.album.images[0]?.url,
            preview: track.preview_url,
            duration_ms: track.duration_ms,
            popularity: track.popularity,
            rank: index + 1
          }));
          
          // Extract genres from top artists
          const genreCounts = {};
          topArtists.forEach(artist => {
            artist.genres.forEach(genre => {
              genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
          });
          
          // Convert genre counts to array and sort
          const topGenres = Object.entries(genreCounts)
            .map(([name, count]) => ({
              name,
              value: Math.min(100, Math.round((count / topArtists.length) * 100))
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
          
          // Create seasonal mood data based on genres
          const seasonalMood = {
            winter: { 
              genres: topGenres.slice(0, 2).map(g => g.name), 
              mood: 'Introspective' 
            },
            spring: { 
              genres: topGenres.slice(1, 3).map(g => g.name), 
              mood: 'Uplifting' 
            },
            summer: { 
              genres: topGenres.slice(2, 4).map(g => g.name), 
              mood: 'Energetic' 
            },
            fall: { 
              genres: topGenres.slice(3, 5).map(g => g.name), 
              mood: 'Melancholic' 
            },
            current: getCurrentSeason(),
            currentSeason: {
              name: getCurrentSeason(),
              primaryMood: getCurrentSeason() === 'winter' ? 'Introspective' : 
                          getCurrentSeason() === 'spring' ? 'Uplifting' : 
                          getCurrentSeason() === 'summer' ? 'Energetic' : 'Melancholic',
              topGenres: topGenres.slice(0, 2).map(g => g.name)
            },
            seasons: [
              {
                name: 'Winter',
                primaryMood: 'Introspective',
                topGenres: topGenres.slice(0, 2).map(g => g.name)
              },
              {
                name: 'Spring',
                primaryMood: 'Uplifting',
                topGenres: topGenres.slice(1, 3).map(g => g.name)
              },
              {
                name: 'Summer',
                primaryMood: 'Energetic',
                topGenres: topGenres.slice(2, 4).map(g => g.name)
              },
              {
                name: 'Fall',
                primaryMood: 'Melancholic',
                topGenres: topGenres.slice(3, 5).map(g => g.name)
              }
            ]
          };
          
          // Combine all data
          spotifyData = {
            topGenres,
            topArtists,
            topTracks,
            seasonalMood,
            tasteLabels: topGenres.map(g => g.name)
          };
          
          // Cache Spotify data for 24 hours (86400 seconds)
          await cacheData('spotify/real-data', { userId }, spotifyData, 86400);
          usingRealData = true;
        }
      } catch (spotifyError) {
        console.error('Error fetching Spotify data:', spotifyError.message);
        console.log('Falling back to mock data');
      }
    }
    
    // Use mock data if real data is not available
    if (!spotifyData) {
      spotifyData = {
        topGenres: [
          { name: 'Melodic House', value: 90 },
          { name: 'Techno', value: 80 },
          { name: 'Progressive House', value: 70 },
          { name: 'Trance', value: 60 },
          { name: 'Deep House', value: 50 }
        ],
        topArtists: [
          { 
            name: 'Max Styler', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb8cbc5b79c7ab0ac7e6c0ff03',
            genres: ['melodic house', 'edm'],
            popularity: 90,
            rank: 1,
            similarArtists: [
              { name: 'Autograf', image: 'https://i.scdn.co/image/ab6761610000e5eb8a7af5d1f7eacb6addae5493' },
              { name: 'Amtrac', image: 'https://i.scdn.co/image/ab6761610000e5eb90c4c8a6fb0b4142c57e0bce' }
            ]
          },
          { 
            name: 'ARTBAT', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
            genres: ['melodic techno', 'organic house'],
            popularity: 85,
            rank: 2,
            similarArtists: [
              { name: 'Anyma', image: 'https://i.scdn.co/image/ab6761610000e5eb4c7c1e59b3e8c594dce7c2d2' },
              { name: 'Mathame', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' }
            ]
          },
          { 
            name: 'Lane 8', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb7f6d6a0a5b0d5e0747e01522',
            genres: ['progressive house', 'melodic house'],
            popularity: 80,
            rank: 3,
            similarArtists: [
              { name: 'Yotto', image: 'https://i.scdn.co/image/ab6761610000e5eb5d27d18dfef4c76f1b3a0f32' },
              { name: 'Ben Böhmer', image: 'https://i.scdn.co/image/ab6761610000e5eb7eb7d559b43f5e9775b20d9a' }
            ]
          },
          { 
            name: 'Boris Brejcha', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb7324ce0b63aec68c638e26f6',
            genres: ['german techno', 'minimal techno'],
            popularity: 75,
            rank: 4,
            similarArtists: [
              { name: 'Stephan Bodzin', image: 'https://i.scdn.co/image/ab6761610000e5eb4e8b9c8e5c628c4d0d64b463' },
              { name: 'Worakls', image: 'https://i.scdn.co/image/ab6761610000e5eb2d7d5f1fe46b7d1c0d11e0c0' }
            ]
          },
          { 
            name: 'Nora En Pure', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2',
            genres: ['deep house', 'organic house'],
            popularity: 70,
            rank: 5,
            similarArtists: [
              { name: 'EDX', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' },
              { name: 'Klingande', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' }
            ]
          }
        ],
        topTracks: [
          {
            name: 'Techno Cat',
            artist: 'Max Styler',
            image: 'https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 1,
            popularity: 85
          },
          {
            name: 'Return To Oz (ARTBAT Remix) ',
            artist: 'Monolink',
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 2,
            popularity: 80
          },
          {
            name: 'Atlas',
            artist: 'Lane 8',
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 3,
            popularity: 75
          },
          {
            name: 'Purple Noise',
            artist: 'Boris Brejcha',
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 4,
            popularity: 70
          },
          {
            name: 'Come With Me',
            artist: 'Nora En Pure',
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 5,
            popularity: 65
          }
        ],
        seasonalMood: {
          winter: { genres: ['Deep House', 'Ambient Techno'], mood: 'Introspective' },
          spring: { genres: ['Progressive House', 'Melodic House'], mood: 'Uplifting' },
          summer: { genres: ['Tech House', 'House'], mood: 'Energetic' },
          fall: { genres: ['Organic House', 'Downtempo'], mood: 'Melancholic' },
          current: getCurrentSeason(),
          currentSeason: {
            name: getCurrentSeason(),
            primaryMood: getCurrentSeason() === 'winter' ? 'Introspective' : 
                        getCurrentSeason() === 'spring' ? 'Uplifting' : 
                        getCurrentSeason() === 'summer' ? 'Energetic' : 'Melancholic',
            topGenres: ['Progressive House', 'Melodic House']
          },
          seasons: [
            {
              name: 'Winter',
              primaryMood: 'Introspective',
              topGenres: ['Deep House', 'Ambient Techno']
            },
            {
              name: 'Spring',
              primaryMood: 'Uplifting',
              topGenres: ['Progressive House', 'Melodic House']
            },
            {
              name: 'Summer',
              primaryMood: 'Energetic',
              topGenres: ['Tech House', 'House']
            },
            {
              name: 'Fall',
              primaryMood: 'Melancholic',
              topGenres: ['Organic House', 'Downtempo']
            }
          ]
        },
        tasteLabels: ['Melodic', 'Progressive', 'Deep', 'Atmospheric', 'Energetic']
      };
    }
    
    // Try to fetch suggested events from the events API
    let suggestedEvents = [];
    try {
      // Check for cached events
      const cachedEvents = await getCachedData('events/suggested', { 
        userId,
        lat: userLocation.latitude,
        lon: userLocation.longitude
      });
      
      if (cachedEvents) {
        suggestedEvents = cachedEvents;
      } else {
        // First try to get correlated events
        const eventsResponse = await axios.get(`${baseUrl}/api/events/correlated-events`, {
          params: {
            lat: userLocation.latitude,
            lon: userLocation.longitude
          },
          timeout: 5000 // 5 second timeout
        });
        
        if (eventsResponse.data && eventsResponse.data.success && Array.isArray(eventsResponse.data.events)) {
          suggestedEvents = eventsResponse.data.events.map(event => ({
            id: event.id,
            name: event.name,
            date: event.date,
            venue: event.venue,
            time: '19:00:00',
            price: '$20-50',
            artists: event.artists,
            image: event.image,
            ticketLink: event.ticketUrl,
            correlation: event.correlationScore / 100,
            matchFactors: {
              genreMatch: Math.round(Math.random() * 40),
              artistMatch: Math.round(Math.random() * 25),
              locationMatch: Math.round(Math.random() * 15)
            }
          }));
          
          // Cache events for 12 hours (43200 seconds)
          await cacheData('events/suggested', { 
            userId,
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, suggestedEvents, 43200);
        }
      }
    } catch (correlatedError) {
      console.error('Error fetching correlated events:', correlatedError.message);
      
      // Fallback to regular events API
      try {
        // Check for cached regular events
        const cachedRegularEvents = await getCachedData('events/regular', { 
          userId,
          lat: userLocation.latitude,
          lon: userLocation.longitude
        });
        
        if (cachedRegularEvents) {
          suggestedEvents = cachedRegularEvents;
        } else {
          const regularEventsResponse = await axios.get(`${baseUrl}/api/events`, {
            timeout: 5000 // 5 second timeout
          });
          
          if (regularEventsResponse.data && Array.isArray(regularEventsResponse.data.events)) {
            suggestedEvents = regularEventsResponse.data.events.slice(0, 5).map(event => ({
              id: event.id,
              name: event.name,
              date: event.date,
              venue: event.venue.name,
              time: '19:00:00',
              price: '$20-50',
              artists: ['Artist 1', 'Artist 2'],
              image: event.image,
              ticketLink: event.ticketLink,
              correlation: 0.7,
              matchFactors: {
                genreMatch: Math.round(Math.random() * 40),
                artistMatch: Math.round(Math.random() * 25),
                locationMatch: Math.round(Math.random() * 15)
              }
            }));
            
            // Cache regular events for 12 hours (43200 seconds)
            await cacheData('events/regular', { 
              userId,
              lat: userLocation.latitude,
              lon: userLocation.longitude
            }, suggestedEvents, 43200);
          }
        }
      } catch (regularError) {
        console.error('Error fetching regular events:', regularError.message);
        
        // Use mock events as final fallback
        suggestedEvents = [
          {
            id: 'evt1',
            name: 'Melodic Nights',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            venue: 'Echostage',
            time: '19:00:00',
            price: '$25-45',
            artists: ['Lane 8', 'Yotto'],
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            ticketLink: 'https://example.com/tickets/1',
            correlation: 0.85,
            matchFactors: {
              genreMatch: 35,
              artistMatch: 20,
              locationMatch: 12
            }
          },
          {
            id: 'evt2',
            name: 'Techno Revolution',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            venue: 'Club Space',
            time: '22:00:00',
            price: '$30-60',
            artists: ['Boris Brejcha', 'ANNA'],
            image: 'https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c',
            ticketLink: 'https://example.com/tickets/2',
            correlation: 0.75,
            matchFactors: {
              genreMatch: 30,
              artistMatch: 22,
              locationMatch: 8
            }
          },
          {
            id: 'evt3',
            name: 'Deep Vibes',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            venue: 'Sound Bar',
            time: '20:00:00',
            price: '$20-40',
            artists: ['Nora En Pure', 'Ben Böhmer'],
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            ticketLink: 'https://example.com/tickets/3',
            correlation: 0.65,
            matchFactors: {
              genreMatch: 25,
              artistMatch: 18,
              locationMatch: 10
            }
          }
        ];
      }
    }
    
    // Combine all data
    const responseData = {
      ...spotifyData,
      suggestedEvents,
      userLocation,
      usingRealData
    };
    
    // Cache the final response for 1 hour (3600 seconds)
    await cacheData(cacheKey, cacheParams, responseData, 3600);
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user taste:', error);
    return res.status(500).json({ error: 'Failed to fetch music taste data' });
  }
}

// Helper function to get current season
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth();
  
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}
