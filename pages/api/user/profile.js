import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return basic user profile
    const userProfile = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      provider: session.user.provider || 'spotify'
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error in /api/user/profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
