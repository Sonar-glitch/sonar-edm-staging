import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";
import { getTopGenres } from "@/lib/moodUtils"; // Assuming this can be reused

// Helper function to compare track lists and identify changes
const diffTracks = (oldTracks, newTracks) => {
  const oldTrackIds = new Set(oldTracks.map(t => t.trackId));
  const newTrackIds = new Set(newTracks.map(t => t.id));

  const added = newTracks.filter(t => !oldTrackIds.has(t.id)).map(t => ({
    trackId: t.id,
    name: t.name,
    artists: t.artists.map(a => a.name),
    date: new Date(),
  }));

  // "Liked" can be inferred if a track's position in the top list improves,
  // but for simplicity, we'll consider any currently-in-top-list as liked.
  const liked = newTracks.map(t => ({
    trackId: t.id,
    name: t.name,
    artists: t.artists.map(a => a.name),
    date: new Date(),
  }));

  // "Removed" logic would require comparing the previous "top" list with the new one.
  // This is complex and can be added later. For now, we focus on additions.
  const removed = [];

  return { added, liked, removed };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tracks: newTracks, artists: newArtists } = req.body;
    if (!newTracks || !newArtists) {
      return res.status(400).json({ error: 'Missing tracks or artists data' });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id;
    const profilesCollection = db.collection('user_taste_profiles');

    let userProfile = await profilesCollection.findOne({ userId });

    // If no profile, create a basic one
    if (!userProfile) {
      userProfile = {
        userId,
        recentActivity: { added: [], removed: [], liked: [] },
        tasteEvolution: [],
        lastUpdated: new Date(0), // Set to epoch to ensure first run updates
      };
    }

    // --- Activity Tracking ---
    const changes = diffTracks(userProfile.recentActivity.liked, newTracks.items);
    const updatedActivity = {
      added: [...changes.added, ...userProfile.recentActivity.added].slice(0, 20), // Keep last 20
      liked: changes.liked.slice(0, 50), // Overwrite with the latest top 50
      removed: userProfile.recentActivity.removed, // Placeholder for now
    };

    // --- Taste Evolution Tracking ---
    const currentGenreProfile = getTopGenres(newArtists.items);
    const lastEvolutionEntry = userProfile.tasteEvolution[userProfile.tasteEvolution.length - 1];

    // Add a new evolution entry if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (!lastEvolutionEntry || lastEvolutionEntry.date !== today) {
      userProfile.tasteEvolution.push({
        date: today,
        genres: currentGenreProfile,
      });
    } else {
      // Otherwise, update today's entry
      lastEvolutionEntry.genres = currentGenreProfile;
    }
    
    // Keep evolution history for the last 90 days
    if (userProfile.tasteEvolution.length > 90) {
        userProfile.tasteEvolution.shift();
    }

    // --- Update Database ---
    await profilesCollection.updateOne(
      { userId },
      {
        $set: {
          recentActivity: updatedActivity,
          tasteEvolution: userProfile.tasteEvolution,
          genrePreferences: Object.entries(currentGenreProfile).map(([name, weight]) => ({ name, weight: weight / 100, source: 'spotify_snapshot' })),
          lastUpdated: new Date(),
        },
      },
      { upsert: true } // Creates the document if it doesn't exist
    );

    res.status(200).json({ success: true, message: 'Taste profile updated.' });

  } catch (error) {
    console.error('Error in /api/user/update-taste-activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
