import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from '../../styles/PromoterDashboard.module.css';
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
  audienceReach: {
    total: 25840,
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
    ]
  },
  eventPerformance: {
    upcoming: 3,
    past: 12,
    averageAttendance: 850,
    topEvents: [
      { name: 'Summer Bass Festival', attendance: 1200, revenue: 48000 },
      { name: 'Neon Nights Club Event', attendance: 950, revenue: 28500 },
      { name: 'Techno Underground', attendance: 750, revenue: 22500 }
    ],
    monthlyAttendance: [
      { month: 'Jan', attendance: 720 },
      { month: 'Feb', attendance: 680 },
      { month: 'Mar', attendance: 790 },
      { month: 'Apr', attendance: 850 },
      { month: 'May', attendance: 940 },
      { month: 'Jun', attendance: 1100 },
      { month: 'Jul', attendance: 1250 },
      { month: 'Aug', attendance: 1150 },
      { month: 'Sep', attendance: 980 },
      { month: 'Oct', attendance: 870 },
      { month: 'Nov', attendance: 780 },
      { month: 'Dec', attendance: 850 }
    ]
  },
  revenue: {
    total: 342500,
    growth: 18.7,
    bySource: [
      { source: 'Ticket Sales', amount: 245000 },
      { source: 'VIP Packages', amount: 58000 },
      { source: 'Merchandise', amount: 24500 },
      { source: 'Sponsorships', amount: 15000 }
    ],
    monthlyRevenue: [
      { month: 'Jan', revenue: 21500 },
      { month: 'Feb', revenue: 19800 },
      { month: 'Mar', revenue: 23700 },
      { month: 'Apr', revenue: 25500 },
      { month: 'May', revenue: 28200 },
      { month: 'Jun', revenue: 33000 },
      { month: 'Jul', revenue: 37500 },
      { month: 'Aug', revenue: 34500 },
      { month: 'Sep', revenue: 29400 },
      { month: 'Oct', revenue: 26100 },
      { month: 'Nov', revenue: 23400 },
      { month: 'Dec', revenue: 25500 }
    ]
  }
};

export default function PromoterDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
      const response = await axios.get('/api/analytics/promoter');
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
  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }
  
  // If not authenticated, show sign-in prompt
  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.authPrompt}>
          <h1>Promoter Dashboard</h1>
          <p>Please sign in with your Google account to access your promoter dashboard.</p>
          <button 
            onClick={() => signIn('google', { callbackUrl: '/promoters/dashboard' })}
            className={styles.googleButton}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" className={styles.googleIcon}>
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            onClick={fetchAnalytics}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // If we have analytics data
  if (analytics) {
    // Prepare chart data
    const genreChartData = {
      labels: analytics.audienceReach.byGenre.map(item => item.genre),
      datasets: [
        {
          label: 'Audience by Genre',
          data: analytics.audienceReach.byGenre.map(item => item.percentage),
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
    
    const attendanceChartData = {
      labels: analytics.eventPerformance.monthlyAttendance.map(item => item.month),
      datasets: [
        {
          label: 'Monthly Attendance',
          data: analytics.eventPerformance.monthlyAttendance.map(item => item.attendance),
          fill: false,
          backgroundColor: 'rgba(0, 240, 255, 0.7)',
          borderColor: 'rgba(0, 240, 255, 1)',
          tension: 0.4
        }
      ]
    };
    
    const revenueChartData = {
      labels: analytics.revenue.monthlyRevenue.map(item => item.month),
      datasets: [
        {
          label: 'Monthly Revenue ($)',
          data: analytics.revenue.monthlyRevenue.map(item => item.revenue),
          backgroundColor: 'rgba(255, 42, 112, 0.7)',
          borderColor: 'rgba(255, 42, 112, 1)',
          borderWidth: 1
        }
      ]
    };
    
    const revenueSourceChartData = {
      labels: analytics.revenue.bySource.map(item => item.source),
      datasets: [
        {
          label: 'Revenue by Source',
          data: analytics.revenue.bySource.map(item => item.amount),
          backgroundColor: [
            'rgba(255, 42, 112, 0.7)',
            'rgba(0, 240, 255, 0.7)',
            'rgba(57, 255, 20, 0.7)',
            'rgba(255, 159, 28, 0.7)'
          ],
          borderColor: [
            'rgba(255, 42, 112, 1)',
            'rgba(0, 240, 255, 1)',
            'rgba(57, 255, 20, 1)',
            'rgba(255, 159, 28, 1)'
          ],
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
          <h1>Promoter Dashboard</h1>
          <div className={styles.userInfo}>
            {session.user.image && (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'User'} 
                className={styles.userAvatar}
              />
            )}
            <span className={styles.userName}>
              {session.user.name || session.user.email || 'Promoter'}
            </span>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className={styles.signOutButton}
            >
              Sign Out
            </button>
          </div>
        </header>
        
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
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
            className={`${styles.tabButton} ${activeTab === 'revenue' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            Revenue
          </button>
        </div>
        
        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Total Audience</h3>
                <div className={styles.statValue}>{analytics.audienceReach.total.toLocaleString()}</div>
                <div className={styles.statGrowth}>
                  <span className={analytics.audienceReach.growth > 0 ? styles.positive : styles.negative}>
                    {analytics.audienceReach.growth > 0 ? '+' : ''}{analytics.audienceReach.growth}%
                  </span>
                  <span className={styles.growthLabel}>vs. last year</span>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <h3>Events</h3>
                <div className={styles.statValue}>{analytics.eventPerformance.upcoming + analytics.eventPerformance.past}</div>
                <div className={styles.statDetail}>
                  <span>{analytics.eventPerformance.upcoming} upcoming</span>
                  <span className={styles.separator}>•</span>
                  <span>{analytics.eventPerformance.past} past</span>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <h3>Total Revenue</h3>
                <div className={styles.statValue}>${analytics.revenue.total.toLocaleString()}</div>
                <div className={styles.statGrowth}>
                  <span className={analytics.revenue.growth > 0 ? styles.positive : styles.negative}>
                    {analytics.revenue.growth > 0 ? '+' : ''}{analytics.revenue.growth}%
                  </span>
                  <span className={styles.growthLabel}>vs. last year</span>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <h3>Avg. Attendance</h3>
                <div className={styles.statValue}>{analytics.eventPerformance.averageAttendance}</div>
                <div className={styles.statDetail}>per event</div>
              </div>
            </div>
            
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3>Monthly Attendance</h3>
                <div className={styles.chartContainer}>
                  <Line data={attendanceChartData} options={chartOptions} />
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <h3>Monthly Revenue</h3>
                <div className={styles.chartContainer}>
                  <Bar data={revenueChartData} options={chartOptions} />
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <h3>Audience by Genre</h3>
                <div className={styles.chartContainer}>
                  <Pie data={genreChartData} options={pieChartOptions} />
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <h3>Revenue by Source</h3>
                <div className={styles.chartContainer}>
                  <Pie data={revenueSourceChartData} options={pieChartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'audience' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>Audience Analytics</h2>
              <p>Understand your audience demographics and preferences</p>
            </div>
            
            <div className={styles.audienceStats}>
              <div className={styles.statCard}>
                <h3>Total Audience</h3>
                <div className={styles.statValue}>{analytics.audienceReach.total.toLocaleString()}</div>
                <div className={styles.statGrowth}>
                  <span className={analytics.audienceReach.growth > 0 ? styles.positive : styles.negative}>
                    {analytics.audienceReach.growth > 0 ? '+' : ''}{analytics.audienceReach.growth}%
                  </span>
                  <span className={styles.growthLabel}>vs. last year</span>
                </div>
              </div>
            </div>
            
            <div className={styles.chartsGrid}>
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
                      labels: analytics.audienceReach.byAge.map(item => item.age),
                      datasets: [
                        {
                          label: 'Audience by Age',
                          data: analytics.audienceReach.byAge.map(item => item.percentage),
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
            
            <div className={styles.audienceInsights}>
              <h3>Key Audience Insights</h3>
              <ul className={styles.insightsList}>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Genre Preference</h4>
                    <p>House and Techno are your audience's top preferences, making up 60% of your audience.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Age Distribution</h4>
                    <p>75% of your audience is under 35, with the 25-34 age group being the largest segment.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Growth Opportunity</h4>
                    <p>Consider expanding your Drum & Bass events to capture the growing interest in this genre.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>Event Performance</h2>
              <p>Track attendance and performance metrics for your events</p>
            </div>
            
            <div className={styles.eventStats}>
              <div className={styles.statCard}>
                <h3>Total Events</h3>
                <div className={styles.statValue}>{analytics.eventPerformance.upcoming + analytics.eventPerformance.past}</div>
                <div className={styles.statDetail}>
                  <span>{analytics.eventPerformance.upcoming} upcoming</span>
                  <span className={styles.separator}>•</span>
                  <span>{analytics.eventPerformance.past} past</span>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <h3>Avg. Attendance</h3>
                <div className={styles.statValue}>{analytics.eventPerformance.averageAttendance}</div>
                <div className={styles.statDetail}>per event</div>
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <h3>Monthly Attendance</h3>
              <div className={styles.chartContainer}>
                <Line data={attendanceChartData} options={chartOptions} />
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
                {analytics.eventPerformance.topEvents.map((event, index) => (
                  <div key={index} className={styles.tableRow}>
                    <div className={styles.tableCell}>{event.name}</div>
                    <div className={styles.tableCell}>{event.attendance}</div>
                    <div className={styles.tableCell}>${event.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.actionButtons}>
              <Link href="/promoters/events/create">
                <a className={styles.primaryButton}>Create New Event</a>
              </Link>
              <Link href="/promoters/events">
                <a className={styles.secondaryButton}>View All Events</a>
              </Link>
            </div>
          </div>
        )}
        
        {activeTab === 'revenue' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>Revenue Analytics</h2>
              <p>Track your financial performance and revenue streams</p>
            </div>
            
            <div className={styles.revenueStats}>
              <div className={styles.statCard}>
                <h3>Total Revenue</h3>
                <div className={styles.statValue}>${analytics.revenue.total.toLocaleString()}</div>
                <div className={styles.statGrowth}>
                  <span className={analytics.revenue.growth > 0 ? styles.positive : styles.negative}>
                    {analytics.revenue.growth > 0 ? '+' : ''}{analytics.revenue.growth}%
                  </span>
                  <span className={styles.growthLabel}>vs. last year</span>
                </div>
              </div>
            </div>
            
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3>Monthly Revenue</h3>
                <div className={styles.chartContainer}>
                  <Bar data={revenueChartData} options={chartOptions} />
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <h3>Revenue by Source</h3>
                <div className={styles.chartContainer}>
                  <Pie data={revenueSourceChartData} options={pieChartOptions} />
                </div>
              </div>
            </div>
            
            <div className={styles.revenueSourcesSection}>
              <h3>Revenue Sources</h3>
              <div className={styles.revenueSourcesTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCell}>Source</div>
                  <div className={styles.tableCell}>Amount</div>
                  <div className={styles.tableCell}>Percentage</div>
                </div>
                {analytics.revenue.bySource.map((source, index) => (
                  <div key={index} className={styles.tableRow}>
                    <div className={styles.tableCell}>{source.source}</div>
                    <div className={styles.tableCell}>${source.amount.toLocaleString()}</div>
                    <div className={styles.tableCell}>
                      {Math.round((source.amount / analytics.revenue.total) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.revenueInsights}>
              <h3>Revenue Insights</h3>
              <ul className={styles.insightsList}>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Peak Season</h4>
                    <p>Your highest revenue months are June and July, with over $70,000 combined.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>VIP Potential</h4>
                    <p>VIP packages account for 17% of revenue. Consider expanding these offerings.</p>
                  </div>
                </li>
                <li className={styles.insightItem}>
                  <div className={styles.insightIcon}>💡</div>
                  <div className={styles.insightContent}>
                    <h4>Sponsorship Growth</h4>
                    <p>Sponsorships are your smallest revenue stream. There's potential to grow this area.</p>
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
      <p>Loading your dashboard...</p>
    </div>
  );
}
