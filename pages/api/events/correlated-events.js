import axios from 'axios';
import { getUserLocation, getDistance } from '@/lib/locationUtils';

export default async function handler(req, res) {
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
      console.log(`Using location from query params for correlated events: ${userLocation.latitude}, ${userLocation.longitude}`);
    } 
    // Then check if location is in session
    else if (req.session?.userLocation) {
      userLocation = req.session.userLocation;
      console.log(`Using location from session for correlated events: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    } 
    // Otherwise detect from request
    else {
      userLocation = await getUserLocation(req);
      console.log(`Detected location for correlated events: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    }
    
    // Get user taste profile
    let userTaste = null;
    
    try {
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
    } catch (error) {
      console.error("Error fetching user taste data:", error.message);
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Extract user genres
    const userGenres = [];
    
    if (userTaste.genreProfile) {
      for (const [genre, score] of Object.entries(userTaste.genreProfile)) {
        if (score > 30) { // Only include genres with score > 30
          userGenres.push(genre.toLowerCase());
        }
      }
    }
    
    console.log("User genres for correlation:", userGenres);
    
    // Fetch all events
    let allEvents = [];
    
    try {
      // Use the location from the request
      const eventsUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/events`;
      const eventsResponse = await axios.get(eventsUrl, {
        params: {
          lat: userLocation.latitude,
          lon: userLocation.longitude,
          city: userLocation.city,
          region: userLocation.region,
          country: userLocation.country
        }
      });
      
      allEvents = eventsResponse.data;
      console.log(`Found ${allEvents.length} events for correlation`);
    } catch (error) {
      console.error("Error fetching events:", error.message);
      return res.status(500).json({ error: "Failed to fetch events" });
    }
    
    // Calculate correlation scores
    const correlatedEvents = allEvents.map(event => {
      let correlationScore = 0;
      
      // Match based on genres
      if (event.genres && userGenres.length > 0) {
        for (const genre of event.genres) {
          if (userGenres.includes(genre.toLowerCase())) {
            correlationScore += 25; // Add 25 points for each matching genre
          }
        }
      }
      
      // Adjust score based on venue location if available
      if (event.venue && event.venue.location && userLocation) {
        const distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.venue.location.latitude,
          event.venue.location.longitude
        );
        
        // Closer events get higher scores
        if (distance < 5) {
          correlationScore += 20; // Within 5km
        } else if (distance < 10) {
          correlationScore += 15; // Within 10km
        } else if (distance < 20) {
          correlationScore += 10; // Within 20km
        } else if (distance < 50) {
          correlationScore += 5; // Within 50km
        }
      }
      
      // Add some randomness to avoid identical scores
      correlationScore += Math.random() * 5;
      
      // Ensure score is between 0 and 100
      correlationScore = Math.min(100, Math.max(0, correlationScore));
      
      return {
        ...event,
        correlationScore: Math.round(correlationScore)
      };
    });
    
    // Sort by correlation score (descending)
    correlatedEvents.sort((a, b) => b.correlationScore - a.correlationScore);
    
    // Return the correlated events
    return res.status(200).json(correlatedEvents);
  } catch (error) {
    console.error("Error in correlated events API:", error);
    return res.status(500).json({ error: "Failed to fetch correlated events" });
  }
}
