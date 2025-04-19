import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4">
            <div className="h-40 bg-gray-700 rounded mb-4"></div>
            <div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
