import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";

// Fallback taste profile for new users or when data is unavailable
const getFallbackTasteProfile = (userId) => ({
  userId,
  genrePreferences: [
    { name: 'melodic techno', weight: 0.8, confidence: 0.9, source: 'spotify' },
    { name: 'progressive house', weight: 0.7, confidence: 0.8, source: 'spotify' },
    { name: 'deep house', weight: 0.6, confidence: 0.75, source: 'spotify' },
  ],
  soundCharacteristics: {
    danceability: { value: 0.75, source: 'spotify' },
    energy: { value: 0.65, source: 'spotify' },
    valence: { value: 0.4, source: 'spotify' },
    instrumentalness: { value: 0.85, source: 'spotify' },
  },
  tasteEvolution: [
    { date: '2025-04-01', genres: { 'melodic techno': 0.7, 'tech house': 0.6 } },
    { date: '2025-05-01', genres: { 'melodic techno': 0.75, 'progressive house': 0.65 } },
    { date: '2025-06-01', genres: { 'melodic techno': 0.8, 'progressive house': 0.7 } },
  ],
  recentActivity: {
    added: [
      { trackId: 'sample1', name: 'Gravity', artists: ['Boris Brejcha'], date: new Date('2025-07-10T10:00:00Z') },
    ],
    removed: [],
    liked: [
      { trackId: 'sample2', name: 'The Future', artists: ['CamelPhat'], date: new Date('2025-07-09T15:30:00Z') },
    ],
  },
  playlists: [
    { id: 'pl1', name: 'Late Night Drives', characteristics: 'Deep, melodic, instrumental', trackCount: 50, lastUpdated: new Date('2025-07-08T20:00:00Z') },
    { id: 'pl2', name: 'Workout Energy', characteristics: 'High-energy, fast-paced, electronic', trackCount: 120, lastUpdated: new Date('2025-07-05T11:00:00Z') },
  ],
  lastUpdated: new Date(),
});

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id; // Assuming user ID is in session

    console.log(`Fetching taste profile for user: ${userId}`);

    const tasteProfile = await db.collection('user_taste_profiles').findOne({ userId });

    if (tasteProfile) {
      console.log(`Found taste profile for user: ${userId}`);
      // Ensure lastUpdated is a valid Date object
      tasteProfile.lastUpdated = new Date(tasteProfile.lastUpdated);
      res.status(200).json(tasteProfile);
    } else {
      console.log(`No taste profile found for user: ${userId}. Returning fallback data.`);
      const fallbackProfile = getFallbackTasteProfile(userId);
      // Optionally, you could save the fallback profile to the DB for new users
      // await db.collection('user_taste_profiles').insertOne(fallbackProfile);
      res.status(200).json(fallbackProfile);
    }
  } catch (error) {
    console.error('Error in /api/user/taste-profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
