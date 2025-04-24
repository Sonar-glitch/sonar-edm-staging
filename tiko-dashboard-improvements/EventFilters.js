import React, { useState } from 'react';
import styles from '@/styles/CompactEventFilters.module.css';

export default function CompactEventFilters({ onFilterChange, initialFilters }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    vibeMatch: initialFilters?.vibeMatch || 50,
    genre: initialFilters?.genre || 'all',
    venue: initialFilters?.venue || 'all',
    event: initialFilters?.event || 'all',
    price: initialFilters?.price || 'all',
  });

  // Handler for vibe match slider
  const handleVibeMatchChange = (e) => {
    const newValue = parseInt(e.target.value);
    updateFilter('vibeMatch', newValue);
  };
  
  // Handler for other filter changes
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
      genre: 'all',
      venue: 'all',
      event: 'all',
      price: 'all'
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
    <div className={styles.container}>
      {/* Vibe Match Slider - Always visible */}
      <div className={styles.vibeSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Vibe Match</span>
          <span className={styles.vibeValue}>{filters.vibeMatch}%+</span>
        </div>
        
        <div className={styles.sliderContainer}>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={filters.vibeMatch} 
            onChange={handleVibeMatchChange}
            className={styles.slider}
          />
          <div 
            className={styles.sliderFill} 
            style={{ width: `${filters.vibeMatch}%` }}
          ></div>
        </div>
      </div>
      
      {/* Toggle button for additional filters */}
      <button 
        className={styles.toggleButton} 
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Less Filters' : 'More Filters'}
        <span className={`${styles.toggleIcon} ${isExpanded ? styles.expanded : ''}`}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>
      
      {/* Expandable filters section */}
      {isExpanded && (
        <div className={styles.expandedFilters}>
          <div className={styles.filterGrid}>
            {/* Genre filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Music</label>
              <select 
                name="genre" 
                value={filters.genre} 
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">All Genres</option>
                <option value="house">House</option>
                <option value="techno">Techno</option>
                <option value="trance">Trance</option>
                <option value="dnb">Drum & Bass</option>
                <option value="melodic">Melodic</option>
              </select>
            </div>
            
            {/* Venue filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Venue</label>
              <select 
                name="venue" 
                value={filters.venue} 
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">All Venues</option>
                <option value="club">Clubs</option>
                <option value="warehouse">Warehouses</option>
                <option value="festival">Festivals</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>
            
            {/* Event type filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Event</label>
              <select 
                name="event" 
                value={filters.event} 
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="weekend">This Weekend</option>
                <option value="month">This Month</option>
                <option value="featured">Featured</option>
              </select>
            </div>
            
            {/* Price filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Price</label>
              <select 
                name="price" 
                value={filters.price} 
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">Any Price</option>
                <option value="free">Free</option>
                <option value="under50">Under $50</option>
                <option value="under100">Under $100</option>
                <option value="over100">$100+</option>
              </select>
            </div>
          </div>
          
          {/* Active filters and reset */}
          <div className={styles.activeFiltersSection}>
            <div className={styles.activeFilters}>
              {Object.entries(filters)
                .filter(([key, value]) => value !== 'all' && key !== 'vibeMatch')
                .map(([key, value]) => (
                  <div key={key} className={styles.activeFilter}>
                    <span className={styles.filterValue}>{value}</span>
                    <button 
                      className={styles.removeFilter}
                      onClick={() => updateFilter(key, 'all')}
                      aria-label={`Remove ${value} filter`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              
              {filters.vibeMatch > 0 && (
                <div className={styles.activeFilter}>
                  <span className={styles.filterValue}>{filters.vibeMatch}%+ Match</span>
                  <button 
                    className={styles.removeFilter}
                    onClick={() => updateFilter('vibeMatch', 0)}
                    aria-label="Reset vibe match"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            <button 
              className={styles.resetButton}
              onClick={resetFilters}
              aria-label="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}