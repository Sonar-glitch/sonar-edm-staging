import React from 'react';
import styles from '../styles/EventFilters.module.css';

const EventFilters = ({ onFilterChange, currentFilters }) => {
  const handleFilterChange = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Genre</label>
        <select 
          className={styles.filterSelect}
          value={currentFilters.genre}
          onChange={(e) => handleFilterChange('genre', e.target.value)}
        >
          <option value="all">All Genres</option>
          <option value="house">House</option>
          <option value="techno">Techno</option>
          <option value="trance">Trance</option>
          <option value="dubstep">Dubstep</option>
          <option value="drum">Drum & Bass</option>
          <option value="melodic">Melodic</option>
          <option value="progressive">Progressive</option>
          <option value="deep">Deep House</option>
          <option value="tech">Tech House</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>When</label>
        <select 
          className={styles.filterSelect}
          value={currentFilters.date}
          onChange={(e) => handleFilterChange('date', e.target.value)}
        >
          <option value="upcoming">All Upcoming</option>
          <option value="today">Today</option>
          <option value="this-week">This Week</option>
          <option value="this-month">This Month</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Distance</label>
        <select 
          className={styles.filterSelect}
          value={currentFilters.distance}
          onChange={(e) => handleFilterChange('distance', e.target.value)}
        >
          <option value="10">Within 10 miles</option>
          <option value="25">Within 25 miles</option>
          <option value="50">Within 50 miles</option>
          <option value="100">Within 100 miles</option>
          <option value="all">Any Distance</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Price</label>
        <select 
          className={styles.filterSelect}
          value={currentFilters.price}
          onChange={(e) => handleFilterChange('price', e.target.value)}
        >
          <option value="all">Any Price</option>
          <option value="0-25">Under $25</option>
          <option value="25-50">$25 - $50</option>
          <option value="50-100">$50 - $100</option>
          <option value="100-">$100+</option>
        </select>
      </div>
    </div>
  );
};

export default EventFilters;
