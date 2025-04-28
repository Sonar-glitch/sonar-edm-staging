import React, { useState } from 'react';
import styles from '@/styles/EnhancedFilterPanel.module.css';
import { FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function EnhancedFilterPanel({ onFilterChange, initialFilters = {} }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    vibeMatch: initialFilters.vibeMatch || 50,
    price: initialFilters.price || 'all',
    genre: initialFilters.genre || 'all',
    distance: initialFilters.distance || 'local',
    ...initialFilters
  });

  // Available genres for electronic music
  const genres = [
    { value: 'all', label: 'All Genres' },
    { value: 'house', label: 'House' },
    { value: 'techno', label: 'Techno' },
    { value: 'trance', label: 'Trance' },
    { value: 'drum_and_bass', label: 'Drum & Bass' },
    { value: 'dubstep', label: 'Dubstep' },
    { value: 'ambient', label: 'Ambient' },
    { value: 'progressive', label: 'Progressive' },
    { value: 'deep_house', label: 'Deep House' },
    { value: 'tech_house', label: 'Tech House' },
    { value: 'melodic_techno', label: 'Melodic Techno' }
  ];

  // Price ranges
  const priceRanges = [
    { value: 'all', label: 'Any Price' },
    { value: 'free', label: 'Free' },
    { value: 'under_25', label: 'Under $25' },
    { value: '25_50', label: '$25-$50' },
    { value: '50_100', label: '$50-$100' },
    { value: 'over_100', label: 'Over $100' }
  ];

  // Distance options
  const distanceOptions = [
    { value: 'local', label: 'Local' },
    { value: 'national', label: 'National' },
    { value: 'international', label: 'International' }
  ];

  // Handle vibe match slider change
  const handleVibeMatchChange = (e) => {
    const newValue = parseInt(e.target.value);
    updateFilter('vibeMatch', newValue);
  };

  // Handle other filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    updateFilter(name, value);
  };

  // Update filter state and notify parent
  const updateFilter = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    const resetValues = {
      vibeMatch: 50,
      price: 'all',
      genre: 'all',
      distance: 'local'
    };
    
    setFilters(resetValues);
    if (onFilterChange) {
      onFilterChange(resetValues);
    }
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.filterPanel}>
      {/* Vibe Match Slider - Always visible */}
      <div className={styles.vibeMatchContainer}>
        <div className={styles.vibeMatchHeader}>
          <span className={styles.vibeMatchLabel}>Vibe Match</span>
          <span className={styles.vibeMatchValue}>{filters.vibeMatch}%+</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={filters.vibeMatch}
          onChange={handleVibeMatchChange}
          className={styles.slider}
        />
      </div>
      
      {/* More Filters Button */}
      <button 
        className={styles.moreFiltersButton}
        onClick={toggleExpanded}
      >
        <FaFilter className={styles.filterIcon} />
        <span>More Filters</span>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      
      {/* Expandable Filter Options */}
      {isExpanded && (
        <div className={styles.expandedFilters}>
          {/* Price Range Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Price Range</label>
            <select 
              name="price" 
              value={filters.price} 
              onChange={handleFilterChange}
              className={styles.filterSelect}
            >
              {priceRanges.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Genre Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Genre</label>
            <select 
              name="genre" 
              value={filters.genre} 
              onChange={handleFilterChange}
              className={styles.filterSelect}
            >
              {genres.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Distance Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Distance</label>
            <select 
              name="distance" 
              value={filters.distance} 
              onChange={handleFilterChange}
              className={styles.filterSelect}
            >
              {distanceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Reset Button */}
          <button 
            className={styles.resetButton}
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
