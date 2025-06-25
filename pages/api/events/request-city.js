import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Import the city request queue utilities
const { addCityRequest, isCountrySupported, getQueueStats } = require('../../../lib/cityRequestQueue');

export default async function handler(req, res) {
  console.log('🔍 DEBUG: request-city API called');
  console.log('🔍 Method:', req.method);
  console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 Cookies:', req.headers.cookie);

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));

    // Verify user session with detailed logging
    console.log('🔍 Attempting to get session...');
    const session = await getServerSession(req, res, authOptions);
    
    console.log('🔍 Session result:', session ? 'Session found' : 'No session');
    if (session) {
      console.log('🔍 Session details:', {
        user: session.user ? {
          email: session.user.email,
          name: session.user.name,
          id: session.user.id
        } : 'No user in session',
        expires: session.expires,
        accessToken: session.accessToken ? 'Present' : 'Missing'
      });
    } else {
      console.log('❌ No session found - checking authOptions...');
      console.log('🔍 AuthOptions available:', typeof authOptions);
    }

    if (!session) {
      console.log('❌ Returning 401 - Unauthorized');
      return res.status(401).json({ 
        message: 'Unauthorized',
        debug: {
          sessionFound: false,
          cookiesPresent: !!req.headers.cookie,
          authOptionsAvailable: typeof authOptions !== 'undefined'
        }
      });
    }

    const { city, country, latitude, longitude } = req.body;

    console.log('🔍 Extracted parameters:', { city, country, latitude, longitude });

    // Validate required fields
    if (!city || !country || !latitude || !longitude) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields: city, country, latitude, longitude',
        received: { city, country, latitude, longitude }
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    console.log('🔍 Parsed coordinates:', { lat, lon });
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.log('❌ Invalid coordinates');
      return res.status(400).json({ 
        message: 'Invalid coordinates provided',
        received: { latitude, longitude, parsed: { lat, lon } }
      });
    }

    // Check if country is supported
    console.log('🔍 Checking country support for:', country);
    if (!isCountrySupported(country)) {
      console.log('❌ Country not supported:', country);
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
    console.log('🔍 User making request:', session.user?.email || 'Unknown');

    // Add city to request queue
    console.log('🔍 Adding city to request queue...');
    const result = addCityRequest(city, country, lat, lon);
    console.log('🔍 Queue result:', result);

    if (!result.success) {
      console.log('❌ Failed to queue city request:', result.error);
      return res.status(500).json({ 
        message: 'Failed to queue city request',
        error: result.error
      });
    }

    // Get queue statistics for response
    const queueStats = getQueueStats();
    console.log('🔍 Queue stats:', queueStats);

    console.log(`✅ City request queued: ${city}, ${country} (${result.countryCode})`);
    console.log(`📊 Queue stats: ${queueStats.pending} pending, ${queueStats.total} total`);

    const response = {
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
      ],
      debug: {
        sessionValid: true,
        userEmail: session.user?.email,
        requestProcessed: true
      }
    };

    console.log('✅ Returning success response');
    return res.status(201).json(response);

  } catch (error) {
    console.error('🚨 Error in request-city API:', error);
    console.error('🚨 Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      debug: {
        errorType: error.name,
        errorMessage: error.message
      }
    });
  }
}

