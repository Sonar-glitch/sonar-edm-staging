import axios from 'axios';

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}

export default async function handler(req, res) {
  try {
    console.log('Starting Ticketmaster API handler');
    
    // Get API key from environment variables
    const apiKey = process.env.TICKETMASTER_API_KEY || 'C06A6McesLlIUC0D8HR93j16Pwjj2Kdd';
    
    console.log('Using Ticketmaster API key:', apiKey);
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Ticketmaster API key is not configured' 
      });
    }
    
    // Get user's location
    let userLocation;
    try {
      console.log('Fetching user location...');
      const ipResponse = await axios.get('https://ipapi.co/json/');
      userLocation = {
        latitude: ipResponse.data.latitude,
        longitude: ipResponse.data.longitude,
        city: ipResponse.data.city,
        region: ipResponse.data.region,
        country: ipResponse.data.country_name
      };
      console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
      console.log(`Coordinates: ${userLocation.latitude}, ${userLocation.longitude}`);
    } catch (error) {
      console.error('Error getting user location:', error.message);
      console.log('Will use default search without location filtering');
      
      // Use fallback location if ipapi fails
      userLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: "New York",
        region: "NY",
        country: "United States"
      };
      console.log('Using fallback location:', userLocation.city);
    }
    
    // Get user taste data to calculate match percentages
    let userTaste;
    try {
      const userTasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/spotify/user-taste`);
      userTaste = userTasteResponse.data.taste;
      console.log('Successfully fetched user taste data');
    } catch (error) {
      console.error('Error fetching user taste data:', error.message);
      // Continue with default taste data if user taste can't be fetched
      userTaste = {
        topGenres: [
          { label: 'House', value: 85 },
          { label: 'Techno', value: 70 },
          { label: 'Trance', value: 60 },
          { label: 'Dubstep', value: 40 },
          { label: 'Drum & Bass', value: 75 },
          { label: 'Future Bass', value: 55 }
        ]
      };
      console.log('Using default taste data instead');
    }
    
    // Extract user's top genres for matching
    const userGenres = userTaste.topGenres.map(genre => genre.label.toLowerCase());
    console.log('User genres for matching:', userGenres);
    
    // Set up parameters for Ticketmaster API
    const params = {
      apikey: apiKey,
      classificationName: 'music',
      // Broader keyword search to catch more EDM events
      keyword: 'electronic OR dance OR dj OR festival OR rave',
      size: 100, // Increased from 50 to get more results
      sort: 'date,asc',
      startDateTime: new Date().toISOString().slice(0, 19) + 'Z' // Current time in ISO format
    };
    
    // Add location parameters if user location is available
    if (userLocation) {
      params.latlong = `${userLocation.latitude},${userLocation.longitude}`;
      params.radius = '100'; // 100 mile radius
      params.unit = 'miles';
      console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
    }
    
    console.log('Ticketmaster API request params:', JSON.stringify(params));
    
    // Call Ticketmaster API with timeout and retry logic
    let response;
    let ticketmasterEvents = [];
    let ticketmasterError = null;
    
    try {
      console.log('Making Ticketmaster API request...');
      response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
        params,
        timeout: 10000 // 10 second timeout
      });
      console.log('Ticketmaster API request successful');
      
      // Check if we have events in the response
      if (response.data._embedded && response.data._embedded.events) {
        ticketmasterEvents = response.data._embedded.events;
        console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
      } else {
        console.log('No events found in Ticketmaster response');
        ticketmasterError = 'No events found from Ticketmaster';
      }
    } catch (error) {
      console.error('Ticketmaster API request failed:', error.message);
      ticketmasterError = error.message;
      
      // Try one more time with a simpler query
      try {
        console.log('Retrying with simpler query...');
        params.keyword = 'electronic';
        delete params.classificationName; // Remove classification to broaden search
        
        response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
          params,
          timeout: 10000
        });
        
        if (response.data._embedded && response.data._embedded.events) {
          ticketmasterEvents = response.data._embedded.events;
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry`);
          ticketmasterError = null;
        } else {
          console.log('No events found in Ticketmaster retry response');
        }
      } catch (retryError) {
        console.error('Ticketmaster retry also failed:', retryError.message);
        ticketmasterError = `${error.message} (retry also failed: ${retryError.message})`;
      }
    }
    
    // Process Ticketmaster events if available
    const processedTicketmasterEvents = ticketmasterEvents.map(event => {
      // Extract event genres
      let eventGenres = [];
      if (event.classifications && event.classifications.length > 0) {
        const classification = event.classifications[0];
        if (classification.genre && classification.genre.name !== 'Undefined') {
          eventGenres.push(classification.genre.name);
        }
        if (classification.subGenre && classification.subGenre.name !== 'Undefined') {
          eventGenres.push(classification.subGenre.name);
        }
        if (classification.segment && classification.segment.name !== 'Undefined') {
          eventGenres.push(classification.segment.name);
        }
      }
      
      // If no genres found, extract from name or use defaults
      if (eventGenres.length === 0) {
        const eventName = event.name.toLowerCase();
        if (eventName.includes('techno')) eventGenres.push('Techno');
        if (eventName.includes('house')) eventGenres.push('House');
        if (eventName.includes('trance')) eventGenres.push('Trance');
        if (eventName.includes('dubstep')) eventGenres.push('Dubstep');
        if (eventName.includes('drum') && eventName.includes('bass')) eventGenres.push('Drum & Bass');
        if (eventName.includes('edm')) eventGenres.push('EDM');
        if (eventName.includes('dj')) eventGenres.push('DJ');
        if (eventName.includes('electronic')) eventGenres.push('Electronic');
        if (eventName.includes('dance')) eventGenres.push('Dance');
        if (eventName.includes('festival')) eventGenres.push('Festival');
        
        // If still no genres, use default
        if (eventGenres.length === 0) {
          eventGenres = ['Electronic', 'Dance'];
        }
      }
      
      // Calculate match percentage
      let matchScore = 0;
      let matchCount = 0;
      
      eventGenres.forEach(eventGenre => {
        const normalizedEventGenre = eventGenre.toLowerCase();
        
        userGenres.forEach((userGenre, index) => {
          // Check for partial matches in genre names
          if (normalizedEventGenre.includes(userGenre) || userGenre.includes(normalizedEventGenre)) {
            // Weight the match by the genre's importance to the user
            const genreWeight = userTaste.topGenres[index].value / 100;
            matchScore += genreWeight;
            matchCount++;
          }
        });
      });
      
      // Calculate final match percentage
      let match = 0;
      if (matchCount > 0) {
        match = Math.round((matchScore / matchCount) * 100);
      } else {
        // Base match for all EDM events
        match = 20;
      }
      
      // Ensure match is between 0-100
      match = Math.max(0, Math.min(100, match));
      
      // Extract venue information
      const venue = event._embedded?.venues?.[0] || {};
      
      // Calculate distance from user if location is available
      let distance = null;
      if (userLocation && venue.location) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(venue.location.latitude),
          parseFloat(venue.location.longitude)
        );
      }
      
      // Format event data
      return {
        id: event.id,
        source: 'ticketmaster',
        name: event.name,
        date: event.dates.start.dateTime,
        image: event.images && event.images.length > 0 
          ? event.images.find(img => img.ratio === '16_9')?.url || event.images[0].url 
          : null,
        venue: {
          id: venue.id,
          name: venue.name || 'Unknown Venue',
          location: venue.city ? `${venue.city.name}, ${venue.state?.stateCode || ''}` : 'Location Unknown',
          address: venue.address?.line1,
          coordinates: venue.location ? {
            latitude: venue.location.latitude,
            longitude: venue.location.longitude
          } : null
        },
        genres: eventGenres,
        match: match,
        ticketLink: event.url,
        distance: distance
      };
    });
    
    // Now fetch from EDMtrain API as backup
    let edmtrainEvents = [];
    let edmtrainError = null;
    
    try {
      console.log('Fetching events from EDMtrain API...');
      const edmtrainApiKey = process.env.EDMTRAIN_API_KEY || 'b5143e2e-21f2-4b45-b537-0b5b9ec9bdad';
      
      // Construct EDMtrain API request
      let edmtrainUrl = 'https://edmtrain.com/api/events';
      let edmtrainParams = { client: edmtrainApiKey };
      
      // Add location parameters if available
      if (userLocation) {
        if (userLocation.city && userLocation.region) {
          edmtrainParams.city = userLocation.city;
          edmtrainParams.state = userLocation.region;
        } else {
          // Use latitude/longitude with radius
          edmtrainParams.latitude = userLocation.latitude;
          edmtrainParams.longitude = userLocation.longitude;
          edmtrainParams.radius = 100; // 100 mile radius
        }
      }
      
      const edmtrainResponse = await axios.get(edmtrainUrl, { 
        params: edmtrainParams,
        timeout: 10000
      });
      
      if (edmtrainResponse.data && edmtrainResponse.data.data) {
        edmtrainEvents = edmtrainResponse.data.data;
        console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
      } else {
        console.log('No events found in EDMtrain response');
        edmtrainError = 'No events found from EDMtrain';
      }
    } catch (error) {
      console.error('EDMtrain API request failed:', error.message);
      edmtrainError = error.message;
    }
    
    // Process EDMtrain events
    const processedEdmtrainEvents = edmtrainEvents.map(event => {
      // Extract genres from artists
      let eventGenres = [];
      if (event.artistList && event.artistList.length > 0) {
        event.artistList.forEach(artist => {
          if (artist.genre) {
            eventGenres.push(artist.genre);
          }
        });
      }
      
      // If no genres found, use default EDM genres
      if (eventGenres.length === 0) {
        eventGenres = ['Electronic', 'Dance'];
      }
      
      // Calculate match percentage
      let matchScore = 0;
      let matchCount = 0;
      
      eventGenres.forEach(eventGenre => {
        const normalizedEventGenre = eventGenre.toLowerCase();
        
        userGenres.forEach((userGenre, index) => {
          // Check for partial matches in genre names
          if (normalizedEventGenre.includes(userGenre) || userGenre.includes(normalizedEventGenre)) {
            // Weight the match by the genre's importance to the user
            const genreWeight = userTaste.topGenres[index].value / 100;
            matchScore += genreWeight;
            matchCount++;
          }
        });
      });
      
      // Calculate final match percentage
      let match = 0;
      if (matchCount > 0) {
        match = Math.round((matchScore / matchCount) * 100);
      } else {
        // Base match for all EDM events
        match = 20;
      }
      
      // Ensure match is between 0-100
      match = Math.max(0, Math.min(100, match));
      
      // Calculate distance if venue coordinates are available
      let distance = null;
      if (userLocation && event.venue.latitude && event.venue.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(event.venue.latitude),
          parseFloat(event.venue.longitude)
        );
      }
      
      // Format event data
      return {
        id: `edmtrain-${event.id}`,
        source: 'edmtrain',
        name: event.name || (event.artistList.length > 0 ? event.artistList[0].name : 'EDM Event'),
        date: event.date,
        image: event.imageUrl || 'https://example.com/edm-event-placeholder.jpg',
        venue: {
          id: `edmtrain-venue-${event.venue.id}`,
          name: event.venue.name,
          location: `${event.venue.location}, ${event.venue.state}`,
          address: event.venue.address,
          coordinates: event.venue.latitude && event.venue.longitude ? {
            latitude: event.venue.latitude,
            longitude: event.venue.longitude
          } : null
        },
        genres: eventGenres,
        match: match,
        ticketLink: event.ticketLink,
        distance: distance
      };
    });
    
    // Combine events from both sources
    let allEvents = [...processedTicketmasterEvents, ...processedEdmtrainEvents];
    
    // Add mock events if no real events found to ensure we have something to display
    if (allEvents.length === 0) {
      console.log('No events found from either source, adding mock events');
      
      // Create mock events based on user location and taste
      const mockEvents = [
        {
          id: 'mock-1',
          source: 'mock',
          name: 'House Music Festival',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          image: 'https://example.com/house-festival.jpg',
          venue: {
            id: 'mock-venue-1',
            name: 'Central Park',
            location: userLocation ? `${userLocation.city}, ${userLocation.region}` : 'New York, NY',
            address: '5th Ave',
            coordinates: userLocation ? {
              latitude: userLocation.latitude + 0.01,
              longitude: userLocation.longitude + 0.01
            } : null
          },
          genres: ['House', 'Electronic', 'Dance'],
          match: 85,
          ticketLink: 'https://example.com/tickets',
          distance: 1.2
        },
        {
          id: 'mock-2',
          source: 'mock',
          name: 'Techno Underground',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
          image: 'https://example.com/techno-underground.jpg',
          venue: {
            id: 'mock-venue-2',
            name: 'The Warehouse',
            location: userLocation ? `${userLocation.city}, ${userLocation.region}` : 'Chicago, IL',
            address: '123 Main St',
            coordinates: userLocation ? {
              latitude: userLocation.latitude - 0.02,
              longitude: userLocation.longitude - 0.01
            } : null
          },
          genres: ['Techno', 'Underground', 'Electronic'],
          match: 75,
          ticketLink: 'https://example.com/tickets',
          distance: 2.5
        },
        {
          id: 'mock-3',
          source: 'mock',
          name: 'Trance Nation',
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
          image: 'https://example.com/trance-nation.jpg',
          venue: {
            id: 'mock-venue-3',
            name: 'Mega Club',
            location: userLocation ? `${userLocation.city}, ${userLocation.region}` : 'Miami, FL',
            address: '456 Ocean Dr',
            coordinates: userLocation ? {
              latitude: userLocation.latitude + 0.03,
              longitude: userLocation.longitude - 0.02
            } : null
          },
          genres: ['Trance', 'Progressive', 'Electronic'],
          match: 85,
          ticketLink: 'https://example.com/tickets',
          distance: 3.7
        }
      ];
      
      allEvents = mockEvents;
    }
    
    // Filter events by distance if user location is available
    let filteredEvents = allEvents;
    if (userLocation) {
      // Keep events within 100 miles or those without distance info
      filteredEvents = allEvents.filter(event => {
        return !event.distance || event.distance <= 100;
      });
      console.log(`Filtered to ${filteredEvents.length} events within 100 miles`);
      
      // If no events within 100 miles, use all events
      if (filteredEvents.length === 0) {
        filteredEvents = allEvents;
        console.log('No events within 100 miles, using all events');
      }
    }
    
    // Sort by match percentage (highest first)
    const sortedEvents = filteredEvents.sort((a, b) => b.match - a.match);
    
    console.log(`Returning ${sortedEvents.length} events`);
    
    res.status(200).json({ 
      success: true, 
      events: sortedEvents,
      userLocation: userLocation,
      apiStatus: {
        ticketmaster: ticketmasterError ? { error: ticketmasterError } : { success: true, count: processedTicketmasterEvents.length },
        edmtrain: edmtrainError ? { error: edmtrainError } : { success: true, count: processedEdmtrainEvents.length }
      }
    });
  } catch (error) {
    console.error('Unexpected error in events API handler:', error.message);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch events',
      details: error.message
    });
  }
}
