import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user location from query parameters if available
    const { lat, lng, radius = 50 } = req.query;
    
    // Try to fetch events from Ticketmaster API
    let events = [];
    try {
      const apiKey = process.env.TICKETMASTER_API_KEY;
      if (!apiKey) {
        throw new Error('Ticketmaster API key not found');
      }
      
      // Build the Ticketmaster API URL
      let ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&classificationName=music&size=50`;
      
      // Add location parameters if available
      if (lat && lng) {
        ticketmasterUrl += `&latlong=${lat},${lng}&radius=${radius}`;
      }
      
      // Add genre filter for EDM events
      ticketmasterUrl += '&genreId=KnvZfZ7vAvF'; // EDM genre ID
      
      const response = await fetch(ticketmasterUrl);
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data._embedded && data._embedded.events) {
        events = data._embedded.events.map(event => ({
          id: event.id,
          name: event.name,
          date: event.dates.start.dateTime,
          venue: {
            name: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
            location: {
              city: event._embedded?.venues?.[0]?.city?.name || 'Unknown City',
              state: event._embedded?.venues?.[0]?.state?.name || '',
              country: event._embedded?.venues?.[0]?.country?.name || ''
            },
            coordinates: {
              latitude: event._embedded?.venues?.[0]?.location?.latitude || null,
              longitude: event._embedded?.venues?.[0]?.location?.longitude || null
            }
          },
          images: event.images || [],
          url: event.url,
          genres: event.classifications?.[0]?.genre?.name ? [event.classifications[0].genre.name] : ['EDM'],
          correlation: Math.random() * 0.5 + 0.5, // Simulate correlation score between 0.5 and 1.0
          source: 'ticketmaster'
        }));
      }
    } catch (ticketmasterError) {
      console.error('Error fetching from Ticketmaster:', ticketmasterError);
      // Continue to try EDMTrain if Ticketmaster fails
    }
    
    // Try to fetch events from EDMTrain API if Ticketmaster returned no events
    if (events.length === 0) {
      try {
        const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
        if (!edmtrainApiKey) {
          throw new Error('EDMTrain API key not found');
        }
        
        // Build the EDMTrain API URL
        let edmtrainUrl = 'https://edmtrain.com/api/events?';
        
        // Add location parameters if available
        if (lat && lng) {
          edmtrainUrl += `&latitude=${lat}&longitude=${lng}&radius=${radius}`;
        }
        
        const response = await fetch(edmtrainUrl, {
          headers: {
            'Authorization': edmtrainApiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`EDMTrain API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          events = data.data.map(event => ({
            id: event.id,
            name: event.name || 'EDM Event',
            date: event.date,
            venue: {
              name: event.venue?.name || 'Unknown Venue',
              location: {
                city: event.venue?.location || 'Unknown City',
                state: event.venue?.state || '',
                country: 'United States'
              },
              coordinates: {
                latitude: event.venue?.latitude || null,
                longitude: event.venue?.longitude || null
              }
            },
            images: event.artistList?.length > 0 && event.artistList[0].img ? 
                   [{ url: event.artistList[0].img }] : [],
            url: `https://edmtrain.com/event/${event.id}`,
            genres: event.artistList?.length > 0 ? 
                   event.artistList.map(artist => artist.genre || 'EDM').filter((v, i, a) => a.indexOf(v) === i) : 
                   ['EDM'],
            correlation: Math.random() * 0.5 + 0.5, // Simulate correlation score between 0.5 and 1.0
            source: 'edmtrain'
          }));
        }
      } catch (edmtrainError) {
        console.error('Error fetching from EDMTrain:', edmtrainError);
        // If both APIs fail, we'll use mock data as a last resort
      }
    }
    
    // If both APIs failed, use mock data as a fallback
    if (events.length === 0) {
      // Generate mock events with realistic data
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
    }
    
    // Sort events by date (closest first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return res.status(200).json(events);
  } catch (error) {
    console.error('Error in events API:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}
