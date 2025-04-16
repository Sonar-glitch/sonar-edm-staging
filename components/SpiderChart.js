import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import styles from '../styles/SpiderChart.module.css';

// Register required Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const SpiderChart = ({ genres }) => {
  const chartRef = useRef(null);
  
  // Prepare data for the chart
  const data = {
    labels: genres.map(genre => genre.label),
    datasets: [
      {
        label: 'Genre Affinity',
        data: genres.map(genre => genre.value),
        backgroundColor: 'rgba(138, 43, 226, 0.2)', // Blueviolet with transparency
        borderColor: 'rgba(138, 43, 226, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(138, 43, 226, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(138, 43, 226, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.2)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: function(context) {
              // Responsive font size based on screen width
              const width = window.innerWidth;
              if (width < 768) return 10; // Mobile
              if (width < 1024) return 12; // Tablet
              return 14; // Desktop
            },
            family: "'Poppins', sans-serif",
          },
          // Handle long labels
          callback: function(value) {
            // For mobile screens, truncate long labels
            if (window.innerWidth < 768 && value.length > 12) {
              return value.substring(0, 10) + '...';
            }
            return value;
          },
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          backdropColor: 'transparent',
          stepSize: 20,
          max: 100,
          min: 0,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend as it's not needed for a single dataset
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 1)',
        titleFont: {
          size: 14,
          family: "'Poppins', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Poppins', sans-serif",
        },
        padding: 10,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            // Show full genre name in tooltip title (no truncation)
            return genres[tooltipItems[0].dataIndex].label;
          },
          label: function(context) {
            return `Affinity: ${context.raw}%`;
          },
        },
      },
    },
  };
  
  // Effect to handle resize events
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className={styles.chartContainer}>
      <Radar ref={chartRef} data={data} options={options} />
    </div>
  );
};

export default SpiderChart;
