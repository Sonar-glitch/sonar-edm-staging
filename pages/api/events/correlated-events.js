// Enhanced correlated-events.js with improved genre matching and score calculation
import axios from 'axios';
import { getUserLocation, getDistance } from '@/lib/locationUtils';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Sample events with valid links - these will always be available as fallback
const sampleEvents = [
  {
    name: "House & Techno Night",
    venue: "CODA",
    city: "Toronto",
    address: "794 Bathurst St",
    date: "2025-05-03",
    time: "22:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/electronic-dance-music-tickets/category/10001",
    matchScore: 85,
    source: "sample",
    genres: ["House", "Techno"]
  },
  {
    name: "Deep House Sessions",
    venue: "Rebel",
    city: "Toronto",
    address: "11 Polson St",
    date: "2025-05-10",
    time: "21:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/music-festivals-tickets/category/10005",
    matchScore: 80,
    source: "sample",
    genres: ["Deep House"]
  },
  {
    name: "Techno Underground",
    venue: "Vertigo",
    city: "Toronto",
    address: "567 Queen St W",
    date: "2025-05-17",
    time: "23:00",
    image: "https://s1.ticketm.net/dam/a/1d1/47cc9b10-4904-4dec-b1d6-539e44a521d1_1825531_TABLET_LANDSCAPE_LARGE_16_9.jpg",
    url: "https://www.ticketmaster.ca/club-passes-tickets/category/10007",
    matchScore: 75,
    source: "sample",
    genres: ["Techno"]
  }
];

// EDMTrain sample events - these will be used when EDMTrain API is unavailable
const edmtrainSampleEvents = [
  {
    id: "edmtrain-12345",
    name: "Armin van Buuren",
    venue: "Rebel",
    city: "Toronto",
    address: "",
    date: "2025-05-05",
    time: "22:00:00",
    image: "https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png",
    url: "https://edmtrain.com/toronto/armin-van-buuren-12345",
    matchScore: 88,
    source: "edmtrain_sample",
    genres: ["Trance", "Progressive"]
  },
  {
    id: "edmtrain-23456",
    name: "Deadmau5 with 2 more",
    venue: "CODA",
    city: "Toronto",
    address: "",
    date: "2025-05-12",
    time: "21:00:00",
    image: "https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png",
    url: "https://edmtrain.com/toronto/deadmau5-23456",
    matchScore: 82,
    source: "edmtrain_sample",
    genres: ["Progressive House", "Techno"]
  },
  {
    id: "edmtrain-34567",
    name: "Above & Beyond",
    venue: "Danforth Music Hall",
    city: "Toronto",
    address: "",
    date: "2025-05-19",
    time: "20:00:00",
    image: "https://edmtrain-public.s3.us-east-2.amazonaws.com/img/logos/edmtrain-logo-tag.png",
    url: "https://edmtrain.com/toronto/above-and-beyond-34567",
    matchScore: 78,
    source: "edmtrain_sample",
    genres: ["Trance", "Progressive"]
  }
];

// Simple in-memory cache
let cache = {
  timestamp: 0,
  data: null
};

// Helper function to normalize genre names
function normalizeGenre(genre) {
  if (!genre) return '';
  return genre.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to calculate genre match score
function calculateGenreMatchScore(eventGenres, userGenres) {
  if (!eventGenres || !userGenres || eventGenres.length === 0 || userGenres.length === 0) {
    return 0;
  }
  
  // Normalize all genres
  const normalizedEventGenres = eventGenres.map(normalizeGenre);
  const normalizedUserGenres = userGenres.map(normalizeGenre);
  
  let totalScore = 0;
  
  // Check for exact matches (highest weight)
  for (const userGenre of normalizedUserGenres) {
    if (normalizedEventGenres.includes(userGenre)) {
      totalScore += 30; // Exact match is worth 30 points
    }
  }
  
  // Check for partial matches
  for (const userGenre of normalizedUserGenres) {
    for (const eventGenre of normalizedEventGenres) {
      // Skip if already counted as exact match
      if (eventGenre === userGenre) continue;
      
      // Check if one contains the other
      if (eventGenre.includes(userGenre) || userGenre.includes(eventGenre)) {
        totalScore += 15; // Partial match is worth 15 points
      }
      // Check for word-level matches
      else {
        const userWords = userGenre.split(' ');
        const eventWords = eventGenre.split(' ');
        
        for (const userWord of userWords) {
          if (userWord.length < 3) continue; // Skip short words
          
          if (eventWords.includes(userWord)) {
            totalScore += 5; // Word match is worth 5 points
          }
        }
      }
    }
  }
  
  // Cap the score at 100
  return Math.min(totalScore, 100);
}

// Helper function to calculate artist match score
function calculateArtistMatchScore(eventName, userArtists) {
  if (!eventName || !userArtists || userArtists.length === 0) {
    return 0;
  }
  
  const normalizedEventName = eventName.toLowerCase();
  let totalScore = 0;
  
  // Check for artist name matches
  for (const artist of userArtists) {
    const normalizedArtist = artist.name.toLowerCase();
    
    // Exact artist match
    if (normalizedEventName.includes(normalizedArtist)) {
      // Higher weight for more popular artists
      totalScore += 40 * (artist.popularity / 100);
    }
  }
  
  // Cap the score at 100
  return Math.min(totalScore, 100);
}

// Helper function to calculate venue match score based on user history
function calculateVenueMatchScore(eventVenue, userVenueHistory) {
  if (!eventVenue || !userVenueHistory || userVenueHistory.length === 0) {
    return 0;
  }
  
  const normalizedEventVenue = eventVenue.toLowerCase();
  let totalScore = 0;
  
  // Check for venue matches
  for (const venue of userVenueHistory) {
    const normalizedVenue = venue.name.toLowerCase();
    
    // Exact venue match
    if (normalizedEventVenue === normalizedVenue) {
      totalScore += 30 * venue.visitCount; // More visits = higher score
    }
  }
  
  // Cap the score at 100
  return Math.min(totalScore, 100);
}

// Helper function to calculate location proximity score
function calculateLocationScore(eventCity, userLocation) {
  if (!eventCity || !userLocation || !userLocation.latitude || !userLocation.longitude) {
    return 0;
  }
  
  // Simple proximity score based on whether the event is in the user's city
  // In a real implementation, we would calculate actual distance
  if (eventCity.toLowerCase() === userLocation.city?.toLowerCase()) {
    return 100; // Maximum score for local events
  }
  
  return 0; // No score for non-local events
}

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log("Starting enhanced correlated-events API handler");
  
  try {
    // Check for session
    const session = await getServerSession(req, res, authOptions);
    
    // Log session status
    console.log("Session status:", session ? "Authenticated" : "Not authenticated");
    
    if (!session) {
      console.log("Not authenticated, returning sample events");
      // Return sample events for non-authenticated users
      const allSampleEvents = [...sampleEvents, ...edmtrainSampleEvents];
      allSampleEvents.sort((a, b) => b.matchScore - a.matchScore);
      
      return res.status(200).json({
        events: allSampleEvents,
        source: 'unauthenticated_fallback'
      });
    }

    // Log session token availability
    console.log("Session token available:", !!session.accessToken);
    
    // Check cache first
    const now = Date.now();
    const cacheExpired = now - cache.timestamp > 30 * 60 * 1000; // 30 minutes
    
    if (cache.data && !cacheExpired) {
      console.log('Using cached correlated events data');
      return res.status(200).json({
        events: cache.data,
        source: 'cache',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get user location
    let userLocation = await getUserLocation(req);
    console.log("User location:", userLocation);
    
    // Get user taste profile directly from Spotify using the session token
    let userTaste = null;
    let userTopArtists = [];
    try {
      // Use the session token directly to fetch user data from Spotify
      if (session && session.accessToken) {
        console.log("Fetching user taste data directly from Spotify");
        
        // Get top artists
        const artistsResponse = await axios.get('https://api.spotify.com/v1/me/top/artists', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          },
          params: {
            limit: 20,
            time_range: 'medium_term' // medium_term = approximately last 6 months
          },
          validateStatus: function (status) {
            return status < 500;
          },
          timeout: 5000 // 5 second timeout
        });
        
        if (artistsResponse.status === 200 && artistsResponse.data.items) {
          userTopArtists = artistsResponse.data.items.map(artist => ({
            id: artist.id,
            name: artist.name,
            popularity: artist.popularity,
            genres: artist.genres || []
          }));
          
          // Extract unique genres from all artists
          const allGenres = userTopArtists.flatMap(artist => artist.genres);
          const uniqueGenres = [...new Set(allGenres)];
          
          userTaste = {
            genres: uniqueGenres,
            topArtists: userTopArtists
          };
          
          console.log("Successfully fetched user taste data from Spotify");
          console.log("User has", uniqueGenres.length, "unique genres");
          console.log("Top genres:", uniqueGenres.slice(0, 5));
        } else {
          console.log("Non-200 response from Spotify API:", artistsResponse.status);
        }
      }
    } catch (error) {
      console.error("Error fetching user taste data from Spotify:", error.message);
      // Continue with null userTaste - we'll still try to get events
    }
    
    // Mock user venue history (in a real implementation, this would come from a database)
    const userVenueHistory = [
      { name: "CODA", visitCount: 3 },
      { name: "Rebel", visitCount: 2 },
      { name: "Danforth Music Hall", visitCount: 1 }
    ];
    
    // Fetch all events
    let allEvents = [];
    try {
      const eventsResponse = await axios.get(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/events`, {
        params: {
          city: userLocation?.city || 'toronto' // Pass user's city or default to Toronto
        },
        timeout: 5000 // 5 second timeout
      });
      
      allEvents = eventsResponse.data.events || [];
      console.log(`Fetched ${allEvents.length} events from API`);
    } catch (error) {
      console.error("Error fetching events:", error.message);
      // Use sample events if we can't fetch real events
      allEvents = [...sampleEvents, ...edmtrainSampleEvents];
      console.log("Using sample events due to events API error");
    }
    
    // Calculate correlation scores based on user taste and location
    let correlatedEvents = allEvents.map(event => {
      // Initialize with base score
      let correlationScore = 0;
      
      // Component scores
      let genreScore = 0;
      let artistScore = 0;
      let venueScore = 0;
      let locationScore = 0;
      
      // Calculate based on music taste if available
      if (userTaste && userTaste.genres) {
        // Genre matching (most important factor)
        genreScore = calculateGenreMatchScore(event.genres, userTaste.genres);
        correlationScore += genreScore * 0.5; // 50% weight for genre matching
        
        // Artist matching
        if (userTaste.topArtists) {
          artistScore = calculateArtistMatchScore(event.name, userTaste.topArtists);
          correlationScore += artistScore * 0.2; // 20% weight for artist matching
        }
      }
      
      // Venue preference matching
      venueScore = calculateVenueMatchScore(event.venue, userVenueHistory);
      correlationScore += venueScore * 0.1; // 10% weight for venue preference
      
      // Location proximity
      locationScore = calculateLocationScore(event.city, userLocation);
      correlationScore += locationScore * 0.2; // 20% weight for location
      
      // Add original match score as a small factor
      correlationScore += (event.matchScore || 0) * 0.1;
      
      // Ensure score is between 0-100
      correlationScore = Math.min(Math.max(correlationScore, 0), 100);
      
      return {
        ...event,
        correlationScore: Math.round(correlationScore),
        correlationDetails: {
          genreScore,
          artistScore,
          venueScore,
          locationScore
        }
      };
    });
    
    // Sort by correlation score
    correlatedEvents.sort((a, b) => b.correlationScore - a.correlationScore);
    
    // Limit to top 10
    correlatedEvents = correlatedEvents.slice(0, 10);
    
    // Update cache
    cache = {
      timestamp: now,
      data: correlatedEvents
    };
    
    // Check if we have any correlated events
    if (!correlatedEvents || correlatedEvents.length === 0) {
      console.log('No correlated events found, using sample events');
      // Use sample events as fallback
      const allSampleEvents = [...sampleEvents, ...edmtrainSampleEvents];
      allSampleEvents.sort((a, b) => b.matchScore - a.matchScore);
      
      return res.status(200).json({
        events: allSampleEvents,
        source: 'empty_fallback'
      });
    }
    
    // Return correlated events
    console.log(`Returning ${correlatedEvents.length} correlated events`);
    return res.status(200).json({
      events: correlatedEvents,
      source: 'correlated',
      userTaste: userTaste ? true : false,
      userLocation: userLocation ? true : false
    });
    
  } catch (error) {
    console.error("Error in correlated events API:", error);
    
    // Always return sample events as last resort fallback
    const allSampleEvents = [...sampleEvents, ...edmtrainSampleEvents];
    allSampleEvents.sort((a, b) => b.matchScore - a.matchScore);
    
    return res.status(200).json({
      events: allSampleEvents,
      source: 'error_fallback',
      error: error.message
    });
  }
}
