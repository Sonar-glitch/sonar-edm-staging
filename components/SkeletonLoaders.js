import React from 'react';

export const SkeletonCard = ({ height = '300px', width = '100%' }) => (
  <div className="skeleton-loading" style={{
    width: width,
    height: height,
    borderRadius: '12px',
    margin: '20px 0'
  }} />
);

export const SkeletonArtistCard = () => (
  <div style={{ 
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    borderRadius: '8px',
    overflow: 'hidden',
    height: '300px'
  }}>
    <div className="skeleton-loading" style={{ height: '200px' }} />
    <div style={{ padding: '15px' }}>
      <div className="skeleton-loading" style={{ height: '24px', width: '70%', marginBottom: '10px' }} />
      <div className="skeleton-loading" style={{ height: '18px', width: '40%', marginBottom: '10px' }} />
      <div className="skeleton-loading" style={{ height: '18px', width: '90%' }} />
    </div>
  </div>
);

export const SkeletonSpiderChart = () => (
  <div className="skeleton-loading" style={{
    width: '100%',
    height: '400px',
    borderRadius: '12px',
    margin: '20px 0'
  }} />
);
