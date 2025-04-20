import React, { useState, useEffect } from 'react';
import styles from '@/styles/EventFilters.module.css';

export default function EventFilters({ onFilterChange, initialFilters }) {
  const [filters, setFilters] = useState({
    genre: initialFilters?.genre || 'all',
    venue: initialFilters?.venue || 'all',
    event: initialFilters?.event || 'all',
    price: initialFilters?.price || 'all',
    vibeMatch: initialFilters?.vibeMatch || 50,
  });

  // Available filter options - these could come from your API
  const genreOptions = [
    { value: 'all', label: 'All Genres' },
    { value: 'techno', label: 'Techno' },
    { value: 'house', label: 'House' },
    { value: 'trance', label: 'Trance' },
    { value: 'bass', label: 'Bass' },
    { value: 'drum-and-bass', label: 'Drum & Bass' },
    { value: 'melodic-techno', label: 'Melodic Techno' },
    { value: 'progressive-house', label: 'Progressive House' },
  ];

  const venueOptions = [
    { value: 'all', label: 'All Venues' },
    { value: 'club', label: 'Clubs' },
    { value: 'warehouse', label: 'Warehouses' },
    { value: 'festival', label: 'Festivals' },
    { value: 'outdoor', label: 'Outdoor' },
  ];

  const eventOptions = [
    { value: 'all', label: 'All Events' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'weekend', label: 'This Weekend' },
    { value: 'month', label: 'This Month' },
  ];

  const priceOptions = [
    { value: 'all', label: 'Any Price' },
    { value: 'free', label: 'Free' },
    { value: 'under50', label: 'Under $50' },
    { value: 'under100', label: 'Under $100' },
    { value: 'over100', label: 'Over $100' },
  ];

  // Send filter changes up to parent component
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVibeMatchChange = (e) => {
    const value = parseInt(e.target.value);
    setFilters(prev => ({
      ...prev,
      vibeMatch: value
    }));
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterLabels}>
        <span>Music</span>
        <span>Venue</span>
        <span>Event</span>
        <span>Price</span>
        <span>Vibe</span>
      </div>
      
      <div className={styles.filterControls}>
        <select 
          name="genre" 
          value={filters.genre}
          onChange={handleChange}
          className={styles.filterSelect}
        >
          {genreOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <select 
          name="venue" 
          value={filters.venue}
          onChange={handleChange}
          className={styles.filterSelect}
        >
          {venueOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <select 
          name="event" 
          value={filters.event}
          onChange={handleChange}
          className={styles.filterSelect}
        >
          {eventOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <select 
          name="price" 
          value={filters.price}
          onChange={handleChange}
          className={styles.filterSelect}
        >
          {priceOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className={styles.vibeSliderContainer}>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.vibeMatch}
            onChange={handleVibeMatchChange}
            className={styles.vibeSlider}
          />
          <div 
            className={styles.vibeSliderFill} 
            style={{ width: `${filters.vibeMatch}%` }}
          ></div>
        </div>
      </div>

      <div className={styles.activeFilters}>
        {Object.entries(filters)
          .filter(([key, value]) => value !== 'all' && key !== 'vibeMatch')
          .map(([key, value]) => (
            <span key={key} className={styles.activeFilterTag}>
              {value}
              <button 
                className={styles.removeFilter} 
                onClick={() => setFilters(prev => ({ ...prev, [key]: 'all' }))}
              >
                ×
              </button>
            </span>
          ))}
          
        {filters.vibeMatch > 0 && (
          <span className={styles.activeFilterTag}>
            {filters.vibeMatch}%+ Vibe Match
            <button 
              className={styles.removeFilter} 
              onClick={() => setFilters(prev => ({ ...prev, vibeMatch: 0 }))}
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
}