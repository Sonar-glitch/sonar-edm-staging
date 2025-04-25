import axios from 'axios';
import { getCachedData, cacheData } from '../../../lib/cache';
export const config = {
  api: {
    responseLimit: false,
  },
};
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
    console.log('Starting Events API handler');
    
    // Get API keys from environment variables
    const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
    const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
    
    console.log('Using Ticketmaster API key:', ticketmasterApiKey ? 'Available' : 'Not available');
    console.log('Using EDMtrain API key:', edmtrainApiKey ? 'Available' : 'Not available');
    
    if (!ticketmasterApiKey && !edmtrainApiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'No API keys configured for event sources' 
      });
    }
    
    // Get user's location
    let userLocation;
    try {
      // Check for cached location data
      const cachedLocation = await getCachedData('ipapi/location', {});
      
      if (cachedLocation) {
        userLocation = cachedLocation;
        console.log('Using cached location data');
      } else {
        console.log('Fetching user location...');
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
        
        console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
        console.log(`Coordinates: ${userLocation.latitude}, ${userLocation.longitude}`);
      }
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
      // Check for cached user taste data
      const cachedTaste = await getCachedData('events/user-taste', {});
      
      if (cachedTaste) {
        userTaste = cachedTaste;
        console.log('Using cached user taste data');
      } else {
        const userTasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/spotify/user-taste`);
        userTaste = userTasteResponse.data;
        
        // Cache user taste data for 24 hours (86400 seconds)
        await cacheData('events/user-taste', {}, userTaste, 86400);
        
        console.log('Successfully fetched user taste data');
      }
    } catch (error) {
      console.error('Error fetching user taste data:', error.message);
      // Continue with default taste data if user taste can't be fetched
      userTaste = {
        genres: [
          { name: 'House', score: 85 },
          { name: 'Techno', score: 70 },
          { name: 'Trance', score: 60 },
          { name: 'Dubstep', score: 40 },
          { name: 'Drum & Bass', score: 75 },
          { name: 'Future Bass', score: 55 }
        ]
      };
      console.log('Using default taste data instead');
    }
    
    // Extract user's top genres for matching
    const userGenres = userTaste.genres ? 
      userTaste.genres.map(genre => genre.name.toLowerCase()) : 
      ['house', 'techno', 'trance', 'electronic', 'dance'];
    
    console.log('User genres for matching:', userGenres);
    
    // Initialize arrays for events from different sources
    let ticketmasterEvents = [];
    let edmtrainEvents = [];
    let ticketmasterError = null;
    let edmtrainError = null;
    
    // Fetch from Ticketmaster API
    if (ticketmasterApiKey) {
      try {
        // Check for cached Ticketmaster events
        const cacheParams = {
          lat: userLocation.latitude,
          lon: userLocation.longitude
        };
        const cachedTicketmaster = await getCachedData('ticketmaster/events', cacheParams);
        
        if (cachedTicketmaster) {
          console.log('Using cached Ticketmaster events');
          ticketmasterEvents = cachedTicketmaster;
        } else {
          console.log('Making Ticketmaster API request...');
          
          // Set up parameters for Ticketmaster API
          const params = {
            apikey: ticketmasterApiKey,
            classificationName: 'music',
            // Broader keyword search to catch more EDM events
            keyword: 'electronic OR dance OR dj OR festival OR rave',
            size: 100, // Increased from 50 to get more results
            sort: 'date,asc',
            startDateTime: new Date().toISOString().slice(0, 19) + 'Z' // Current time in ISO format
          };
          
          // Add location parameters if user location is available
          if (userLocation) {
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        params.latlong = `${userLocation.latitude},${userLocation.longitude}`;
        params.radius = "100"; // 100 mile radius
        params.unit = "miles";
        console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
      } else {
        console.log("No valid location data available, skipping location filter");
      }
            params.radius = '100'; // 100 mile radius
            params.unit = 'miles';
            console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
          }
          
          console.log('Ticketmaster API request params:', JSON.stringify(params));
          
          const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
            params,
            timeout: 15000 // 15 second timeout
          });
          
          console.log('Ticketmaster API request successful');
          
          // Check if we have events in the response
          if (response.data._embedded && response.data._embedded.events) {
            ticketmasterEvents = response.data._embedded.events;
            
            // Cache Ticketmaster events for 12 hours (43200 seconds)
            await cacheData('ticketmaster/events', cacheParams, ticketmasterEvents, 43200);
            
            console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
          } else {
            console.log('No events found in Ticketmaster response');
            ticketmasterError = 'No events found from Ticketmaster';
            
            // Try one more time with a simpler query
            console.log('Retrying with simpler query...');
            params.keyword = 'electronic';
            delete params.classificationName; // Remove classification to broaden search
            
            const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
              params,
              timeout: 15000
            });
            
            if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
              ticketmasterEvents = retryResponse.data._embedded.events;
              
              // Cache Ticketmaster events for 12 hours (43200 seconds)
              await cacheData('ticketmaster/events', cacheParams, ticketmasterEvents, 43200);
              
              console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry`);
              ticketmasterError = null;
            } else {
              console.log('No events found in Ticketmaster retry response');
            }
          }
        }
      } catch (error) {
        console.error('Ticketmaster API request failed:', error.message);
        ticketmasterError = error.message;
        
        // Try one more time with a simpler query
        try {
      console.log("Retrying with simpler query after error...");
      try {
        const retryParams = {
          apikey: ticketmasterApiKey,
          keyword: "electronic",
          size: 50,
          sort: "date,asc",
          startDateTime: new Date().toISOString().slice(0, 19) + "Z"
        };
        
        // Only add location if we have valid coordinates
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          retryParams.latlong = `${userLocation.latitude},${userLocation.longitude}`;
          retryParams.radius = "100";
          retryParams.unit = "miles";
        }
        
        console.log("Ticketmaster retry params:", JSON.stringify(retryParams));
        
        const retryResponse = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", { 
          params: retryParams,
          timeout: 15000
        });
        
        if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
          ticketmasterEvents = retryResponse.data._embedded.events;
          
          // Cache Ticketmaster events for 12 hours (43200 seconds)
          await cacheData("ticketmaster/events", {
            lat: userLocation?.latitude,
            lon: userLocation?.longitude
          }, ticketmasterEvents, 43200);
          
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
          ticketmasterError = null;
        } else {
          console.log("No events found in Ticketmaster retry response after error");
        }
      } catch (retryError) {
        console.error("Ticketmaster retry also failed:", retryError.message);
        ticketmasterError = `${error.message} (retry also failed: ${retryError.message})`;
      }
          
          const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
            params,
            timeout: 15000
          });
          
          if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
            ticketmasterEvents = retryResponse.data._embedded.events;
            
            // Cache Ticketmaster events for 12 hours (43200 seconds)
            await cacheData('ticketmaster/events', {
              lat: userLocation.latitude,
              lon: userLocation.longitude
            }, ticketmasterEvents, 43200);
            
            console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
            ticketmasterError = null;
          } else {
            console.log('No events found in Ticketmaster retry response after error');
          }
        } catch (retryError) {
          console.error('Ticketmaster retry also failed:', retryError.message);
          ticketmasterError = `${error.message} (retry also failed: ${retryError.message})`;
        }
      }
    } else {
      console.log('Skipping Ticketmaster API call - no API key configured');
      ticketmasterError = 'Ticketmaster API key not configured';
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
            const genreWeight = userTaste.genres && userTaste.genres[index] ? 
              userTaste.genres[index].score / 100 : 0.5;
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
    
    // Fetch from EDMtrain API
    if (edmtrainApiKey) {
      try {
        // Check for cached EDMtrain events
        const cacheParams = {
          lat: userLocation.latitude,
          lon: userLocation.longitude
        };
        const cachedEdmtrain = await getCachedData('edmtrain/events', cacheParams);
        
        if (cachedEdmtrain) {
          console.log('Using cached EDMtrain events');
          edmtrainEvents = cachedEdmtrain;
        } else {
          console.log('Fetching events from EDMtrain API...');
          
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
          
          console.log('EDMtrain API request params:', JSON.stringify(edmtrainParams));
          
          const edmtrainResponse = await axios.get(edmtrainUrl, { 
            params: edmtrainParams,
            timeout: 15000
          });
          
          if (edmtrainResponse.data && edmtrainResponse.data.data) {
            edmtrainEvents = edmtrainResponse.data.data;
            
            // Cache EDMtrain events for 12 hours (43200 seconds)
            await cacheData('edmtrain/events', cacheParams, edmtrainEvents, 43200);
            
            console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
          } else {
            console.log('No events found in EDMtrain response');
            edmtrainError = 'No events found from EDMtrain';
          }
        }
      } catch (error) {
        console.error('EDMtrain API request failed:', error.message);
        edmtrainError = error.message;
        
        // Try one more time with a simpler query
        try {
          console.log('Retrying EDMtrain with simpler query...');
          const edmtrainUrl = 'https://edmtrain.com/api/events';
          const edmtrainParams = { client: edmtrainApiKey };
          
          const retryResponse = await axios.get(edmtrainUrl, { 
            params: edmtrainParams,
            timeout: 15000
          });
          
          if (retryResponse.data && retryResponse.data.data) {
            edmtrainEvents = retryResponse.data.data;
            
            // Cache EDMtrain events for 12 hours (43200 seconds)
            await cacheData('edmtrain/events', {
              lat: userLocation.latitude,
              lon: userLocation.longitude
            }, edmtrainEvents, 43200);
            
            console.log(`Found ${edmtrainEvents.length} events from EDMtrain retry`);
            edmtrainError = null;
          } else {
            console.log('No events found in EDMtrain retry response');
          }
        } catch (retryError) {
          console.error('EDMtrain retry also failed:', retryError.message);
          edmtrainError = `${error.message} (retry also failed: ${retryError.message})`;
        }
      }
    } else {
      console.log('Skipping EDMtrain API call - no API key configured');
      edmtrainError = 'EDMtrain API key not configured';
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
            const genreWeight = userTaste.genres && userTaste.genres[index] ? 
              userTaste.genres[index].score / 100 : 0.5;
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
      const venue = event.venue || {};
      
      // Calculate distance from user if location is available
      let distance = null;
      if (userLocation && venue.latitude && venue.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(venue.latitude),
          parseFloat(venue.longitude)
        );
      }
      
      // Extract artists
      const artists = event.artistList ? event.artistList.map(artist => artist.name) : [];
      
      // Format event data
      return {
        id: `edmtrain-${event.id}`,
        source: 'edmtrain',
        name: event.name || artists.join(' & ') || 'EDM Event',
        date: event.date,
        image: null, // EDMtrain doesn't provide images
        venue: {
          id: `venue-${venue.id}`,
          name: venue.name || 'Unknown Venue',
          location: venue.location || 'Location Unknown',
          address: venue.address,
          coordinates: venue.latitude && venue.longitude ? {
            latitude: venue.latitude,
            longitude: venue.longitude
          } : null
        },
        genres: eventGenres,
        match: match,
        ticketLink: event.ticketLink,
        distance: distance,
        artists: artists
      };
    });
    
    // Combine events from both sources
    const allEvents = [...processedTicketmasterEvents, ...processedEdmtrainEvents];
    
    // Sort events by match percentage (highest first)
    allEvents.sort((a, b) => b.match - a.match);
    
    // Return events
    return res.status(200).json({
      success: true,
      events: allEvents,
      userLocation,
      sources: {
        ticketmaster: {
          success: !ticketmasterError,
          error: ticketmasterError,
          count: processedTicketmasterEvents.length
        },
        edmtrain: {
          success: !edmtrainError,
          error: edmtrainError,
          count: processedEdmtrainEvents.length
        }
      }
    });
  } catch (error) {
    console.error('Error in events API:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message
    });
  }
}
