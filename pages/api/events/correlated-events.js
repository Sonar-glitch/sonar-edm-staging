import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Get user location from query params or use IP geolocation
    let userLocation = null;
    if (req.query.lat && req.query.lon) {
      userLocation = {
        latitude: parseFloat(req.query.lat),
        longitude: parseFloat(req.query.lon)
      };
    } else {
      // Fallback to IP geolocation
      try {
        const geoResponse = await axios.get('https://ipapi.co/json/') ;
        userLocation = {
          latitude: geoResponse.data.latitude,
          longitude: geoResponse.data.longitude,
          city: geoResponse.data.city,
          region: geoResponse.data.region
        };
      } catch (geoError) {
        console.warn('Could not determine user location:', geoError);
      }
    }
    
    // Fetch user's music taste data
    // In a production environment, you would fetch this from your database
    // For this example, we'll use mock data
    const userTaste = {
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
    
    // Fetch events from your event sources
    // In a production environment, you would fetch this from your database or APIs
    // For this example, we'll use mock data
    const mockEvents = [
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
    
    // Calculate correlation scores for each event
    const correlatedEvents = mockEvents.map(event => {
      // Calculate genre match
      const genreMatch = event.genres.reduce((score, genre)  => {
        const matchingGenre = userTaste.topGenres.find(g => g.name.toLowerCase() === genre.toLowerCase());
        return score + (matchingGenre ? matchingGenre.weight * 50 : 0);
      }, 0) / event.genres.length;
      
      // Calculate artist match
      const artistMatch = event.artists.reduce((score, artist) => {
        const matchingArtist = userTaste.topArtists.find(a => a.name.toLowerCase() === artist.toLowerCase());
        return score + (matchingArtist ? matchingArtist.weight * 50 : 0);
      }, 0) / event.artists.length;
      
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
        distance
      };
    });
    
    // Sort by correlation score (highest first)
    correlatedEvents.sort((a, b) => b.correlationScore - a.correlationScore);
    
    return res.status(200).json({ 
      success: true, 
      events: correlatedEvents,
      userLocation
    });
    
  } catch (error) {
    console.error('Error fetching correlated events:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
