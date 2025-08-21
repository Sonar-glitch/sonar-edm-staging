import React, { useState } from 'react';
import styles from '../styles/EnhancedFilterPanel.module.css';

export default function EnhancedFilterPanel({ initialMatchScore = 70, onFilterChange }) {
  const [matchScore, setMatchScore] = useState(initialMatchScore);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleMatchScoreChange = (e) => {
    const newScore = e.target.value;
    setMatchScore(newScore);
    // Call the callback function passed from the parent (EventsSection)
    if (onFilterChange) {
      onFilterChange({ matchScore: newScore });
    }
  };

  const toggleMoreFilters = () => {
    setShowMoreFilters(!showMoreFilters);
  };

  return (
    <div className={styles.filterPanel}>
      {/* Vibe Match Slider - Always Visible */}
      <div className={styles.filterGroup}>
        <label htmlFor="matchScoreSlider" className={styles.label}>
          Vibe Match: {matchScore}%+
        </label>
        <input
          id="matchScoreSlider"
          type="range"
          min="0"
          max="100"
          value={matchScore}
          onChange={handleMatchScoreChange}
          className={styles.slider}
        />
      </div>

      {/* More Filters Toggle */}
      <button onClick={toggleMoreFilters} className={styles.toggleButton}>
        {showMoreFilters ? 'Less Filters' : 'More Filters'} {showMoreFilters ? '▲' : '▼'}
      </button>

      {/* Collapsible More Filters Section */}
      {showMoreFilters && (
        <div className={styles.moreFilters}>
          <p className={styles.placeholderText}>
            Additional filters (e.g., date range, genre) will be added here.
          </p>
          {/* Example placeholder for future filters */}
          {/* 
          <div className={styles.filterGroup}>
            <label htmlFor="dateRange" className={styles.label}>Date Range:</label>
            <select id="dateRange" className={styles.selectInput}>
              <option>Any</option>
              <option>Next 7 days</option>
              <option>Next 30 days</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="genre" className={styles.label}>Genre:</label>
            <input type="text" id="genre" placeholder="e.g., House, Techno" className={styles.textInput} />
          </div>
          */}
        </div>
      )}
    </div>
  );
}

