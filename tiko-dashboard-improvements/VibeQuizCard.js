import React, { useState } from 'react';
import styles from '../styles/VibeQuizCard.module.css';

const VibeQuizCard = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    genres: [],
    mood: 'energetic',
    tempo: 'medium',
    discovery: 'balanced',
    venues: []
  });
  
  const genreOptions = [
    'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 
    'Ambient', 'Hardstyle', 'Garage', 'Electro', 'Progressive'
  ];
  
  const moodOptions = ['energetic', 'chill', 'dark', 'euphoric', 'experimental'];
  const tempoOptions = ['slow', 'medium', 'fast', 'varied'];
  const discoveryOptions = ['mainstream', 'balanced', 'underground'];
  const venueOptions = ['clubs', 'festivals', 'warehouses', 'outdoor', 'intimate venues'];
  
  const handleGenreToggle = (genre) => {
    if (preferences.genres.includes(genre)) {
      setPreferences({
        ...preferences,
        genres: preferences.genres.filter(g => g !== genre)
      });
    } else {
      if (preferences.genres.length < 5) {
        setPreferences({
          ...preferences,
          genres: [...preferences.genres, genre]
        });
      }
    }
  };
  
  const handleVenueToggle = (venue) => {
    if (preferences.venues.includes(venue)) {
      setPreferences({
        ...preferences,
        venues: preferences.venues.filter(v => v !== venue)
      });
    } else {
      setPreferences({
        ...preferences,
        venues: [...preferences.venues, venue]
      });
    }
  };
  
  const handleSubmit = () => {
    onSubmit(preferences);
  };
  
  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className={styles.quizStep}>
            <h3>Select your favorite genres (max 5)</h3>
            <div className={styles.optionsGrid}>
              {genreOptions.map(genre => (
                <button
                  key={genre}
                  className={`${styles.optionButton} ${preferences.genres.includes(genre) ? styles.selected : ''}`}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.quizStep}>
            <h3>What's your preferred mood?</h3>
            <div className={styles.optionsGrid}>
              {moodOptions.map(mood => (
                <button
                  key={mood}
                  className={`${styles.optionButton} ${preferences.mood === mood ? styles.selected : ''}`}
                  onClick={() => setPreferences({...preferences, mood})}
                >
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.quizStep}>
            <h3>What tempo do you prefer?</h3>
            <div className={styles.optionsGrid}>
              {tempoOptions.map(tempo => (
                <button
                  key={tempo}
                  className={`${styles.optionButton} ${preferences.tempo === tempo ? styles.selected : ''}`}
                  onClick={() => setPreferences({...preferences, tempo})}
                >
                  {tempo.charAt(0).toUpperCase() + tempo.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
(Content truncated due to size limit. Use line ranges to read in chunks)
