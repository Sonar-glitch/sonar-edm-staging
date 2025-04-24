import React, { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const SoundCharacteristicsChart = ({ soundData }) => {
  const [chartData, setChartData] = useState([]);
  const containerRef = useRef(null);
  
  // Process data when it changes
  useEffect(() => {
    if (!soundData) {
      // Use fallback data if none provided
      const fallbackData = [
        { name: 'Danceability', value: 78 },
        { name: 'Melody', value: 85 },
        { name: 'Energy', value: 72 },
        { name: 'Obscurity', value: 63 },
        { name: 'Tempo', value: 68 }
      ];
      setChartData(fallbackData);
      return;
    }
    
    // Format data for the chart
    const formattedData = Object.entries(soundData).map(([name, value]) => ({
      name,
      value: typeof value === 'number' ? value : 0
    }));
    
    // Sort by value in descending order
    formattedData.sort((a, b) => b.value - a.value);
    
    // Take top 5 characteristics
    setChartData(formattedData.slice(0, 5));
  }, [soundData]);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid #00e5ff',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)'
        }}>
          <p style={{ color: '#fff', margin: '0' }}>
            <span style={{ color: '#00e5ff' }}>{payload[0].name}: </span>
            <span>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Generate gradient colors for bars
  const getGradientColors = (index) => {
    const colors = [
      ['#00e5ff', '#0077ff'], // Cyan to blue
      ['#ff00ff', '#cc00ff'], // Magenta to purple
      ['#1de9b6', '#00b8a9'], // Teal to turquoise
      ['#ff9100', '#ff6d00'], // Orange to deep orange
      ['#d500f9', '#aa00ff']  // Purple to deep purple
    ];
    
    return colors[index % colors.length];
  };
  
  return (
    <div ref={containerRef} style={{
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px 0',
      boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
      height: '300px',
      width: '100%'
    }}>
      <h3 style={{
        color: '#fff',
        marginTop: '0',
        marginBottom: '15px',
        fontSize: '1.2rem',
        textAlign: 'center'
      }}>
        Your Sound Characteristics
      </h3>
      
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tick={{ fill: '#fff' }} 
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: '#fff' }} 
            width={100}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            {chartData.map((entry, index) => (
              <linearGradient 
                key={`gradient-${index}`} 
                id={`gradient-${index}`} 
                x1="0" 
                y1="0" 
                x2="1" 
                y2="0"
              >
                <stop 
                  offset="0%" 
                  stopColor={getGradientColors(index)[0]} 
                  stopOpacity={0.8}
                />
                <stop 
                  offset="100%" 
                  stopColor={getGradientColors(index)[1]} 
                  stopOpacity={0.8}
                />
              </linearGradient>
            ))}
          </defs>
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#gradient-${index})`}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SoundCharacteristicsChart;
