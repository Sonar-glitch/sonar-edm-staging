// pages/api/user/reset-taste-progress.js
// Clears stale taste collection progress when user skips to basic profile

import { getSession } from 'next-auth/react';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { db } = await connectToDatabase();
    const userEmail = session.user.email;

    console.log('🎵 Resetting taste collection progress for:', userEmail);

    // Clear any stale progress in user profiles
    await Promise.allSettled([
      // Clear processing status in taste profiles
      db.collection('user_taste_profiles').updateMany(
        { userEmail },
        { 
          $unset: { 
            processingStatus: "",
            tasteCollectionInProgress: "",
            lastProgressUpdate: ""
          }
        }
      ),
      
      // Clear processing status in sound profiles  
      db.collection('user_sound_profiles').updateMany(
        { userEmail },
        { 
          $unset: { 
            processingStatus: "",
            essentiaAnalysisInProgress: "",
            lastProgressUpdate: ""
          }
        }
      ),

      // Remove any stuck analysis requests
      db.collection('user_taste_analysis_requests').deleteMany({
        userEmail,
        status: { $in: ['pending', 'in_progress'] }
      }),

      // Remove any stuck Essentia jobs
      db.collection('essentia_analysis_jobs').deleteMany({
        userEmail,
        status: { $in: ['pending', 'in_progress'] }
      })
    ]);

    console.log('✅ Taste collection progress reset completed');

    res.status(200).json({ 
      success: true, 
      message: 'Progress reset for future sessions',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Progress reset error:', error);
    res.status(500).json({ 
      error: 'Failed to reset progress',
      message: error.message
    });
  }
}
