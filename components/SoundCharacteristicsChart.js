import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SoundCharacteristicsChart = ({ soundData }) => {
  // Format data for the chart
  const formatChartData = (data) => {
    if (!data) return [];
    
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: typeof value === 'number' ? value : 0,
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  };
  
  const chartData = formatChartData(soundData);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '10px',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '14px'
        }}>
          <p style={{ margin: 0 }}>{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div style={{ 
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px 0',
      boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
    }}>
      <h2 style={{ 
        color: '#fff',
        fontSize: '1.5rem',
        marginTop: 0,
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        Your Sound Characteristics
      </h2>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tick={{ fill: 'rgba(255,255,255,0.7)' }} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: 'rgba(255,255,255,0.7)' }} 
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#ff00ff" />
              </linearGradient>
            </defs>
            <Bar 
              dataKey="value" 
              fill="url(#barGradient)" 
              radius={[0, 4, 4, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p style={{ 
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.9rem',
        textAlign: 'center',
        marginTop: '15px'
      }}>
        Based on your listening history and preferences
      </p>
    </div>
  );
};

export default SoundCharacteristicsChart;
