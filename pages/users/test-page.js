import React from 'react';
import SpiderChart from '../components/SpiderChart';
import Navigation from '../components/Navigation';
import SeasonalMoodCard from '../components/SeasonalMoodCard';
import EventCorrelationIndicator from '../components/EventCorrelationIndicator';

export default function Test() {
  // Sample data for SpiderChart
  const sampleGenres = [
    { name: "House", score: 85 },
    { name: "Techno", score: 70 },
    { name: "Trance", score: 60 },
    { name: "Drum & Bass", score: 40 },
    { name: "Ambient", score: 30 }
  ];

  // Sample data for SeasonalMoodCard
  const sampleSeasonalMood = {
    currentSeason: {
      name: 'Spring',
      topGenres: ['House', 'Techno', 'Progressive'],
      mood: 'Energetic',
      energy: 75
    },
    previousSeason: {
      name: 'Winter',
      topGenres: ['Ambient', 'Deep House', 'Downtempo']
    },
    seasonalShift: {
      intensity: 65,
      changes: [
        'More uptempo tracks',
        'Brighter melodies',
        'Less atmospheric elements',
        'Increased dance energy'
      ]
    }
  };

  // Sample data for EventCorrelationIndicator
  const sampleCorrelation = 78;

  return (
    <div style={{ backgroundColor: '#0a0014', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <Navigation />
      
      <div style={{ maxWidth: '1200px', margin: '60px auto 0', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px', color: '#ff00ff' }}>Component Test Page</h1>
        <p style={{ marginBottom: '40px' }}>This page tests the visualization components to ensure they're working correctly.</p>
        
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#00ffff' }}>SpiderChart Test</h2>
          <SpiderChart genres={sampleGenres} />
        </div>
        
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#00ffff' }}>SeasonalMoodCard Test</h2>
          <SeasonalMoodCard seasonalMood={sampleSeasonalMood} />
        </div>
        
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#00ffff' }}>EventCorrelationIndicator Test</h2>
          <div style={{ maxWidth: '500px' }}>
            <EventCorrelationIndicator correlation={sampleCorrelation} />
          </div>
        </div>
      </div>
    </div>
  );
}
