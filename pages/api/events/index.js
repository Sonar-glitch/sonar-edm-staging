import axios from 'axios';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Sample events for Toronto as fallback with local placeholder images
const TORONTO_SAMPLE_EVENTS = [
  {
    id: "toronto-event-1",
    name: "Electric Nights: Toronto House Edition",
    url: "https://www.ticketmaster.ca/electric-nights-toronto-house-edition-toronto-ontario-05-15-2025/event/10005E8B9A3A1234",
    images: [{ url: "/images/placeholders/event_placeholder_large.jpg" }],
    dates: {
      start: {
        localDate: "2025-05-15",
        localTime: "20:00:00"
      }
    },
    priceRanges: [
      {
        min: 45.00,
        max: 120.00,
        currency: "CAD"
      }
    ],
    _embedded: {
      venues: [{
        name: "REBEL",
        address: {
          line1: "11 Polson St"
        },
        city: {
          name: "Toronto"
        },
        postalCode: "M5A 1A4",
        location: {
          latitude: "43.644444",
          longitude: "-79.365556"
        }
      }],
      attractions: [{
        name: "DJ TechHouse",
        classifications: [
          {
            segment: {
              name: "Music"
            },
            genre: {
              name: "Electronic"
            },
            subGenre: {
              name: "House"
            }
          }
        ]
      }]
    },
    matchScore: 92
  },
  {
    id: "toronto-event-2",
    name: "Deep Techno Underground",
    url: "https://www.ticketmaster.ca/deep-techno-underground-toronto-ontario-05-22-2025/event/10005E8B9A3A5678",
    images: [{ url: "/images/placeholders/event_placeholder_large.jpg" }],
    dates: {
      start: {
        localDate: "2025-05-22",
        localTime: "22:00:00"
      }
    },
    priceRanges: [
      {
        min: 35.00,
        max: 85.00,
        currency: "CAD"
      }
    ],
    _embedded: {
      venues: [{
        name: "CODA",
        address: {
          line1: "794 Bathurst St"
        },
        city: {
          name: "Toronto"
        },
        postalCode: "M5R 3G1",
        location: {
          latitude: "43.665833",
          longitude: "-79.411944"
        }
      }],
      attractions: [{
        name: "Techno Collective",
        classifications: [
          {
            segment: {
              name: "Music"
            },
            genre: {
              name: "Electronic"
            },
            subGenre: {
              name: "Techno"
            }
          }
        ]
      }]
    },
    matchScore: 88
  },
  {
    id: "toronto-event-3",
    name: "Progressive House Showcase",
    url: "https://www.ticketmaster.ca/progressive-house-showcase-toronto-ontario-05-29-2025/event/10005E8B9A3A9012",
    images: [{ url: "/images/placeholders/event_placeholder_large.jpg" }],
    dates: {
      start: {
        localDate: "2025-05-29",
        localTime: "21:00:00"
      }
    },
    priceRanges: [
      {
        min: 40.00,
        max: 95.00,
        currency: "CAD"
      }
    ],
    _embedded: {
      venues: [{
        name: "The Danforth Music Hall",
        address: {
          line1: "147 Danforth Ave"
        },
        city: {
          name: "Toronto"
        },
        postalCode: "M4K 1N2",
        location: {
          latitude: "43.676667",
          longitude: "-79.353056"
        }
      }],
      attractions: [{
        name: "Progressive Sound",
        classifications: [
          {
            segment: {
              name: "Music"
            },
            genre: {
              name: "Electronic"
            },
            subGenre: {
              name: "Progressive House"
            }
          }
        ]
      }]
    },
    matchScore: 85
  }
];

// Function to ensure events have valid image URLs
function ensureValidImageUrls(events) {
  if (!events || !Array.isArray(events)) return [];
  
  return events.map(event => {
    // Check if event has valid images
    if (!event.images || !Array.isArray(event.images) || event.images.length === 0) {
      // If no images or invalid images, add placeholder
      event.images = [{ url: "/images/placeholders/event_placeholder_large.jpg" }];
    } else {
      // Check each image URL and replace if invalid
      event.images = event.images.map(img => {
        if (!img.url || img.url.includes('undefined') || img.url.includes('null')) {
          return { url: "/images/placeholders/event_placeholder_large.jpg" };
        }
        return img;
      });
    }
    return event;
  });
}

// Function to calculate match score based on user's music taste
function calculateMatchScore(event, userTaste) {
  // Default score if we can't determine
  let score = 70;
  
  try {
    // Extract genre information from event
    const attractions = event._embedded?.attractions || [];
    const genres = attractions.flatMap(attraction => 
      attraction.classifications?.map(c => ({
        genre: c.genre?.name?.toLowerCase(),
        subGenre: c.subGenre?.name?.toLowerCase()
      })) || []
    );
    
    // If we have user taste data, calculate a more accurate score
    if (userTaste && userTaste.genres && userTaste.genres.length > 0) {
      const userGenres = userTaste.genres.map(g => g.toLowerCase());
      
      // Check for direct matches
      const directMatches = genres.filter(g => 
        userGenres.includes(g.genre) || userGenres.includes(g.subGenre)
      ).length;
      
      if (directMatches > 0) {
        // Higher score for direct matches
        score = 75 + (directMatches * 5);
      } else {
        // Check for partial matches
        const partialMatches = genres.filter(g => 
          userGenres.some(ug => g.genre?.includes(ug) || g.subGenre?.includes(ug) || ug.includes(g.genre) || ug.includes(g.subGenre))
        ).length;
        
        if (partialMatches > 0) {
          score = 70 + (partialMatches * 3);
        }
      }
    }
    
    // Cap the score at 95
    return Math.min(score, 95);
  } catch (error) {
    console.error("Error calculating match score:", error);
    return score;
  }
}

export default async function handler(req, res) {
  console.log("Events API handler called with query:", req.query);
  
  // Get user session
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    console.log("No session found, returning 401");
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // Get location from query parameters
  let { lat, lon, city } = req.query;
  console.log(`Original location parameters: lat=${lat}, lon=${lon}, city=${city}`);
  
  // Validate and fix location parameters
  if (lat === 'undefined' || lon === 'undefined' || !lat || !lon) {
    // If we have a city, use that
    if (city && city !== 'undefined') {
      console.log(`Using city parameter: ${city}`);
      // City is valid, continue with it
    } else if (city === 'Toronto' || city?.includes('Toronto')) {
      // For Toronto, set specific coordinates
      lat = '43.65';
      lon = '-79.38';
      city = 'Toronto';
      console.log(`Setting Toronto coordinates: lat=${lat}, lon=${lon}`);
    } else {
      // Default to Toronto if no valid location
      lat = '43.65';
      lon = '-79.38';
      city = 'Toronto';
      console.log(`No valid location, defaulting to Toronto: lat=${lat}, lon=${lon}`);
    }
  }
  
  // Check if we have a Toronto request
  const isTorontoRequest = city?.toLowerCase().includes('toronto') || 
                          (lat && lon && Math.abs(parseFloat(lat) - 43.65) < 0.5 && Math.abs(parseFloat(lon) - (-79.38)) < 0.5);
  
  console.log(`Is Toronto request: ${isTorontoRequest}`);
  
  try {
    // Prepare API request parameters
    let params = {
      apikey: process.env.TICKETMASTER_API_KEY,
      classificationName: "music",
      keyword: "electronic OR dance OR dj OR festival OR rave",
      size: 20,
      sort: "date,asc",
      startDateTime: new Date().toISOString()
    };
    
    // Add location parameters
    if (lat && lon && lat !== 'undefined' && lon !== 'undefined') {
      params.latlong = `${lat},${lon}`;
      params.radius = "50";
      params.unit = "miles";
      console.log(`Using coordinates for Ticketmaster API: ${params.latlong}`);
    } else if (city && city !== 'undefined') {
      params.city = city;
      console.log(`Using city for Ticketmaster API: ${params.city}`);
    }
    
    console.log("Making Ticketmaster API request with params:", params);
    
    // Make request to Ticketmaster API
    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
      params,
      timeout: 8000 // 8 second timeout
    });
    
    // Check if we have events
    if (response.data._embedded && response.data._embedded.events && response.data._embedded.events.length > 0) {
      console.log(`Found ${response.data._embedded.events.length} events from Ticketmaster API`);
      
      // Process events
      let events = response.data._embedded.events.map(event => {
        // Calculate match score
        const matchScore = calculateMatchScore(event, {
          genres: ["electronic", "house", "techno", "dance", "trance", "dubstep"]
        });
        
        return {
          ...event,
          matchScore
        };
      });
      
      // Ensure all events have valid image URLs
      events = ensureValidImageUrls(events);
      
      // Sort by match score
      events.sort((a, b) => b.matchScore - a.matchScore);
      
      return res.status(200).json({
        events,
        source: "ticketmaster"
      });
    } else {
      console.log("No events found from Ticketmaster API, trying simplified query...");
      
      // Try again with a simpler query
      const simplifiedParams = {
        ...params,
        keyword: "music", // More generic keyword
        classificationName: "music",
        size: 30
      };
      
      try {
        const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
          params: simplifiedParams,
          timeout: 8000
        });
        
        if (retryResponse.data._embedded && retryResponse.data._embedded.events && retryResponse.data._embedded.events.length > 0) {
          console.log(`Found ${retryResponse.data._embedded.events.length} events from simplified Ticketmaster API query`);
          
          // Process events
          let events = retryResponse.data._embedded.events.map(event => {
            // Calculate match score
            const matchScore = calculateMatchScore(event, {
              genres: ["electronic", "house", "techno", "dance", "trance", "dubstep"]
            });
            
            return {
              ...event,
              matchScore
            };
          });
          
          // Ensure all events have valid image URLs
          events = ensureValidImageUrls(events);
          
          // Sort by match score
          events.sort((a, b) => b.matchScore - a.matchScore);
          
          return res.status(200).json({
            events,
            source: "ticketmaster_simplified"
          });
        }
      } catch (retryError) {
        console.error("Error with simplified Ticketmaster query:", retryError);
      }
      
      // If still no events or retry failed, use sample events for Toronto
      if (isTorontoRequest) {
        console.log("Using Toronto sample events as fallback");
        return res.status(200).json({
          events: TORONTO_SAMPLE_EVENTS,
          source: "sample"
        });
      } else {
        // For non-Toronto locations with no events, return empty array
        console.log("No events found and not Toronto, returning empty array");
        return res.status(200).json({
          events: [],
          source: "ticketmaster_empty"
        });
      }
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    
    // If error and it's a Toronto request, return sample events
    if (isTorontoRequest) {
      console.log("Error fetching events, using Toronto sample events as fallback");
      return res.status(200).json({
        events: TORONTO_SAMPLE_EVENTS,
        source: "sample_fallback"
      });
    }
    
    // Otherwise return empty array with error
    return res.status(200).json({ 
      events: [],
      error: "Failed to fetch events",
      message: error.message,
      source: "error_fallback"
    });
  }
}
