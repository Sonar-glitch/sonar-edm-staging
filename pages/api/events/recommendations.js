import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";

// Utility function to calculate match score between user tastes and event
function calculateMatchScore(userGenres, eventGenres) {
  let score = 0;
  let totalWeight = 0;
  
  // Calculate weighted score based on genre matches
  Object.entries(userGenres).forEach(([genre, weight]) => {
    totalWeight += weight;
    if (eventGenres.includes(genre.toLowerCase())) {
      score += weight;
    } else {
      // Check for partial matches
      const partialMatches = eventGenres.filter(eventGenre => 
        eventGenre.toLowerCase().includes(genre.toLowerCase()) || 
        genre.toLowerCase().includes(eventGenre.toLowerCase())
      );
      
      if (partialMatches.length > 0) {
        score += (weight * 0.6); // Partial match gives 60% of the weight
      }
    }
  });
  
  // Normalize score to percentage
  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
}

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Get user profile from database
    const userProfile = await db
      .collection("users")
      .findOne({ email: session.user.email });
    
    if (!userProfile || !userProfile.musicTaste) {
      return res.status(404).json({ 
        error: "User profile or music taste not found",
        events: [] // Return empty events array
      });
    }
    
    // Get user genres from profile or fetch from Spotify
    const userGenres = userProfile.musicTaste.genreProfile || {};
    
    // Determine user's location (default to New York if not set)
    const userLocation = userProfile.preferences?.location || "New York";
    
    // Query EDMTrain API for events
    const API_KEY = process.env.EDMTRAIN_API_KEY;
    const currentDate = new Date().toISOString().split('T')[0]; // Today's date
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Events for next 3 months
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const edmTrainResponse = await fetch(
      `https://edmtrain.com/api/events?locationName=${encodeURIComponent(userLocation)}&startDate=${currentDate}&endDate=${endDateStr}&client=${API_KEY}`
    );
    
    if (!edmTrainResponse.ok) {
      throw new Error("Failed to fetch events from EDMTrain");
    }
    
    const edmEvents = await edmTrainResponse.json();
    
    // Backup - query Ticketmaster API for more events
    const TM_API_KEY = process.env.TICKETMASTER_API_KEY;
    const ticketmasterResponse = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=electronic&city=${encodeURIComponent(userLocation)}&startDateTime=${currentDate}T00:00:00Z&endDateTime=${endDateStr}T23:59:59Z&size=50&apikey=${TM_API_KEY}`
    );
    
    let tmEvents = [];
    if (ticketmasterResponse.ok) {
      const tmData = await ticketmasterResponse.json();
      if (tmData._embedded && tmData._embedded.events) {
        tmEvents = tmData._embedded.events;
      }
    }
    
    // Format and combine events
    let events = [];
    
    // Process EDMTrain events
    if (edmEvents.data && edmEvents.data.length > 0) {
      events = edmEvents.data.map(event => {
        // Extract genres from artists
        const eventGenres = event.artistList
          ? event.artistList.flatMap(artist => artist.genre || [])
          : [];
        
        return {
          id: `edm-${event.id}`,
          name: event.name || "Unnamed Event",
          venue: event.venue ? event.venue.name : "Unknown Venue",
          location: event.venue ? `${event.venue.location}` : userLocation,
          date: event.date,
          artists: event.artistList ? event.artistList.map(a => a.name) : [],
          price: event.ticketLink ? 65 : 0, // Placeholder price if not available
          primaryGenre: eventGenres[0] || "Electronic",
          genres: eventGenres,
          source: "edmtrain",
          url: event.ticketLink || ""
        };
      });
    }
    
    // Process Ticketmaster events
    if (tmEvents.length > 0) {
      const tmFormatted = tmEvents.map(event => {
        // Extract genres
        const genres = [];
        if (event.classifications) {
          event.classifications.forEach(c => {
            if (c.genre && c.genre.name && c.genre.name !== "Undefined") {
              genres.push(c.genre.name);
            }
            if (c.subGenre && c.subGenre.name && c.subGenre.name !== "Undefined") {
              genres.push(c.subGenre.name);
            }
          });
        }
        
        // Get venue and location
        let venue = "Unknown Venue";
        let location = userLocation;
        
        if (event._embedded && event._embedded.venues && event._embedded.venues[0]) {
          venue = event._embedded.venues[0].name || venue;
          location = event._embedded.venues[0].city 
            ? event._embedded.venues[0].city.name 
            : location;
        }
        
        // Get price range
        let price = 0;
        if (event.priceRanges && event.priceRanges[0]) {
          price = event.priceRanges[0].min || 0;
        }
        
        return {
          id: `tm-${event.id}`,
          name: event.name,
          venue: venue,
          location: location,
          date: event.dates && event.dates.start ? event.dates.start.dateTime : null,
          artists: event.name.split(/[,&]/), // Simple artist extraction from name
          price: price,
          primaryGenre: genres[0] || "Electronic",
          genres: genres,
          source: "ticketmaster",
          url: event.url || ""
        };
      });
      
      events = [...events, ...tmFormatted];
    }
    
    // If no events found, provide a placeholder set
    if (events.length === 0) {
      events = [
        {
          id: "placeholder-1",
          name: "Techno Dreamscape",
          venue: "Warehouse 23",
          location: userLocation,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          artists: ["Unknown Artist"],
          price: 45,
          primaryGenre: "Techno",
          genres: ["Techno", "Electronic"],
          source: "placeholder",
          url: ""
        },
        {
          id: "placeholder-2",
          name: "House Vibrations",
          venue: "Club Echo",
          location: userLocation,
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
          artists: ["Unknown Artist"],
          price: 35,
          primaryGenre: "House",
          genres: ["House", "Deep House"],
          source: "placeholder",
          url: ""
        }
      ];
    }
    
    // Calculate match scores for each event
    events = events.map(event => ({
      ...event,
      matchScore: calculateMatchScore(userGenres, event.genres)
    }));
    
    // Sort by match score
    events.sort((a, b) => b.matchScore - a.matchScore);
    
    return res.status(200).json({
      events: events.slice(0, 20), // Return top 20 matches
      location: userLocation
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch event recommendations",
      message: error.message
    });
  }
}