// pages/api/events/correlated-events.js
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
    source: "sample"
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
    source: "sample"
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
    source: "sample"
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
    url: "https://edmtrain.com/toronto",
    matchScore: 88,
    source: "edmtrain_sample"
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
    url: "https://edmtrain.com/toronto",
    matchScore: 82,
    source: "edmtrain_sample"
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
    url: "https://edmtrain.com/toronto",
    matchScore: 78,
    source: "edmtrain_sample"
  }
];

// Simple in-memory cache
let cache = {
  timestamp: 0,
  data: null
};

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Check for session
    const session = await getServerSession(req, res, authOptions);
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
    
    // Get user taste profile using the session
    let userTaste = null;
    try {
      const tasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/spotify/user-taste`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}` // Use the session token
        },
        validateStatus: function (status) {
          return status < 500;
        },
        timeout: 5000 // 5 second timeout
      });
      
      if (tasteResponse.status === 401) {
        console.log("Authentication required for user taste data");
        throw new Error("Authentication required");
      }
      
      userTaste = tasteResponse.data;
    } catch (error) {
      console.error("Error fetching user taste data:", error.message);
      // Return sample events if we can't get user taste
      const allSampleEvents = [...sampleEvents, ...edmtrainSampleEvents];
      allSampleEvents.sort((a, b) => b.matchScore - a.matchScore);
      
      return res.status(200).json({
        events: allSampleEvents,
        source: 'taste_error_fallback',
        error: error.message
      });
    }
    
    // Fetch all events
    let allEvents = [];
    try {
      const eventsResponse = await axios.get(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/events`, {
        timeout: 5000 // 5 second timeout
      });
      
      allEvents = eventsResponse.data.events || [];
    } catch (error) {
      console.error("Error fetching events:", error.message);
      // Use sample events if we can't fetch real events
      allEvents = [...sampleEvents, ...edmtrainSampleEvents];
    }
    
    // Calculate correlation scores based on user taste and location
    let correlatedEvents = allEvents.map(event => {
      let correlationScore = 0;
      
      // Calculate based on music taste if available
      if (userTaste && userTaste.genres) {
        // Example: match event name with user's top genres
        for (const genre of userTaste.genres) {
          if (event.name.toLowerCase().includes(genre.toLowerCase())) {
            correlationScore += 20;
          }
        }
      }
      
      // Add original match score
      correlationScore += event.matchScore || 0;
      
      // Calculate based on location if available
      if (userLocation && userLocation.latitude && userLocation.longitude && event.venue) {
        // This is a simplified example - you would need venue coordinates
        // For now, just add a small random factor
        correlationScore += Math.floor(Math.random() * 10);
      }
      
      return {
        ...event,
        correlationScore
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
