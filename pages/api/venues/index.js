import axios from 'axios';

export default async function handler(req, res) {
  try {
    console.log('Starting venues API handler');
    
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
    }
    
    // Get user taste data to calculate match percentages
    let userTaste;
    try {
      const userTasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/spotify/user-taste`);
      userTaste = userTasteResponse.data.taste;
      console.log('Successfully fetched user taste data');
    } catch (error) {
      console.error('Error fetching user taste data:', error.message);
      // Continue with default taste data if user taste can't be fetched
      userTaste = {
        topGenres: [
          { label: 'House', value: 85 },
          { label: 'Techno', value: 70 },
          { label: 'Trance', value: 60 },
          { label: 'Dubstep', value: 40 },
          { label: 'Drum & Bass', value: 75 },
          { label: 'Future Bass', value: 55 }
        ]
      };
      console.log('Using default taste data instead');
    }
    
    // Extract user's top genres for matching
    const userGenres = userTaste.topGenres.map(genre => genre.label.toLowerCase());
    console.log('User genres for matching:', userGenres);
    
    // Mock venues data with location-based filtering
    // In a production environment, this would be fetched from a database or external API
    const allVenues = [
      {
        id: 'v1',
        name: 'Fabric London',
        location: 'London, UK',
        coordinates: { latitude: 51.5203, longitude: -0.1019 },
        genres: ['techno', 'house', 'drum & bass'],
        description: 'Iconic London nightclub known for electronic music',
        image: 'https://example.com/fabric.jpg',
        website: 'https://fabriclondon.com',
        capacity: 1600
      },
      {
        id: 'v2',
        name: 'Berghain',
        location: 'Berlin, Germany',
        coordinates: { latitude: 52.5111, longitude: 13.4399 },
        genres: ['techno', 'house'],
        description: 'Famous Berlin techno club with strict door policy',
        image: 'https://example.com/berghain.jpg',
        website: 'https://berghain.de',
        capacity: 1500
      },
      {
        id: 'v3',
        name: 'Output',
        location: 'New York, USA',
        coordinates: { latitude: 40.7223, longitude: -73.9588 },
        genres: ['house', 'techno', 'electronic'],
        description: 'Brooklyn-based nightclub with focus on sound quality',
        image: 'https://example.com/output.jpg',
        website: 'https://outputclub.com',
        capacity: 1200
      },
      {
        id: 'v4',
        name: 'Echostage',
        location: 'Washington DC, USA',
        coordinates: { latitude: 38.9183, longitude: -76.9726 },
        genres: ['edm', 'trance', 'dubstep'],
        description: 'Massive venue hosting top EDM artists',
        image: 'https://example.com/echostage.jpg',
        website: 'https://echostage.com',
        capacity: 3000
      },
      {
        id: 'v5',
        name: 'Ministry of Sound',
        location: 'London, UK',
        coordinates: { latitude: 51.4963, longitude: -0.0994 },
        genres: ['house', 'trance', 'edm'],
        description: 'Legendary London club and record label',
        image: 'https://example.com/ministry.jpg',
        website: 'https://ministryofsound.com',
        capacity: 1500
      },
      {
        id: 'v6',
        name: 'Printworks',
        location: 'London, UK',
        coordinates: { latitude: 51.4983, longitude: -0.0514 },
        genres: ['techno', 'house', 'drum & bass'],
        description: 'Massive venue in former printing factory',
        image: 'https://example.com/printworks.jpg',
        website: 'https://printworkslondon.co.uk',
        capacity: 6000
      },
      {
        id: 'v7',
        name: 'Hï Ibiza',
        location: 'Ibiza, Spain',
        coordinates: { latitude: 38.9177, longitude: 1.4082 },
        genres: ['house', 'edm', 'techno'],
        description: 'Modern superclub in Ibiza',
        image: 'https://example.com/hi-ibiza.jpg',
        website: 'https://hiibiza.com',
        capacity: 4000
      },
      {
        id: 'v8',
        name: 'Exchange LA',
        location: 'Los Angeles, USA',
        coordinates: { latitude: 34.0454, longitude: -118.2491 },
        genres: ['house', 'trance', 'techno'],
        description: 'Multi-level club in historic bank building',
        image: 'https://example.com/exchange.jpg',
        website: 'https://exchangela.com',
        capacity: 1500
      },
      {
        id: 'v9',
        name: 'Stereo Montreal',
        location: 'Montreal, Canada',
        coordinates: { latitude: 45.5088, longitude: -73.5549 },
        genres: ['house', 'techno'],
        description: 'Afterhours club with legendary sound system',
        image: 'https://example.com/stereo.jpg',
        website: 'https://stereo-nightclub.com',
        capacity: 1000
      },
      {
        id: 'v10',
        name: 'Zouk Singapore',
        location: 'Singapore',
        coordinates: { latitude: 1.3104, longitude: 103.8405 },
        genres: ['edm', 'house', 'trance'],
        description: 'Award-winning club in Singapore',
        image: 'https://example.com/zouk.jpg',
        website: 'https://zoukclub.com',
        capacity: 2000
      },
      {
        id: 'v11',
        name: 'The Warehouse Project',
        location: 'Manchester, UK',
        coordinates: { latitude: 53.4754, longitude: -2.2385 },
        genres: ['house', 'techno', 'drum & bass'],
        description: 'Seasonal series of club nights',
        image: 'https://example.com/whp.jpg',
        website: 'https://thewarehouseproject.com',
        capacity: 10000
      },
      {
        id: 'v12',
        name: 'Tresor',
        location: 'Berlin, Germany',
        coordinates: { latitude: 52.5102, longitude: 13.4201 },
        genres: ['techno', 'house'],
        description: 'Historic techno club in former power plant',
        image: 'https://example.com/tresor.jpg',
        website: 'https://tresorberlin.com',
        capacity: 1000
      }
    ];
    
    // Calculate distance between user and venues
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
    
    // Calculate match percentage and add distance if location is available
    const venuesWithMatch = allVenues.map(venue => {
      // Calculate match percentage based on genre overlap
      let matchScore = 0;
      let matchCount = 0;
      
      venue.genres.forEach(venueGenre => {
        const normalizedVenueGenre = venueGenre.toLowerCase();
        
        userGenres.forEach((userGenre, index) => {
          // Check for partial matches in genre names
          if (normalizedVenueGenre.includes(userGenre) || userGenre.includes(normalizedVenueGenre)) {
            // Weight the match by the genre's importance to the user
            const genreWeight = userTaste.topGenres[index].value / 100;
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
        // Base match for all EDM venues
        match = 20;
      }
      
      // Ensure match is between 0-100
      match = Math.max(0, Math.min(100, match));
      
      // Calculate distance if user location is available
      let distance = null;
      if (userLocation && venue.coordinates) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          venue.coordinates.latitude,
          venue.coordinates.longitude
        );
      }
      
      return {
        ...venue,
        match,
        distance
      };
    });
    
    // Filter venues by distance if user location is available
    let filteredVenues = venuesWithMatch;
    if (userLocation) {
      // Add some nearby venues regardless of match percentage to ensure results
      const nearbyVenues = venuesWithMatch.filter(venue => venue.distance && venue.distance <= 500);
      const otherVenues = venuesWithMatch.filter(venue => !venue.distance || venue.distance > 500);
      
      // Ensure we have at least some venues by including both nearby and other venues
      filteredVenues = [...nearbyVenues, ...otherVenues];
    }
    
    // Sort by match percentage (highest first)
    const sortedVenues = filteredVenues.sort((a, b) => b.match - a.match);
    
    console.log(`Returning ${sortedVenues.length} venues`);
    
    // Return the venues with match percentages
    res.status(200).json({ 
      success: true, 
      venues: sortedVenues,
      userLocation: userLocation
    });
  } catch (error) {
    console.error('Error in venues API handler:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch venues',
      details: error.message
    });
  }
}
