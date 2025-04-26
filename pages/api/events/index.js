import axios from 'axios';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Sample events for Toronto as fallback
const TORONTO_SAMPLE_EVENTS = [
  {
    id: "toronto-event-1",
    name: "Electric Nights: Toronto House Edition",
    url: "https://www.ticketmaster.ca/electric-nights-toronto-house-edition-toronto-ontario-05-15-2025/event/10005E8B9A3A1234",
    images: [{ url: "https://s1.ticketm.net/dam/a/1f6/0e4fe8ee-488a-46ba-9d6e-717fde4841f6_1339061_TABLET_LANDSCAPE_LARGE_16_9.jpg" }],
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
    images: [{ url: "https://s1.ticketm.net/dam/a/1f6/0e4fe8ee-488a-46ba-9d6e-717fde4841f6_1339061_TABLET_LANDSCAPE_LARGE_16_9.jpg" }],
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
    images: [{ url: "https://s1.ticketm.net/dam/a/1f6/0e4fe8ee-488a-46ba-9d6e-717fde4841f6_1339061_TABLET_LANDSCAPE_LARGE_16_9.jpg" }],
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
  // Get user session
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // Get location from query parameters
  const { lat, lon, city } = req.query;
  
  // Check if we have a Toronto request
  const isTorontoRequest = city?.toLowerCase().includes('toronto') || 
                          (lat && lon && Math.abs(parseFloat(lat) - 43.65) < 0.5 && Math.abs(parseFloat(lon) - (-79.38)) < 0.5);
  
  try {
    // Validate location parameters
    if ((!lat || !lon) && !city) {
      console.log("Using sample events due to missing location parameters");
      // Return sample events if location is missing
      return res.status(200).json({
        events: TORONTO_SAMPLE_EVENTS,
        source: "sample"
      });
    }
    
    // Prepare API request parameters
    let params = {
      apikey: process.env.TICKETMASTER_API_KEY,
      classificationName: "music",
      size: 10,
      sort: "date,asc"
    };
    
    // Add location parameters
    if (lat && lon) {
      params.latlong = `${lat},${lon}`;
      params.radius = "50";
      params.unit = "miles";
    } else if (city) {
      params.city = city;
    }
    
    // Make request to Ticketmaster API
    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
      params,
      timeout: 5000 // 5 second timeout
    });
    
    // Check if we have events
    if (response.data._embedded && response.data._embedded.events && response.data._embedded.events.length > 0) {
      // Process events
      const events = response.data._embedded.events.map(event => {
        // Calculate match score
        const matchScore = calculateMatchScore(event, {
          genres: ["electronic", "house", "techno", "dance"]
        });
        
        return {
          ...event,
          matchScore
        };
      });
      
      // Sort by match score
      events.sort((a, b) => b.matchScore - a.matchScore);
      
      return res.status(200).json({
        events,
        source: "ticketmaster"
      });
    } else {
      console.log("No events found from Ticketmaster API, using sample events");
      
      // If no events found and it's a Toronto request, return sample events
      if (isTorontoRequest) {
        return res.status(200).json({
          events: TORONTO_SAMPLE_EVENTS,
          source: "sample"
        });
      }
      
      // Otherwise return empty array
      return res.status(200).json({
        events: [],
        source: "ticketmaster"
      });
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    
    // If error and it's a Toronto request, return sample events
    if (isTorontoRequest) {
      console.log("Error fetching events, using Toronto sample events");
      return res.status(200).json({
        events: TORONTO_SAMPLE_EVENTS,
        source: "sample"
      });
    }
    
    // Otherwise return error
    return res.status(500).json({ 
      error: "Failed to fetch events",
      message: error.message
    });
  }
}
