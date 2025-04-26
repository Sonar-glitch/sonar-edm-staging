// Updated API endpoint for events with robust location parameter handling
import axios from 'axios';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  console.log('Starting Events API handler');
  
  // Check API keys
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
  const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
  
  console.log(`Using Ticketmaster API key: ${ticketmasterApiKey ? 'Available' : 'Missing'}`);
  console.log(`Using EDMtrain API key: ${edmtrainApiKey ? 'Available' : 'Missing'}`);
  
  if (!ticketmasterApiKey) {
    return res.status(500).json({ error: 'Ticketmaster API key not configured' });
  }
  
  // Get user session
  const session = await getSession({ req });
  
  // Set default parameters
  const radius = req.query.radius || 100;
  const startDateTime = new Date().toISOString();
  
  // Process location parameters with robust fallbacks
  let locationFilter = '';
  let locationForLog = '';
  
  if (req.query.lat && req.query.lon && req.query.lat !== 'undefined' && req.query.lon !== 'undefined') {
    // Valid coordinates provided
    locationForLog = `${req.query.lat},${req.query.lon}`;
    locationFilter = `&latlong=${req.query.lat},${req.query.lon}&radius=${radius}&unit=miles`;
  } else if (req.query.city && req.query.city !== 'undefined') {
    // City name provided
    locationForLog = req.query.city;
    locationFilter = `&city=${encodeURIComponent(req.query.city)}`;
  } else if (req.query.fallback) {
    // Explicit fallback requested
    locationForLog = 'Toronto (fallback)';
    locationFilter = '&latlong=43.65,-79.38&radius=100&unit=miles';
  } else {
    // Default to Toronto if no valid location
    locationForLog = 'Toronto (default)';
    locationFilter = '&latlong=43.65,-79.38&radius=100&unit=miles';
  }
  
  console.log(`Adding location filter: ${locationForLog}, radius: ${radius} miles`);
  
  try {
    // Fetch user's music taste for matching
    let userGenres = [];
    
    try {
      if (session) {
        console.log('Using cached location data');
        const tasteResponse = await axios.get(`${process.env.NEXTAUTH_URL}/api/spotify/user-taste`, {
          headers: { cookie: req.headers.cookie || '' }
        });
        userGenres = tasteResponse.data.genres || [];
      }
    } catch (error) {
      console.error('Error fetching user taste data:', error.message);
      console.log('Using default taste data instead');
      userGenres = ['house', 'techno', 'trance', 'dubstep', 'drum & bass', 'future bass'];
    }
    
    console.log('User genres for matching:', userGenres);
    
    // Fetch events from Ticketmaster
    let ticketmasterEvents = [];
    
    try {
      console.log('Making Ticketmaster API request...');
      
      // Prepare request parameters
      const params = {
        apikey: ticketmasterApiKey,
        classificationName: 'music',
        keyword: 'electronic OR dance OR dj OR festival OR rave',
        size: 100,
        sort: 'date,asc',
        startDateTime: startDateTime
      };
      
      // Add location parameters
      const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${new URLSearchParams(params)}${locationFilter}`;
      
      console.log('Ticketmaster API request params:', {
        ...params,
        latlong: locationForLog,
        radius: radius.toString(),
        unit: 'miles'
      });
      
      const ticketmasterResponse = await axios.get(ticketmasterUrl);
      
      if (ticketmasterResponse.data._embedded && ticketmasterResponse.data._embedded.events) {
        ticketmasterEvents = ticketmasterResponse.data._embedded.events;
        console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
      } else {
        console.log('No events found from Ticketmaster, trying simplified query...');
        
        // Try again with simplified query
        const simplifiedUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterApiKey}&classificationName=music&keyword=electronic&size=100&sort=date,asc&startDateTime=${startDateTime}`;
        
        const retryResponse = await axios.get(simplifiedUrl);
        
        if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
          ticketmasterEvents = retryResponse.data._embedded.events;
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
        } else {
          console.log('No events found from Ticketmaster retry');
        }
      }
    } catch (error) {
      console.error('Ticketmaster API request failed:', error.message);
      console.log('Retrying with simpler query after error...');
      
      try {
        // Retry with simplified query
        const simplifiedUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterApiKey}&classificationName=music&keyword=electronic&size=100&sort=date,asc&startDateTime=${startDateTime}`;
        
        const retryResponse = await axios.get(simplifiedUrl);
        
        if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
          ticketmasterEvents = retryResponse.data._embedded.events;
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
        } else {
          console.log('No events found from Ticketmaster retry');
        }
      } catch (retryError) {
        console.error('Ticketmaster retry failed:', retryError.message);
      }
    }
    
    // Fetch events from EDMtrain as backup
    let edmtrainEvents = [];
    
    if (edmtrainApiKey) {
      try {
        console.log('Fetching events from EDMtrain API...');
        
        // Prepare EDMtrain parameters
        const edmtrainParams = {
          client: edmtrainApiKey,
          radius: radius
        };
        
        // Add location parameters if available
        if (req.query.lat && req.query.lon && req.query.lat !== 'undefined' && req.query.lon !== 'undefined') {
          edmtrainParams.latitude = req.query.lat;
          edmtrainParams.longitude = req.query.lon;
        } else {
          // Default to Toronto
          edmtrainParams.latitude = 43.65;
          edmtrainParams.longitude = -79.38;
        }
        
        console.log('EDMtrain API request params:', edmtrainParams);
        
        const edmtrainResponse = await axios.get('https://edmtrain.com/api/events', {
          params: edmtrainParams
        });
        
        if (edmtrainResponse.data && edmtrainResponse.data.data) {
          edmtrainEvents = edmtrainResponse.data.data;
          console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
        }
      } catch (error) {
        console.error('EDMtrain API request failed:', error.message);
      }
    }
    
    // Process and combine events
    let allEvents = [];
    
    // Process Ticketmaster events
    if (ticketmasterEvents.length > 0) {
      ticketmasterEvents.forEach(event => {
        // Calculate match score based on genres
        let matchScore = 70; // Base score
        
        if (event.classifications) {
          const eventGenres = event.classifications.map(c => 
            c.genre && c.genre.name ? c.genre.name.toLowerCase() : ''
          ).filter(Boolean);
          
          const matchingGenres = eventGenres.filter(g => 
            userGenres.some(ug => g.includes(ug) || ug.includes(g))
          );
          
          if (matchingGenres.length > 0) {
            matchScore += Math.min(30, matchingGenres.length * 10);
          }
        }
        
        // Ensure all events have valid image URLs
        if (event.images && event.images.length > 0) {
          // Keep the existing images
        } else {
          // Add a placeholder image
          event.images = [{
            url: '/images/placeholders/event_placeholder_medium.jpg',
            width: 500,
            height: 300
          }];
        }
        
        // Add to combined events with source and match score
        allEvents.push({
          ...event,
          source: 'ticketmaster',
          matchScore
        });
      });
    }
    
    // Process EDMtrain events
    if (edmtrainEvents.length > 0) {
      edmtrainEvents.forEach(event => {
        // Calculate match score based on genres
        let matchScore = 70; // Base score
        
        if (event.artistList && event.artistList.length > 0) {
          const eventGenres = event.artistList
            .flatMap(artist => artist.genres || [])
            .map(g => g.toLowerCase())
            .filter(Boolean);
          
          const matchingGenres = eventGenres.filter(g => 
            userGenres.some(ug => g.includes(ug) || ug.includes(g))
          );
          
          if (matchingGenres.length > 0) {
            matchScore += Math.min(30, matchingGenres.length * 10);
          }
        }
        
        // Convert EDMtrain event to Ticketmaster-like format
        const formattedEvent = {
          id: `edmtrain-${event.id}`,
          name: event.name,
          url: event.link || `https://edmtrain.com/event/${event.id}`,
          images: [{
            url: event.imageUrl || '/images/placeholders/event_placeholder_medium.jpg',
            width: 500,
            height: 300
          }],
          dates: {
            start: {
              localDate: event.date,
              localTime: event.startTime || '20:00:00'
            }
          },
          _embedded: {
            venues: [{
              name: event.venue ? event.venue.name : 'Venue TBA',
              city: {
                name: event.venue ? event.venue.location : 'City TBA'
              },
              address: {
                line1: event.venue ? `${event.venue.address || ''} ${event.venue.location || ''}` : ''
              }
            }]
          },
          source: 'edmtrain',
          matchScore
        };
        
        allEvents.push(formattedEvent);
      });
    }
    
    // If no events found, use sample Toronto events as fallback
    if (allEvents.length === 0) {
      console.log('No events found, using sample Toronto events');
      
      // Sample events for Toronto
      const sampleEvents = [
        {
          id: 'sample-1',
          name: 'House & Techno Night',
          url: 'https://ticketmaster.com',
          images: [{
            url: '/images/placeholders/event_placeholder_medium.jpg',
            width: 500,
            height: 300
          }],
          dates: {
            start: {
              localDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              localTime: '22:00:00'
            }
          },
          _embedded: {
            venues: [{
              name: 'CODA',
              city: {
                name: 'Toronto'
              },
              address: {
                line1: '794 Bathurst St'
              }
            }]
          },
          source: 'sample',
          matchScore: 85
        },
        {
          id: 'sample-2',
          name: 'Deep House Sessions',
          url: 'https://ticketmaster.com',
          images: [{
            url: '/images/placeholders/event_placeholder_medium.jpg',
            width: 500,
            height: 300
          }],
          dates: {
            start: {
              localDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              localTime: '21:00:00'
            }
          },
          _embedded: {
            venues: [{
              name: 'Rebel',
              city: {
                name: 'Toronto'
              },
              address: {
                line1: '11 Polson St'
              }
            }]
          },
          source: 'sample',
          matchScore: 80
        },
        {
          id: 'sample-3',
          name: 'Techno Underground',
          url: 'https://ticketmaster.com',
          images: [{
            url: '/images/placeholders/event_placeholder_medium.jpg',
            width: 500,
            height: 300
          }],
          dates: {
            start: {
              localDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              localTime: '23:00:00'
            }
          },
          _embedded: {
            venues: [{
              name: 'Vertigo',
              city: {
                name: 'Toronto'
              },
              address: {
                line1: '276 Augusta Ave'
              }
            }]
          },
          source: 'sample',
          matchScore: 90
        }
      ];
      
      allEvents = sampleEvents;
    }
    
    // Sort events by match score (descending) and date (ascending)
    allEvents.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      
      const dateA = new Date(a.dates.start.localDate);
      const dateB = new Date(b.dates.start.localDate);
      return dateA - dateB;
    });
    
    // Return combined events
    return res.status(200).json({
      events: allEvents,
      total: allEvents.length,
      location: locationForLog
    });
  } catch (error) {
    console.error('Error in events API:', error.message);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}
