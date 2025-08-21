// /c/sonar/users/sonar-edm-user/components/GenreRadarChart.js
import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';

const GenreRadarChart = ({ genreData }) => {
  // Convert genre data to format expected by Recharts
  const chartData = Object.entries(genreData || {}).map(([genre, value]) => ({
    genre,
    value
  }));
  
  // If no data, show placeholder
  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center bg-black/20 rounded-lg border border-cyan-500/20">
        <p className="text-gray-400">No genre data available</p>
      </div>
    );
  }
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius="80%" data={chartData}>
          <PolarGrid stroke="rgba(0, 255, 255, 0.1)" />
          <PolarAngleAxis 
            dataKey="genre" 
            tick={{ fill: '#00e5ff', fontSize: 12 }} 
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
            axisLine={false}
            tickCount={5}
          />
          <Radar 
            name="Genre Score" 
            dataKey="value" 
            stroke="#00e5ff" 
            fill="#00e5ff" 
            fillOpacity={0.3} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
              border: '1px solid #00e5ff',
              borderRadius: '4px',
              color: 'white'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenreRadarChart;
