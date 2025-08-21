import React, { useState } from 'react';
import styles from '@/styles/UserFeedbackGrid.module.css';

const UserFeedbackGrid = ({ onSubmit, onClose }) => {
  const [preferences, setPreferences] = useState({
    genres: [],
    mood: [],
    tempo: [],
    discovery: [],
    venues: []
  });
  
  // Define options for each category
  const genreOptions = [
    'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 
    'Ambient', 'Hardstyle', 'Garage', 'Electro', 'Progressive',
    'Melodic Techno', 'Deep House', 'Tech House', 'Minimal', 'Downtempo'
  ];
  
  const moodOptions = [
    'Energetic', 'Chill', 'Dark', 'Euphoric', 'Experimental',
    'Melodic', 'Aggressive', 'Uplifting', 'Hypnotic', 'Atmospheric'
  ];
  
  const tempoOptions = [
    'Slow', 'Medium', 'Fast', 'Varied', 'Progressive',
    'Building', 'Steady', 'Driving', 'Pulsing', 'Rhythmic'
  ];
  
  const discoveryOptions = [
    'Mainstream', 'Underground', 'Emerging', 'Classic', 'Fusion',
    'Experimental', 'Regional', 'Global', 'Trending', 'Timeless'
  ];
  
  const venueOptions = [
    'Clubs', 'Festivals', 'Warehouses', 'Outdoor', 'Intimate Venues',
    'Beach Parties', 'Boat Parties', 'Rooftops', 'Underground', 'Arenas'
  ];
  
  // Toggle selection for any category
  const handleToggle = (category, item) => {
    if (preferences[category].includes(item)) {
      setPreferences({
        ...preferences,
        [category]: preferences[category].filter(i => i !== item)
      });
    } else {
      // Limit to 5 selections per category
      if (preferences[category].length < 5) {
        setPreferences({
          ...preferences,
          [category]: [...preferences[category], item]
        });
      }
    }
  };
  
  // Handle submission of preferences
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(preferences);
    }
    if (onClose) {
      onClose();
    }
  };
  
  // Render a grid of options for a category
  const renderOptionGrid = (category, options) => (
    <div className={styles.optionCategory}>
      <h3 className={styles.categoryTitle}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </h3>
      <div className={styles.optionsGrid}>
        {options.map(option => (
          <button
            key={option}
            className={`${styles.optionButton} ${preferences[category].includes(option) ? styles.selected : ''}`}
            onClick={() => handleToggle(category, option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Help Us Understand Your Taste</h2>
        <p className={styles.subtitle}>Select up to 5 options in each category that match your preferences</p>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.gridContainer}>
        {renderOptionGrid('genres', genreOptions)}
        {renderOptionGrid('mood', moodOptions)}
        {renderOptionGrid('tempo', tempoOptions)}
        {renderOptionGrid('discovery', discoveryOptions)}
        {renderOptionGrid('venues', venueOptions)}
      </div>
      
      <div className={styles.actions}>
        <button 
          className={styles.submitButton}
          onClick={handleSubmit}
        >
          Update My Profile
        </button>
      </div>
    </div>
  );
};

export default UserFeedbackGrid;
