import axios from 'axios';

// Default Toronto coordinates
const DEFAULT_LAT = 43.6532;
const DEFAULT_LON = -79.3832;

export default async function handler(req, res) {
  console.log('Starting Events API handler');
  
  // Check if API keys are available
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
  const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
  
  console.log(`Using Ticketmaster API key: ${ticketmasterApiKey ? 'Available' : 'Missing'}`);
  console.log(`Using EDMtrain API key: ${edmtrainApiKey ? 'Available' : 'Missing'}`);
  
  // Get location from query parameters or use default
  let { lat, lon } = req.query;
  
  // If location is not provided in query, try to get it from IP
  if (!lat || !lon) {
    try {
      console.log('Using cached location data');
      // Default to Toronto if no location is available
      lat = lat || DEFAULT_LAT;
      lon = lon || DEFAULT_LON;
    } catch (error) {
      console.error('Error getting location from IP:', error);
      // Default to Toronto if location detection fails
      lat = DEFAULT_LAT;
      lon = DEFAULT_LON;
    }
  }
  
  // Ensure lat and lon are valid numbers
  lat = parseFloat(lat);
  lon = parseFloat(lon);
  
  // If parsing failed, use default values
  if (isNaN(lat) || isNaN(lon)) {
    lat = DEFAULT_LAT;
    lon = DEFAULT_LON;
  }
  
  // Get user genres for matching
  const userGenres = [
    'house',
    'techno',
    'trance',
    'dubstep',
    'drum & bass',
    'future bass'
  ];
  
  console.log('User genres for matching:', userGenres);
  
  // Fetch events from Ticketmaster API
  let ticketmasterEvents = [];
  try {
    console.log('Making Ticketmaster API request...');
    
    // Format location parameters properly
    const latlong = `${lat},${lon}`;
    console.log(`Adding location filter: ${latlong}, radius: 100 miles`);
    
    // Prepare request parameters
    const params = {
      apikey: ticketmasterApiKey,
      classificationName: 'music',
      keyword: 'electronic OR dance OR dj OR festival OR rave',
      size: 100,
      sort: 'date,asc',
      startDateTime: `${new Date().toISOString().split('.')[0]}Z`,
      latlong: latlong,
      radius: '100',
      unit: 'miles'
    };
    
    console.log('Ticketmaster API request params:', params);
    
    // Make API request
    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { params });
    
    // Process response
    if (response.data._embedded && response.data._embedded.events) {
      ticketmasterEvents = response.data._embedded.events.map(event => {
        // Extract venue information
        const venue = event._embedded?.venues?.[0] || {};
        const venueAddress = venue.address?.line1 || '';
        const venueCity = venue.city?.name || '';
        const venueState = venue.state?.stateCode || '';
        
        // Extract artist information
        const attractions = event._embedded?.attractions || [];
        const artists = attractions.map(attraction => attraction.name);
        
        // Calculate match score based on genre and location
        const matchScore = calculateMatchScore(event, userGenres, lat, lon);
        
        return {
          id: event.id,
          name: event.name,
          date: event.dates.start.dateTime,
          venue: venue.name,
          address: `${venueAddress}, ${venueCity}, ${venueState}`,
          artists: artists,
          url: event.url,
          images: event.images,
          genres: extractGenres(event),
          source: 'ticketmaster',
          matchScore: matchScore,
          isLiveData: true
        };
      });
      
      console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
    } else {
      console.log('No events found from Ticketmaster');
    }
  } catch (error) {
    console.error('Ticketmaster API request failed:', error.message);
    console.log('Retrying with simpler query after error...');
    
    // Retry with simpler query without location parameters
    try {
      const retryParams = {
        apikey: ticketmasterApiKey,
        classificationName: 'music',
        keyword: 'electronic',
        size: 50,
        sort: 'date,asc',
        startDateTime: `${new Date().toISOString().split('.')[0]}Z`
      };
      
      const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { params: retryParams });
      
      if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
        ticketmasterEvents = retryResponse.data._embedded.events.map(event => {
          // Extract venue information
          const venue = event._embedded?.venues?.[0] || {};
          const venueAddress = venue.address?.line1 || '';
          const venueCity = venue.city?.name || '';
          const venueState = venue.state?.stateCode || '';
          
          // Extract artist information
          const attractions = event._embedded?.attractions || [];
          const artists = attractions.map(attraction => attraction.name);
          
          // Calculate match score based on genre and location
          const matchScore = calculateMatchScore(event, userGenres, lat, lon);
          
          return {
            id: event.id,
            name: event.name,
            date: event.dates.start.dateTime,
            venue: venue.name,
            address: `${venueAddress}, ${venueCity}, ${venueState}`,
            artists: artists,
            url: event.url,
            images: event.images,
            genres: extractGenres(event),
            source: 'ticketmaster',
            matchScore: matchScore,
            isLiveData: true
          };
        });
        
        console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
      }
    } catch (retryError) {
      console.error('Ticketmaster retry also failed:', retryError.message);
    }
  }
  
  // Fetch events from EDMtrain API
  let edmtrainEvents = [];
  try {
    console.log('Fetching events from EDMtrain API...');
    
    // Prepare request parameters
    const params = {
      client: edmtrainApiKey,
      latitude: lat,
      longitude: lon,
      radius: 100
    };
    
    console.log('EDMtrain API request params:', params);
    
    // Make API request
    const response = await axios.get('https://edmtrain.com/api/events', { params });
    
    // Process response
    if (response.data && response.data.data) {
      edmtrainEvents = response.data.data.map(event => {
        // Calculate match score based on genre and location
        const matchScore = calculateMatchScore(event, userGenres, lat, lon);
        
        return {
          id: `edmtrain-${event.id}`,
          name: event.name,
          date: event.date,
          venue: event.venue.name,
          address: `${event.venue.address || ''}, ${event.venue.location || ''}`,
          artists: event.artistList.map(artist => artist.name),
          url: `https://edmtrain.com/event/${event.id}`,
          images: [{ url: event.artistList[0]?.img || 'https://edmtrain.com/img/logo-white.png' }],
          genres: extractGenresFromArtists(event.artistList),
          source: 'edmtrain',
          matchScore: matchScore,
          isLiveData: true
        };
      });
      
      console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
    } else {
      console.log('No events found from EDMtrain');
    }
  } catch (error) {
    console.error('EDMtrain API request failed:', error.message);
  }
  
  // Combine events from both sources
  let allEvents = [...ticketmasterEvents, ...edmtrainEvents];
  
  // If no events found or very few events, add sample events
  if (allEvents.length < 5) {
    console.log('Adding sample events due to limited API results');
    allEvents = [...allEvents, ...getSampleEvents(lat, lon, userGenres)];
  }
  
  // Sort events by match score (descending)
  allEvents.sort((a, b) => b.matchScore - a.matchScore);
  
  // Return events
  res.status(200).json(allEvents);
}

// Helper function to extract genres from Ticketmaster event
function extractGenres(event) {
  const genres = [];
  
  // Extract from classifications
  if (event.classifications) {
    event.classifications.forEach(classification => {
      if (classification.genre && classification.genre.name && classification.genre.name !== 'Undefined') {
        genres.push(classification.genre.name.toLowerCase());
      }
      if (classification.subGenre && classification.subGenre.name && classification.subGenre.name !== 'Undefined') {
        genres.push(classification.subGenre.name.toLowerCase());
      }
    });
  }
  
  // Extract from name
  const eventName = event.name.toLowerCase();
  const genreKeywords = [
    'techno', 'house', 'trance', 'edm', 'electronic', 'dance', 'dj', 'rave',
    'dubstep', 'drum & bass', 'dnb', 'progressive', 'deep house', 'tech house'
  ];
  
  genreKeywords.forEach(keyword => {
    if (eventName.includes(keyword) && !genres.includes(keyword)) {
      genres.push(keyword);
    }
  });
  
  return genres.length > 0 ? genres : ['electronic'];
}

// Helper function to extract genres from EDMtrain artists
function extractGenresFromArtists(artists) {
  const genres = [];
  
  artists.forEach(artist => {
    if (artist.genre && !genres.includes(artist.genre.toLowerCase())) {
      genres.push(artist.genre.toLowerCase());
    }
  });
  
  return genres.length > 0 ? genres : ['electronic'];
}

// Helper function to calculate match score
function calculateMatchScore(event, userGenres, userLat, userLon) {
  // Base score
  let score = 70 + Math.random() * 10;
  
  // Extract event genres
  const eventGenres = event.source === 'ticketmaster' 
    ? extractGenres(event) 
    : extractGenresFromArtists(event.artistList || []);
  
  // Increase score for genre matches
  userGenres.forEach(userGenre => {
    if (eventGenres.some(eventGenre => eventGenre.includes(userGenre))) {
      score += 5;
    }
  });
  
  // Adjust score based on location proximity (if available)
  if (event.source === 'ticketmaster' && event._embedded?.venues?.[0]?.location) {
    const venueLat = parseFloat(event._embedded.venues[0].location.latitude);
    const venueLon = parseFloat(event._embedded.venues[0].location.longitude);
    
    if (!isNaN(venueLat) && !isNaN(venueLon)) {
      const distance = calculateDistance(userLat, userLon, venueLat, venueLon);
      
      // Closer events get higher scores
      if (distance < 10) {
        score += 10;
      } else if (distance < 25) {
        score += 5;
      } else if (distance < 50) {
        score += 2;
      }
    }
  }
  
  // Cap score at 95 (leaving room for randomness)
  return Math.min(Math.round(score), 95);
}

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Helper function to get sample events
function getSampleEvents(lat, lon, userGenres) {
  // Determine if we should use Toronto venues
  const isToronto = Math.abs(lat - 43.6532) < 1 && Math.abs(lon - (-79.3832)) < 1;
  
  // Sample events with Toronto venues if near Toronto
  if (isToronto) {
    return [
      {
        id: 'sample-1',
        name: 'Techno Warehouse Night',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'REBEL',
        address: '11 Polson St, Toronto, ON',
        artists: ['Charlotte de Witte', 'Amelie Lens', 'FJAAK'],
        url: 'https://ticketmaster.com',
        images: [{ url: 'https://example.com/event1.jpg' }],
        genres: ['techno', 'warehouse'],
        source: 'sample',
        matchScore: 92,
        isLiveData: false,
        venueType: 'warehouse'
      },
      {
        id: 'sample-2',
        name: 'Melodic Techno Night',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'CODA',
        address: '794 Bathurst St, Toronto, ON',
        artists: ['Tale Of Us', 'Mind Against', 'Mathame'],
        url: 'https://ticketmaster.com',
        images: [{ url: 'https://example.com/event2.jpg' }],
        genres: ['melodic techno', 'progressive house'],
        source: 'sample',
        matchScore: 88,
        isLiveData: false,
        venueType: 'club'
      },
      {
        id: 'sample-3',
        name: 'Summer House Festival',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'The Danforth Music Hall',
        address: '147 Danforth Ave, Toronto, ON',
        artists: ['Disclosure', 'Kaytranada', 'The Blessed Madonna'],
        url: 'https://ticketmaster.com',
        images: [{ url: 'https://example.com/event3.jpg' }],
        genres: ['house', 'tech house'],
        source: 'sample',
        matchScore: 85,
        isLiveData: false,
        venueType: 'festival'
      },
      {
        id: 'sample-4',
        name: 'Progressive Dreams',
        date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Velvet Underground',
        address: '508 Queen St W, Toronto, ON',
        artists: ['Hernan Cattaneo', 'Nick Warren', 'Guy J'],
        url: 'https://ticketmaster.com',
        images: [{ url: 'https://example.com/event4.jpg' }],
        genres: ['progressive house', 'deep house'],
        source: 'sample',
        matchScore: 78,
        isLiveData: false,
        venueType: 'club'
      }
    ];
  } else {
    // Generic sample events for other locations
    return [
      {
        id: 'sample-1',
        name: 'Techno Warehouse Night',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'The Underground',
        address: '123 Industrial Ave, Brooklyn, NY',
        artists: ['Charlotte de Witte', 'Amelie Lens', 'FJAAK'],
        url: 'https://ticketmaster.com',
        images: [{ url: 'https://example.com/event1.jpg' }],
        genres: ['techno', 'warehouse'],
        source: 'sample',
        matchScore: 92,
        isLiveData: false,
        venueType: 'warehouse'
      },
      {
        id: 'sample-2',
        name: 'Melodic Techno Night',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'The Loft',
        address: '101 Skyline Ave, Chicago, IL',
        artists: ['Tale Of Us', 'Mind Against', 'Mathame'],
        url: 'https://ticketmaster.com',
        images: [{ url: 'https://example.com/event2.jpg' }],
        genres: ['melodic techno', 'progressive house'],
        source: 'sample',
        matchScore: 88,
        isLiveData: false,
        venueType: 'rooftop'
      },
      {
        id: 'sample-3',
        name: 'Summer House Festival',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Sunset Park',
        address: '456 Parkway Dr, Miami, FL',
        artists: ['Disclosure', 'Kaytranada', 'The Blessed Madonna'],
        url: 'https://ticketmaster.com',
        images: [{ url: 'https://example.com/event3.jpg' }],
        genres: ['house', 'tech house'],
        source: 'sample',
        matchScore: 85,
        isLiveData: false,
        venueType: 'festival'
      },
      {
        id: 'sample-4',
        name: 'Progressive Dreams',
        date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Club Horizon',
        address: '789 Downtown Blvd, Los Angeles, CA',
        artists: ['Hernan Cattaneo', 'Nick Warren', 'Guy J'],
        url: 'https://ticketmaster.com',
        images: [{ url: 'https://example.com/event4.jpg' }],
        genres: ['progressive house', 'deep house'],
        source: 'sample',
        matchScore: 78,
        isLiveData: false,
        venueType: 'club'
      }
    ];
  }
}
