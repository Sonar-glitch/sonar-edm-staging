// /c/sonar/users/sonar-edm-user/components/common/SpotifyImage.js
import React, { useState } from 'react';
import Image from 'next/image';

const SpotifyImage = ({ src, alt, width, height, className }) => {
  const [error, setError] = useState(false);
  
  // Fallback image when Spotify image fails to load
  const fallbackSrc = '/images/fallback-album-art.png';
  
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!error ? (
        <Image
          src={src}
          alt={alt || 'Spotify image'}
          width={width}
          height={height}
          layout="responsive"
          objectFit="cover"
          onError={() => setError(true)}
        />
      ) : (
        <div 
          className="w-full h-full bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center"
          style={{ width, height }}
        >
          <span className="text-white">♪</span>
        </div>
      )}
    </div>
  );
};

export default SpotifyImage;
