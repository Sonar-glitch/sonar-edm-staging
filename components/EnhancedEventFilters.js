import React, { useState } from 'react';
import styles from '@/styles/EnhancedEventFilters.module.css';

const EnhancedEventFilters = ({ onFilterChange, initialFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    vibeMatch: initialFilters?.vibeMatch || 50,
    eventType: initialFilters?.eventType || 'all',
    distance: initialFilters?.distance || 'all',
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
      eventType: 'all',
      distance: 'all'
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
            {/* Event Type filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Event Type</label>
              <select 
                name="eventType" 
                value={filters.eventType} 
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">All Types</option>
                <option value="warehouse">Warehouse</option>
                <option value="festival">Festival</option>
                <option value="club">Club</option>
                <option value="terrace">Terrace</option>
                <option value="openair">Open Air</option>
              </select>
            </div>
            
            {/* Distance filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Distance</label>
              <select 
                name="distance" 
                value={filters.distance} 
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">Any Distance</option>
                <option value="local">Local</option>
                <option value="national">National</option>
                <option value="international">International</option>
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
};

export default EnhancedEventFilters;
