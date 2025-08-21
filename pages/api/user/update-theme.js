import { getSession } from 'next-auth/react';
import { saveUserPreferences } from '../../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { theme } = req.body;
    
    if (!theme || typeof theme !== 'string') {
      return res.status(400).json({ error: 'Invalid theme data' });
    }
    
    // Get user ID
    const userId = session.user.id || session.user.email || 'anonymous';
    
    // Save theme preference to MongoDB if available
    try {
      await saveUserPreferences(userId, { theme });
    } catch (error) {
      console.warn('Could not save theme to MongoDB:', error);
      // Continue anyway since we also save to localStorage
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Theme updated successfully'
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({ error: 'Failed to update theme' });
  }
}
