import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../styles/SharedAnalytics.module.css';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

// Mock data for development and testing
const mockAnalyticsData = {
  audienceMetrics: {
    totalUsers: 25840,
    growth: 12.5,
    byGenre: [
      { genre: 'House', percentage: 35 },
      { genre: 'Techno', percentage: 25 },
      { genre: 'Trance', percentage: 15 },
      { genre: 'Dubstep', percentage: 10 },
      { genre: 'Drum & Bass', percentage: 10 },
      { genre: 'Other', percentage: 5 }
    ],
    byAge: [
      { age: '18-24', percentage: 30 },
      { age: '25-34', percentage: 45 },
      { age: '35-44', percentage: 15 },
      { age: '45+', percentage: 10 }
    ],
    monthlyActive: [
      { month: 'Jan', users: 15200 },
      { month: 'Feb', users: 16100 },
      { month: 'Mar', users: 17300 },
      { month: 'Apr', users: 18500 },
      { month: 'May', users: 19800 },
      { month: 'Jun', users: 21200 },
      { month: 'Jul', users: 22500 },
      { month: 'Aug', users: 23800 },
      { month: 'Sep', users: 24600 },
      { month: 'Oct', users: 25100 },
      { month: 'Nov', users: 25500 },
      { month: 'Dec', users: 25840 }
    ]
  },
  eventMetrics: {
    totalEvents: 156,
    upcoming: 32,
    past: 124,
    averageAttendance: 850,
    topEvents: [
      { name: 'Summer Bass Festival', attendance: 1200, revenue: 48000 },
      { name: 'Neon Nights Club Event', attendance: 950, revenue: 28500 },
      { name: 'Techno Underground', attendance: 750, revenue: 22500 }
    ],
    monthlyEvents: [
      { month: 'Jan', count: 10 },
      { month: 'Feb', count: 12 },
      { month: 'Mar', count: 14 },
      { month: 'Apr', count: 13 },
      { month: 'May', count: 15 },
      { month: 'Jun', count: 18 },
      { month: 'Jul', count: 20 },
      { month: 'Aug', count: 16 },
      { month: 'Sep', count: 14 },
      { month: 'Oct', count: 12 },
      { month: 'Nov', count: 11 },
      { month: 'Dec', count: 13 }
    ]
  },
  musicTrends: {
    topGenres: [
      { genre: 'House', growth: 15 },
      { genre: 'Techno', growth: 12 },
      { genre: 'Drum & Bass', growth: 18 },
      { genre: 'Dubstep', growth: 5 },
      { genre: 'Trance', growth: 8 }
    ],
    topArtists: [
      { name: 'Daft Punk', popularity: 92 },
      { name: 'Deadmau5', popularity: 88 },
      { name: 'Avicii', popularity: 90 },
      { name: 'Calvin Harris', popularity: 85 },
      { name: 'Martin Garrix', popularity: 87 }
    ],
    emergingTrends: [
      { trend: 'Lo-Fi House', growth: 25 },
      { trend: 'Melodic Techno', growth: 22 },
      { trend: 'Future Bass', growth: 18 }
    ]
  }
};

export default function SharedAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('audience');
  
  // Function to fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a production environment, this would call the actual API
      // For now, we'll use mock data with a simulated delay
      setTimeout(() => {
        setAnalytics(mockAnalyticsData);
        setLoading(false);
      }, 1500);
      
      // Actual API call would look like this:
      /*
      const response = await axios.get('/api/analytics/shared');
      setAnalytics(response.data);
      */
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch analytics data on component mount
  useEffect(() => {
    if (!analytics && !loading) {
      fetchAnalytics();
    }
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          onClick={fetchAnalytics}
          className={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // If we have analytics data
  if (analytics) {
    // Prepare chart data
    const genreChartData = {
      labels: analytics.audienceMetrics.byGenre.map(item => item.genre),
      datasets: [
        {
          label: 'Audience by Genre',
          data: analytics.audienceMetrics.byGenre.map(item => item.percentage),
          backgroundColor: [
            'rgba(255, 42, 112, 0.7)',
            'rgba(0, 240, 255, 0.7)',
            'rgba(57, 255, 20, 0.7)',
            'rgba(255, 159, 28, 0.7)',
            'rgba(138, 43, 226, 0.7)',
            'rgba(75, 192, 192, 0.7)'
          ],
          borderColor: [
            'rgba(255, 42, 112, 1)',
            'rgba(0, 240, 255, 1)',
            'rgba(57, 255, 20, 1)',
            'rgba(255, 159, 28, 1)',
            'rgba(138, 43, 226, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
    
    const usersChartData = {
      labels: analytics.audienceMetrics.monthlyActive.map(item => item.month),
      datasets: [
        {
          label: 'Monthly Active Users',
          data: analytics.audienceMetrics.monthlyActive.map(item => item.users),
          fill: false,
          backgroundColor: 'rgba(0, 240, 255, 0.7)',
          borderColor: 'rgba(0, 240, 255, 1)',
          tension: 0.4
        }
      ]
    };
    
    const eventsChartData = {
      labels: analytics.eventMetrics.monthlyEvents.map(item => item.month),
      datasets: [
        {
          label: 'Monthly Events',
          data: analytics.eventMetrics.monthlyEvents.map(item => item.count),
          backgroundColor: 'rgba(255, 42, 112, 0.7)',
          borderColor: 'rgba(255, 42, 112, 1)',
          borderWidth: 1
        }
      ]
    };
    
    const genreGrowthChartData = {
      labels: analytics.musicTrends.topGenres.map(item => item.genre),
      datasets: [
        {
          label: 'Genre Growth (%)',
          data: analytics.musicTrends.topGenres.map(item => item.growth),
          backgroundColor: 'rgba(57, 255, 20, 0.7)',
          borderColor: 'rgba(57, 255, 20, 1)',
          borderWidth: 1
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#FFFFFF'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#FFFFFF',
          bodyColor: '#FFFFFF'
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#B3B3B3'
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#B3B3B3'
          }
        }
      }
    };
    
    const pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#FFFFFF'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#FFFFFF',
          bodyColor: '#FFFFFF'
        }
      }
    };
    
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Sonar EDM Platform Analytics</h1>
          <p className={styles.headerDescription}>
            Comprehensive analytics shared between promoters and music fans
          </p>
        </header>
        
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'audience' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('audience')}
          >
            Audience
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'events' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'music' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('music')}
          >
            Music Trends
          </button>
        </div>
        
        {activeTab === 'audience' && (
          <div className={styles.tabContent}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Total Users</h3>
                <div className={styles.statValue}>{analytics.audienceMetrics.totalUsers.toLocaleString()}</div>
                <div className={styles.statGrowth}>
                  <span className={analytics.audienceMetrics.growth > 0 ? styles.positive : styles.negative}>
                    {analytics.audienceMetrics.growth > 0 ? '+' : ''}{analytics.audienceMetrics.growth}%
                  </span>
                  <span className={styles.growthLabel}>vs. last year</span>
                </div>
              </div>
            </div>
            
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3>Monthly Active Users</h3>
                <div className={styles.chartContainer}>
                  <Line data={usersChartData} options={chartOptions} />
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <h3>Audience by Genre</h3>
                <div className={styles.chartContainer}>
                  <Pie data={genreChartData} options={pieChartOptions} />
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <h3>Audience by Age</h3>
                <div className={styles.chartContainer}>
                  <Pie 
                    data={{
                      labels: analytics.audienceMetrics.byAge.map(item => item.age),
                      datasets: [
                        {
                          label: 'Audience by Age',
                          data: analytics.audienceMetrics.byAge.map(item => item.percentage),
                          backgroundColor: [
                            'rgba(0, 240, 255, 0.7)',
                            'rgba(255, 42, 112, 0.7)',
                            'rgba(57, 255, 20, 0.7)',
                            'rgba(255, 159, 28, 0.7)'
                          ],
                          borderColor: [
                            'rgba(0, 240, 255, 1)',
                            'rgba(255, 42, 112, 1)',
                            'rgba(57, 255, 20, 1)',
                            'rgba(255, 159, 28, 1)'
                          ],
                          borderWidth: 1
                        }
                      ]
                    }} 
                    options={pieChartOptions} 
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.insightsSection}>
              <h3>Key Audience Insights</h3>
              <ul className={styles.insightsList}>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Demographics</h4>
                    <p>75% of platform users are under 35, with the 25-34 age group being the largest segment.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Genre Preferences</h4>
                    <p>House and Techno are the dominant genres, making up 60% of user preferences.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Growth Trend</h4>
                    <p>User base has grown consistently month-over-month, with a 12.5% annual increase.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className={styles.tabContent}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Total Events</h3>
                <div className={styles.statValue}>{analytics.eventMetrics.totalEvents}</div>
                <div className={styles.statDetail}>
                  <span>{analytics.eventMetrics.upcoming} upcoming</span>
                  <span className={styles.separator}>•</span>
                  <span>{analytics.eventMetrics.past} past</span>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <h3>Avg. Attendance</h3>
                <div className={styles.statValue}>{analytics.eventMetrics.averageAttendance}</div>
                <div className={styles.statDetail}>per event</div>
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <h3>Monthly Events</h3>
              <div className={styles.chartContainer}>
                <Bar data={eventsChartData} options={chartOptions} />
              </div>
            </div>
            
            <div className={styles.topEventsSection}>
              <h3>Top Performing Events</h3>
              <div className={styles.topEventsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCell}>Event Name</div>
                  <div className={styles.tableCell}>Attendance</div>
                  <div className={styles.tableCell}>Revenue</div>
                </div>
                {analytics.eventMetrics.topEvents.map((event, index) => (
                  <div key={index} className={styles.tableRow}>
                    <div className={styles.tableCell}>{event.name}</div>
                    <div className={styles.tableCell}>{event.attendance}</div>
                    <div className={styles.tableCell}>${event.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.insightsSection}>
              <h3>Event Insights</h3>
              <ul className={styles.insightsList}>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Seasonal Trends</h4>
                    <p>Summer months (June-August) show the highest event frequency and attendance.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Event Types</h4>
                    <p>Festivals generate the highest revenue per attendee compared to club nights.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Growth Opportunity</h4>
                    <p>Winter months show potential for growth with targeted indoor events.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'music' && (
          <div className={styles.tabContent}>
            <div className={styles.chartCard}>
              <h3>Genre Growth Trends</h3>
              <div className={styles.chartContainer}>
                <Bar data={genreGrowthChartData} options={chartOptions} />
              </div>
            </div>
            
            <div className={styles.trendingSection}>
              <h3>Top Artists</h3>
              <div className={styles.trendingGrid}>
                {analytics.musicTrends.topArtists.map((artist, index) => (
                  <div key={index} className={styles.trendingCard}>
                    <div className={styles.trendingRank}>{index + 1}</div>
                    <div className={styles.trendingContent}>
                      <h4>{artist.name}</h4>
                      <div className={styles.popularityBar}>
                        <div 
                          className={styles.popularityFill} 
                          style={{ width: `${artist.popularity}%` }}
                        ></div>
                      </div>
                      <div className={styles.popularityValue}>{artist.popularity}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.emergingSection}>
              <h3>Emerging Trends</h3>
              <div className={styles.emergingGrid}>
                {analytics.musicTrends.emergingTrends.map((trend, index) => (
                  <div key={index} className={styles.emergingCard}>
                    <h4>{trend.trend}</h4>
                    <div className={styles.growthValue}>+{trend.growth}%</div>
                    <p>Growth this year</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.insightsSection}>
              <h3>Music Trend Insights</h3>
              <ul className={styles.insightsList}>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Genre Evolution</h4>
                    <p>Drum & Bass is showing the strongest growth among established genres at 18%.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Emerging Sounds</h4>
                    <p>Lo-Fi House is the fastest growing subgenre with 25% growth this year.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Artist Popularity</h4>
                    <p>Classic artists like Daft Punk maintain high popularity despite fewer new releases.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Default loading state
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Loading analytics data...</p>
    </div>
  );
}
