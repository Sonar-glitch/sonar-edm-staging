// Sample events for fallback
const sampleEvents = [
  {
    name: "House & Techno Night",
    venue: "CODA",
    city: "Toronto",
    address: "794 Bathurst St",
    date: "2025-05-03",
    time: "22:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://ticketmaster.ca",
    matchScore: 85
  },
  {
    name: "Deep House Sessions",
    venue: "Rebel",
    city: "Toronto",
    address: "11 Polson St",
    date: "2025-05-10",
    time: "21:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://ticketmaster.ca",
    matchScore: 80
  },
  {
    name: "Techno Underground",
    venue: "Vertigo",
    city: "Toronto",
    address: "567 Queen St W",
    date: "2025-05-17",
    time: "23:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://ticketmaster.ca",
    matchScore: 75
  }
];

const handler = async (req, res) => {
  console.log('API events endpoint called');
  
  // Extract location parameters with fallbacks
  const lat = req.query.lat || '43.65';
  const lon = req.query.lon || '-79.38';
  const city = req.query.city || 'Toronto';
  const radius = req.query.radius || '100';
  
  console.log(`Fetching events with location: {lat: '${lat}', lon: '${lon}', city: '${city}'}`);
  
  try {
    // Attempt to fetch from Ticketmaster API
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
      console.warn('Ticketmaster API key not found in environment variables');
      throw new Error('API key not configured');
    }
    
    // Construct the Ticketmaster API URL
    const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&latlong=${lat},${lon}&radius=${radius}&classificationName=music&size=50`;
    
    console.log(`Making request to Ticketmaster API: ${ticketmasterUrl}`);
    
    const response = await fetch(ticketmasterUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process Ticketmaster events
    let events = [];
    if (data._embedded && data._embedded.events) {
      events = data._embedded.events.map(event => {
        // Extract venue info
        const venue = event._embedded?.venues?.[0]?.name || 'Unknown Venue';
        const city = event._embedded?.venues?.[0]?.city?.name || 'Unknown City';
        const address = event._embedded?.venues?.[0]?.address?.line1 || '';
        
        // Extract image
        let image = 'https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg';
        if (event.images && event.images.length > 0) {
          const mediumImage = event.images.find(img => img.width > 300 && img.width < 800);
          image = mediumImage ? mediumImage.url : event.images[0].url;
        }
        
        // Extract date and time
        const date = event.dates?.start?.localDate || 'TBD';
        const time = event.dates?.start?.localTime || 'TBD';
        
        return {
          id: event.id,
          name: event.name,
          venue,
          city,
          address,
          date,
          time,
          image,
          url: event.url || '#',
          matchScore: Math.floor(Math.random() * 30) + 70 // Random match score between 70-100
        };
      });
      
      console.log(`Found ${events.length} events from Ticketmaster API`);
    } else {
      console.warn('No events found in Ticketmaster API response, using fallback');
      throw new Error('No events in response');
    }
    
    // Return the events
    res.status(200).json({
      events,
      source: 'ticketmaster',
      location: { lat, lon, city }
    });
    
  } catch (error) {
    console.error('Error fetching events from Ticketmaster:', error);
    
    // Always return sample events as fallback
    console.log('Using sample events as fallback');
    res.status(200).json({
      events: sampleEvents,
      source: 'fallback',
      error: error.message,
      location: { lat, lon, city }
    });
  }
};

export default handler;
