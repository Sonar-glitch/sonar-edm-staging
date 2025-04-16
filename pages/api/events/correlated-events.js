// This file contains the implementation for integrating Ticketmaster API with correlation indicators
// Path: pages/api/events/correlated-events.js

import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  try {
    // Get user's location from query or use default
    const { lat, lon } = req.query;
    
    // Get user's music taste data to correlate with events
    const tasteResponse = await axios.get(
      `${process.env.NEXTAUTH_URL}/api/spotify/user-taste`,
      {
        headers: {
          cookie: req.headers.cookie
        }
      }
    );
    
    const tasteData = tasteResponse.data.taste;
    
    if (!tasteData) {
      return res.status(400).json({ success: false, error: 'Unable to fetch user taste data for correlation' });
    }
    
    // Extract genres and artists for correlation
    const userGenres = tasteData.topGenres.map(genre => genre.label.toLowerCase());
    const userArtists = tasteData.topArtists.map(artist => artist.name.toLowerCase());
    
    // Get user location using ipapi if not provided
    let userLocation;
    if (!lat || !lon) {
      try {
        const locationResponse = await axios.get('https://ipapi.co/json/');
        userLocation = {
          latitude: locationResponse.data.latitude,
          longitude: locationResponse.data.longitude,
          city: locationResponse.data.city,
          region: locationResponse.data.region,
          country: locationResponse.data.country_name
        };
      } catch (error) {
        console.error('Error fetching user location:', error);
        userLocation = {
          latitude: 40.7128, // Default to NYC
          longitude: -74.0060,
          city: 'New York',
          region: 'NY',
          country: 'United States'
        };
      }
    } else {
      userLocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      };
    }
    
    // Fetch events from Ticketmaster API
    const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
    const radius = 100; // miles
    const size = 50; // number of events to fetch
    
    const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterApiKey}&latlong=${userLocation.latitude},${userLocation.longitude}&radius=${radius}&size=${size}&classificationName=music&sort=date,asc`;
    
    let ticketmasterEvents = [];
    try {
      const ticketmasterResponse = await axios.get(ticketmasterUrl);
      
      if (ticketmasterResponse.data._embedded && ticketmasterResponse.data._embedded.events) {
        ticketmasterEvents = ticketmasterResponse.data._embedded.events.map(event => {
          // Extract event details
          const eventName = event.name;
          const venue = event._embedded?.venues?.[0]?.name || 'Unknown Venue';
          const city = event._embedded?.venues?.[0]?.city?.name || 'Unknown City';
          const state = event._embedded?.venues?.[0]?.state?.stateCode || '';
          const date = event.dates?.start?.localDate || '';
          const time = event.dates?.start?.localTime || '';
          const image = event.images?.find(img => img.ratio === '16_9' && img.width > 500)?.url || 
                       (event.images && event.images.length > 0 ? event.images[0].url : null);
          const url = event.url;
          const genres = event.classifications?.map(c => 
            [c.segment?.name, c.genre?.name, c.subGenre?.name].filter(Boolean).map(g => g.toLowerCase())
          ).flat().filter(Boolean) || [];
          
          // Calculate venue coordinates for distance calculation
          const venueLocation = {
            latitude: parseFloat(event._embedded?.venues?.[0]?.location?.latitude || 0),
            longitude: parseFloat(event._embedded?.venues?.[0]?.location?.longitude || 0)
          };
          
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            userLocation.latitude, 
            userLocation.longitude,
            venueLocation.latitude,
            venueLocation.longitude
          );
          
          // Calculate correlation with user's music taste
          const correlation = calculateCorrelation(eventName, genres, userGenres, userArtists);
          
          return {
            source: 'ticketmaster',
            id: event.id,
            name: eventName,
            venue,
            location: `${city}, ${state}`,
            date,
            time,
            image,
            url,
            distance: Math.round(distance),
            genres,
            correlation
          };
        });
      }
    } catch (error) {
      console.error('Ticketmaster API error:', error.response?.data || error.message);
      // Continue with empty ticketmaster events
    }
    
    // Combine and sort events by correlation
    const allEvents = [...ticketmasterEvents]
      .filter(event => event.correlation > 0) // Only include events with some correlation
      .sort((a, b) => b.correlation - a.correlation); // Sort by correlation (highest first)
    
    return res.status(200).json({ 
      success: true, 
      events: allEvents,
      userLocation
    });
    
  } catch (error) {
    console.error('Error fetching correlated events:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch correlated events',
      details: error.response?.data || error.message
    });
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999; // Return large distance if coordinates missing
  
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI/180);
}

// Calculate correlation between event and user's music taste
function calculateCorrelation(eventName, eventGenres, userGenres, userArtists) {
  let score = 0;
  const eventNameLower = eventName.toLowerCase();
  
  // Check if any user artists appear in the event name
  userArtists.forEach((artist, index) => {
    if (eventNameLower.includes(artist)) {
      // Higher ranked artists get higher scores
      score += 100 - (index * 5);
    }
  });
  
  // Check for genre matches
  eventGenres.forEach(eventGenre => {
    userGenres.forEach((userGenre, index) => {
      if (eventGenre.includes(userGenre) || userGenre.includes(eventGenre)) {
        // Higher ranked genres get higher scores
        score += 50 - (index * 5);
      }
    });
  });
  
  // Normalize score to 0-100 range
  return Math.min(100, score);
}
