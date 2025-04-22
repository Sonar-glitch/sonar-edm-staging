// /pages/api/events/recommendations.js
// This bridge file redirects requests to the correct endpoint based on what's available

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Set unlimited response size
export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Determine which API endpoint to use based on availability
    let apiEndpoint = '/api/events'; // Default to the index.js handler
    
    // Check if correlated-events endpoint exists by trying to require it
    try {
      require('../../api/events/correlated-events');
      apiEndpoint = '/api/events/correlated-events';
      console.log('Using correlated-events API endpoint');
    } catch (e) {
      console.log('correlated-events not available, using default events endpoint');
    }
    
    // Forward the request to the determined API endpoint
    const apiUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${apiEndpoint}`;
    console.log(`Forwarding request to ${apiUrl}`);
    
    // Forward all query parameters
    const queryString = new URLSearchParams(req.query).toString();
    const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;
    
    // Make the request
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie // Forward cookies for authentication
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    // Get the response data
    const data = await response.json();
    console.log("API response structure:", Object.keys(data));
    
    // Check if the response has the correct event structure
    let events = [];
    
    if (data.events && Array.isArray(data.events)) {
      // If the API directly returns events array (from correlated-events.js)
      console.log(`Found ${data.events.length} events in data.events`);
      events = data.events;
    } else if (data.success && Array.isArray(data.events)) {
      // Format from index.js
      console.log(`Found ${data.events.length} events in data.success.events`);
      events = data.events;
    } else if (Array.isArray(data)) {
      // If the API returns just an array of events
      console.log(`Found ${data.length} events in direct array`);
      events = data;
    } else {
      console.log("Could not find events array in response:", data);
    }
    
    // Normalize event structure for frontend compatibility
    const normalizedEvents = events.map(event => {
      // Extract basic event details
      const baseEvent = {
        id: event.id || `event-${Math.random().toString(36).substr(2, 9)}`,
        name: event.name || event.title || 'Unnamed Event',
        venue: event.venue?.name || event.venue || 'Unknown Venue',
        location: event.venue?.location || event.location || 'Unknown Location',
        date: event.date || event.dates?.start?.dateTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: event.price || (event.priceRanges ? event.priceRanges[0]?.min : 0) || 0,
        primaryGenre: event.primaryGenre || (event.genres && event.genres.length > 0 ? event.genres[0] : 'Electronic'),
        matchScore: event.matchScore || event.match || event.correlationScore || 75,
        url: event.url || event.ticketLink || ''
      };
      
      return baseEvent;
    });
    
    console.log(`Normalized ${normalizedEvents.length} events`);
    
    // If no events after normalization, provide fallbacks
    if (normalizedEvents.length === 0) {
      console.log("No events found after normalization, using fallbacks");
      // Create fallback events
      const fallbackEvents = [
        {
          id: 'fb-1',
          name: 'Techno Dreamscape',
          venue: 'Warehouse 23',
          location: 'New York',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          price: 45,
          primaryGenre: 'Techno',
          matchScore: 92
        },
        {
          id: 'fb-2',
          name: 'Deep House Journey',
          venue: 'Club Echo',
          location: 'Brooklyn',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          price: 35,
          primaryGenre: 'Deep House',
          matchScore: 85
        },
        {
          id: 'fb-3',
          name: 'Melodic Techno Night',
          venue: 'The Sound Bar',
          location: 'Manhattan',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          price: 55,
          primaryGenre: 'Melodic Techno',
          matchScore: 88
        }
      ];
      
      return res.status(200).json({
        events: fallbackEvents,
        source: 'fallback'
      });
    }
    
    // Return the normalized events
    return res.status(200).json({
      events: normalizedEvents,
      source: data.source || apiEndpoint
    });
    
  } catch (error) {
    console.error("API Bridge Error:", error);
    
    // Provide fallback events even on error
    const fallbackEvents = [
      {
        id: 'fb-1',
        name: 'Techno Dreamscape',
        venue: 'Warehouse 23',
        location: 'New York',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: 45,
        primaryGenre: 'Techno',
        matchScore: 92
      },
      {
        id: 'fb-2',
        name: 'Deep House Journey',
        venue: 'Club Echo',
        location: 'Brooklyn',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        price: 35,
        primaryGenre: 'Deep House',
        matchScore: 85
      }
    ];
    
    return res.status(200).json({
      events: fallbackEvents,
      source: 'error-fallback',
      error: error.message
    });
  }
}