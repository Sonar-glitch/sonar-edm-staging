import { getCachedData, setCachedData, clearAllCache } from '../../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { city, lat, lon, radius = '50' } = req.body;
    
    if (!city || !lat || !lon) {
      return res.status(400).json({ message: 'Missing required parameters: city, lat, lon' });
    }

    // Clear cache for this city
    const cacheKey = `events_${city}_${lat}_${lon}_${radius}`;
    await clearAllCache();
    
    console.log(`🗑️ Cache cleared for ${city} (${lat}, ${lon})`);
    
    res.status(200).json({ 
      success: true, 
      message: `Cache cleared for ${city}`,
      cacheKey 
    });
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error?.message || error?.toString() || 'Unknown error');
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear cache',
      error: error.message 
    });
  }
}
