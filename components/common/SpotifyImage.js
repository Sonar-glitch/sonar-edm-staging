// /c/sonar/users/sonar-edm-user/components/common/SpotifyImage.js
import React, { useState } from 'react';
import Image from 'next/image';

const SpotifyImage = ({ 
  src, 
  alt, 
  width = 80, 
  height = 80, 
  className = '', 
  fallbackText = '♪' 
}) => {
  const [imgError, setImgError] = useState(false);
  
  // Handle case where no src is provided or error occurred
  if (!src || imgError) {
    return (
      <div 
        className={`bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center rounded-lg ${className}`}
        style={{ width, height }}
      >
        <span className="text-2xl">{fallbackText}</span>
      </div>
    );
  }
  
  return (
    <div className="relative" style={{ width, height }}>
      <Image
        src={src}
        alt={alt || "Music artwork"}
        width={width}
        height={height}
        className={`rounded-lg ${className}`}
        unoptimized={true}
        onError={() => setImgError(true)}
      />
    </div>
  );
};

export default SpotifyImage;
