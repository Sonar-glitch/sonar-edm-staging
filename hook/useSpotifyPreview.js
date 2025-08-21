import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for playing Spotify preview tracks
 * - Handles track playback with automatic cleanup
 * - Provides control functions and player state
 * - Supports playing multiple previews with automatic switching
 */
export function useSpotifyPreview() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef(null);
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  /**
   * Play a track preview
   * @param {string} previewUrl - The URL of the preview to play
   * @param {string} trackId - The ID of the track (for tracking state)
   */
  const playPreview = async (previewUrl, trackId) => {
    // Don't do anything if no preview URL
    if (!previewUrl) {
      setError('No preview available for this track');
      return;
    }
    
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // If we're toggling the same track, just stop it
        if (currentTrackId === trackId) {
          setIsPlaying(false);
          setCurrentTrackId(null);
          setCurrentPreviewUrl(null);
          audioRef.current = null;
          return;
        }
      }
      
      setIsLoading(true);
      
      // Create new audio element
      const audio = new Audio(previewUrl);
      
      // Set up event listeners
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('error', handleAudioError);
      
      // Play the audio
      await audio.play();
      
      // Update state
      audioRef.current = audio;
      setIsPlaying(true);
      setCurrentTrackId(trackId);
      setCurrentPreviewUrl(previewUrl);
      setError(null);
    } catch (err) {
      console.error('Failed to play track preview:', err);
      setError('Unable to play preview. Try again later.');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Pause the currently playing track
   */
  const pausePreview = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  /**
   * Resume the paused track
   */
  const resumePreview = async () => {
    if (audioRef.current && !isPlaying) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setError(null);
      } catch (err) {
        console.error('Failed to resume track preview:', err);
        setError('Unable to resume preview. Try again later.');
      }
    }
  };
  
  /**
   * Stop the current preview completely
   */
  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
      setCurrentTrackId(null);
      setCurrentPreviewUrl(null);
    }
  };
  
  /**
   * Toggle play/pause for a track
   * @param {string} previewUrl - The URL of the preview
   * @param {string} trackId - The ID of the track
   */
  const togglePlay = (previewUrl, trackId) => {
    if (isPlaying && currentTrackId === trackId) {
      pausePreview();
    } else if (!isPlaying && currentTrackId === trackId) {
      resumePreview();
    } else {
      playPreview(previewUrl, trackId);
    }
  };
  
  // Event handlers
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTrackId(null);
    setCurrentPreviewUrl(null);
    audioRef.current = null;
  };
  
  const handleAudioError = (e) => {
    console.error('Audio playback error:', e);
    setError('Error playing preview. Audio format might not be supported.');
    setIsPlaying(false);
    setCurrentTrackId(null);
    setCurrentPreviewUrl(null);
    audioRef.current = null;
  };
  
  return {
    isPlaying,
    currentTrackId,
    currentPreviewUrl,
    error,
    isLoading,
    playPreview,
    pausePreview,
    resumePreview,
    stopPreview,
    togglePlay,
  };
}

export default useSpotifyPreview;