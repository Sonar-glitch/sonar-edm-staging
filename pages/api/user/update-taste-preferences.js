import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ success: false, message: 'Preferences data is required' });
    }
    
    // In a production environment, you would store these preferences in a database
    // and use them to adjust the user's taste profile
    
    console.log('Updating user taste preferences:', preferences);
    
    // For now, we'll just return success
    return res.status(200).json({ 
      success: true, 
      message: 'Taste preferences updated successfully',
      preferences
    });
    
  } catch (error) {
    console.error('Error updating taste preferences:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
