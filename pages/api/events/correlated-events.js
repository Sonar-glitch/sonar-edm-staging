import { getSession } from 'next-auth/react';
import axios from 'axios';
import { getCachedData, cacheData } from '../../../lib/cache';
export const config = {
  api: {
    responseLimit: false,
  },
};
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Get user ID for caching
    const userId = session.user.id || session.user.email || 'anonymous';
    
    // Try to get cached data first
    const cacheKey = 'events/correlated';
    const cacheParams = { 
      userId,
      lat: req.query.lat,
      lon: req.query.lon
    };
    const cachedData = await getCachedData(cacheKey, cacheParams);
    
    if (cachedData) {
      console.log('Using cached correlated events data');
      return res.status(200).json(cachedData);
    }
    
    // Get user location from query params or use IP geolocation
    let userLocation = null;
    if (req.query.lat && req.query.lon) {
      userLocation = {
        latitude: parseFloat(req.query.lat),
        longitude: parseFloat(req.query.lon)
      };
    } else {
      // Check for cached location data
      const cachedLocation = await getCachedData('ipapi/location', {});
      
      if (cachedLocation) {
        userLocation = cachedLocation;
        console.log('Using cached location data');
      } else {
        // Fallback to IP geolocation
        try {
          const geoResponse = await axios.get('https://ipapi.co/json/');
          userLocation = {
            latitude: geoResponse.data.latitude,
            longitude: geoResponse.data.longitude,
            city: geoResponse.data.city,
            region: geoResponse.data.region
          };
          
          // Cache location data for 24 hours (86400 seconds)
          await cacheData('ipapi/location', {}, userLocation, 86400);
        } catch (geoError) {
          console.warn('Could not determine user location:', geoError);
          
          // Use fallback location
          userLocation = {
            latitude: 40.7128,
            longitude: -74.0060,
            city: "New York",
            region: "NY",
            country: "United States"
          };
        }
      }
    }
    
    // Fetch user's music taste data
    let userTaste;
    try {
      // Check for cached user taste data
      const cachedTaste = await getCachedData('spotify/user-taste', { userId });
      
      if (cachedTaste) {
        userTaste = cachedTaste;
        console.log('Using cached user taste data');
      } else {
        // In a production environment, you would fetch this from your database
        // For this example, we'll use the API
        const tasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/spotify/user-taste`, {
          headers: {
            Cookie: req.headers.cookie // Forward cookies for authentication
          },
          validateStatus: function (status) {
            return status < 500; // Only treat 500+ errors as actual errors
          }
        });
        
        if (tasteResponse.status === 401) {
          console.log("Authentication required for user taste data");
          throw new Error("Authentication required");
        }
        
        userTaste = tasteResponse.data;
        
        userTaste = tasteResponse.data;
        
        // Cache user taste data for 1 hour (3600 seconds)
        await cacheData('spotify/user-taste', { userId }, userTaste, 3600);
      }
    } catch (tasteError) {
      console.warn('Could not fetch user taste data:', tasteError);
      
      // Use mock data as fallback
      userTaste = {
        topGenres: [
          { name: 'Melodic House', weight: 0.9 },
          { name: 'Techno', weight: 0.8 },
          { name: 'Progressive House', weight: 0.7 },
          { name: 'Trance', weight: 0.6 },
          { name: 'Deep House', weight: 0.5 }
        ],
        topArtists: [
          { name: 'Max Styler', weight: 0.9 },
          { name: 'ARTBAT', weight: 0.85 },
          { name: 'Lane 8', weight: 0.8 },
          { name: 'Boris Brejcha', weight: 0.75 },
          { name: 'Nora En Pure', weight: 0.7 }
        ]
      };
    }
    
    // Try to fetch real events from the events API
    let realEvents = [];
    try {
      // Check for cached events
      const cachedEvents = await getCachedData('events/all', { 
        lat: userLocation.latitude,
        lon: userLocation.longitude
      });
      
      if (cachedEvents) {
        realEvents = cachedEvents;
        console.log('Using cached events data');
      } else {
        const eventsResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events`, {
          timeout: 5000 // 5 second timeout
        });
        
        if (eventsResponse.data && eventsResponse.data.success && Array.isArray(eventsResponse.data.events)) {
          realEvents = eventsResponse.data.events;
          
          // Cache events for 12 hours (43200 seconds)
          await cacheData('events/all', { 
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, realEvents, 43200);
        }
      }
    } catch (eventsError) {
      console.warn('Could not fetch real events:', eventsError);
    }
    
    // Use real events if available, otherwise use mock events
    let events = [];
    if (realEvents.length > 0) {
      events = realEvents;
    } else {
      // Mock events as fallback
      events = [
        {
          id: 'evt1',
          name: 'Melodic Nights',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Echostage',
          genres: ['Melodic House', 'Progressive House'],
          artists: ['Lane 8', 'Yotto'],
          image: 'https://example.com/event1.jpg',
          ticketUrl: 'https://example.com/tickets/1',
          location: {
            latitude: userLocation ? userLocation.latitude + 0.02 : 0,
            longitude: userLocation ? userLocation.longitude - 0.01 : 0
          }
        },
        {
          id: 'evt2',
          name: 'Techno Revolution',
          date: new Date(Date.now()  + 14 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Club Space',
          genres: ['Techno', 'Dark Techno'],
          artists: ['Boris Brejcha', 'ANNA'],
          image: 'https://example.com/event2.jpg',
          ticketUrl: 'https://example.com/tickets/2',
          location: {
            latitude: userLocation ? userLocation.latitude - 0.03 : 0,
            longitude: userLocation ? userLocation.longitude + 0.02 : 0
          }
        },
        {
          id: 'evt3',
          name: 'Deep Vibes',
          date: new Date(Date.now()  + 3 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Sound Bar',
          genres: ['Deep House', 'Organic House'],
          artists: ['Nora En Pure', 'Ben Böhmer'],
          image: 'https://example.com/event3.jpg',
          ticketUrl: 'https://example.com/tickets/3',
          location: {
            latitude: userLocation ? userLocation.latitude + 0.01 : 0,
            longitude: userLocation ? userLocation.longitude + 0.01 : 0
          }
        },
        {
          id: 'evt4',
          name: 'Trance Journey',
          date: new Date(Date.now()  + 21 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Avalon',
          genres: ['Trance', 'Progressive Trance'],
          artists: ['Above & Beyond', 'Armin van Buuren'],
          image: 'https://example.com/event4.jpg',
          ticketUrl: 'https://example.com/tickets/4',
          location: {
            latitude: userLocation ? userLocation.latitude - 0.02 : 0,
            longitude: userLocation ? userLocation.longitude - 0.02 : 0
          }
        },
        {
          id: 'evt5',
          name: 'House Classics',
          date: new Date(Date.now()  + 10 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Ministry of Sound',
          genres: ['House', 'Tech House'],
          artists: ['CamelPhat', 'Solardo'],
          image: 'https://example.com/event5.jpg',
          ticketUrl: 'https://example.com/tickets/5',
          location: {
            latitude: userLocation ? userLocation.latitude + 0.04 : 0,
            longitude: userLocation ? userLocation.longitude - 0.03 : 0
          }
        }
      ];
    }
    
    // Calculate correlation scores for each event
    const correlatedEvents = events.map(event => {
      // Extract genres from event
      const eventGenres = event.genres || [];
      
      // Extract artists from event
      const eventArtists = event.artists || 
                          (event.artistList ? event.artistList.map(a => a.name) : []);
      
      // Calculate genre match
      const genreMatch = eventGenres.reduce((score, genre)  => {
        const matchingGenre = userTaste.topGenres ? 
          userTaste.topGenres.find(g => g.name.toLowerCase() === genre.toLowerCase()) : null;
        return score + (matchingGenre ? (matchingGenre.weight || matchingGenre.value / 100) * 50 : 0);
      }, 0) / Math.max(1, eventGenres.length);
      
      // Calculate artist match
      const artistMatch = eventArtists.reduce((score, artist) => {
        const matchingArtist = userTaste.topArtists ? 
          userTaste.topArtists.find(a => a.name.toLowerCase() === artist.toLowerCase()) : null;
        return score + (matchingArtist ? (matchingArtist.weight || 0.5) * 50 : 0);
      }, 0) / Math.max(1, eventArtists.length);
      
      // Calculate distance if location is available
      let distance = null;
      if (userLocation && event.location) {
        // Haversine formula to calculate distance
        const R = 3958.8; // Earth radius in miles
        const dLat = (event.location.latitude - userLocation.latitude) * Math.PI / 180;
        const dLon = (event.location.longitude - userLocation.longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(event.location.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }
      
      // Calculate overall correlation score (0-100)
      const correlationScore = Math.min(100, Math.round(genreMatch + artistMatch));
      
      return {
        ...event,
        correlationScore,
        distance,
        matchFactors: {
          genreMatch: Math.round(genreMatch),
          artistMatch: Math.round(artistMatch),
          locationMatch: distance ? Math.max(0, 100 - Math.round(distance * 2)) : 0
        }
      };
    });
    
    // Sort by correlation score (highest first)
    correlatedEvents.sort((a, b) => b.correlationScore - a.correlationScore);
    
    // Prepare response data
    const responseData = { 
      success: true, 
      events: correlatedEvents,
      userLocation,
      usingRealEvents: realEvents.length > 0
    };
    
    // Cache the response for 1 hour (3600 seconds)
    await cacheData(cacheKey, cacheParams, responseData, 3600);
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching correlated events:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
