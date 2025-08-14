// pages/api/user/essentia-callback.js
// 🎵 ESSENTIA ANALYSIS CALLBACK ENDPOINT
// Receives results from Essentia service after user track analysis

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎵 Essentia callback received:', req.body);
    
    const { userEmail, trackMatrices, soundCharacteristics, success, error } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email required' });
    }

    const { db } = await connectToDatabase();
    
    if (success && trackMatrices && soundCharacteristics) {
      // Save Essentia results to user profile
      await db.collection('user_taste_profiles').updateOne(
        { userEmail },
        {
          $set: {
            essentiaProfile: {
              trackMatrices,
              soundCharacteristics,
              analyzedAt: new Date(),
              source: 'essentia_ml'
            },
            essentiaAnalyzed: true,
            lastEssentiaUpdate: new Date()
          }
        }
      );
      
      // Update user sound profile collection
      await db.collection('user_sound_profiles').updateOne(
        { userEmail },
        {
          $set: {
            trackMatrices,
            soundCharacteristics: {
              ...soundCharacteristics,
              analyzedAt: new Date(),
              source: 'essentia_ml'
            },
            lastEssentiaAnalysis: new Date()
          }
        },
        { upsert: true }
      );
      
      // Update collection status
      await db.collection('user_taste_collection_status').updateOne(
        { userEmail },
        {
          $set: {
            essentiaStatus: 'complete',
            essentiaCompletedAt: new Date(),
            tracksAnalyzed: trackMatrices?.length || 0
          }
        }
      );
      
      console.log(`✅ Essentia results saved for ${userEmail}: ${trackMatrices?.length || 0} tracks analyzed`);
      
    } else {
      // Handle Essentia analysis failure
      await db.collection('user_taste_collection_status').updateOne(
        { userEmail },
        {
          $set: {
            essentiaStatus: 'failed',
            essentiaError: error || 'Analysis failed',
            essentiaFailedAt: new Date()
          }
        }
      );
      
      console.log(`❌ Essentia analysis failed for ${userEmail}: ${error}`);
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Callback processed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error processing Essentia callback:', error);
    return res.status(500).json({ 
      error: 'Failed to process callback',
      message: error.message 
    });
  }
}
