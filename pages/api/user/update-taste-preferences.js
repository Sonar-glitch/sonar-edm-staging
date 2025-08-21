import { getSession } from 'next-auth/react';
import { saveUserPreferences, invalidateCache } from '../../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences data' });
    }
    
    // Get user ID
    const userId = session.user.id || session.user.email || 'anonymous';
    
    // Save preferences to MongoDB
    const success = await saveUserPreferences(userId, preferences);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to save preferences' });
    }
    
    // Invalidate user taste cache to force refresh
    await invalidateCache('spotify/user-taste', { userId });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
}
