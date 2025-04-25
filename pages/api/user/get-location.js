import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '@/lib/session';
import { getUserLocation } from '@/lib/locationUtils';

export default withIronSessionApiRoute(async function handler(req, res) {
  try {
    // Check if location is in session and not expired (24 hours)
    const sessionLocation = req.session.userLocation;
    const now = Date.now();
    const locationAge = sessionLocation?.timestamp ? now - sessionLocation.timestamp : Infinity;
    
    if (sessionLocation && locationAge < 24 * 60 * 60 * 1000) {
      return res.status(200).json(sessionLocation);
    }
    
    // If no valid session location, detect from request
    const detectedLocation = await getUserLocation(req);
    
    // Store in session
    req.session.userLocation = {
      ...detectedLocation,
      timestamp: now
    };
    
    await req.session.save();
    
    return res.status(200).json(detectedLocation);
  } catch (error) {
    console.error('Error getting location:', error);
    return res.status(500).json({ error: 'Failed to get location' });
  }
}, sessionOptions);
