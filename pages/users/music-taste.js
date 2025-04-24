// /c/sonar/users/sonar-edm-user/pages/users/music-taste.js
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import OverviewTab from '@/components/music-taste/OverviewTab';
import ArtistsTab from '@/components/music-taste/ArtistsTab';
import TracksTab from '@/components/music-taste/TracksTab';
import TrendsTab from '@/components/music-taste/TrendsTab';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getFallbackDetailedTasteData } from '@/lib/fallbackData';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [eventCount, setEventCount] = useState(0);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Fetch user data on initial load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDetailedMusicTaste();
    }
  }, [status]);
  
  // Fetch detailed music taste data
  const fetchDetailedMusicTaste = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from API with robust error handling
      const response = await fetch('/api/spotify/detailed-taste')
        .catch(err => {
          console.error('Network error:', err);
          return { ok: false };
        });
      
      // Process data with validation
      let tasteData = getFallbackDetailedTasteData();
      
      if (response.ok) {
        try {
          const data = await response.json();
          if (data && (data.genreProfile || data.artistProfile)) {
            tasteData = {
              ...tasteData,
              ...data
            };
          }
        } catch (jsonError) {
          console.error('Error parsing taste data:', jsonError);
        }
      }
      
      // Fetch event count
      const eventsResponse = await fetch('/api/events/count')
        .catch(err => {
          console.error('Network error fetching event count:', err);
          return { ok: false };
        });
      
      if (eventsResponse.ok) {
        try {
          const data = await eventsResponse.json();
          if (data && data.count) {
            setEventCount(data.count);
          } else {
            setEventCount(42); // Fallback count
          }
        } catch (jsonError) {
          console.error('Error parsing event count:', jsonError);
          setEventCount(42); // Fallback count
        }
      } else {
        setEventCount(42); // Fallback count
      }
      
      // Set user profile
      setUserProfile(tasteData);
      
    } catch (error) {
      console.error('Error fetching detailed music taste:', error);
      setError('Failed to load your music taste profile.');
      setUserProfile(getFallbackDetailedTasteData());
    } finally {
      setLoading(false);
    }
  };
  
  // Get primary genres for summary display
  const getPrimaryGenres = () => {
    const genreProfile = userProfile?.genreProfile;
    if (!genreProfile || Object.keys(genreProfile).length === 0) return '';
    
    // Sort genres by value and take top 2
    const sortedGenres = Object.entries(genreProfile)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre.toLowerCase())
      .slice(0, 2);
      
    return sortedGenres.join(' + ');
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <LoadingSpinner size="large" text="Analyzing your music taste..." />
      </div>
    );
  }
  
  if (error && !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <h2 className="text-2xl text-fuchsia-500 mb-4">Oops!</h2>
        <p className="mb-6">{error}</p>
        <button 
          className="px-4 py-2 bg-black/30 border border-cyan-500 rounded-full text-cyan-400 hover:bg-cyan-500/20 transition"
          onClick={fetchDetailedMusicTaste}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>TIKO | Your Music Taste</title>
        <meta name="description" content="Your personalized music taste analysis" />
      </Head>
      
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <main className="max-w-5xl mx-auto px-4 pb-12">
          {/* User Summary Banner */}
          <div className="mb-8 mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-900/50 to-teal-900/50">
            <p className="text-center text-lg">
              Your music taste evolves around <span className="text-cyan-400 font-medium">{getPrimaryGenres()}</span> with 
              <span className="text-teal-400 font-medium"> {userProfile?.mood?.melodic || 85}% melodic</span> and
              <span className="text-teal-400 font-medium"> {userProfile?.mood?.energetic || 72}% energetic</span> tendencies.
              Found <span className="text-cyan-400 font-medium">{eventCount}</span> events that match your taste.
            </p>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-800 mb-6 overflow-x-auto">
            <button 
              className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'overview' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'artists' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('artists')}
            >
              Top Artists
            </button>
            <button 
              className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'tracks' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('tracks')}
            >
              Top Tracks
            </button>
            <button 
              className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'trends' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('trends')}
            >
              Listening Trends
            </button>
          </div>
          
          {/* Content based on active tab */}
          {activeTab === 'overview' && <OverviewTab userProfile={userProfile} />}
          {activeTab === 'artists' && <ArtistsTab userProfile={userProfile} />}
          {activeTab === 'tracks' && <TracksTab userProfile={userProfile} />}
          {activeTab === 'trends' && <TrendsTab userProfile={userProfile} />}
        </main>
        
        <footer className="p-4 text-center text-gray-500 border-t border-gray-800">
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}
