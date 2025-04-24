// /c/sonar/users/sonar-edm-user/components/EventFilters.js
import React from 'react';

const EventFilters = ({ filters, onFilterChange }) => {
  const handleVibeMatchChange = (e) => {
    onFilterChange('vibeMatch', parseInt(e.target.value));
  };
  
  const handleSelectChange = (e) => {
    onFilterChange(e.target.name, e.target.value);
  };
  
  return (
    <div className="bg-black/30 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <label className="block text-sm mb-1">Vibe Match: {filters.vibeMatch}%+</label>
          <div className="relative w-full h-6">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={filters.vibeMatch} 
              onChange={handleVibeMatchChange}
              className="absolute inset-0 w-full opacity-0 z-10 cursor-pointer"
            />
            <div className="absolute inset-0 h-2 bg-gray-700 rounded-full my-auto"></div>
            <div 
              className="absolute top-0 bottom-0 left-0 h-2 my-auto rounded-full" 
              style={{ 
                width: `${filters.vibeMatch}%`,
                background: `linear-gradient(to right, #00e5ff, #ff00ff)` 
              }}
            ></div>
            <div 
              className="absolute h-4 w-4 rounded-full bg-white top-1/2 -translate-y-1/2 shadow"
              style={{ left: `calc(${filters.vibeMatch}% - 8px)` }}
            ></div>
          </div>
        </div>
        
        <div className="flex-1 min-w-32">
          <label className="block text-sm mb-1">Genre</label>
          <select 
            name="genre"
            value={filters.genre}
            onChange={handleSelectChange}
            className="w-full bg-black/50 border border-cyan-500/30 rounded py-1 px-2 text-white"
          >
            <option value="all">All Genres</option>
            <option value="techno">Techno</option>
            <option value="house">House</option>
            <option value="trance">Trance</option>
            <option value="melodic techno">Melodic Techno</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-32">
          <label className="block text-sm mb-1">Price</label>
          <select 
            name="price"
            value={filters.price}
            onChange={handleSelectChange}
            className="w-full bg-black/50 border border-cyan-500/30 rounded py-1 px-2 text-white"
          >
            <option value="all">Any Price</option>
            <option value="under50">Under $50</option>
            <option value="under100">Under $100</option>
            <option value="over100">$100+</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default EventFilters;
