import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  try {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get Spotify access token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const spotifyToken = token?.accessToken;
    
    // Initialize data sources tracking
    const dataSource = {
      artists: 'mock',
      tracks: 'mock',
      genres: 'mock',
      events: 'mock'
    };
    
    // Initialize user taste data
    let userTaste = {
      topArtists: [],
      topTracks: [],
      genres: [],
      seasonalMood: {
        spring: { genres: ['Progressive House', 'Melodic House'], mood: 'Uplifting' },
        summer: { genres: ['Tech House', 'House'], mood: 'Energetic' },
        fall: { genres: ['Organic House', 'Downtempo'], mood: 'Melancholic' },
        winter: { genres: ['Deep House', 'Ambient Techno'], mood: 'Introspective' },
        current: getCurrentSeason()
      },
      suggestedEvents: []
    };
    
    // Try to fetch real data from Spotify API
    if (spotifyToken) {
      try {
        // Fetch top artists
        const artistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });
        
        if (artistsResponse.ok) {
          const artistsData = await artistsResponse.json();
          
          if (artistsData.items && artistsData.items.length > 0) {
            userTaste.topArtists = artistsData.items.map(artist => ({
              id: artist.id,
              name: artist.name,
              image: artist.images && artist.images.length > 0 ? artist.images[0].url : null,
              genres: artist.genres || [],
              popularity: artist.popularity,
              correlation: Math.random() * 0.5 + 0.5, // Simulate correlation score between 0.5 and 1.0
              similarArtists: generateSimilarArtists(artist.name, 2)
            }));
            
            dataSource.artists = 'spotify';
            
            // Extract genres from artists
            const genreMap = {};
            artistsData.items.forEach(artist => {
              if (artist.genres && artist.genres.length > 0) {
                artist.genres.forEach(genre => {
                  genreMap[genre] = (genreMap[genre] || 0) + 1;
                });
              }
            });
            
            // Convert genre map to array and sort by frequency
            const genreArray = Object.entries(genreMap)
              .map(([name, count]) => ({
                name,
                score: Math.min(100, Math.round((count / artistsData.items.length) * 100))
              }))
              .sort((a, b) => b.score - a.score);
            
            if (genreArray.length > 0) {
              userTaste.genres = genreArray;
              dataSource.genres = 'spotify';
            }
          }
        }
        
        // Fetch top tracks
        const tracksResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });
        
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json();
          
          if (tracksData.items && tracksData.items.length > 0) {
            userTaste.topTracks = tracksData.items.map(track => ({
              id: track.id,
              name: track.name,
              artist: track.artists.map(a => a.name).join(', '),
              image: track.album && track.album.images && track.album.images.length > 0 ? 
                    track.album.images[0].url : null,
              popularity: track.popularity,
              duration_ms: track.duration_ms,
              correlation: Math.random() * 0.5 + 0.5 // Simulate correlation score between 0.5 and 1.0
            }));
            
            dataSource.tracks = 'spotify';
          }
        }
      } catch (spotifyError) {
        console.error('Error fetching from Spotify API:', spotifyError);
        // Continue with mock data if Spotify API fails
      }
    }
    
    // If we couldn't get real data from Spotify, use mock data
    if (userTaste.topArtists.length === 0) {
      userTaste.topArtists = getMockArtists();
    }
    
    if (userTaste.topTracks.length === 0) {
      userTaste.topTracks = getMockTracks();
    }
    
    if (userTaste.genres.length === 0) {
      userTaste.genres = getMockGenres();
    }
    
    // Try to fetch events
    try {
      // Get user's IP-based location
      const geoResponse = await fetch('https://ipapi.co/json/');
      let lat, lng;
      
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        lat = geoData.latitude;
        lng = geoData.longitude;
      }
      
      // Fetch events using our own API
      const eventsUrl = new URL(`${req.headers.origin}/api/events`);
      if (lat && lng) {
        eventsUrl.searchParams.append('lat', lat);
        eventsUrl.searchParams.append('lng', lng);
        eventsUrl.searchParams.append('radius', '50');
      }
      
      const eventsResponse = await fetch(eventsUrl.toString(), {
        headers: {
          cookie: req.headers.cookie || ''
        }
      });
      
      if (eventsResponse.ok) {
        const events = await eventsResponse.json();
        
        if (Array.isArray(events) && events.length > 0) {
          userTaste.suggestedEvents = events;
          
          // Check if any events are from real sources
          const realEventSources = events.filter(e => e.source === 'ticketmaster' || e.source === 'edmtrain');
          if (realEventSources.length > 0) {
            dataSource.events = realEventSources[0].source;
          }
        }
      }
    } catch (eventsError) {
      console.error('Error fetching events:', eventsError);
      // Use mock events as fallback
      userTaste.suggestedEvents = getMockEvents();
    }
    
    // If we still don't have events, use mock events
    if (userTaste.suggestedEvents.length === 0) {
      userTaste.suggestedEvents = getMockEvents();
    }
    
    // Add data source information
    userTaste.dataSource = dataSource;
    
    return res.status(200).json(userTaste);
  } catch (error) {
    console.error('Error in user-taste API:', error);
    return res.status(500).json({ error: 'Failed to fetch user taste data' });
  }
}

// Helper function to get current season
function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

// Helper function to generate similar artists
function generateSimilarArtists(artistName, count) {
  const similarArtistsPool = [
    { name: 'Tiesto', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Armin van Buuren', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Deadmau5', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Eric Prydz', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Carl Cox', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Charlotte de Witte', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Nina Kraviz', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Amelie Lens', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Boris Brejcha', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
    { name: 'Peggy Gou', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' }
  ];
  
  // Filter out the current artist
  const filteredPool = similarArtistsPool.filter(artist => artist.name !== artistName);
  
  // Shuffle the array
  const shuffled = [...filteredPool].sort(() => 0.5 - Math.random());
  
  // Return the first 'count' elements
  return shuffled.slice(0, count);
}

// Mock data generators
function getMockArtists() {
  return [
    {
      id: 'artist-1',
      name: 'Max Styler',
      image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56',
      genres: ['melodic house', 'edm'],
      popularity: 90,
      correlation: 0.9,
      similarArtists: [
        { name: 'Klingande', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
        { name: 'Autograf', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' }
      ]
    },
    {
      id: 'artist-2',
      name: 'ARTBAT',
      image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56',
      genres: ['organic house', 'melodic techno'],
      popularity: 85,
      correlation: 0.85,
      similarArtists: [
        { name: 'Mathame', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
        { name: 'Adriatique', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' }
      ]
    },
    {
      id: 'artist-3',
      name: 'Lane 8',
      image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56',
      genres: ['progressive house', 'melodic house'],
      popularity: 80,
      correlation: 0.8,
      similarArtists: [
        { name: 'Yotto', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
        { name: 'Ben Böhmer', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' }
      ]
    },
    {
      id: 'artist-4',
      name: 'Boris Brejcha',
      image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56',
      genres: ['minimal techno', 'high-tech minimal'],
      popularity: 75,
      correlation: 0.75,
      similarArtists: [
        { name: 'Stephan Bodzin', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
        { name: 'Worakls', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' }
      ]
    },
    {
      id: 'artist-5',
      name: 'Nora En Pure',
      image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56',
      genres: ['deep house', 'organic house'],
      popularity: 70,
      correlation: 0.7,
      similarArtists: [
        { name: 'EDX', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' },
        { name: 'Klangkarussell', image: 'https://i.scdn.co/image/ab6761610000e5eb0119c5d2c6c0b4e1c92e8f56' }
      ]
    }
  ];
}

function getMockTracks() {
  return [
    {
      id: 'track-1',
      name: 'Techno Cat',
      artist: 'Unknown Artist',
      image: 'https://i.scdn.co/image/ab67616d0000b273b1f8da74f225fa1225cdface',
      popularity: 0,
      duration_ms: 360000,
      correlation: 0.9
    },
    {
      id: 'track-2',
      name: 'Return To Oz (ARTBAT Remix)',
      artist: 'Unknown Artist',
      image: 'https://i.scdn.co/image/ab67616d0000b273b1f8da74f225fa1225cdface',
      popularity: 0,
      duration_ms: 420000,
      correlation: 0.85
    },
    {
      id: 'track-3',
      name: 'Atlas',
      artist: 'Unknown Artist',
      image: 'https://i.scdn.co/image/ab67616d0000b273b1f8da74f225fa1225cdface',
      popularity: 0,
      duration_ms: 300000,
      correlation: 0.8
    },
    {
      id: 'track-4',
      name: 'Purple Noise',
      artist: 'Unknown Artist',
      image: 'https://i.scdn.co/image/ab67616d0000b273b1f8da74f225fa1225cdface',
      popularity: 0,
      duration_ms: 330000,
      correlation: 0.75
    },
    {
      id: 'track-5',
      name: 'Come With Me',
      artist: 'Unknown Artist',
      image: 'https://i.scdn.co/image/ab67616d0000b273b1f8da74f225fa1225cdface',
      popularity: 0,
      duration_ms: 390000,
      correlation: 0.7
    }
  ];
}

function getMockGenres() {
  return [
    { name: 'Melodic House', score: 80 },
    { name: 'Techno', score: 70 },
    { name: 'Deep House', score: 60 },
    { name: 'Trance', score: 50 },
    { name: 'Progressive House', score: 40 }
  ];
}

function getMockEvents() {
  const cities = [
    { name: 'New York', state: 'NY', country: 'USA', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', state: 'CA', country: 'USA', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', state: 'IL', country: 'USA', lat: 41.8781, lng: -87.6298 },
    { name: 'Miami', state: 'FL', country: 'USA', lat: 25.7617, lng: -80.1918 },
    { name: 'Las Vegas', state: 'NV', country: 'USA', lat: 36.1699, lng: -115.1398 }
  ];
  
  const venues = [
    'Club XYZ', 'Warehouse 23', 'The Grand', 'Neon Garden', 'Underground', 
    'Echostage', 'Output', 'Space', 'Hakkasan', 'Omnia'
  ];
  
  const artists = [
    'Tiesto', 'Armin van Buuren', 'Deadmau5', 'Eric Prydz', 'Carl Cox',
    'Charlotte de Witte', 'Nina Kraviz', 'Amelie Lens', 'Boris Brejcha', 'Peggy Gou'
  ];
  
  const genres = [
    'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep',
    'Progressive House', 'Tech House', 'Melodic Techno', 'Hard Techno', 'Minimal'
  ];
  
  const events = [];
  
  // Generate 20 mock events
  for (let i = 0; i < 20; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const venue = venues[Math.floor(Math.random() * venues.length)];
    const artist = artists[Math.floor(Math.random() * artists.length)];
    const genre = genres[Math.floor(Math.random() * genres.length)];
    
    // Generate a random date within the next 30 days
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30));
    
    events.push({
      id: `mock-${i}`,
      name: `${artist} at ${venue}`,
      date: date.toISOString(),
      venue: {
        name: venue,
        location: {
          city: city.name,
          state: city.state,
          country: city.country
        },
        coordinates: {
          latitude: city.lat + (Math.random() * 0.1 - 0.05),
          longitude: city.lng + (Math.random() * 0.1 - 0.05)
        }
      },
      images: [{ url: '/images/event-placeholder.jpg' }],
      url: '#',
      genres: [genre],
      correlation: Math.random() * 0.5 + 0.5, // Simulate correlation score between 0.5 and 1.0
      source: 'mock'
    });
  }
  
  return events;
}
