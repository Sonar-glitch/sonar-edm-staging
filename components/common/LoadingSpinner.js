// /c/sonar/users/sonar-edm-user/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'medium', text }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-fuchsia-400 border-b-teal-400 border-l-transparent animate-spin"></div>
      </div>
      {text && <p className="mt-4 text-gray-300">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
