import axios from 'axios';
import { getUserLocation } from '@/lib/locationUtils';

export default async function handler(req, res) {
  console.log("Starting Events API handler");
  
  // Get API keys from environment variables
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
  const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
  
  console.log(`Using Ticketmaster API key: ${ticketmasterApiKey ? 'Available' : 'Missing'}`);
  console.log(`Using EDMtrain API key: ${edmtrainApiKey ? 'Available' : 'Missing'}`);
  
  try {
    // Get user location with fallbacks
    let userLocation;
    
    // First check if location is provided in the request
    if (req.query.lat && req.query.lon) {
      userLocation = {
        latitude: parseFloat(req.query.lat),
        longitude: parseFloat(req.query.lon),
        city: req.query.city || 'Unknown',
        region: req.query.region || 'Unknown',
        country: req.query.country || 'Unknown'
      };
      console.log(`Using location from query params: ${userLocation.latitude}, ${userLocation.longitude}`);
    } 
    // Then check if location is in cookies
    else {
      const cookies = req.headers.cookie || '';
      const cookieObj = cookies.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const locationCookie = cookieObj.userLocation;
      
      if (locationCookie) {
        try {
          userLocation = JSON.parse(decodeURIComponent(locationCookie));
          console.log(`Using location from cookie: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
        } catch (e) {
          console.error('Error parsing location cookie:', e);
        }
      }
    }
    
    // If no location found yet, detect from request
    if (!userLocation) {
      userLocation = await getUserLocation(req);
      console.log(`Detected location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    }
    
    // Rest of the function remains the same...
    // Fetch events from Ticketmaster API
    let ticketmasterEvents = [];
    let ticketmasterError = null;
    
    if (ticketmasterApiKey) {
      try {
        console.log("Making Ticketmaster API request...");
        
        // Prepare parameters for Ticketmaster API
        const params = {
          apikey: ticketmasterApiKey,
          classificationName: "music",
          keyword: "electronic OR dance OR dj OR festival OR rave",
          size: 100,
          sort: "date,asc",
          startDateTime: new Date().toISOString().slice(0, 19) + "Z"
        };
        
        // Add location parameters if available
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          params.latlong = `${userLocation.latitude},${userLocation.longitude}`;
          params.radius = "100"; // 100 mile radius
          params.unit = "miles";
          console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
        }
        
        console.log("Ticketmaster API request params:", JSON.stringify(params));
        
        const response = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", { 
          params,
          timeout: 15000
        });
        
        if (response.data._embedded && response.data._embedded.events) {
          ticketmasterEvents = response.data._embedded.events;
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
        } else {
          console.log("No events found in Ticketmaster response");
        }
      } catch (error) {
        console.error("Ticketmaster API request failed:", error.message);
        ticketmasterError = error.message;
        
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
          
          const retryResponse = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", { 
            params: retryParams,
            timeout: 15000
          });
          
          if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
            ticketmasterEvents = retryResponse.data._embedded.events;
            console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
            ticketmasterError = null;
          } else {
            console.log("No events found in Ticketmaster retry response after error");
          }
        } catch (retryError) {
          console.error("Ticketmaster retry also failed:", retryError.message);
          ticketmasterError = `${error.message} (retry also failed: ${retryError.message})`;
        }
      }
    }
    
    // Fetch events from EDMtrain API
    let edmtrainEvents = [];
    let edmtrainError = null;
    
    if (edmtrainApiKey) {
      try {
        console.log("Fetching events from EDMtrain API...");
        
        // Prepare parameters for EDMtrain API
        const params = {
          client: edmtrainApiKey,
          radius: 100 // 100 mile radius
        };
        
        // Add location parameters if available
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          params.latitude = userLocation.latitude;
          params.longitude = userLocation.longitude;
        }
        
        console.log("EDMtrain API request params:", JSON.stringify(params));
        
        const response = await axios.get("https://edmtrain.com/api/events", { 
          params,
          timeout: 15000
        });
        
        if (response.data && response.data.data) {
          edmtrainEvents = response.data.data;
          console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
        } else {
          console.log("No events found in EDMtrain response");
        }
      } catch (error) {
        console.error("EDMtrain API request failed:", error.message);
        edmtrainError = error.message;
      }
    }
    
    // Process and combine events from both sources
    const processedEvents = [];
    
    // Process Ticketmaster events
    if (ticketmasterEvents.length > 0) {
      for (const event of ticketmasterEvents) {
        try {
          // Skip non-music events
          if (!event.classifications || !event.classifications.some(c => c.segment && c.segment.name === "Music")) {
            continue;
          }
          
          // Extract venue information
          const venue = event._embedded?.venues?.[0] || {};
          const venueLocation = venue.location ? {
            latitude: parseFloat(venue.location.latitude),
            longitude: parseFloat(venue.location.longitude)
          } : null;
          
          // Extract date information
          const startDate = event.dates?.start?.dateTime ? new Date(event.dates.start.dateTime) : null;
          
          // Skip past events
          if (startDate && startDate < new Date()) {
            continue;
          }
          
          // Extract genre information
          const genres = [];
          if (event.classifications) {
            for (const classification of event.classifications) {
              if (classification.genre && classification.genre.name && classification.genre.name !== "Undefined") {
                genres.push(classification.genre.name.toLowerCase());
              }
              if (classification.subGenre && classification.subGenre.name && classification.subGenre.name !== "Undefined") {
                genres.push(classification.subGenre.name.toLowerCase());
              }
            }
          }
          
          // Create processed event object
          const processedEvent = {
            id: event.id,
            name: event.name,
            url: event.url,
            date: startDate ? startDate.toISOString() : null,
            venue: {
              name: venue.name || "Unknown Venue",
              city: venue.city?.name || "Unknown City",
              state: venue.state?.name || "Unknown State",
              country: venue.country?.name || "Unknown Country",
              address: venue.address?.line1 || "",
              location: venueLocation
            },
            artists: event._embedded?.attractions?.map(a => ({
              name: a.name,
              url: a.url || null,
              image: a.images && a.images.length > 0 ? a.images[0].url : null
            })) || [],
            genres: genres,
            source: "ticketmaster",
            sourceData: event,
            liveData: true
          };
          
          processedEvents.push(processedEvent);
        } catch (error) {
          console.error("Error processing Ticketmaster event:", error);
        }
      }
    }
    
    // Process EDMtrain events
    if (edmtrainEvents.length > 0) {
      for (const event of edmtrainEvents) {
        try {
          // Skip events without venue
          if (!event.venue) {
            continue;
          }
          
          // Extract venue location
          const venueLocation = event.venue.latitude && event.venue.longitude ? {
            latitude: event.venue.latitude,
            longitude: event.venue.longitude
          } : null;
          
          // Extract date information
          const startDate = event.date ? new Date(event.date) : null;
          
          // Skip past events
          if (startDate && startDate < new Date()) {
            continue;
          }
          
          // Create processed event object
          const processedEvent = {
            id: `edmtrain-${event.id}`,
            name: event.name || "EDM Event",
            url: `https://edmtrain.com/event/${event.id}`,
            date: startDate ? startDate.toISOString() : null,
            venue: {
              name: event.venue.name || "Unknown Venue",
              city: event.venue.location || "Unknown City",
              state: event.venue.state || "Unknown State",
              country: "United States", // EDMtrain only covers US events
              address: `${event.venue.address || ""}, ${event.venue.location || ""}, ${event.venue.state || ""}`,
              location: venueLocation
            },
            artists: event.artistList?.map(a => ({
              name: a.name,
              url: `https://edmtrain.com/artist/${a.id}`,
              image: null
            })) || [],
            genres: ["electronic dance music"], // EDMtrain doesn't provide specific genres
            source: "edmtrain",
            sourceData: event,
            liveData: true
          };
          
          processedEvents.push(processedEvent);
        } catch (error) {
          console.error("Error processing EDMtrain event:", error);
        }
      }
    }
    
    // Add some sample events if we don't have enough real events
    if (processedEvents.length < 10) {
      console.log("Adding sample events to supplement real events");
      
      const sampleEvents = getSampleEvents(userLocation);
      processedEvents.push(...sampleEvents);
    }
    
    // Sort events by date
    processedEvents.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });
    
    // Return the combined events
    return res.status(200).json(processedEvents);
  } catch (error) {
    console.error("Error in events API:", error);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
}

// Function to generate sample events near user location
function getSampleEvents(userLocation) {
  const now = new Date();
  const sampleEvents = [];
  
  // Sample venues (will be adjusted based on user location)
  const sampleVenues = [
    {
      name: "The Underground",
      city: userLocation?.city || "Unknown City",
      state: userLocation?.region || "Unknown State",
      country: userLocation?.country || "Unknown Country",
      address: "123 Main St",
      location: { 
        latitude: userLocation?.latitude ? userLocation.latitude + 0.01 : 40.7128,
        longitude: userLocation?.longitude ? userLocation.longitude + 0.01 : -74.0060
      }
    },
    {
      name: "The Loft",
      city: userLocation?.city || "Unknown City",
      state: userLocation?.region || "Unknown State",
      country: userLocation?.country || "Unknown Country",
      address: "101 Skyline Ave",
      location: { 
        latitude: userLocation?.latitude ? userLocation.latitude - 0.01 : 40.7128,
        longitude: userLocation?.longitude ? userLocation.longitude - 0.01 : -74.0060
      }
    },
    {
      name: "Sunset Park",
      city: userLocation?.city || "Unknown City",
      state: userLocation?.region || "Unknown State",
      country: userLocation?.country || "Unknown Country",
      address: "456 Parkway Dr",
      location: { 
        latitude: userLocation?.latitude ? userLocation.latitude + 0.02 : 40.7128,
        longitude: userLocation?.longitude ? userLocation.longitude + 0.02 : -74.0060
      }
    },
    {
      name: "Club Horizon",
      city: userLocation?.city || "Unknown City",
      state: userLocation?.region || "Unknown State",
      country: userLocation?.country || "Unknown Country",
      address: "789 Downtown Blvd",
      location: { 
        latitude: userLocation?.latitude ? userLocation.latitude - 0.02 : 40.7128,
        longitude: userLocation?.longitude ? userLocation.longitude - 0.02 : -74.0060
      }
    }
  ];
  
  // Sample artists
  const sampleArtists = [
    { name: "Melodic Techno Night", genres: ["melodic techno", "deep house"] },
    { name: "Summer House Festival", genres: ["house", "tech house"] },
    { name: "Progressive Dreams", genres: ["progressive house", "melodic house"] },
    { name: "Techno Warehouse Night", genres: ["techno", "industrial techno"] },
    { name: "Bass Music Showcase", genres: ["dubstep", "trap", "bass"] },
    { name: "Trance Journey", genres: ["trance", "progressive trance"] },
    { name: "Drum & Bass Collective", genres: ["drum & bass", "jungle"] },
    { name: "Future Bass Experience", genres: ["future bass", "electronic"] }
  ];
  
  // Generate 8 sample events
  for (let i = 0; i < 8; i++) {
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + 7 + i * 3); // Events starting in a week, 3 days apart
    
    const venue = sampleVenues[i % sampleVenues.length];
    const artistInfo = sampleArtists[i % sampleArtists.length];
    
    // Create featured artists
    const featuredArtists = [];
    const artistCount = 2 + Math.floor(Math.random() * 3); // 2-4 artists
    
    for (let j = 0; j < artistCount; j++) {
      featuredArtists.push({
        name: ["Tale of Us", "Mind Against", "Mathame", "Charlotte de Witte", "Amelie Lens", "FJAAK", "Disclosure", "Kayranada", "The Blessed Madonna", "Hernan Cattaneo", "Nick Warren", "Guy J"][Math.floor(Math.random() * 12)],
        url: null,
        image: null
      });
    }
    
    sampleEvents.push({
      id: `sample-${i}`,
      name: artistInfo.name,
      url: null,
      date: eventDate.toISOString(),
      venue: venue,
      artists: featuredArtists,
      genres: artistInfo.genres,
      source: "sample",
      liveData: false
    });
  }
  
  return sampleEvents;
}
