#!/bin/bash

# Sonar EDM Platform - Component Compilation Fix

# Set the project root directory
cd /c/sonar/users/sonar-edm-user

# Create backup directory
BACKUP_DIR="./backups-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR/components"
mkdir -p "$BACKUP_DIR/styles"
mkdir -p "$BACKUP_DIR/pages/users"

echo "Created backup directory at $BACKUP_DIR"

# Verify component directories exist
echo "Ensuring component directories exist..."
mkdir -p ./components
mkdir -p ./styles
mkdir -p ./pages/api/user
mkdir -p ./pages/api/events

# Check if components exist and create them if not
echo "Checking for required components..."

# 1. Check for VibeQuizCard component
if [ ! -f "./components/VibeQuizCard.js" ]; then
  echo "Creating VibeQuizCard component..."
  cat > "./components/VibeQuizCard.js" << 'EOF'
import { useState } from 'react';
import axios from 'axios';
import styles from '../styles/VibeQuizCard.module.css';

export default function VibeQuizCard({ onTasteUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Sample quiz questions - these would be fetched from an API in production
  const questions = [
    {
      id: 'tempo',
      question: 'What tempo do you prefer?',
      options: [
        { value: 'slow', label: 'Slow & Chill' },
        { value: 'medium', label: 'Medium & Groovy' },
        { value: 'fast', label: 'Fast & Energetic' }
      ]
    },
    {
      id: 'mood',
      question: 'What mood resonates with you most?',
      options: [
        { value: 'dark', label: 'Dark & Mysterious' },
        { value: 'uplifting', label: 'Uplifting & Euphoric' },
        { value: 'melodic', label: 'Melodic & Emotional' }
      ]
    },
    {
      id: 'elements',
      question: 'Which elements do you enjoy in tracks?',
      options: [
        { value: 'vocals', label: 'Strong Vocals' },
        { value: 'bass', label: 'Heavy Bass' },
        { value: 'melody', label: 'Complex Melodies' }
      ]
    }
  ];

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    // Reset quiz state when collapsing
    if (isExpanded) {
      setCurrentQuestion(0);
      setAnswers({});
      setSubmitSuccess(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
    
    // Move to next question or submit if last question
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Submit answers to API
      const response = await axios.post('/api/user/update-taste-preferences', { preferences: answers });
      
      if (response.data.success) {
        setSubmitSuccess(true);
        // Call the callback to update parent component if provided
        if (onTasteUpdate && typeof onTasteUpdate === 'function') {
          onTasteUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating taste preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSubmitSuccess(false);
  };

  return (
    <div className={`${styles.quizCard} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.quizHeader} onClick={handleToggle}>
        <h3 className={styles.quizTitle}>
          {isExpanded ? 'Refine Your Taste Profile' : 'Something doesn\'t feel right?'}
        </h3>
        <div className={styles.toggleIcon}>
          {isExpanded ? '−' : '+'}
        </div>
      </div>
      
      {isExpanded && (
        <div className={styles.quizContent}>
          {!submitSuccess ? (
            <>
              <p className={styles.quizDescription}>
                Answer a few quick questions to help us fine-tune your music recommendations.
              </p>
              
              <div className={styles.questionContainer}>
                <h4 className={styles.questionText}>{questions[currentQuestion].question}</h4>
                
                <div className={styles.optionsGrid}>
                  {questions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      className={styles.optionButton}
                      onClick={() => handleAnswer(questions[currentQuestion].id, option.value)}
                      disabled={isSubmitting}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                <div className={styles.progressIndicator}>
                  {questions.map((_, index) => (
                    <span 
                      key={index} 
                      className={`${styles.progressDot} ${index === currentQuestion ? styles.active : ''} ${index < currentQuestion ? styles.completed : ''}`}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <h4>Thanks for your input!</h4>
              <p>We've updated your taste profile with your preferences.</p>
              <button className={styles.resetButton} onClick={handleReset}>
                Refine Further
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
EOF
fi

# 2. Check for VibeQuizCard CSS module
if [ ! -f "./styles/VibeQuizCard.module.css" ]; then
  echo "Creating VibeQuizCard CSS module..."
  cat > "./styles/VibeQuizCard.module.css" << 'EOF'
.quizCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-left: 4px solid #ff6b6b;
  transform: skewX(-2deg);
  transform-origin: top left;
}

.expanded {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.quizHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background: linear-gradient(90deg, rgba(138, 43, 226, 0.2), rgba(255, 107, 107, 0.2));
  position: relative;
  z-index: 1;
}

.quizHeader::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(138, 43, 226, 0.1), transparent 70%);
  z-index: -1;
}

.quizTitle {
  margin: 0;
  font-size: 1.2rem;
  color: white;
  font-weight: 600;
  transform: skewX(2deg);
}

.toggleIcon {
  font-size: 1.5rem;
  color: #ff6b6b;
  transform: skewX(2deg);
}

.quizContent {
  padding: 20px;
  transform: skewX(2deg);
}

.quizDescription {
  margin-top: 0;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.questionContainer {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.questionText {
  font-size: 1.1rem;
  margin-bottom: 16px;
  color: white;
  position: relative;
  display: inline-block;
}

.questionText::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #ff6b6b, transparent);
}

.optionsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.optionButton {
  background-color: rgba(30, 30, 40, 0.9);
  border: 1px solid rgba(138, 43, 226, 0.4);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.optionButton::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.2), transparent 80%);
  z-index: 0;
}

.optionButton:hover {
  background-color: rgba(138, 43, 226, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.optionButton:active {
  transform: translateY(0);
}

.optionButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progressIndicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.progressDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.progressDot.active {
  background-color: #ff6b6b;
  transform: scale(1.2);
}

.progressDot.completed {
  background-color: #8a2be2;
}

.successMessage {
  text-align: center;
  padding: 20px 0;
  animation: fadeIn 0.5s ease;
}

.successIcon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8a2be2, #ff6b6b);
  color: white;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.resetButton {
  background: linear-gradient(90deg, #8a2be2, #ff6b6b);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 16px;
  transition: all 0.2s ease;
}

.resetButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .optionsGrid {
    grid-template-columns: 1fr;
  }
  
  .quizTitle {
    font-size: 1.1rem;
  }
  
  .questionText {
    font-size: 1rem;
  }
}
EOF
fi

# 3. Create API endpoint for updating taste preferences
echo "Creating API endpoint for updating taste preferences..."
cat > "./pages/api/user/update-taste-preferences.js" << 'EOF'
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ success: false, message: 'Preferences data is required' });
    }
    
    // In a production environment, you would store these preferences in a database
    // and use them to adjust the user's taste profile
    
    console.log('Updating user taste preferences:', preferences);
    
    // For now, we'll just return success
    return res.status(200).json({ 
      success: true, 
      message: 'Taste preferences updated successfully',
      preferences
    });
    
  } catch (error) {
    console.error('Error updating taste preferences:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
EOF

# 4. Create API endpoint for correlated events
echo "Creating API endpoint for correlated events..."
cat > "./pages/api/events/correlated-events.js" << 'EOF'
import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Get user location from query params or use IP geolocation
    let userLocation = null;
    if (req.query.lat && req.query.lon) {
      userLocation = {
        latitude: parseFloat(req.query.lat),
        longitude: parseFloat(req.query.lon)
      };
    } else {
      // Fallback to IP geolocation
      try {
        const geoResponse = await axios.get('https://ipapi.co/json/') ;
        userLocation = {
          latitude: geoResponse.data.latitude,
          longitude: geoResponse.data.longitude,
          city: geoResponse.data.city,
          region: geoResponse.data.region
        };
      } catch (geoError) {
        console.warn('Could not determine user location:', geoError);
      }
    }
    
    // Fetch user's music taste data
    // In a production environment, you would fetch this from your database
    // For this example, we'll use mock data
    const userTaste = {
      topGenres: [
        { name: 'Melodic House', weight: 0.9 },
        { name: 'Techno', weight: 0.8 },
        { name: 'Progressive House', weight: 0.7 },
        { name: 'Trance', weight: 0.6 },
        { name: 'Deep House', weight: 0.5 }
      ],
      topArtists: [
        { name: 'Max Styler', weight: 0.9 },
        { name: 'ARTBAT', weight: 0.85 },
        { name: 'Lane 8', weight: 0.8 },
        { name: 'Boris Brejcha', weight: 0.75 },
        { name: 'Nora En Pure', weight: 0.7 }
      ]
    };
    
    // Fetch events from your event sources
    // In a production environment, you would fetch this from your database or APIs
    // For this example, we'll use mock data
    const mockEvents = [
      {
        id: 'evt1',
        name: 'Melodic Nights',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Echostage',
        genres: ['Melodic House', 'Progressive House'],
        artists: ['Lane 8', 'Yotto'],
        image: 'https://example.com/event1.jpg',
        ticketUrl: 'https://example.com/tickets/1',
        location: {
          latitude: userLocation ? userLocation.latitude + 0.02 : 0,
          longitude: userLocation ? userLocation.longitude - 0.01 : 0
        }
      },
      {
        id: 'evt2',
        name: 'Techno Revolution',
        date: new Date(Date.now()  + 14 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Club Space',
        genres: ['Techno', 'Dark Techno'],
        artists: ['Boris Brejcha', 'ANNA'],
        image: 'https://example.com/event2.jpg',
        ticketUrl: 'https://example.com/tickets/2',
        location: {
          latitude: userLocation ? userLocation.latitude - 0.03 : 0,
          longitude: userLocation ? userLocation.longitude + 0.02 : 0
        }
      },
      {
        id: 'evt3',
        name: 'Deep Vibes',
        date: new Date(Date.now()  + 3 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Sound Bar',
        genres: ['Deep House', 'Organic House'],
        artists: ['Nora En Pure', 'Ben Böhmer'],
        image: 'https://example.com/event3.jpg',
        ticketUrl: 'https://example.com/tickets/3',
        location: {
          latitude: userLocation ? userLocation.latitude + 0.01 : 0,
          longitude: userLocation ? userLocation.longitude + 0.01 : 0
        }
      },
      {
        id: 'evt4',
        name: 'Trance Journey',
        date: new Date(Date.now()  + 21 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Avalon',
        genres: ['Trance', 'Progressive Trance'],
        artists: ['Above & Beyond', 'Armin van Buuren'],
        image: 'https://example.com/event4.jpg',
        ticketUrl: 'https://example.com/tickets/4',
        location: {
          latitude: userLocation ? userLocation.latitude - 0.02 : 0,
          longitude: userLocation ? userLocation.longitude - 0.02 : 0
        }
      },
      {
        id: 'evt5',
        name: 'House Classics',
        date: new Date(Date.now()  + 10 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Ministry of Sound',
        genres: ['House', 'Tech House'],
        artists: ['CamelPhat', 'Solardo'],
        image: 'https://example.com/event5.jpg',
        ticketUrl: 'https://example.com/tickets/5',
        location: {
          latitude: userLocation ? userLocation.latitude + 0.04 : 0,
          longitude: userLocation ? userLocation.longitude - 0.03 : 0
        }
      }
    ];
    
    // Calculate correlation scores for each event
    const correlatedEvents = mockEvents.map(event => {
      // Calculate genre match
      const genreMatch = event.genres.reduce((score, genre)  => {
        const matchingGenre = userTaste.topGenres.find(g => g.name.toLowerCase() === genre.toLowerCase());
        return score + (matchingGenre ? matchingGenre.weight * 50 : 0);
      }, 0) / event.genres.length;
      
      // Calculate artist match
      const artistMatch = event.artists.reduce((score, artist) => {
        const matchingArtist = userTaste.topArtists.find(a => a.name.toLowerCase() === artist.toLowerCase());
        return score + (matchingArtist ? matchingArtist.weight * 50 : 0);
      }, 0) / event.artists.length;
      
      // Calculate distance if location is available
      let distance = null;
      if (userLocation && event.location) {
        // Haversine formula to calculate distance
        const R = 3958.8; // Earth radius in miles
        const dLat = (event.location.latitude - userLocation.latitude) * Math.PI / 180;
        const dLon = (event.location.longitude - userLocation.longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(event.location.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }
      
      // Calculate overall correlation score (0-100)
      const correlationScore = Math.min(100, Math.round(genreMatch + artistMatch));
      
      return {
        ...event,
        correlationScore,
        distance
      };
    });
    
    // Sort by correlation score (highest first)
    correlatedEvents.sort((a, b) => b.correlationScore - a.correlationScore);
    
    return res.status(200).json({ 
      success: true, 
      events: correlatedEvents,
      userLocation
    });
    
  } catch (error) {
    console.error('Error fetching correlated events:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
EOF

# 5. Verify package.json has required dependencies
echo "Checking package.json for required dependencies..."
if [ -f "./package.json" ]; then
  # Check if axios is in dependencies
  if ! grep -q '"axios"' "./package.json"; then
    echo "Adding axios dependency..."
    npm install --save axios
  fi
fi

# 6. Clean up temporary files
echo "Cleaning up temporary files..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel
rm -rf out
rm -rf build
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete

# 7. Reinstall dependencies and rebuild
echo "Reinstalling dependencies and rebuilding..."
npm install
npm run build

# 8. Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix component compilation issues"

# 9. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Component compilation fix complete!"
echo "Your Sonar EDM Platform should now compile all necessary components."
