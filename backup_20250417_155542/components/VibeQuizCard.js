import React, { useState } from 'react';
import styles from '../styles/VibeQuizCard.module.css';

const VibeQuizCard = ({ onSubmit }) => {
  // Error handling: Check if onSubmit is a valid function
  const handleSubmit = typeof onSubmit === 'function' ? onSubmit : () => console.warn('No onSubmit handler provided');
  
  const [activeTab, setActiveTab] = useState(0);
  const [selections, setSelections] = useState({
    tempo: [],
    mood: [],
    elements: [],
    subgenres: [],
    venues: []
  });
  
  const tabs = [
    {
      id: 'tempo',
      label: 'Tempo',
      options: [
        { id: 'slow', label: 'Slow & Chill' },
        { id: 'medium', label: 'Medium Groove' },
        { id: 'fast', label: 'Fast & Energetic' },
        { id: 'varying', label: 'Varying Tempos' },
        { id: 'experimental', label: 'Experimental Rhythms' }
      ]
    },
    {
      id: 'mood',
      label: 'Mood',
      options: [
        { id: 'uplifting', label: 'Uplifting & Euphoric' },
        { id: 'dark', label: 'Dark & Intense' },
        { id: 'melodic', label: 'Melodic & Emotional' },
        { id: 'aggressive', label: 'Aggressive & Hard' },
        { id: 'ambient', label: 'Ambient & Atmospheric' }
      ]
    },
    {
      id: 'elements',
      label: 'Elements',
      options: [
        { id: 'vocals', label: 'Vocal Tracks' },
        { id: 'instrumental', label: 'Instrumental Only' },
        { id: 'bass', label: 'Heavy Bass' },
        { id: 'melody', label: 'Melodic Focus' },
        { id: 'drops', label: 'Epic Drops' }
      ]
    },
    {
      id: 'subgenres',
      label: 'Subgenres',
      options: [
        { id: 'house', label: 'House' },
        { id: 'techno', label: 'Techno' },
        { id: 'trance', label: 'Trance' },
        { id: 'dubstep', label: 'Dubstep' },
        { id: 'dnb', label: 'Drum & Bass' }
      ]
    },
    {
      id: 'venues',
      label: 'Venues',
      options: [
        { id: 'club', label: 'Club Nights' },
        { id: 'festival', label: 'Festivals' },
        { id: 'warehouse', label: 'Warehouse Parties' },
        { id: 'underground', label: 'Underground Scene' },
        { id: 'mainstream', label: 'Mainstream Events' }
      ]
    }
  ];
  
  const handleOptionToggle = (tabId, optionId) => {
    try {
      setSelections(prev => {
        // Ensure prev[tabId] exists and is an array
        const currentSelections = Array.isArray(prev[tabId]) ? [...prev[tabId]] : [];
        
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [tabId]: currentSelections.filter(id => id !== optionId)
          };
        } else {
          return {
            ...prev,
            [tabId]: [...currentSelections, optionId]
          };
        }
      });
    } catch (error) {
      console.error('Error toggling option:', error);
    }
  };
  
  const submitSelections = () => {
    try {
      handleSubmit(selections);
    } catch (error) {
      console.error('Error submitting selections:', error);
    }
  };
  
  const isOptionSelected = (tabId, optionId) => {
    try {
      return Array.isArray(selections[tabId]) && selections[tabId].includes(optionId);
    } catch (error) {
      console.error('Error checking if option is selected:', error);
      return false;
    }
  };
  
  // Improved completion percentage calculation
  // Now calculates based on having at least one selection per category
  // rather than assuming all options need to be selected
  const getCompletionPercentage = () => {
    try {
      let completedCategories = 0;
      const totalCategories = Object.keys(selections).length;
      
      Object.keys(selections).forEach(key => {
        const selectionArray = Array.isArray(selections[key]) ? selections[key] : [];
        if (selectionArray.length > 0) {
          completedCategories++;
        }
      });
      
      return totalCategories > 0 ? Math.round((completedCategories / totalCategories) * 100) : 0;
    } catch (error) {
      console.error('Error calculating completion percentage:', error);
      return 0;
    }
  };
  
  // Navigation functions
  const goToNextTab = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };
  
  const goToPrevTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };
  
  return (
    <div className={styles.vibeQuizCard}>
      <h3 className={styles.quizTitle}>Customize Your Vibe</h3>
      <p className={styles.quizDescription}>
        Select what you're into to fine-tune your music profile. 
        Choose at least one option in each category.
      </p>
      
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === index ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {tab.label}
              {Array.isArray(selections[tab.id]) && selections[tab.id].length > 0 && (
                <span className={styles.selectionCount}>
                  {selections[tab.id].length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className={styles.tabContent}>
          {tabs.map((tab, index) => (
            <div 
              key={tab.id}
              className={`${styles.tabPanel} ${activeTab === index ? styles.activePanel : ''}`}
            >
              <div className={styles.optionsGrid}>
                {Array.isArray(tab.options) && tab.options.map(option => (
                  <div 
                    key={option.id}
                    className={`${styles.optionItem} ${isOptionSelected(tab.id, option.id) ? styles.selectedOption : ''}`}
                    onClick={() => handleOptionToggle(tab.id, option.id)}
                  >
                    <div className={styles.optionCheckmark}>
                      {isOptionSelected(tab.id, option.id) && '✓'}
                    </div>
                    <span className={styles.optionLabel}>{option.label}</span>
                  </div>
                ))}
              </div>
              
              <div className={styles.tabNavigation}>
                {activeTab > 0 && (
                  <button 
                    className={styles.navButton}
                    onClick={goToPrevTab}
                  >
                    ← Previous
                  </button>
                )}
                
                {activeTab < tabs.length - 1 && (
                  <button 
                    className={styles.navButton}
                    onClick={goToNextTab}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.quizFooter}>
        <div className={styles.completionBar}>
          <div 
            className={styles.completionFill}
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
        <span className={styles.completionText}>
          {getCompletionPercentage()}% Complete
        </span>
        
        <button 
          className={styles.submitButton}
          onClick={submitSelections}
          disabled={getCompletionPercentage() === 0}
        >
          Update My Taste Profile
        </button>
      </div>
    </div>
  );
};

export default VibeQuizCard;
