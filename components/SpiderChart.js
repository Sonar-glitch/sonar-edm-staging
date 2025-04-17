import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import styles from '../styles/SpiderChart.module.css';

const SpiderChart = ({ genres }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Validate genres data
    if (!Array.isArray(genres) || genres.length === 0) {
      return;
    }

    // Filter out invalid genres and ensure all have name and score properties
    const validGenres = genres.filter(genre => 
      genre && typeof genre === 'object' && 
      typeof genre.name === 'string' && 
      (typeof genre.score === 'number' || typeof genre.value === 'number')
    );

    if (validGenres.length === 0) {
      return;
    }

    // Get canvas context
    const ctx = chartRef.current.getContext('2d');
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Prepare data for chart
    const labels = validGenres.map(genre => genre.name);
    const data = validGenres.map(genre => genre.score || genre.value || 0);
    
    // Create new chart
    try {
      chartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Genre Affinity',
            data: data,
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            borderColor: 'rgba(0, 255, 255, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(0, 255, 255, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(0, 255, 255, 1)'
          }]
        },
        options: {
          scales: {
            r: {
              angleLines: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              pointLabels: {
                color: 'rgba(255, 255, 255, 0.7)',
                font: {
                  size: 12
                },
                padding: 10,
                // Ensure labels don't get truncated
                callback: function(value) {
                  // Limit label length to prevent truncation
                  if (value.length > 10) {
                    return value.substr(0, 8) + '...';
                  }
                  return value;
                }
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.5)',
                backdropColor: 'transparent',
                showLabelBackdrop: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              titleColor: '#00ffff',
              bodyColor: '#ffffff',
              borderColor: 'rgba(0, 255, 255, 0.3)',
              borderWidth: 1,
              displayColors: false,
              callbacks: {
                title: function(tooltipItems) {
                  return tooltipItems[0].label;
                },
                label: function(context) {
                  return `Score: ${context.raw}`;
                }
              }
            }
          },
          maintainAspectRatio: false
        }
      });
    } catch (error) {
      console.error('Error creating spider chart:', error);
    }
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [genres]);
  
  // If no genres data, show a message
  if (!Array.isArray(genres) || genres.length === 0) {
    return (
      <div className={styles.noDataContainer}>
        <p>No genre data available</p>
      </div>
    );
  }
  
  return (
    <div className={styles.spiderChartContainer}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default SpiderChart;
