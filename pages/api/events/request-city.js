import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Import the city request queue utilities
const { addCityRequest, isCountrySupported, getQueueStats } = require('../../../lib/cityRequestQueue');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify user session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { city, country, latitude, longitude } = req.body;

    // Validate required fields
    if (!city || !country || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Missing required fields: city, country, latitude, longitude' 
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ 
        message: 'Invalid coordinates provided' 
      });
    }

    // Check if country is supported
    if (!isCountrySupported(country)) {
      return res.status(400).json({ 
        message: `Country "${country}" is not supported by Ticketmaster`,
        supportedCountries: [
          'United States', 'Canada', 'United Kingdom', 'Germany', 
          'France', 'Netherlands', 'Spain', 'Italy', 'Australia', 
          'Brazil', 'Mexico', 'Japan', 'South Korea'
        ]
      });
    }

    console.log(`🌍 City request received: ${city}, ${country} (${lat}, ${lon})`);

    // Add city to request queue
    const result = addCityRequest(city, country, lat, lon);

    if (!result.success) {
      return res.status(500).json({ 
        message: 'Failed to queue city request',
        error: result.error
      });
    }

    // Get queue statistics for response
    const queueStats = getQueueStats();

    console.log(`✅ City request queued: ${city}, ${country} (${result.countryCode})`);
    console.log(`📊 Queue stats: ${queueStats.pending} pending, ${queueStats.total} total`);

    return res.status(201).json({
      message: result.isNew ? 
        `City request created for ${city}, ${country}! Events will be available in 2-5 minutes.` :
        `Updated existing request for ${city}, ${country}. Processing priority increased.`,
      cityRequest: {
        city: result.city,
        country: result.country,
        countryCode: result.countryCode,
        isNew: result.isNew,
        estimatedTime: '2-5 minutes'
      },
      queueStats: {
        position: queueStats.pending,
        totalPending: queueStats.pending,
        totalCities: queueStats.total
      },
      nextSteps: [
        'Your city has been queued for processing',
        'Worker will automatically process the request',
        'Events will appear in 2-5 minutes',
        'Future requests for this city will be instant'
      ]
    });

  } catch (error) {
    console.error('🚨 Error in request-city API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}

