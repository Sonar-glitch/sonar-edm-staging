import React, { useState, useEffect } from 'react';
import styles from '@/styles/MobileOptimizedVibeQuiz.module.css';

const MobileOptimizedVibeQuiz = ({ onSave, onClose, initialSelections }) => {
  // State for tracking selected options in each category
  const [selectedOptions, setSelectedOptions] = useState({
    genres: [],
    mood: [],
    tempo: [],
    discovery: [],
    venues: []
  });
  
  // State for tracking which card is currently active
  const [activeCard, setActiveCard] = useState(0);
  
  // Load initial selections if provided
  useEffect(() => {
    if (initialSelections) {
      setSelectedOptions(prev => ({
        ...prev,
        ...initialSelections
      }));
    }
  }, [initialSelections]);
  
  // Categories and their options
  const categories = [
    {
      id: 'genres',
      name: 'Genres',
      options: ['House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 'Ambient', 'Hardstyle', 'Garage', 'Electro', 'Progressive', 'Melodic Techno', 'Deep House', 'Tech House', 'Minimal', 'Downtempo']
    },
    {
      id: 'mood',
      name: 'Mood',
      options: ['Energetic', 'Chill', 'Dark', 'Euphoric', 'Experimental', 'Melodic', 'Aggressive', 'Uplifting', 'Hypnotic', 'Atmospheric']
    },
    {
      id: 'tempo',
      name: 'Tempo',
      options: ['Slow', 'Medium', 'Fast', 'Varied', 'Progressive', 'Building', 'Steady', 'Driving', 'Pulsing', 'Rhythmic']
    },
    {
      id: 'discovery',
      name: 'Discovery',
      options: ['Mainstream', 'Underground', 'Emerging', 'Classic', 'Fusion', 'Experimental', 'Regional', 'Global', 'Trending', 'Timeless']
    },
    {
      id: 'venues',
      name: 'Venues',
      options: ['Clubs', 'Festivals', 'Warehouses', 'Outdoor', 'Intimate Venues', 'Beach Parties', 'Boat Parties', 'Rooftops', 'Basements', 'Art Spaces']
    }
  ];
  
  // Calculate completion percentage
  const calculateCompletion = () => {
    const totalCategories = categories.length;
    const completedCategories = Object.values(selectedOptions).filter(options => options.length > 0).length;
    return (completedCategories / totalCategories) * 100;
  };
  
  // Handle option selection
  const toggleOption = (categoryId, option) => {
    setSelectedOptions(prev => {
      const updatedCategory = [...prev[categoryId]];
      
      if (updatedCategory.includes(option)) {
        // Remove option if already selected
        const index = updatedCategory.indexOf(option);
        updatedCategory.splice(index, 1);
      } else {
        // Add option if not already selected (limit to 5 per category)
        if (updatedCategory.length < 5) {
          updatedCategory.push(option);
        }
      }
      
      return {
        ...prev,
        [categoryId]: updatedCategory
      };
    });
  };
  
  // Handle navigation between cards
  const goToNextCard = () => {
    if (activeCard < categories.length - 1) {
      setActiveCard(activeCard + 1);
    }
  };
  
  const goToPrevCard = () => {
    if (activeCard > 0) {
      setActiveCard(activeCard - 1);
    }
  };
  
  // Handle save
  const handleSave = () => {
    if (onSave) {
      // Apply higher weightage to user selections when updating profile
      const weightedSelections = {
        ...selectedOptions,
        weightage: 2.0 // Higher weightage for explicit user feedback
      };
      onSave(weightedSelections);
    }
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Help Us Understand Your Taste</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.instructions}>
        Select at least 1 option in each category that matches your preferences
      </div>
      
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${calculateCompletion()}%` }}
        ></div>
        <div className={styles.progressText}>
          {calculateCompletion() === 100 ? 'Complete!' : `${Math.round(calculateCompletion())}% complete`}
        </div>
      </div>
      
      <div className={styles.cardContainer}>
        {categories.map((category, index) => (
          <div 
            key={category.id}
            className={`${styles.card} ${activeCard === index ? styles.activeCard : styles.inactiveCard}`}
          >
            <h3 className={styles.categoryTitle}>{category.name}</h3>
            <div className={styles.optionsGrid}>
              {category.options.map(option => (
                <button
                  key={option}
                  className={`${styles.optionButton} ${selectedOptions[category.id].includes(option) ? styles.selectedOption : ''}`}
                  onClick={() => toggleOption(category.id, option)}
                >
                  {option}
                </button>
              ))}
            </div>
            
            <div className={styles.cardNavigation}>
              {index > 0 && (
                <button className={styles.navButton} onClick={goToPrevCard}>
                  Previous
                </button>
              )}
              {index < categories.length - 1 ? (
                <button className={styles.navButton} onClick={goToNextCard}>
                  Next
                </button>
              ) : (
                <button 
                  className={`${styles.saveButton} ${calculateCompletion() === 100 ? styles.saveButtonActive : ''}`}
                  onClick={handleSave}
                  disabled={calculateCompletion() < 100}
                >
                  Save Preferences
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.cardIndicators}>
        {categories.map((category, index) => (
          <div 
            key={index}
            className={`${styles.indicator} ${activeCard === index ? styles.activeIndicator : ''} ${selectedOptions[category.id].length > 0 ? styles.completedIndicator : ''}`}
            onClick={() => setActiveCard(index)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default MobileOptimizedVibeQuiz;
