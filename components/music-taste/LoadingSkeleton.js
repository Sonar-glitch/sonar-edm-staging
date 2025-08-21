import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
      <div className="grid-layout mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="artist-card">
            <div className="h-48 bg-gray-700 rounded-t-lg"></div>
            <div className="card-body">
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
