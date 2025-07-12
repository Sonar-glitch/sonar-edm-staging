// pages/api/user/update-taste-activity.js - FINAL
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";
import { getTopGenres } from "@/lib/moodUtils";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

    const { artists: newArtists } = req.body;
    if (!newArtists) return res.status(400).json({ error: 'Missing artists data' });

    const { db } = await connectToDatabase();
    const userId = session.user.id;
    const profiles = db.collection('user_taste_profiles');

    const userProfile = await profiles.findOne({ userId });
    const tasteEvolution = userProfile?.tasteEvolution || []; // FIX: Initialize as empty array if it doesn't exist

    const currentGenreProfile = getTopGenres(newArtists.items);
    const today = new Date().toISOString().split('T')[0];
    const lastEntry = tasteEvolution[tasteEvolution.length - 1];

    if (lastEntry?.date === today) {
      lastEntry.genres = currentGenreProfile;
    } else {
      tasteEvolution.push({ date: today, genres: currentGenreProfile });
    }

    await profiles.updateOne(
      { userId },
      { $set: { tasteEvolution: tasteEvolution.slice(-90), lastUpdated: new Date() } },
      { upsert: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
