import React from 'react';
import styles from '@/styles/CompactSoundCharacteristics.module.css';
import { Bar } from 'recharts';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CompactSoundCharacteristics = ({ data }) => {
  // If no data is provided, use sample data
  const chartData = data || [
    { name: 'Melody', value: 85 },
    { name: 'Danceability', value: 75 },
    { name: 'Energy', value: 65 },
    { name: 'Tempo', value: 60 },
    { name: 'Obscurity', value: 55 }
  ];

  // Custom tooltip to match the neon theme
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.label}>{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Your Sound Characteristics</h3>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: '#fff' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="url(#colorGradient)" 
              barSize={20}
              radius={[0, 4, 4, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="50%" stopColor="#734ce2" />
                <stop offset="100%" stopColor="#ff00ff" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.subtitle}>Based on your listening history and preferences</p>
    </div>
  );
};

export default CompactSoundCharacteristics;
