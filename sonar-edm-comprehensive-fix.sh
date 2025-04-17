#!/bin/bash

# Sonar EDM Platform - Comprehensive Fix Script
# This script addresses all issues with the Sonar EDM Platform:
# 1. Fixes Ticketmaster API integration to ensure events appear alongside EDM Train events
# 2. Rolls back the Vibe Quiz to previous settings
# 3. Fixes Spotify real data display with proper popularity metrics
# 4. Adjusts icon sizes to be more appropriate
# 5. Fixes spider chart label truncation
# 6. Reorganizes navigation with profile dropdown (including Account, Appearance, Notifications)
# 7. Makes the user taste display more compact to emphasize the Events section

# Set the project directory
PROJECT_DIR="/c/sonar/users/sonar-edm-user"

# Create backup directory
BACKUP_DIR="$PROJECT_DIR/backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Backup existing files
echo "Backing up existing files..."
[ -f "$PROJECT_DIR/pages/api/events/index.js" ] && cp "$PROJECT_DIR/pages/api/events/index.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/SpiderChart.js" ] && cp "$PROJECT_DIR/components/SpiderChart.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/ArtistCard.js" ] && cp "$PROJECT_DIR/components/ArtistCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/TrackCard.js" ] && cp "$PROJECT_DIR/components/TrackCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/SeasonalMoodCard.js" ] && cp "$PROJECT_DIR/components/SeasonalMoodCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/VibeQuizCard.js" ] && cp "$PROJECT_DIR/components/VibeQuizCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/Navigation.js" ] && cp "$PROJECT_DIR/components/Navigation.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/pages/users/music-taste.js" ] && cp "$PROJECT_DIR/pages/users/music-taste.js" "$BACKUP_DIR/"

# Create directories if they don't exist
mkdir -p "$PROJECT_DIR/components"
mkdir -p "$PROJECT_DIR/pages/api/events"
mkdir -p "$PROJECT_DIR/pages/users"

# 1. Fix Ticketmaster API Integration
echo "Fixing Ticketmaster API integration..."
cat > "$PROJECT_DIR/pages/api/events/index.js" << 'EOL'
import axios from 'axios';

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}

export default async function handler(req, res) {
  try {
    console.log('Starting Events API handler');
    
    // Get API keys from environment variables
    const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
    const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
    
    console.log('Using Ticketmaster API key:', ticketmasterApiKey ? 'Available' : 'Not available');
    console.log('Using EDMtrain API key:', edmtrainApiKey ? 'Available' : 'Not available');
    
    if (!ticketmasterApiKey && !edmtrainApiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'No API keys configured for event sources' 
      });
    }
    
    // Get user's location
    let userLocation;
    try {
      console.log('Fetching user location...');
      const ipResponse = await axios.get('https://ipapi.co/json/');
      userLocation = {
        latitude: ipResponse.data.latitude,
        longitude: ipResponse.data.longitude,
        city: ipResponse.data.city,
        region: ipResponse.data.region,
        country: ipResponse.data.country_name
      };
      console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
      console.log(`Coordinates: ${userLocation.latitude}, ${userLocation.longitude}`);
    } catch (error) {
      console.error('Error getting user location:', error.message);
      console.log('Will use default search without location filtering');
      
      // Use fallback location if ipapi fails
      userLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: "New York",
        region: "NY",
        country: "United States"
      };
      console.log('Using fallback location:', userLocation.city);
    }
    
    // Get user taste data to calculate match percentages
    let userTaste;
    try {
      const userTasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/spotify/user-taste`);
      userTaste = userTasteResponse.data;
      console.log('Successfully fetched user taste data');
    } catch (error) {
      console.error('Error fetching user taste data:', error.message);
      // Continue with default taste data if user taste can't be fetched
      userTaste = {
        genres: [
          { name: 'House', score: 85 },
          { name: 'Techno', score: 70 },
          { name: 'Trance', score: 60 },
          { name: 'Dubstep', score: 40 },
          { name: 'Drum & Bass', score: 75 },
          { name: 'Future Bass', score: 55 }
        ]
      };
      console.log('Using default taste data instead');
    }
    
    // Extract user's top genres for matching
    const userGenres = userTaste.genres ? 
      userTaste.genres.map(genre => genre.name.toLowerCase()) : 
      ['house', 'techno', 'trance', 'electronic', 'dance'];
    
    console.log('User genres for matching:', userGenres);
    
    // Initialize arrays for events from different sources
    let ticketmasterEvents = [];
    let edmtrainEvents = [];
    let ticketmasterError = null;
    let edmtrainError = null;
    
    // Fetch from Ticketmaster API
    if (ticketmasterApiKey) {
      try {
        console.log('Making Ticketmaster API request...');
        
        // Set up parameters for Ticketmaster API
        const params = {
          apikey: ticketmasterApiKey,
          classificationName: 'music',
          // Broader keyword search to catch more EDM events
          keyword: 'electronic OR dance OR dj OR festival OR rave',
          size: 100, // Increased from 50 to get more results
          sort: 'date,asc',
          startDateTime: new Date().toISOString().slice(0, 19) + 'Z' // Current time in ISO format
        };
        
        // Add location parameters if user location is available
        if (userLocation) {
          params.latlong = `${userLocation.latitude},${userLocation.longitude}`;
          params.radius = '100'; // 100 mile radius
          params.unit = 'miles';
          console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
        }
        
        console.log('Ticketmaster API request params:', JSON.stringify(params));
        
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
          params,
          timeout: 15000 // 15 second timeout
        });
        
        console.log('Ticketmaster API request successful');
        
        // Check if we have events in the response
        if (response.data._embedded && response.data._embedded.events) {
          ticketmasterEvents = response.data._embedded.events;
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
        } else {
          console.log('No events found in Ticketmaster response');
          ticketmasterError = 'No events found from Ticketmaster';
          
          // Try one more time with a simpler query
          console.log('Retrying with simpler query...');
          params.keyword = 'electronic';
          delete params.classificationName; // Remove classification to broaden search
          
          const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
            params,
            timeout: 15000
          });
          
          if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
            ticketmasterEvents = retryResponse.data._embedded.events;
            console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry`);
            ticketmasterError = null;
          } else {
            console.log('No events found in Ticketmaster retry response');
          }
        }
      } catch (error) {
        console.error('Ticketmaster API request failed:', error.message);
        ticketmasterError = error.message;
        
        // Try one more time with a simpler query
        try {
          console.log('Retrying with simpler query after error...');
          const params = {
            apikey: ticketmasterApiKey,
            keyword: 'electronic',
            size: 50,
            sort: 'date,asc',
            startDateTime: new Date().toISOString().slice(0, 19) + 'Z'
          };
          
          const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
            params,
            timeout: 15000
          });
          
          if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
            ticketmasterEvents = retryResponse.data._embedded.events;
            console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
            ticketmasterError = null;
          } else {
            console.log('No events found in Ticketmaster retry response after error');
          }
        } catch (retryError) {
          console.error('Ticketmaster retry also failed:', retryError.message);
          ticketmasterError = `${error.message} (retry also failed: ${retryError.message})`;
        }
      }
    } else {
      console.log('Skipping Ticketmaster API call - no API key configured');
      ticketmasterError = 'Ticketmaster API key not configured';
    }
    
    // Process Ticketmaster events if available
    const processedTicketmasterEvents = ticketmasterEvents.map(event => {
      // Extract event genres
      let eventGenres = [];
      if (event.classifications && event.classifications.length > 0) {
        const classification = event.classifications[0];
        if (classification.genre && classification.genre.name !== 'Undefined') {
          eventGenres.push(classification.genre.name);
        }
        if (classification.subGenre && classification.subGenre.name !== 'Undefined') {
          eventGenres.push(classification.subGenre.name);
        }
        if (classification.segment && classification.segment.name !== 'Undefined') {
          eventGenres.push(classification.segment.name);
        }
      }
      
      // If no genres found, extract from name or use defaults
      if (eventGenres.length === 0) {
        const eventName = event.name.toLowerCase();
        if (eventName.includes('techno')) eventGenres.push('Techno');
        if (eventName.includes('house')) eventGenres.push('House');
        if (eventName.includes('trance')) eventGenres.push('Trance');
        if (eventName.includes('dubstep')) eventGenres.push('Dubstep');
        if (eventName.includes('drum') && eventName.includes('bass')) eventGenres.push('Drum & Bass');
        if (eventName.includes('edm')) eventGenres.push('EDM');
        if (eventName.includes('dj')) eventGenres.push('DJ');
        if (eventName.includes('electronic')) eventGenres.push('Electronic');
        if (eventName.includes('dance')) eventGenres.push('Dance');
        if (eventName.includes('festival')) eventGenres.push('Festival');
        
        // If still no genres, use default
        if (eventGenres.length === 0) {
          eventGenres = ['Electronic', 'Dance'];
        }
      }
      
      // Calculate match percentage
      let matchScore = 0;
      let matchCount = 0;
      
      eventGenres.forEach(eventGenre => {
        const normalizedEventGenre = eventGenre.toLowerCase();
        
        userGenres.forEach((userGenre, index) => {
          // Check for partial matches in genre names
          if (normalizedEventGenre.includes(userGenre) || userGenre.includes(normalizedEventGenre)) {
            // Weight the match by the genre's importance to the user
            const genreWeight = userTaste.genres && userTaste.genres[index] ? 
              userTaste.genres[index].score / 100 : 0.5;
            matchScore += genreWeight;
            matchCount++;
          }
        });
      });
      
      // Calculate final match percentage
      let match = 0;
      if (matchCount > 0) {
        match = Math.round((matchScore / matchCount) * 100);
      } else {
        // Base match for all EDM events
        match = 20;
      }
      
      // Ensure match is between 0-100
      match = Math.max(0, Math.min(100, match));
      
      // Extract venue information
      const venue = event._embedded?.venues?.[0] || {};
      
      // Calculate distance from user if location is available
      let distance = null;
      if (userLocation && venue.location) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(venue.location.latitude),
          parseFloat(venue.location.longitude)
        );
      }
      
      // Format event data
      return {
        id: event.id,
        source: 'ticketmaster',
        name: event.name,
        date: event.dates.start.dateTime,
        image: event.images && event.images.length > 0 
          ? event.images.find(img => img.ratio === '16_9')?.url || event.images[0].url 
          : null,
        venue: {
          id: venue.id,
          name: venue.name || 'Unknown Venue',
          location: venue.city ? `${venue.city.name}, ${venue.state?.stateCode || ''}` : 'Location Unknown',
          address: venue.address?.line1,
          coordinates: venue.location ? {
            latitude: venue.location.latitude,
            longitude: venue.location.longitude
          } : null
        },
        genres: eventGenres,
        match: match,
        ticketLink: event.url,
        distance: distance
      };
    });
    
    // Fetch from EDMtrain API
    if (edmtrainApiKey) {
      try {
        console.log('Fetching events from EDMtrain API...');
        
        // Construct EDMtrain API request
        let edmtrainUrl = 'https://edmtrain.com/api/events';
        let edmtrainParams = { client: edmtrainApiKey };
        
        // Add location parameters if available
        if (userLocation) {
          if (userLocation.city && userLocation.region) {
            edmtrainParams.city = userLocation.city;
            edmtrainParams.state = userLocation.region;
          } else {
            // Use latitude/longitude with radius
            edmtrainParams.latitude = userLocation.latitude;
            edmtrainParams.longitude = userLocation.longitude;
            edmtrainParams.radius = 100; // 100 mile radius
          }
        }
        
        console.log('EDMtrain API request params:', JSON.stringify(edmtrainParams));
        
        const edmtrainResponse = await axios.get(edmtrainUrl, { 
          params: edmtrainParams,
          timeout: 15000
        });
        
        if (edmtrainResponse.data && edmtrainResponse.data.data) {
          edmtrainEvents = edmtrainResponse.data.data;
          console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
        } else {
          console.log('No events found in EDMtrain response');
          edmtrainError = 'No events found from EDMtrain';
        }
      } catch (error) {
        console.error('EDMtrain API request failed:', error.message);
        edmtrainError = error.message;
        
        // Try one more time with a simpler query
        try {
          console.log('Retrying EDMtrain with simpler query...');
          const edmtrainUrl = 'https://edmtrain.com/api/events';
          const edmtrainParams = { client: edmtrainApiKey };
          
          const retryResponse = await axios.get(edmtrainUrl, { 
            params: edmtrainParams,
            timeout: 15000
          });
          
          if (retryResponse.data && retryResponse.data.data) {
            edmtrainEvents = retryResponse.data.data;
            console.log(`Found ${edmtrainEvents.length} events from EDMtrain retry`);
            edmtrainError = null;
          } else {
            console.log('No events found in EDMtrain retry response');
          }
        } catch (retryError) {
          console.error('EDMtrain retry also failed:', retryError.message);
          edmtrainError = `${error.message} (retry also failed: ${retryError.message})`;
        }
      }
    } else {
      console.log('Skipping EDMtrain API call - no API key configured');
      edmtrainError = 'EDMtrain API key not configured';
    }
    
    // Process EDMtrain events
    const processedEdmtrainEvents = edmtrainEvents.map(event => {
      // Extract genres from artists
      let eventGenres = [];
      if (event.artistList && event.artistList.length > 0) {
        event.artistList.forEach(artist => {
          if (artist.genre) {
            eventGenres.push(artist.genre);
          }
        });
      }
      
      // If no genres found, use default EDM genres
      if (eventGenres.length === 0) {
        eventGenres = ['Electronic', 'Dance'];
      }
      
      // Calculate match percentage
      let matchScore = 0;
      let matchCount = 0;
      
      eventGenres.forEach(eventGenre => {
        const normalizedEventGenre = eventGenre.toLowerCase();
        
        userGenres.forEach((userGenre, index) => {
          // Check for partial matches in genre names
          if (normalizedEventGenre.includes(userGenre) || userGenre.includes(normalizedEventGenre)) {
            // Weight the match by the genre's importance to the user
            const genreWeight = userTaste.genres && userTaste.genres[index] ? 
              userTaste.genres[index].score / 100 : 0.5;
            matchScore += genreWeight;
            matchCount++;
          }
        });
      });
      
      // Calculate final match percentage
      let match = 0;
      if (matchCount > 0) {
        match = Math.round((matchScore / matchCount) * 100);
      } else {
        // Base match for all EDM events
        match = 20;
      }
      
      // Ensure match is between 0-100
      match = Math.max(0, Math.min(100, match));
      
      // Calculate distance if venue coordinates are available
      let distance = null;
      if (userLocation && event.venue.latitude && event.venue.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(event.venue.latitude),
          parseFloat(event.venue.longitude)
        );
      }
      
      // Format event data
      return {
        id: `edmtrain-${event.id}`,
        source: 'edmtrain',
        name: event.name || (event.artistList.length > 0 ? event.artistList[0].name : 'EDM Event'),
        date: event.date,
        image: event.imageUrl || 'https://example.com/edm-event-placeholder.jpg',
        venue: {
          id: `edmtrain-venue-${event.venue.id}`,
          name: event.venue.name,
          location: `${event.venue.location}, ${event.venue.state}`,
          address: event.venue.address,
          coordinates: event.venue.latitude && event.venue.longitude ? {
            latitude: event.venue.latitude,
            longitude: event.venue.longitude
          } : null
        },
        genres: eventGenres,
        match: match,
        ticketLink: event.ticketLink,
        distance: distance
      };
    });
    
    // Combine events from both sources
    let allEvents = [...processedTicketmasterEvents, ...processedEdmtrainEvents];
    
    // Sort by match score (highest first)
    allEvents.sort((a, b) => b.match - a.match);
    
    // Log event counts by source
    console.log(`Total events: ${allEvents.length}`);
    console.log(`Ticketmaster events: ${processedTicketmasterEvents.length}`);
    console.log(`EDMtrain events: ${processedEdmtrainEvents.length}`);
    
    return res.status(200).json({ 
      success: true, 
      events: allEvents,
      userLocation,
      sources: {
        ticketmaster: {
          count: processedTicketmasterEvents.length,
          error: ticketmasterError
        },
        edmtrain: {
          count: processedEdmtrainEvents.length,
          error: edmtrainError
        }
      }
    });
    
  } catch (error) {
    console.error('Error in events API handler:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
}
EOL

# 2. Fix SpiderChart.js - prevent truncated genre names
echo "Updating SpiderChart.js to fix truncated genre names..."
cat > "$PROJECT_DIR/components/SpiderChart.js" << 'EOL'
import React from 'react';
import styles from '../styles/SpiderChart.module.css';

const SpiderChart = ({ genres }) => {
  // Error handling: Check if genres is valid
  if (!genres || !Array.isArray(genres) || genres.length === 0) {
    return (
      <div className={styles.spiderChartContainer}>
        <div className={styles.errorMessage}>
          <p>Unable to display genre chart. No genre data available.</p>
        </div>
      </div>
    );
  }

  // Ensure all genres have valid properties
  const validGenres = genres.map(genre => ({
    name: genre.name || 'Unknown',
    score: typeof genre.score === 'number' && !isNaN(genre.score) ? genre.score : 0
  }));

  // Calculate positions for each genre on the spider chart
  const calculatePoints = (genres) => {
    try {
      const points = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 100; // Reduced from 120 to make chart more compact
      
      genres.forEach((genre, index) => {
        const angle = (Math.PI * 2 * index) / genres.length;
        const x = centerX + radius * Math.cos(angle) * (genre.score / 100);
        const y = centerY + radius * Math.sin(angle) * (genre.score / 100);
        points.push({ x, y, name: genre.name, score: genre.score });
      });
      
      return points;
    } catch (error) {
      console.error('Error calculating points:', error);
      return [];
    }
  };
  
  // Create SVG path for the spider web
  const createWebPath = (points) => {
    try {
      if (!points || points.length < 3) {
        return '';
      }
      
      let path = '';
      points.forEach((point, index) => {
        if (index === 0) {
          path += `M ${point.x} ${point.y} `;
        } else {
          path += `L ${point.x} ${point.y} `;
        }
      });
      path += 'Z';
      return path;
    } catch (error) {
      console.error('Error creating web path:', error);
      return '';
    }
  };
  
  // Create grid lines for the spider chart
  const createGridLines = (count) => {
    try {
      const lines = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 100; // Reduced from 120 to make chart more compact
      
      for (let i = 1; i <= count; i++) {
        const gridPoints = [];
        const gridRadius = (radius * i) / count;
        
        for (let j = 0; j < validGenres.length; j++) {
          const angle = (Math.PI * 2 * j) / validGenres.length;
          const x = centerX + gridRadius * Math.cos(angle);
          const y = centerY + gridRadius * Math.sin(angle);
          gridPoints.push({ x, y });
        }
        
        lines.push(createWebPath(gridPoints));
      }
      
      return lines;
    } catch (error) {
      console.error('Error creating grid lines:', error);
      return [];
    }
  };
  
  // Create axis lines for each genre
  const createAxisLines = () => {
    try {
      const lines = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 100; // Reduced from 120 to make chart more compact
      
      validGenres.forEach((genre, index) => {
        const angle = (Math.PI * 2 * index) / validGenres.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        lines.push({ x1: centerX, y1: centerY, x2: x, y2: y });
      });
      
      return lines;
    } catch (error) {
      console.error('Error creating axis lines:', error);
      return [];
    }
  };
  
  // Calculate all the necessary data with error handling
  let points = [];
  let webPath = '';
  let gridLines = [];
  let axisLines = [];
  
  try {
    points = calculatePoints(validGenres);
    webPath = createWebPath(points);
    gridLines = createGridLines(3); // Reduced from 4 to 3 for more compact display
    axisLines = createAxisLines();
  } catch (error) {
    console.error('Error in SpiderChart calculations:', error);
  }
  
  // Function to position and format genre labels to prevent truncation
  const getGenreLabelPosition = (index, totalGenres) => {
    const angle = (Math.PI * 2 * index) / totalGenres;
    // Increased label radius to provide more space for text
    const labelRadius = 130;
    const labelX = 150 + labelRadius * Math.cos(angle);
    const labelY = 150 + labelRadius * Math.sin(angle);
    
    // Determine text anchor based on position in the circle
    // This helps align text better to prevent truncation
    let textAnchor = "middle";
    if (angle < Math.PI * 0.25 || angle > Math.PI * 1.75) {
      textAnchor = "start";
    } else if (angle >= Math.PI * 0.75 && angle <= Math.PI * 1.25) {
      textAnchor = "end";
    }
    
    return { labelX, labelY, textAnchor };
  };
  
  // Abbreviate genre names to prevent truncation
  const abbreviateGenreName = (name) => {
    if (!name) return '';
    
    // If name is already short, return as is
    if (name.length <= 10) return name;
    
    // Common abbreviations for EDM genres
    const abbreviations = {
      'Progressive': 'Prog',
      'Electronic': 'Elec',
      'Melodic': 'Melo',
      'Techno': 'Tech',
      'House': 'House',
      'Trance': 'Trance',
      'Dubstep': 'Dub',
      'Drum and Bass': 'DnB',
      'Drum & Bass': 'DnB',
      'Future Bass': 'Fut Bass',
      'Tropical': 'Trop',
      'Hardstyle': 'Hard',
      'Underground': 'Undgr'
    };
    
    // Check if we can use a common abbreviation
    for (const [full, abbr] of Object.entries(abbreviations)) {
      if (name.includes(full)) {
        return name.replace(full, abbr);
      }
    }
    
    // If no common abbreviation, truncate with ellipsis
    return name.substring(0, 8) + '...';
  };
  
  return (
    <div className={styles.spiderChartContainer}>
      {points.length > 0 ? (
        <svg viewBox="0 0 300 300" className={styles.spiderChart}>
          {/* Grid lines */}
          {gridLines.map((line, index) => (
            <path
              key={`grid-${index}`}
              d={line}
              className={styles.gridLine}
            />
          ))}
          
          {/* Axis lines */}
          {axisLines.map((line, index) => (
            <line
              key={`axis-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={styles.axisLine}
            />
          ))}
          
          {/* Data web */}
          {webPath && (
            <path
              d={webPath}
              className={styles.dataWeb}
            />
          )}
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="3" // Reduced from 4 to make points smaller
              className={styles.dataPoint}
            />
          ))}
          
          {/* Genre labels with improved positioning and abbreviation */}
          {points.map((point, index) => {
            const { labelX, labelY, textAnchor } = getGenreLabelPosition(index, validGenres.length);
            const abbreviatedName = abbreviateGenreName(point.name);
            
            return (
              <text
                key={`label-${index}`}
                x={labelX}
                y={labelY}
                className={styles.genreLabel}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize="10" // Reduced from 12 to make text smaller
              >
                {abbreviatedName}
              </text>
            );
          })}
        </svg>
      ) : (
        <div className={styles.errorMessage}>
          <p>Unable to render chart. Please try again later.</p>
        </div>
      )}
      
      <div className={styles.legend}>
        {validGenres.map((genre, index) => (
          <div key={`legend-${index}`} className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: `hsl(${index * (360 / validGenres.length)}, 100%, 50%)` }}></span>
            <span className={styles.legendText}>{genre.name}: {genre.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpiderChart;
EOL

# 3. Fix ArtistCard.js - add popularity and obscurity metrics
echo "Updating ArtistCard.js to add popularity and obscurity metrics..."
cat > "$PROJECT_DIR/components/ArtistCard.js" << 'EOL'
import React from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist, correlation, similarArtists }) => {
  // Error handling: Check if artist is valid
  if (!artist || typeof artist !== 'object') {
    return (
      <div className={styles.artistCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display artist information. Invalid artist data.</p>
        </div>
      </div>
    );
  }

  // Ensure correlation is a valid number
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Validate similarArtists array
  const validSimilarArtists = Array.isArray(similarArtists) ? similarArtists : [];
  
  // Ensure popularity is a valid number
  const popularity = typeof artist.popularity === 'number' && !isNaN(artist.popularity) ? artist.popularity : 50;
  
  // Calculate obscurity level (inverse of popularity)
  const obscurityLevel = 100 - popularity;
  
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistImageContainer}>
        {artist.images && artist.images.length > 0 ? (
          <div 
            className={styles.artistImage}
            style={{ 
              backgroundImage: `url(${artist.images[0].url})`,
              width: '80px',  // Reduced from default size
              height: '80px'  // Reduced from default size
            }}
          />
        ) : (
          <div 
            className={styles.artistImagePlaceholder}
            style={{ 
              width: '80px',  // Reduced from default size
              height: '80px'  // Reduced from default size
            }}
          >
            <span>{artist.name ? artist.name.charAt(0) : '?'}</span>
          </div>
        )}
        
        <div className={styles.correlationBadge}>
          <span className={styles.correlationValue}>{correlationPercent}%</span>
          <span className={styles.correlationLabel}>match</span>
        </div>
      </div>
      
      <div className={styles.artistInfo}>
        <h3 className={styles.artistName}>{artist.name || 'Unknown Artist'}</h3>
        
        <div className={styles.artistMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Popularity</span>
            <div className={styles.popularityBar}>
              <div 
                className={styles.popularityFill} 
                style={{ width: `${popularity}%` }}
              ></div>
            </div>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Obscurity</span>
            <div className={styles.obscurityBar}>
              <div 
                className={styles.obscurityFill} 
                style={{ width: `${obscurityLevel}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className={styles.artistGenres}>
          {artist.genres && Array.isArray(artist.genres) ? 
            artist.genres.slice(0, 2).map((genre, index) => (
              <span key={index} className={styles.genreTag}>{genre}</span>
            )) : 
            <span className={styles.genreTag}>No genres available</span>
          }
        </div>
        
        <div className={styles.similarArtistsSection}>
          <h4 className={styles.similarArtistsTitle}>Similar Artists</h4>
          <div className={styles.similarArtistsList}>
            {validSimilarArtists.length > 0 ? 
              validSimilarArtists.slice(0, 3).map((similar, index) => (
                <div key={index} className={styles.similarArtist}>
                  <span className={styles.similarArtistName}>{similar.name || 'Unknown Artist'}</span>
                </div>
              )) : 
              <div className={styles.similarArtist}>
                <span className={styles.similarArtistName}>No similar artists found</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
EOL

# 4. Fix TrackCard.js - add obscurity metric
echo "Updating TrackCard.js to add obscurity metric..."
cat > "$PROJECT_DIR/components/TrackCard.js" << 'EOL'
import React from 'react';
import styles from '../styles/TrackCard.module.css';

const TrackCard = ({ track, correlation, duration, popularity }) => {
  // Error handling: Check if track is valid
  if (!track || typeof track !== 'object') {
    return (
      <div className={styles.trackCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display track information. Invalid track data.</p>
        </div>
      </div>
    );
  }

  // Ensure correlation, duration and popularity are valid numbers
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  const validDuration = typeof duration === 'number' && !isNaN(duration) ? duration : 0;
  const validPopularity = typeof popularity === 'number' && !isNaN(popularity) ? popularity : 50;
  
  // Format correlation as percentage
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Calculate obscurity level (inverse of popularity)
  const obscurityLevel = 100 - validPopularity;
  
  // Format duration from ms to mm:ss
  const formatDuration = (ms) => {
    try {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return '0:00';
    }
  };
  
  return (
    <div className={styles.trackCard}>
      <div className={styles.albumArtContainer}>
        {track.album && track.album.images && track.album.images.length > 0 && track.album.images[0].url ? (
          <div 
            className={styles.albumArt}
            style={{ 
              backgroundImage: `url(${track.album.images[0].url})`,
              width: '80px',  // Reduced from default size
              height: '80px'  // Reduced from default size
            }}
          />
        ) : (
          <div 
            className={styles.albumArtPlaceholder}
            style={{ 
              width: '80px',  // Reduced from default size
              height: '80px'  // Reduced from default size
            }}
          >
            <span>{track.name ? track.name.charAt(0) : '?'}</span>
          </div>
        )}
        
        <div className={styles.correlationBadge}>
          <span className={styles.correlationValue}>{correlationPercent}%</span>
          <span className={styles.correlationLabel}>match</span>
        </div>
      </div>
      
      <div className={styles.trackInfo}>
        <h3 className={styles.trackName}>{track.name || 'Unknown Track'}</h3>
        <p className={styles.artistName}>
          {track.artists && Array.isArray(track.artists) 
            ? track.artists.map(a => a?.name || 'Unknown Artist').join(', ')
            : 'Unknown Artist'}
        </p>
        
        <div className={styles.trackMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Duration</span>
            <span className={styles.metricValue}>{formatDuration(validDuration)}</span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Popularity</span>
            <div className={styles.popularityBar}>
              <div 
                className={styles.popularityFill} 
                style={{ width: `${validPopularity}%` }}
              ></div>
            </div>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Obscurity</span>
            <div className={styles.obscurityBar}>
              <div 
                className={styles.obscurityFill} 
                style={{ width: `${obscurityLevel}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
EOL

# 5. Fix SeasonalMoodCard.js - make it more compact and Gen Z friendly
echo "Updating SeasonalMoodCard.js to make it more compact and Gen Z friendly..."
cat > "$PROJECT_DIR/components/SeasonalMoodCard.js" << 'EOL'
import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  // Error handling: Check if seasonalMood is valid
  if (!seasonalMood || typeof seasonalMood !== 'object') {
    return (
      <div className={styles.seasonalMoodCard}>
        <div className={styles.errorMessage}>
          <p>Can't show your vibe right now. Try again later!</p>
        </div>
      </div>
    );
  }

  // Safely extract currentSeason and seasons with fallbacks
  const currentSeason = seasonalMood.currentSeason || {};
  const seasons = Array.isArray(seasonalMood.seasons) ? seasonalMood.seasons : [];
  
  // Get season icon based on season name
  const getSeasonIcon = (season) => {
    if (!season) return '🎵';
    
    try {
      const seasonName = typeof season === 'string' ? season.toLowerCase() : 
                         typeof season === 'object' && season.name ? season.name.toLowerCase() : '';
      
      switch(seasonName) {
        case 'spring':
          return '🌸';
        case 'summer':
          return '☀️';
        case 'fall':
        case 'autumn':
          return '🍂';
        case 'winter':
          return '❄️';
        default:
          return '🎵';
      }
    } catch (error) {
      console.error('Error getting season icon:', error);
      return '🎵';
    }
  };
  
  // Get mood color based on mood name
  const getMoodColor = (mood) => {
    if (!mood) return '#00ffff';
    
    try {
      const moodName = typeof mood === 'string' ? mood.toLowerCase() : '';
      
      switch(moodName) {
        case 'energetic':
          return '#ff3366';
        case 'chill':
          return '#33ccff';
        case 'melancholic':
          return '#9966ff';
        case 'happy':
          return '#ffcc33';
        case 'dark':
          return '#6633cc';
        case 'uplifting':
          return '#33ff99';
        default:
          return '#00ffff';
      }
    } catch (error) {
      console.error('Error getting mood color:', error);
      return '#00ffff';
    }
  };
  
  // Check if currentSeason has required properties
  const hasValidCurrentSeason = currentSeason && 
                               currentSeason.name && 
                               currentSeason.primaryMood && 
                               Array.isArray(currentSeason.topGenres);
  
  return (
    <div className={styles.seasonalMoodCard} style={{ maxHeight: '200px', overflow: 'hidden' }}>
      {/* Current vibe section with Gen Z friendly language - more compact */}
      {hasValidCurrentSeason ? (
        <div className={styles.currentSeason} style={{ padding: '10px' }}>
          <div className={styles.seasonHeader} style={{ marginBottom: '5px' }}>
            <span className={styles.seasonIcon}>{getSeasonIcon(currentSeason.name)}</span>
            <h3 className={styles.seasonName} style={{ fontSize: '16px', margin: '0 5px' }}>
              Your {currentSeason.name} Vibe
            </h3>
            <span 
              className={styles.moodValue}
              style={{ 
                color: getMoodColor(currentSeason.primaryMood),
                fontSize: '14px'
              }}
            >
              {currentSeason.primaryMood}
            </span>
          </div>
          
          {/* Simplified genre tags in a more compact layout */}
          <div className={styles.genreTags} style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {currentSeason.topGenres.length > 0 ? (
              currentSeason.topGenres.slice(0, 2).map((genre, index) => (
                <span 
                  key={index} 
                  className={styles.genreTag}
                  style={{ 
                    fontSize: '12px', 
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.2)'
                  }}
                >
                  {genre}
                </span>
              ))
            ) : (
              <span className={styles.genreTag}>No genres yet</span>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.currentSeason} style={{ padding: '10px' }}>
          <div className={styles.seasonHeader}>
            <span className={styles.seasonIcon}>🎵</span>
            <h3 className={styles.seasonName} style={{ fontSize: '16px', margin: '0 5px' }}>
              Your Current Vibe
            </h3>
          </div>
          <p style={{ fontSize: '12px', margin: '5px 0' }}>Still figuring out your vibe...</p>
        </div>
      )}
      
      {/* Year-round vibes section with Gen Z friendly language - more compact */}
      <div className={styles.seasonalHistory} style={{ padding: '5px 10px' }}>
        <h4 className={styles.historyTitle} style={{ fontSize: '14px', margin: '5px 0' }}>
          Your Year-Round Vibes
        </h4>
        
        {seasons.length > 0 ? (
          <div className={styles.seasonsGrid} style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '5px'
          }}>
            {seasons.map((season, index) => {
              // Validate season object
              if (!season || typeof season !== 'object' || !season.name) {
                return null;
              }
              
              return (
                <div key={index} className={styles.seasonItem} style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '12px',
                  padding: '2px 5px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  margin: '0'
                }}>
                  <span className={styles.seasonItemIcon} style={{ marginRight: '3px' }}>
                    {getSeasonIcon(season.name)}
                  </span>
                  <span className={styles.seasonItemName} style={{ marginRight: '3px' }}>
                    {season.name}
                  </span>
                  
                  {season.primaryMood && (
                    <span 
                      className={styles.seasonItemMood}
                      style={{ 
                        color: getMoodColor(season.primaryMood),
                        fontSize: '11px'
                      }}
                    >
                      {season.primaryMood}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noDataMessage} style={{ fontSize: '12px' }}>
            <p>No seasonal vibes yet - keep listening!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
EOL

# 6. Roll back VibeQuizCard.js to previous settings
echo "Rolling back VibeQuizCard.js to previous settings..."
cat > "$PROJECT_DIR/components/VibeQuizCard.js" << 'EOL'
import React, { useState } from 'react';
import styles from '../styles/VibeQuizCard.module.css';

const VibeQuizCard = ({ onSubmit }) => {
  // Error handling: Check if onSubmit is a valid function
  const handleSubmit = typeof onSubmit === 'function' ? onSubmit : () => console.warn('No onSubmit handler provided');
  
  const [activeTab, setActiveTab] = useState(0);
  const [selections, setSelections] = useState({
    tempo: [],
    mood: [],
    elements: [],
    subgenres: [],
    venues: []
  });
  
  const tabs = [
    {
      id: 'tempo',
      label: 'Tempo',
      options: [
        { id: 'slow', label: 'Slow & Chill' },
        { id: 'medium', label: 'Medium Groove' },
        { id: 'fast', label: 'Fast & Energetic' },
        { id: 'varying', label: 'Varying Tempos' },
        { id: 'experimental', label: 'Experimental Rhythms' }
      ]
    },
    {
      id: 'mood',
      label: 'Mood',
      options: [
        { id: 'uplifting', label: 'Uplifting & Euphoric' },
        { id: 'dark', label: 'Dark & Intense' },
        { id: 'melodic', label: 'Melodic & Emotional' },
        { id: 'aggressive', label: 'Aggressive & Hard' },
        { id: 'ambient', label: 'Ambient & Atmospheric' }
      ]
    },
    {
      id: 'elements',
      label: 'Elements',
      options: [
        { id: 'vocals', label: 'Vocal Tracks' },
        { id: 'instrumental', label: 'Instrumental Only' },
        { id: 'bass', label: 'Heavy Bass' },
        { id: 'melody', label: 'Melodic Focus' },
        { id: 'drops', label: 'Epic Drops' }
      ]
    },
    {
      id: 'subgenres',
      label: 'Subgenres',
      options: [
        { id: 'house', label: 'House' },
        { id: 'techno', label: 'Techno' },
        { id: 'trance', label: 'Trance' },
        { id: 'dubstep', label: 'Dubstep' },
        { id: 'dnb', label: 'Drum & Bass' }
      ]
    },
    {
      id: 'venues',
      label: 'Venues',
      options: [
        { id: 'club', label: 'Club Nights' },
        { id: 'festival', label: 'Festivals' },
        { id: 'warehouse', label: 'Warehouse Parties' },
        { id: 'underground', label: 'Underground Scene' },
        { id: 'mainstream', label: 'Mainstream Events' }
      ]
    }
  ];
  
  const handleOptionToggle = (tabId, optionId) => {
    try {
      setSelections(prev => {
        // Ensure prev[tabId] exists and is an array
        const currentSelections = Array.isArray(prev[tabId]) ? [...prev[tabId]] : [];
        
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [tabId]: currentSelections.filter(id => id !== optionId)
          };
        } else {
          return {
            ...prev,
            [tabId]: [...currentSelections, optionId]
          };
        }
      });
    } catch (error) {
      console.error('Error toggling option:', error);
    }
  };
  
  const submitSelections = () => {
    try {
      handleSubmit(selections);
    } catch (error) {
      console.error('Error submitting selections:', error);
    }
  };
  
  const isOptionSelected = (tabId, optionId) => {
    try {
      return Array.isArray(selections[tabId]) && selections[tabId].includes(optionId);
    } catch (error) {
      console.error('Error checking if option is selected:', error);
      return false;
    }
  };
  
  const getCompletionPercentage = () => {
    try {
      let selectedCount = 0;
      let totalCount = 0;
      
      Object.keys(selections).forEach(key => {
        const selectionArray = Array.isArray(selections[key]) ? selections[key] : [];
        selectedCount += selectionArray.length;
        
        const tabOptions = tabs.find(tab => tab.id === key)?.options;
        totalCount += Array.isArray(tabOptions) ? tabOptions.length : 0;
      });
      
      return totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;
    } catch (error) {
      console.error('Error calculating completion percentage:', error);
      return 0;
    }
  };
  
  return (
    <div className={styles.vibeQuizCard}>
      <h3 className={styles.quizTitle}>Customize Your Vibe</h3>
      <p className={styles.quizDescription}>
        Select your preferences to fine-tune your music taste profile. 
        Choose multiple options in each category.
      </p>
      
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === index ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {tab.label}
              {Array.isArray(selections[tab.id]) && selections[tab.id].length > 0 && (
                <span className={styles.selectionCount}>
                  {selections[tab.id].length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className={styles.tabContent}>
          {tabs.map((tab, index) => (
            <div 
              key={tab.id}
              className={`${styles.tabPanel} ${activeTab === index ? styles.activePanel : ''}`}
            >
              <div className={styles.optionsGrid}>
                {Array.isArray(tab.options) && tab.options.map(option => (
                  <div 
                    key={option.id}
                    className={`${styles.optionItem} ${isOptionSelected(tab.id, option.id) ? styles.selectedOption : ''}`}
                    onClick={() => handleOptionToggle(tab.id, option.id)}
                  >
                    <div className={styles.optionCheckmark}>
                      {isOptionSelected(tab.id, option.id) && '✓'}
                    </div>
                    <span className={styles.optionLabel}>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.quizFooter}>
        <div className={styles.completionBar}>
          <div 
            className={styles.completionFill}
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
        <span className={styles.completionText}>
          {getCompletionPercentage()}% Complete
        </span>
        
        <button 
          className={styles.submitButton}
          onClick={submitSelections}
          disabled={getCompletionPercentage() === 0}
        >
          Update My Taste Profile
        </button>
      </div>
    </div>
  );
};

export default VibeQuizCard;
EOL

# 7. Fix Navigation.js - reorganize with profile dropdown
echo "Updating Navigation.js to reorganize with profile dropdown..."
cat > "$PROJECT_DIR/components/Navigation.js" << 'EOL'
import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/Navigation.module.css';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const Navigation = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const isActive = (path) => {
    return router.pathname === path ? styles.active : '';
  };
  
  // Fixed sign-out functionality
  const handleSignOut = async () => {
    try {
      // Use callbackUrl to ensure proper redirection after sign-out
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback manual redirect if signOut fails
      window.location.href = '/';
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <a className={styles.logo}>SONAR</a>
        </Link>
        <span className={styles.tagline}>Connect with your sound</span>
      </div>
      
      <div className={styles.navLinks}>
        {status === 'authenticated' && (
          <>
            <Link href="/users/music-taste">
              <a className={`${styles.navLink} ${isActive('/users/music-taste')}`}>
                Music Taste
              </a>
            </Link>
            <Link href="/users/events">
              <a className={`${styles.navLink} ${isActive('/users/events')}`}>
                Events
              </a>
            </Link>
          </>
        )}
      </div>
      
      <div className={styles.authContainer}>
        {status === 'loading' ? (
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : status === 'authenticated' ? (
          <div className={styles.profileDropdown} ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={styles.profileButton}
            >
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileInitial}>
                  {session.user?.name ? session.user.name.charAt(0) : 'U'}
                </div>
              )}
              <span className={styles.profileName}>
                {session.user?.name ? session.user.name.split(' ')[0] : 'User'}
              </span>
              <span className={styles.dropdownArrow}>▼</span>
            </button>
            
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <Link href="/users/profile">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>👤</span>
                    Profile
                  </a>
                </Link>
                <Link href="/users/settings">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>⚙️</span>
                    Settings
                  </a>
                </Link>
                <Link href="/users/account">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🔑</span>
                    Account
                  </a>
                </Link>
                <Link href="/users/appearance">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🎨</span>
                    Appearance
                  </a>
                </Link>
                <Link href="/users/notifications">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🔔</span>
                    Notifications
                  </a>
                </Link>
                <div className={styles.dropdownDivider}></div>
                <button 
                  onClick={handleSignOut}
                  className={styles.dropdownItem}
                >
                  <span className={styles.dropdownIcon}>🚪</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => signIn('spotify')}
            className={styles.authButton}
          >
            Connect
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
EOL

# 8. Fix music-taste.js - update to show top 5 artists/tracks and use Gen Z-friendly language
echo "Updating music-taste.js to show top 5 artists/tracks and use Gen Z-friendly language..."
cat > "$PROJECT_DIR/pages/users/music-taste.js" << 'EOL'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/MusicTaste.module.css';
import SpiderChart from '../../components/SpiderChart';
import ArtistCard from '../../components/ArtistCard';
import TrackCard from '../../components/TrackCard';
import SeasonalMoodCard from '../../components/SeasonalMoodCard';
import VibeQuizCard from '../../components/VibeQuizCard';
import EventCard from '../../components/EventCard';
import Navigation from '../../components/Navigation';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserTaste();
    }
  }, [status]);

  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      if (!response.ok) {
        throw new Error('Failed to fetch music taste data');
      }
      const data = await response.json();
      console.log('API response:', data); // For debugging
      setUserTaste(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVibeQuizSubmit = async (preferences) => {
    try {
      const response = await fetch('/api/user/update-taste-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      // Refresh user taste data
      fetchUserTaste();
      setShowVibeQuiz(false);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.message);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your vibe...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Connect to see your sound</h1>
          <p className={styles.subtitle}>Link Spotify. Get your vibe. Find your scene.</p>
          <Link href="/api/auth/signin">
            <a className={styles.connectButton}>Connect Spotify</a>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.errorContainer}>
          <h1 className={styles.title}>Oops! That didn't work</h1>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchUserTaste} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userTaste) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.noDataContainer}>
          <h1 className={styles.title}>No vibe data yet</h1>
          <p className={styles.subtitle}>
            Play more tracks on Spotify. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  // Safely extract data with null checks and fallbacks
  const genres = Array.isArray(userTaste.genres) ? userTaste.genres : 
                 Array.isArray(userTaste.topGenres) ? userTaste.topGenres.map(g => typeof g === 'string' ? {name: g, score: 50} : g) : 
                 [];
  
  const topArtists = Array.isArray(userTaste.topArtists) ? userTaste.topArtists : [];
  const topTracks = Array.isArray(userTaste.topTracks) ? userTaste.topTracks : [];
  
  // Handle seasonal mood data with fallbacks
  const seasonalMood = userTaste.seasonalMood && typeof userTaste.seasonalMood === 'object' ? userTaste.seasonalMood : {};
  
  // Create currentSeason if it doesn't exist or is incomplete
  if (!seasonalMood.currentSeason || typeof seasonalMood.currentSeason !== 'object') {
    const currentSeasonName = seasonalMood.current || 'Current Season';
    seasonalMood.currentSeason = {
      name: currentSeasonName,
      primaryMood: seasonalMood[currentSeasonName]?.mood || 'Unknown',
      topGenres: Array.isArray(seasonalMood[currentSeasonName]?.genres) ? 
                seasonalMood[currentSeasonName].genres : []
    };
  }
  
  // Ensure seasons array exists
  if (!Array.isArray(seasonalMood.seasons)) {
    seasonalMood.seasons = [];
  }
  
  const suggestedEvents = Array.isArray(userTaste.suggestedEvents) ? userTaste.suggestedEvents : [];

  // Create a more concise, ADHD-friendly summary
  const getTopGenres = () => {
    if (genres.length === 0) return "your fav beats";
    return genres.slice(0, Math.min(2, genres.length)).map(g => g.name || 'Unknown').join(' + ');
  };

  const getRecentTrends = () => {
    if (!seasonalMood.currentSeason || 
        !Array.isArray(seasonalMood.currentSeason.topGenres) || 
        seasonalMood.currentSeason.topGenres.length === 0) {
      return "fresh sounds";
    }
    return seasonalMood.currentSeason.topGenres.slice(0, 1).join('');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Sound | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        {/* Compact header section */}
        <div className={styles.header} style={{ marginBottom: '15px' }}>
          <h1 className={styles.title} style={{ fontSize: '24px', marginBottom: '5px' }}>Your Sound</h1>
          <p className={styles.subtitle} style={{ fontSize: '14px', marginTop: '0' }}>
            Based on what you're streaming
          </p>
        </div>
        
        {/* Concise summary */}
        <div className={styles.summary} style={{ 
          padding: '10px', 
          marginBottom: '15px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px'
        }}>
          <p style={{ margin: '0', fontSize: '14px' }}>
            You're all about <span className={styles.highlight}>{getTopGenres()}</span> with 
            a vibe shift toward <span className={styles.highlight}>{getRecentTrends()}</span>. 
            {suggestedEvents.length > 0 ? 
              `Found ${suggestedEvents.length} events that match your sound.` : 
              "Events coming soon that match your sound."}
          </p>
        </div>
        
        {/* Events section - moved up to prioritize */}
        <section className={styles.eventsSection} style={{ 
          marginBottom: '20px',
          padding: '15px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(0,255,255,0.2)'
        }}>
          <h2 className={styles.sectionTitle} style={{ 
            fontSize: '20px', 
            marginBottom: '10px',
            color: '#00ffff'
          }}>Events That Match Your Vibe</h2>
          
          {suggestedEvents.length > 0 ? (
            <div className={styles.eventsGrid}>
              {suggestedEvents.slice(0, Math.min(3, suggestedEvents.length)).map((event, index) => (
                <EventCard 
                  key={event.id || `event-${index}`} 
                  event={event} 
                  correlation={event.correlation || 0.5}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage} style={{ textAlign: 'center', padding: '20px' }}>
              <p>Events coming soon. Check back!</p>
              <button className={styles.refreshButton} onClick={fetchUserTaste} style={{
                marginTop: '10px',
                padding: '8px 15px',
                background: 'rgba(0,255,255,0.2)',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer'
              }}>
                Refresh
              </button>
            </div>
          )}
          
          {suggestedEvents.length > 0 && (
            <div className={styles.viewMoreContainer} style={{ textAlign: 'center', marginTop: '10px' }}>
              <Link href="/users/events">
                <a className={styles.viewMoreButton} style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}>See All Events</a>
              </Link>
            </div>
          )}
        </section>
        
        {/* More compact genre section */}
        <section className={styles.genreSection} style={{ marginBottom: '15px' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '18px', marginBottom: '5px' }}>Your Mix</h2>
          <div className={styles.spiderChartContainer} style={{ maxHeight: '250px' }}>
            {genres.length > 0 ? (
              <SpiderChart genres={genres} />
            ) : (
              <div className={styles.noDataMessage}>
                <p>No genre data yet. Keep streaming!</p>
              </div>
            )}
          </div>
        </section>
        
        {/* More compact artists section */}
        <section className={styles.artistsSection} style={{ marginBottom: '15px' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '18px', marginBottom: '5px' }}>Artists You Vibe With</h2>
          {topArtists.length > 0 ? (
            <div className={styles.artistsGrid} style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '10px'
            }}>
              {/* Show top 5 artists with up to 3 similar artists each */}
              {topArtists.slice(0, 5).map((artist, index) => (
                <ArtistCard 
                  key={artist.id || `artist-${index}`} 
                  artist={artist} 
                  correlation={artist.correlation || 0.5}
                  similarArtists={Array.isArray(artist.similarArtists) ? artist.similarArtists.slice(0, 3) : []}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No artist data yet. Keep streaming!</p>
            </div>
          )}
        </section>
        
        {/* More compact tracks section */}
        <section className={styles.tracksSection} style={{ marginBottom: '15px' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '18px', marginBottom: '5px' }}>Your Repeat Tracks</h2>
          {topTracks.length > 0 ? (
            <div className={styles.tracksGrid} style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '10px'
            }}>
              {/* Show top 5 tracks based on the last 3 months */}
              {topTracks.slice(0, 5).map((track, index) => (
                <TrackCard 
                  key={track.id || `track-${index}`} 
                  track={track} 
                  correlation={track.correlation || 0.5}
                  duration={track.duration_ms || 0}
                  popularity={track.popularity || 0}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No track data yet. Keep streaming!</p>
            </div>
          )}
        </section>
        
        {/* More compact seasonal section */}
        <section className={styles.seasonalSection} style={{ marginBottom: '15px' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '18px', marginBottom: '5px' }}>Your Seasonal Vibes</h2>
          <SeasonalMoodCard seasonalMood={seasonalMood} />
        </section>
        
        {/* Vibe Quiz section */}
        <section className={styles.vibeQuizSection} style={{ marginBottom: '15px' }}>
          <div className={styles.vibeQuizPrompt} style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px'
          }}>
            <p style={{ margin: '0', fontSize: '14px' }}>Not feeling this vibe? Tell us what you're into</p>
            <button 
              className={styles.vibeQuizButton}
              onClick={() => setShowVibeQuiz(!showVibeQuiz)}
              style={{
                padding: '5px 15px',
                background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
            >
              {showVibeQuiz ? 'Hide Quiz' : 'Take Quiz'}
            </button>
          </div>
          
          {showVibeQuiz && (
            <VibeQuizCard onSubmit={handleVibeQuizSubmit} />
          )}
        </section>
      </main>
    </div>
  );
}
EOL

# Add CSS for profile dropdown
echo "Adding CSS for profile dropdown..."
cat > "$PROJECT_DIR/styles/Navigation.module.css" << 'EOL'
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logoContainer {
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #00ffff;
  text-decoration: none;
  letter-spacing: 2px;
}

.tagline {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
}

.navLinks {
  display: flex;
  gap: 1.5rem;
}

.navLink {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s;
}

.navLink:hover {
  color: #00ffff;
}

.navLink.active {
  color: #00ffff;
}

.navLink.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
}

.authContainer {
  position: relative;
}

.authButton {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  color: black;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.authButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 255, 255, 0.3);
}

.loadingDots {
  display: flex;
  gap: 4px;
}

.loadingDots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #00ffff;
  animation: pulse 1.5s infinite;
}

.loadingDots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loadingDots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Profile dropdown styles */
.profileDropdown {
  position: relative;
}

.profileButton {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  border-radius: 20px;
  transition: background-color 0.2s;
}

.profileButton:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.profileImage {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 8px;
  border: 2px solid #00ffff;
}

.profileInitial {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(45deg, #00ffff, #ff00ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 8px;
}

.profileName {
  margin-right: 5px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdownArrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.profileButton:hover .dropdownArrow {
  transform: translateY(2px);
}

.dropdownMenu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background-color: #121212;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 10;
  margin-top: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dropdownItem {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: white;
  text-decoration: none;
  transition: background-color 0.2s;
  font-size: 14px;
}

.dropdownItem:hover {
  background-color: rgba(0, 255, 255, 0.1);
}

button.dropdownItem {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.dropdownIcon {
  margin-right: 10px;
  font-size: 16px;
}

.dropdownDivider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 5px 0;
}

@media (max-width: 768px) {
  .navigation {
    padding: 1rem;
  }
  
  .navLinks {
    gap: 1rem;
  }
  
  .profileName {
    display: none;
  }
}
EOL

# Commit changes and deploy to Heroku
echo "Committing changes and deploying to Heroku..."
cd "$PROJECT_DIR"

# Add all changes
git add pages/api/events/index.js
git add components/SpiderChart.js
git add components/ArtistCard.js
git add components/TrackCard.js
git add components/SeasonalMoodCard.js
git add components/VibeQuizCard.js
git add components/Navigation.js
git add pages/users/music-taste.js
git add styles/Navigation.module.css

# Commit changes
git commit -m "Comprehensive fix for Sonar EDM Platform: Ticketmaster integration, UI improvements, and navigation reorganization"

# Deploy to Heroku
git push heroku main

echo "Deployment complete! Your Sonar EDM Platform has been updated with all the requested improvements."
echo "Visit https://sonar-edm-user-50e4fb038f6e.herokuapp.com/ to see the changes."
echo ""
echo "Key improvements:"
echo "1. Fixed Ticketmaster API integration to ensure events appear alongside EDM Train events"
echo "2. Rolled back the Vibe Quiz to previous settings"
echo "3. Fixed Spotify real data display with proper popularity metrics"
echo "4. Adjusted icon sizes to be more appropriate"
echo "5. Fixed spider chart label truncation"
echo "6. Reorganized navigation with profile dropdown (including Account, Appearance, Notifications)"
echo "7. Made the user taste display more compact to emphasize the Events section"
echo ""
echo "If you need to restore from backup, the files are in: $BACKUP_DIR"
