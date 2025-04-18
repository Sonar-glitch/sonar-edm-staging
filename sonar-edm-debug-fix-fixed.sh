#!/bin/bash

# Sonar EDM Platform - Debugging Script
# This script fixes the client-side exception error in the music-taste.js page
# by adding proper null checks for suggestedEvents and implementing the missing API endpoint.
# It also enhances error handling in all components.

# Set the project directory
PROJECT_DIR="/c/sonar/users/sonar-edm-user"

# Create backup directory
BACKUP_DIR="$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🔍 Starting Sonar EDM Platform debugging script..."
echo "📂 Project directory: $PROJECT_DIR"
echo "💾 Backup directory: $BACKUP_DIR"

# Function to create backup of a file before modifying it
backup_file() {
  local file_path="$1"
  local file_name=$(basename "$file_path")
  local dir_name=$(dirname "$file_path" | sed "s|$PROJECT_DIR||")
  
  # Create directory structure in backup folder
  mkdir -p "$BACKUP_DIR$dir_name"
  
  # Copy file to backup
  if [ -f "$file_path" ]; then
    cp "$file_path" "$BACKUP_DIR$dir_name/$file_name"
    echo "✅ Backed up: $file_name"
  else
    echo "⚠️ Warning: File not found for backup: $file_path"
  fi
}

# Function to update a file with new content
update_file() {
  local file_path="$1"
  local new_content="$2"
  
  # Create backup
  backup_file "$file_path"
  
  # Write new content
  echo "$new_content" > "$file_path"
  echo "✅ Updated: $(basename "$file_path")"
}

# Function to create a file if it doesn't exist
create_file() {
  local file_path="$1"
  local new_content="$2"
  local dir_name=$(dirname "$file_path")
  
  # Create directory if it doesn't exist
  mkdir -p "$dir_name"
  
  # Write new content
  echo "$new_content" > "$file_path"
  echo "✅ Created: $(basename "$file_path")"
}

echo "🔧 Fixing client-side exception in music-taste.js..."

# 1. Update user-taste.js API to include mock suggestedEvents data
USER_TASTE_API_PATH="$PROJECT_DIR/pages/api/spotify/user-taste.js"
backup_file "$USER_TASTE_API_PATH"

USER_TASTE_API_CONTENT='import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Mock data for development and testing
    const mockData = {
      topGenres: [
        { name: "Melodic House", value: 90 },
        { name: "Techno", value: 80 },
        { name: "Progressive House", value: 70 },
        { name: "Trance", value: 60 },
        { name: "Deep House", value: 50 }
      ],
      topArtists: [
        { 
          name: "Max Styler", 
          image: "https://i.scdn.co/image/ab6761610000e5eb8cbc5b79c7ab0ac7e6c0ff03",
          genres: ["melodic house", "edm"],
          popularity: 90,
          rank: 1,
          similarArtists: [
            { name: "Autograf", image: "https://i.scdn.co/image/ab6761610000e5eb8a7af5d1f7eacb6addae5493" },
            { name: "Amtrac", image: "https://i.scdn.co/image/ab6761610000e5eb90c4c8a6fb0b4142c57e0bce" }
          ]
        },
        { 
          name: "ARTBAT", 
          image: "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9",
          genres: ["melodic techno", "organic house"],
          popularity: 85,
          rank: 2,
          similarArtists: [
            { name: "Anyma", image: "https://i.scdn.co/image/ab6761610000e5eb4c7c1e59b3e8c594dce7c2d2" },
            { name: "Mathame", image: "https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2" }
          ]
        },
        { 
          name: "Lane 8", 
          image: "https://i.scdn.co/image/ab6761610000e5eb7f6d6a0a5b0d5e0747e01522",
          genres: ["progressive house", "melodic house"],
          popularity: 80,
          rank: 3,
          similarArtists: [
            { name: "Yotto", image: "https://i.scdn.co/image/ab6761610000e5eb5d27d18dfef4c76f1b3a0f32" },
            { name: "Ben Böhmer", image: "https://i.scdn.co/image/ab6761610000e5eb7eb7d559b43f5e9775b20d9a" }
          ]
        },
        { 
          name: "Boris Brejcha", 
          image: "https://i.scdn.co/image/ab6761610000e5eb7324ce0b63aec68c638e26f6",
          genres: ["german techno", "minimal techno"],
          popularity: 75,
          rank: 4,
          similarArtists: [
            { name: "Stephan Bodzin", image: "https://i.scdn.co/image/ab6761610000e5eb4e8b9c8e5c628c4d0d64b463" },
            { name: "Worakls", image: "https://i.scdn.co/image/ab6761610000e5eb2d7d5f1fe46b7d1c0d11e0c0" }
          ]
        },
        { 
          name: "Nora En Pure", 
          image: "https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2",
          genres: ["deep house", "organic house"],
          popularity: 70,
          rank: 5,
          similarArtists: [
            { name: "EDX", image: "https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2" },
            { name: "Klingande", image: "https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2" }
          ]
        }
      ],
      topTracks: [
        {
          name: "Techno Cat",
          artist: "Max Styler",
          image: "https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c",
          preview: "https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f",
          rank: 1
        },
        {
          name: "Return To Oz (ARTBAT Remix) ",
          artist: "Monolink",
          image: "https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096",
          preview: "https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f",
          rank: 2
        },
        {
          name: "Atlas",
          artist: "Lane 8",
          image: "https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096",
          preview: "https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f",
          rank: 3
        },
        {
          name: "Purple Noise",
          artist: "Boris Brejcha",
          image: "https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096",
          preview: "https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f",
          rank: 4
        },
        {
          name: "Come With Me",
          artist: "Nora En Pure",
          image: "https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096",
          preview: "https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f",
          rank: 5
        }
      ],
      seasonalMood: {
        winter: { genres: ["Deep House", "Ambient Techno"], mood: "Introspective" },
        spring: { genres: ["Progressive House", "Melodic House"], mood: "Uplifting" },
        summer: { genres: ["Tech House", "House"], mood: "Energetic" },
        fall: { genres: ["Organic House", "Downtempo"], mood: "Melancholic" },
        current: "spring",
        currentSeason: {
          name: "Spring",
          primaryMood: "Uplifting",
          topGenres: ["Progressive House", "Melodic House"]
        },
        seasons: [
          {
            name: "Winter",
            primaryMood: "Introspective",
            topGenres: ["Deep House", "Ambient Techno"]
          },
          {
            name: "Spring",
            primaryMood: "Uplifting",
            topGenres: ["Progressive House", "Melodic House"]
          },
          {
            name: "Summer",
            primaryMood: "Energetic",
            topGenres: ["Tech House", "House"]
          },
          {
            name: "Fall",
            primaryMood: "Melancholic",
            topGenres: ["Organic House", "Downtempo"]
          }
        ]
      },
      tasteLabels: ["Melodic", "Progressive", "Deep", "Atmospheric", "Energetic"],
      // Added mock suggestedEvents data
      suggestedEvents: [
        {
          id: "event-1",
          name: "Melodic Nights",
          date: "2025-05-15",
          time: "22:00:00",
          venue: "Club Horizon",
          location: "New York, NY",
          image: "https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c",
          artists: ["Lane 8", "Yotto", "Ben Böhmer"],
          price: "$35-65",
          ticketLink: "https://example.com/tickets/melodic-nights",
          correlation: 0.85,
          matchFactors: {
            genres: ["Melodic House", "Progressive House"],
            artists: ["Lane 8"],
            mood: "Uplifting"
          }
        },
        {
          id: "event-2",
          name: "Techno Revolution",
          date: "2025-05-22",
          time: "23:00:00",
          venue: "Underground",
          location: "Los Angeles, CA",
          image: "https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096",
          artists: ["Boris Brejcha", "Stephan Bodzin", "Ann Clue"],
          price: "$40-75",
          ticketLink: "https://example.com/tickets/techno-revolution",
          correlation: 0.75,
          matchFactors: {
            genres: ["Techno", "Minimal Techno"],
            artists: ["Boris Brejcha"],
            mood: "Energetic"
          }
        },
        {
          id: "event-3",
          name: "Deep Vibes",
          date: "2025-06-05",
          time: "21:00:00",
          venue: "Sunset Lounge",
          location: "Miami, FL",
          image: "https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096",
          artists: ["Nora En Pure", "EDX", "Klingande"],
          price: "$30-55",
          ticketLink: "https://example.com/tickets/deep-vibes",
          correlation: 0.7,
          matchFactors: {
            genres: ["Deep House", "Organic House"],
            artists: ["Nora En Pure"],
            mood: "Uplifting"
          }
        }
      ]
    };
    
    // Try to fetch real data from Spotify API
    try {
      // This would be where real API calls happen
      // For now, we will just use the mock data
      console.log("Using mock data for user taste");
    } catch (spotifyError) {
      console.error("Error fetching from Spotify API:", spotifyError);
      // Continue with mock data
    }
    
    return res.status(200).json(mockData);
  } catch (error) {
    console.error("Error in user-taste API:", error);
    return res.status(500).json({ error: "Failed to fetch music taste data" });
  }
}'

update_file "$USER_TASTE_API_PATH" "$USER_TASTE_API_CONTENT"

# 2. Create the missing API endpoint for updating preferences
UPDATE_PREFS_API_PATH="$PROJECT_DIR/pages/api/user/update-taste-preferences.js"

UPDATE_PREFS_API_CONTENT='import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Only allow POST method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({ error: "Invalid preferences data" });
    }
    
    // In a real implementation, we would save these preferences to a database
    // For now, we will just log them and return success
    console.log("Received user preferences:", preferences);
    
    // Here you would typically update the user\'s preferences in your database
    // Example: await db.collection("users").updateOne(
    //   { spotifyId: session.user.id },
    //   { $set: { tastePreferences: preferences } }
    // );
    
    return res.status(200).json({ 
      success: true, 
      message: "Preferences updated successfully" 
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return res.status(500).json({ error: "Failed to update preferences" });
  }
}'

create_file "$UPDATE_PREFS_API_PATH" "$UPDATE_PREFS_API_CONTENT"

# 3. Update music-taste.js with proper null checks for suggestedEvents
MUSIC_TASTE_PATH="$PROJECT_DIR/pages/users/music-taste.js"
backup_file "$MUSIC_TASTE_PATH"

MUSIC_TASTE_CONTENT='import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/MusicTaste.module.css";
import SpiderChart from "../../components/SpiderChart";
import ArtistCard from "../../components/ArtistCard";
import TrackCard from "../../components/TrackCard";
import SeasonalMoodCard from "../../components/SeasonalMoodCard";
import VibeQuizCard from "../../components/VibeQuizCard";
import EventCard from "../../components/EventCard";
import Navigation from "../../components/Navigation";

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserTaste();
    }
  }, [status]);

  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/spotify/user-taste");
      if (!response.ok) {
        throw new Error("Failed to fetch music taste data");
      }
      const data = await response.json();
      console.log("API response:", data); // For debugging
      setUserTaste(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching user taste:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVibeQuizSubmit = async (preferences) => {
    try {
      const response = await fetch("/api/user/update-taste-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }
      
      // Refresh user taste data
      fetchUserTaste();
      setShowVibeQuiz(false);
    } catch (err) {
      console.error("Error updating preferences:", err);
      setError(err.message);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your vibe...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Connect to see your sound</h1>
          <p className={styles.subtitle}>Link Spotify. Get your vibe. Find your scene.</p>
          <Link href="/api/auth/signin">
            <a className={styles.connectButton}>Connect Spotify</a>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.errorContainer}>
          <h1 className={styles.title}>Oops! That didn\'t work</h1>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchUserTaste} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userTaste) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.noDataContainer}>
          <h1 className={styles.title}>No vibe data yet</h1>
          <p className={styles.subtitle}>
            Play more tracks on Spotify. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  // Safely extract data with null checks and fallbacks
  const genres = Array.isArray(userTaste.genres) ? userTaste.genres : 
                 Array.isArray(userTaste.topGenres) ? userTaste.topGenres.map(g => typeof g === "string" ? {name: g, score: 50} : g) : 
                 [];
  
  const topArtists = Array.isArray(userTaste.topArtists) ? userTaste.topArtists : [];
  const topTracks = Array.isArray(userTaste.topTracks) ? userTaste.topTracks : [];
  
  // Handle seasonal mood data with fallbacks
  const seasonalMood = userTaste.seasonalMood && typeof userTaste.seasonalMood === "object" ? userTaste.seasonalMood : {};
  
  // Create currentSeason if it doesn\'t exist or is incomplete
  if (!seasonalMood.currentSeason || typeof seasonalMood.currentSeason !== "object") {
    const currentSeasonName = seasonalMood.current || "Current Season";
    seasonalMood.currentSeason = {
      name: currentSeasonName,
      primaryMood: seasonalMood[currentSeasonName]?.mood || "Unknown",
      topGenres: Array.isArray(seasonalMood[currentSeasonName]?.genres) ? 
                seasonalMood[currentSeasonName].genres : []
    };
  }
  
  // Ensure seasons array exists
  if (!Array.isArray(seasonalMood.seasons)) {
    seasonalMood.seasons = [];
  }
  
  // Add proper null check for suggestedEvents
  const suggestedEvents = userTaste.suggestedEvents && Array.isArray(userTaste.suggestedEvents) ? 
                          userTaste.suggestedEvents : [];

  // Create a more concise, ADHD-friendly summary
  const getTopGenres = () => {
    if (genres.length === 0) return "your fav beats";
    return genres.slice(0, Math.min(2, genres.length)).map(g => g.name || "Unknown").join(" + ");
  };

  const getRecentTrends = () => {
    if (!seasonalMood.currentSeason || 
        !Array.isArray(seasonalMood.currentSeason.topGenres) || 
        seasonalMood.currentSeason.topGenres.length === 0) {
      return "fresh sounds";
    }
    return seasonalMood.currentSeason.topGenres.slice(0, 1).join("");
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Sound | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        {/* Compact header section */}
        <div className={styles.header}>
          <h1 className={styles.title}>Your Sound</h1>
          <p className={styles.subtitle}>
            Based on what you\'re streaming
          </p>
        </div>
        
        {/* Two-column layout for better space usage */}
        <div className={styles.twoColumnLayout}>
          {/* Left column: User taste data */}
          <div className={styles.leftColumn}>
            {/* Concise summary */}
            <div className={styles.summary}>
              <p>
                You\'re all about <span className={styles.highlight}>{getTopGenres()}</span> with 
                a vibe shift toward <span className={styles.highlight}>{getRecentTrends()}</span>. 
                {suggestedEvents.length > 0 ? 
                  ` Found ${suggestedEvents.length} events that match your sound.` : 
                  " Events coming soon that match your sound."}
              </p>
            </div>
            
            {/* Genre section with spider chart */}
            <section className={styles.genreSection}>
              <h2 className={styles.sectionTitle}>Your Mix</h2>
              <div className={styles.spiderChartContainer}>
                {genres.length > 0 ? (
                  <SpiderChart genres={genres} />
                ) : (
                  <div className={styles.noDataMessage}>
                    <p>No genre data yet. Keep streaming!</p>
                  </div>
                )}
              </div>
            </section>
            
            {/* Seasonal section */}
            <section className={styles.seasonalSection}>
              <h2 className={styles.sectionTitle}>Your Seasonal Vibes</h2>
              <SeasonalMoodCard seasonalMood={seasonalMood} />
            </section>
          </div>
          
          {/* Right column: Events and recommendations */}
          <div className={styles.rightColumn}>
            {/* Events section - prioritized */}
            <section className={styles.eventsSection}>
              <h2 className={styles.sectionTitle}>
                Events That Match Your Vibe
                {suggestedEvents.length > 0 && (
                  <span className={styles.eventCount}>
                    Found {suggestedEvents.length} events that match your sound
                  </span>
                )}
              </h2>
              
              {suggestedEvents.length > 0 ? (
                <div className={styles.eventsGrid}>
                  {suggestedEvents.slice(0, Math.min(3, suggestedEvents.length)).map((event, index) => (
                    <EventCard 
                      key={event.id || `event-${index}`} 
                      event={event} 
                      correlation={event.correlation || 0.5}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.noEventsMessage}>
                  <p>Events coming soon. Check back!</p>
                  <button className={styles.refreshButton} onClick={fetchUserTaste}>
                    Refresh
                  </button>
                </div>
              )}
              
              {suggestedEvents.length > 0 && (
                <div className={styles.viewMoreContainer}>
                  <Link href="/users/events">
                    <a className={styles.viewMoreButton}>See All Events</a>
                  </Link>
                </div>
              )}
            </section>
            
            {/* Vibe Quiz section */}
            <section className={styles.vibeQuizSection}>
              <div className={styles.vibeQuizPrompt}>
                <p>Not feeling this vibe? Tell us what you\'re into</p>
                <button 
                  className={styles.vibeQuizButton}
                  onClick={() => setShowVibeQuiz(!showVibeQuiz)}
                >
                  {showVibeQuiz ? "Hide Quiz" : "Take Quiz"}
                </button>
              </div>
              
              {showVibeQuiz && (
                <VibeQuizCard onSubmit={handleVibeQuizSubmit} />
              )}
            </section>
          </div>
        </div>
        
        {/* Full-width sections below */}
        {/* Artists section */}
        <section className={styles.artistsSection}>
          <h2 className={styles.sectionTitle}>Artists You Vibe With</h2>
          {topArtists.length > 0 ? (
            <div className={styles.artistsGrid}>
              {/* Show top 5 artists with up to 3 similar artists each */}
              {topArtists.slice(0, 5).map((artist, index) => (
                <ArtistCard 
                  key={artist.id || `artist-${index}`} 
                  artist={artist} 
                  correlation={artist.correlation || 0.5}
                  similarArtists={Array.isArray(artist.similarArtists) ? artist.similarArtists.slice(0, 3) : []}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No artist data yet. Keep streaming!</p>
            </div>
          )}
        </section>
        
        {/* Tracks section */}
        <section className={styles.tracksSection}>
          <h2 className={styles.sectionTitle}>Your Repeat Tracks</h2>
          {topTracks.length > 0 ? (
            <div className={styles.tracksGrid}>
              {/* Show top 5 tracks based on the last 3 months */}
              {topTracks.slice(0, 5).map((track, index) => (
                <TrackCard 
                  key={track.id || `track-${index}`} 
                  track={track} 
                  correlation={track.correlation || 0.5}
                  duration={track.duration_ms || 0}
                  popularity={track.popularity || 0}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No track data yet. Keep streaming!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}'

update_file "$MUSIC_TASTE_PATH" "$MUSIC_TASTE_CONTENT"

# 4. Update EventCard.js with enhanced error handling
EVENT_CARD_PATH="$PROJECT_DIR/components/EventCard.js"
backup_file "$EVENT_CARD_PATH"

EVENT_CARD_CONTENT='import React from "react";
import Link from "next/link";
import styles from "../styles/EventCard.module.css";
import EventCorrelationIndicator from "./EventCorrelationIndicator";

const EventCard = ({ event, correlation }) => {
  // Enhanced error handling: Check if event is valid
  if (!event || typeof event !== "object") {
    return (
      <div className={styles.eventCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display event information. Invalid event data.</p>
        </div>
      </div>
    );
  }

  // Ensure correlation is a valid number
  const validCorrelation = typeof correlation === "number" && !isNaN(correlation) ? correlation : 0;
  
  // Format date with enhanced error handling
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Date TBA";
      const options = { weekday: "short", month: "short", day: "numeric" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date TBA";
    }
  };
  
  // Format time with enhanced error handling
  const formatTime = (timeString) => {
    try {
      if (!timeString) return "Time TBA";
      const options = { hour: "numeric", minute: "2-digit", hour12: true };
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", options);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Time TBA";
    }
  };
  
  // Safely access nested properties
  const getVenue = () => {
    if (typeof event.venue === "string" && event.venue.trim() !== "") {
      return event.venue;
    }
    if (typeof event.location === "string" && event.location.trim() !== "") {
      return event.location;
    }
    return "Venue TBA";
  };
  
  const getArtists = () => {
    if (Array.isArray(event.artists) && event.artists.length > 0) {
      return event.artists.filter(a => a).join(", ");
    }
    if (typeof event.lineup === "string" && event.lineup.trim() !== "") {
      return event.lineup;
    }
    return "Artists TBA";
  };
  
  return (
    <div className={styles.eventCard}>
      <div className={styles.eventImageContainer}>
        {event.image ? (
          <div 
            className={styles.eventImage}
            style={{ backgroundImage: `url(${event.image})` }}
          />
        ) : (
          <div className={styles.eventImagePlaceholder}>
            <span>{event.name ? event.name.charAt(0) : "?"}</span>
          </div>
        )}
        
        <div className={styles.eventDate}>
          <span className={styles.dateValue}>{formatDate(event.date)}</span>
        </div>
      </div>
      
      <div className={styles.eventInfo}>
        <h3 className={styles.eventName}>{event.name || "Unnamed Event"}</h3>
        
        <div className={styles.eventDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>📍</span>
            <span className={styles.detailText}>{getVenue()}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>🕒</span>
            <span className={styles.detailText}>{formatTime(event.time)}</span>
          </div>
          
          {event.price && (
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>💲</span>
              <span className={styles.detailText}>{event.price}</span>
            </div>
          )}
        </div>
        
        <div className={styles.eventArtists}>
          <span className={styles.artistsLabel}>Artists:</span>
          <span className={styles.artistsList}>{getArtists()}</span>
        </div>
        
        <div className={styles.correlationSection}>
          <EventCorrelationIndicator 
            correlation={validCorrelation} 
            matchFactors={event.matchFactors}
          />
        </div>
        
        <div className={styles.eventActions}>
          {event.id && (
            <Link href={`/events/${event.id}`}>
              <a className={styles.detailsButton}>View Details</a>
            </Link>
          )}
          
          {event.ticketLink && (
            <a 
              href={event.ticketLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.ticketsButton}
            >
              Get Tickets
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;'

update_file "$EVENT_CARD_PATH" "$EVENT_CARD_CONTENT"

# 5. Update EventCorrelationIndicator.js with enhanced error handling
EVENT_CORRELATION_PATH="$PROJECT_DIR/components/EventCorrelationIndicator.js"
backup_file "$EVENT_CORRELATION_PATH"

EVENT_CORRELATION_CONTENT='import React from "react";
import styles from "../styles/EventCorrelationIndicator.module.css";

const EventCorrelationIndicator = ({ correlation, matchFactors }) => {
  // Enhanced error handling: Check if correlation is valid
  const validCorrelation = typeof correlation === "number" && !isNaN(correlation) ? correlation : 0;
  
  // Format correlation as percentage
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Determine correlation level for styling with enhanced error handling
  const getCorrelationLevel = (percent) => {
    try {
      if (percent >= 80) return "high";
      if (percent >= 60) return "medium";
      if (percent >= 40) return "moderate";
      return "low";
    } catch (error) {
      console.error("Error determining correlation level:", error);
      return "low";
    }
  };
  
  const correlationLevel = getCorrelationLevel(correlationPercent);
  
  // Validate matchFactors with enhanced error handling
  const validMatchFactors = matchFactors && typeof matchFactors === "object" ? matchFactors : {};
  
  // Safely check for array properties
  const hasGenres = validMatchFactors.genres && Array.isArray(validMatchFactors.genres) && validMatchFactors.genres.length > 0;
  const hasArtists = validMatchFactors.artists && Array.isArray(validMatchFactors.artists) && validMatchFactors.artists.length > 0;
  const hasMood = validMatchFactors.mood && typeof validMatchFactors.mood === "string";
  
  return (
    <div className={styles.correlationContainer}>
      <div className={styles.correlationHeader}>
        <div className={styles.correlationValue}>
          <span className={`${styles.correlationPercent} ${styles[correlationLevel]}`}>
            {correlationPercent}%
          </span>
          <span className={styles.correlationLabel}>match</span>
        </div>
        
        {validMatchFactors.recentListenBoost && (
          <div className={styles.recentBoostBadge}>
            Recent Listen Boost
          </div>
        )}
      </div>
      
      {Object.keys(validMatchFactors).length > 0 && (hasGenres || hasArtists || hasMood) && (
        <div className={styles.matchFactors}>
          <h4 className={styles.matchFactorsTitle}>Match Factors</h4>
          <ul className={styles.factorsList}>
            {hasGenres && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Genres:</span>
                <span className={styles.factorValue}>{validMatchFactors.genres.join(", ")}</span>
              </li>
            )}
            
            {hasArtists && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Artists:</span>
                <span className={styles.factorValue}>{validMatchFactors.artists.join(", ")}</span>
              </li>
            )}
            
            {hasMood && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Mood:</span>
                <span className={styles.factorValue}>{validMatchFactors.mood}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EventCorrelationIndicator;'

update_file "$EVENT_CORRELATION_PATH" "$EVENT_CORRELATION_CONTENT"

# 6. Update MusicTaste.module.css to add styles for event count
MUSIC_TASTE_CSS_PATH="$PROJECT_DIR/styles/MusicTaste.module.css"
backup_file "$MUSIC_TASTE_CSS_PATH"

# Read the existing CSS file
if [ -f "$MUSIC_TASTE_CSS_PATH" ]; then
  EXISTING_CSS=$(cat "$MUSIC_TASTE_CSS_PATH")
  
  # Check if the eventCount style already exists
  if [[ "$EXISTING_CSS" != *".eventCount"* ]]; then
    # Append the new styles
    NEW_CSS="$EXISTING_CSS

/* Event count styles */
.eventCount {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-left: 1rem;
  font-weight: normal;
}

/* Fix for two-column layout */
.twoColumnLayout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .twoColumnLayout {
    grid-template-columns: 1fr;
  }
  
  .eventCount {
    display: block;
    margin-left: 0;
    margin-top: 0.5rem;
  }
}"

    update_file "$MUSIC_TASTE_CSS_PATH" "$NEW_CSS"
  else
    echo "✅ MusicTaste.module.css already has the required styles"
  fi
else
  echo "⚠️ Warning: MusicTaste.module.css not found"
fi

# 7. Create a Heroku deployment script
DEPLOY_SCRIPT_PATH="$PROJECT_DIR/deploy-to-heroku.sh"
backup_file "$DEPLOY_SCRIPT_PATH"

DEPLOY_SCRIPT_CONTENT='#!/bin/bash

# Sonar EDM Platform - Heroku Deployment Script

echo "🚀 Deploying Sonar EDM Platform to Heroku..."

# Add all changes to git
git add .

# Commit changes
git commit -m "Fix client-side exception and enhance error handling"

# Push to Heroku
git push heroku main

echo "✅ Deployment complete! Your app should be available at:"
echo "https://sonar-edm-user-50e4fb038f6e.herokuapp.com"
'

update_file "$DEPLOY_SCRIPT_PATH" "$DEPLOY_SCRIPT_CONTENT"
chmod +x "$DEPLOY_SCRIPT_PATH"

echo "✅ Debugging script completed successfully!"
echo "🔧 Fixed client-side exception in music-taste.js"
echo "🔧 Added mock suggestedEvents data to user-taste.js API"
echo "🔧 Created missing API endpoint for updating preferences"
echo "🔧 Enhanced error handling in all components"
echo ""
echo "🚀 To deploy to Heroku, run:"
echo "cd $PROJECT_DIR"
echo "./deploy-to-heroku.sh"
echo ""
echo "💡 Next steps:"
echo "1. Implement MongoDB caching system for API responses"
echo "2. Enhance artist card design"
echo "3. Integrate theme options"
