// Debug endpoint: returns presence of user profile & sound profile docs (non-sensitive)
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
const { connectToDatabase } = require('../../../lib/mongodb');

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    const { db } = await connectToDatabase();
    const userId = session.user.id || session.user.email;
    const profile = await db.collection('userProfiles').findOne({ $or: [ { userId }, { email: session.user.email } ] }, { projection: { topGenres: 1, genres: 1, audioFeatures: 1 } });
    const sound = await db.collection('user_sound_profiles').findOne({ userId }, { projection: { topGenres: 1, soundCharacteristics: 1, expiresAt: 1, createdAt: 1 } });
    return res.status(200).json({
      hasUserProfile: !!profile,
      hasSoundProfile: !!sound,
      profileTopGenres: profile?.topGenres?.slice(0,5) || profile?.genres?.slice(0,5) || [],
      soundTopGenres: sound?.topGenres?.slice(0,5) || [],
      soundCharacteristics: sound?.soundCharacteristics || {},
      cacheAgeMinutes: sound?.createdAt ? Math.floor((Date.now() - new Date(sound.createdAt)) / 60000) : null,
      expiresInMinutes: sound?.expiresAt ? Math.floor((new Date(sound.expiresAt) - Date.now()) / 60000) : null
    });
  } catch (e) {
    return res.status(500).json({ error: 'debug-failed', message: e.message });
  }
}
