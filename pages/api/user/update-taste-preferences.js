import { getSession } from 'next-auth/react';

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
    
    if (!preferences) {
      return res.status(400).json({ error: 'Missing preferences data' });
    }
    
    // In a real app, you would store these preferences in a database
    // For demo purposes, we'll just return success
    console.log('Received taste preferences:', preferences);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Taste preferences updated successfully' 
    });
  } catch (error) {
    console.error('Error updating taste preferences:', error);
    return res.status(500).json({ error: 'Failed to update taste preferences' });
  }
}
