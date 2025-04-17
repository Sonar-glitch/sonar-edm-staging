import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if request method is POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get preferences from request body
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences data' });
    }
    
    // In a real implementation, we would save these preferences to a database
    // For now, we'll just log them and return success
    console.log('Updating taste preferences for user:', session.user.email);
    console.log('Preferences:', preferences);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return success
    return res.status(200).json({ 
      success: true,
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating taste preferences:', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
}
