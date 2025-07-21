import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from '../styles/Top5GenresSpiderChart.module.css';

// Dynamic import for Chart.js to avoid SSR issues
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Chart), { ssr: false });

export default function Top5GenresSpiderChart({ data, dataSource }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    loadChartData();
  }, [data]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      
      let genreData;
      
      if (data && data.topGenres && data.topGenres.length > 0) {
        genreData = data.topGenres.slice(0, 5);
      } else {
        // Fallback genre data
        genreData = [
          { name: 'Melodic Techno', percentage: 95 },
          { name: 'Melodic House', percentage: 95 },
          { name: 'Progressive House', percentage: 60 },
          { name: 'Techno', percentage: 30 },
          { name: 'Organic House', percentage: 15 }
        ];
      }

      // Prepare chart data
      const chartConfig = {
        labels: genreData.map(genre => genre.name),
        datasets: [{
          label: 'Genre Preference',
          data: genreData.map(genre => genre.percentage),
          backgroundColor: 'rgba(255, 0, 204, 0.2)', // TIKO pink with transparency
          borderColor: '#FF00CC', // TIKO pink
          borderWidth: 2,
          pointBackgroundColor: '#FF00CC',
          pointBorderColor: '#DADADA',
          pointHoverBackgroundColor: '#00CFFF',
          pointHoverBorderColor: '#FF00CC',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      };

      setChartData(chartConfig);
      
    } catch (err) {
      console.error('Chart data loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend to keep it clean
      },
      tooltip: {
        backgroundColor: 'rgba(21, 21, 31, 0.9)',
        titleColor: '#DADADA',
        bodyColor: '#DADADA',
        borderColor: '#00CFFF',
        borderWidth: 1
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          display: false // Hide tick labels for cleaner look
        },
        grid: {
          color: 'rgba(0, 207, 255, 0.2)' // TIKO cyan grid
        },
        angleLines: {
          color: 'rgba(0, 207, 255, 0.2)' // TIKO cyan angle lines
        },
        pointLabels: {
          color: '#DADADA', // TIKO primary text color
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 4
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your top genres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Unable to load genre chart</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>No genre data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ONLY SPIDER CHART - REMOVED DUPLICATE GENRE LIST */}
      <div className={styles.chartContainer}>
        <Chart
          ref={chartRef}
          type="radar"
          data={chartData}
          options={chartOptions}
        />
      </div>
      
      {/* REMOVED: Enhanced Profile button as requested */}
      {/* REMOVED: Duplicate genre list below chart as requested */}
    </div>
  );
}

