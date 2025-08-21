import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import styles from '@/styles/Settings.module.css';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    location: '',
    locationRadius: 25,
    notifyEvents: true,
    notifyMatches: true,
    notifyUpdates: false,
    theme: 'dark',
    maxPrice: 100,
    preferredGenres: [],
    preferredVenues: []
  });
  
  const [availableGenres, setAvailableGenres] = useState([
    'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 
    'Melodic House', 'Deep House', 'Progressive House', 'Tech House'
  ]);
  
  const [venueTypes, setVenueTypes] = useState([
    'Club', 'Warehouse', 'Festival', 'Rooftop', 'Open Air', 'Venue'
  ]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  
  // Load user data
  useEffect(() => {
    if (session?.user) {
      // Initialize form with user data
      setFormData(prev => ({
        ...prev,
        displayName: session.user.name || '',
        email: session.user.email || ''
      }));
      
      // Fetch user preferences
      fetchUserPreferences();
    }
  }, [session]);
  
  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleGenreToggle = (genre) => {
    setFormData(prev => {
      const current = [...prev.preferredGenres];
      
      if (current.includes(genre)) {
        return {
          ...prev,
          preferredGenres: current.filter(g => g !== genre)
        };
      } else {
        return {
          ...prev,
          preferredGenres: [...current, genre]
        };
      }
    });
  };
  
  const handleVenueToggle = (venue) => {
    setFormData(prev => {
      const current = [...prev.preferredVenues];
      
      if (current.includes(venue)) {
        return {
          ...prev,
          preferredVenues: current.filter(v => v !== venue)
        };
      } else {
        return {
          ...prev,
          preferredVenues: [...current, venue]
        };
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch('/api/user/update-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Your preferences have been updated successfully.' 
        });
      } else {
        const error = await response.json();
        setMessage({ 
          type: 'error', 
          text: error.message || 'Failed to update preferences.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      });
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your settings...</p>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Settings | TIKO</title>
        <meta name="description" content="Manage your TIKO account settings" />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <Link href="/users/dashboard" className={styles.backLink}>
            Back to Dashboard
          </Link>
        </div>
        
        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Profile Settings</h2>
            
            <div className={styles.profileHeader}>
              {session?.user?.image ? (
                <Image 
                  src={session.user.image} 
                  alt="Profile" 
                  width={80} 
                  height={80} 
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileImagePlaceholder}>
                  {formData.displayName.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <p className={styles.spotifyConnected}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM11.7 11.5C11.6 11.7 11.3 11.8 11.1 11.7C9.2 10.5 6.8 10.3 4 10.9C3.8 11 3.6 10.8 3.5 10.6C3.4 10.4 3.6 10.2 3.8 10.1C6.8 9.4 9.5 9.7 11.6 11C11.8 11.1 11.8 11.4 11.7 11.5ZM12.7 9.3C12.5 9.5 12.2 9.6 12 9.4C9.8 8 6.6 7.6 4 8.4C3.7 8.5 3.4 8.3 3.3 8C3.2 7.7 3.4 7.4 3.7 7.3C6.7 6.5 10.2 6.8 12.7 8.5C12.9 8.6 13 9 12.7 9.3ZM12.8 7C10.2 5.5 5.9 5.3 3.5 6.1C3.2 6.2 2.8 6 2.7 5.7C2.6 5.4 2.8 5 3.1 4.9C5.9 4 10.6 4.2 13.6 6C13.9 6.2 14 6.6 13.8 6.9C13.6 7.1 13.2 7.2 12.8 7Z" fill="#1DB954"/>
                  </svg>
                  Connected to Spotify
                </p>
                <p className={styles.note}>
                  Profile picture is linked to your Spotify account
                </p>
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Your display name"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled
              />
              <p className={styles.note}>
                Email is managed through your Spotify account
              </p>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="locationRadius">
                Distance Radius: {formData.locationRadius} miles
              </label>
              <input
                type="range"
                id="locationRadius"
                name="locationRadius"
                min="5"
                max="100"
                value={formData.locationRadius}
                onChange={handleChange}
                className={styles.rangeInput}
              />
              <div className={styles.rangeLabels}>
                <span>5mi</span>
                <span>50mi</span>
                <span>100mi</span>
              </div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Event Preferences</h2>
            
            <div className={styles.inputGroup}>
              <label htmlFor="maxPrice">
                Maximum Ticket Price: ${formData.maxPrice}
              </label>
              <input
                type="range"
                id="maxPrice"
                name="maxPrice"
                min="0"
                max="300"
                step="10"
                value={formData.maxPrice}
                onChange={handleChange}
                className={styles.rangeInput}
              />
              <div className={styles.rangeLabels}>
                <span>$0</span>
                <span>$150</span>
                <span>$300+</span>
              </div>
            </div>
            
            <div className={styles.genreSection}>
              <label>Preferred Genres</label>
              <div className={styles.tagContainer}>
                {availableGenres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    className={`${styles.tagButton} ${
                      formData.preferredGenres.includes(genre) ? styles.tagSelected : ''
                    }`}
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.venueSection}>
              <label>Preferred Venue Types</label>
              <div className={styles.tagContainer}>
                {venueTypes.map(venue => (
                  <button
                    key={venue}
                    type="button"
                    className={`${styles.tagButton} ${
                      formData.preferredVenues.includes(venue) ? styles.tagSelected : ''
                    }`}
                    onClick={() => handleVenueToggle(venue)}
                  >
                    {venue}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="notifyEvents"
                name="notifyEvents"
                checked={formData.notifyEvents}
                onChange={handleChange}
              />
              <label htmlFor="notifyEvents">
                Event Recommendations
                <span className={styles.checkboxDescription}>
                  Get notified when we find events that match your taste
                </span>
              </label>
            </div>
            
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="notifyMatches"
                name="notifyMatches"
                checked={formData.notifyMatches}
                onChange={handleChange}
              />
              <label htmlFor="notifyMatches">
                High Match Events
                <span className={styles.checkboxDescription}>
                  Get notified for events with 90%+ match to your taste
                </span>
              </label>
            </div>
            
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="notifyUpdates"
                name="notifyUpdates"
                checked={formData.notifyUpdates}
                onChange={handleChange}
              />
              <label htmlFor="notifyUpdates">
                TIKO Updates
                <span className={styles.checkboxDescription}>
                  Get notified about new features and updates
                </span>
              </label>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            
            <div className={styles.themeSection}>
              <label>Theme</label>
              <div className={styles.themeOptions}>
                <label className={`${styles.themeOption} ${formData.theme === 'dark' ? styles.themeSelected : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={formData.theme === 'dark'}
                    onChange={handleChange}
                  />
                  <div className={styles.themeSwatch} style={{background: '#121212'}}></div>
                  <span>Dark</span>
                </label>
                
                <label className={`${styles.themeOption} ${formData.theme === 'hypnotic' ? styles.themeSelected : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="hypnotic"
                    checked={formData.theme === 'hypnotic'}
                    onChange={handleChange}
                  />
                  <div className={styles.themeSwatch} style={{background: 'linear-gradient(135deg, #121212, #330066)'}}></div>
                  <span>Hypnotic</span>
                </label>
                
                <label className={`${styles.themeOption} ${formData.theme === 'neon' ? styles.themeSelected : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="neon"
                    checked={formData.theme === 'neon'}
                    onChange={handleChange}
                  />
                  <div className={styles.themeSwatch} style={{background: 'linear-gradient(135deg, #121212, #ff00ff)'}}></div>
                  <span>Neon</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
        
        <div className={styles.dangerZone}>
          <h2 className={styles.dangerTitle}>Account Management</h2>
          <p className={styles.dangerText}>
            Need to take a break? You can disconnect your Spotify account, which will remove your data from TIKO.
          </p>
          <button type="button" className={styles.disconnectButton}>
            Disconnect Spotify Account
          </button>
        </div>
      </div>
    </>
  );
}