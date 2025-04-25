import { parse } from 'cookie';
import { getUserLocation } from '@/lib/locationUtils';

export default async function handler(req, res) {
  try {
    // Check if location is in cookies
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const locationCookie = cookies.userLocation;
    
    if (locationCookie) {
      try {
        const locationData = JSON.parse(locationCookie);
        const now = Date.now();
        const locationAge = locationData?.timestamp ? now - locationData.timestamp : Infinity;
        
        // Use cookie location if not expired (24 hours)
        if (locationData && locationAge < 24 * 60 * 60 * 1000) {
          return res.status(200).json(locationData);
        }
      } catch (e) {
        console.error('Error parsing location cookie:', e);
      }
    }
    
    // If no valid cookie location, detect from request
    const detectedLocation = await getUserLocation(req);
    
    return res.status(200).json(detectedLocation);
  } catch (error) {
    console.error('Error getting location:', error);
    return res.status(500).json({ error: 'Failed to get location' });
  }
}
