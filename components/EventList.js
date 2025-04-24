// /c/sonar/users/sonar-edm-user/components/EventList.js
import React from 'react';
import LoadingSpinner from './common/LoadingSpinner';

const EventList = ({ events, loading, error }) => {
  // Format date for display
  const formatEventDate = (dateString) => {
    if (!dateString) return 'Upcoming';
    
    try {
      const date = new Date(dateString);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = days[date.getDay()];
      const dayOfMonth = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      
      return `${day}, ${month} ${dayOfMonth}`;
    } catch (e) {
      return 'Upcoming';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner text="Finding your perfect events..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-black/20 rounded-lg p-6 text-center">
        <p className="mb-2 text-red-400">{error}</p>
        <p className="text-sm text-gray-400">Try refreshing the page or check back later.</p>
      </div>
    );
  }
  
  if (!events || events.length === 0) {
    return (
      <div className="bg-black/20 rounded-lg p-6 text-center">
        <p className="mb-2">No events match your current filters.</p>
        <p className="text-sm text-gray-400">Try adjusting your filters or check back later.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {events.map(event => (
        <div key={event.id} className="bg-black/30 rounded-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Event info */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-medium">{event.name}</h3>
                  <p className="text-gray-400">{event.venue}, {event.location}</p>
                </div>
                <div className="bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 rounded-full px-3 py-1 text-sm">
                  <span className="text-cyan-400 font-medium">{event.matchScore}%</span> match
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-black/40 rounded text-xs border border-white/10">
                  {event.primaryGenre}
                </span>
                <span className="px-2 py-1 bg-black/40 rounded text-xs border border-white/10">
                  ${event.price}
                </span>
                <span className="px-2 py-1 bg-black/40 rounded text-xs border border-white/10">
                  {formatEventDate(event.date)}
                </span>
              </div>
            </div>
            
            {/* Match score visualization */}
            <div className="w-full md:w-24 bg-black/40 flex flex-row md:flex-col items-center justify-center p-4">
              <div className="w-16 h-16 md:w-20 md:h-20 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="10"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={`url(#gradient-${event.id})`}
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 45 * event.matchScore / 100} ${2 * Math.PI * 45 * (1 - event.matchScore / 100)}`}
                    strokeDashoffset={2 * Math.PI * 45 * 0.25}
                    strokeLinecap="round"
                  />
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id={`gradient-${event.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00e5ff" />
                      <stop offset="100%" stopColor="#ff00ff" />
                    </linearGradient>
                  </defs>
                  {/* Text in center */}
                  <text
                    x="50"
                    y="50"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="22"
                    fontWeight="bold"
                  >
                    {event.matchScore}
                  </text>
                  <text
                    x="50"
                    y="65"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255, 255, 255, 0.7)"
                    fontSize="12"
                  >
                    %
                  </text>
                </svg>
              </div>
              <div className="ml-3 md:ml-0 md:mt-2 text-center">
                <button className="text-cyan-400 text-sm hover:text-cyan-300 transition">
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;
