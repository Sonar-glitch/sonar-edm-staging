// /c/sonar/users/sonar-edm-user/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = '', color = 'cyan' }) => {
  // Size classes
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };
  
  // Color classes
  const colorClasses = {
    cyan: 'border-cyan-500',
    fuchsia: 'border-fuchsia-500',
    white: 'border-white'
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${sizeClasses[size]} rounded-full border-t-4 border-b-4 ${colorClasses[color]} animate-spin mb-3`}
      ></div>
      {text && <p className="text-white text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
