#!/bin/bash

# Sonar EDM Platform Flow Optimization Implementation Script
# This script implements the flow optimization components and changes
# while preserving existing functionality

# Set the project root directory
PROJECT_ROOT="/c/sonar/users/sonar-edm-user"

# Create backup directory
BACKUP_DIR="$PROJECT_ROOT/backups-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR/components"
mkdir -p "$BACKUP_DIR/styles"
mkdir -p "$BACKUP_DIR/pages/users"
mkdir -p "$BACKUP_DIR/pages/api/user"
mkdir -p "$BACKUP_DIR/pages/api/events"

echo "Created backup directory at $BACKUP_DIR"

# Backup existing files that will be modified
echo "Backing up existing files..."
cp "$PROJECT_ROOT/components/Navigation.js" "$BACKUP_DIR/components/"
cp "$PROJECT_ROOT/components/EventCard.js" "$BACKUP_DIR/components/"
cp "$PROJECT_ROOT/styles/Navigation.module.css" "$BACKUP_DIR/styles/"
cp "$PROJECT_ROOT/styles/EventCard.module.css" "$BACKUP_DIR/styles/"
cp "$PROJECT_ROOT/styles/MusicTaste.module.css" "$BACKUP_DIR/styles/"
cp "$PROJECT_ROOT/pages/users/music-taste.js" "$BACKUP_DIR/pages/users/"

# Create VibeQuizCard component
echo "Creating VibeQuizCard component..."
cat > "$PROJECT_ROOT/components/VibeQuizCard.js" << 'EOF'
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

# Create VibeQuizCard CSS module
echo "Creating VibeQuizCard CSS module..."
cat > "$PROJECT_ROOT/styles/VibeQuizCard.module.css" << 'EOF'
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

# Create EventCorrelationIndicator component
echo "Creating EventCorrelationIndicator component..."
cat > "$PROJECT_ROOT/components/EventCorrelationIndicator.js" << 'EOF'
import React from 'react';
import styles from '../styles/EventCorrelationIndicator.module.css';

export default function EventCorrelationIndicator({ correlationScore }) {
  // Determine correlation level based on score
  let correlationLevel = 'low';
  if (correlationScore >= 80) {
    correlationLevel = 'high';
  } else if (correlationScore >= 50) {
    correlationLevel = 'medium';
  }

  // Get appropriate label based on correlation level
  const getCorrelationLabel = () => {
    switch (correlationLevel) {
      case 'high':
        return 'Strong Match';
      case 'medium':
        return 'Good Match';
      case 'low':
        return 'Moderate Match';
      default:
        return 'Moderate Match';
    }
  };

  return (
    <div className={`${styles.correlationIndicator} ${styles[correlationLevel]}`}>
      <div className={styles.correlationBadge}>
        <span className={styles.correlationScore}>{correlationScore}%</span>
      </div>
      <div className={styles.correlationLabel}>
        {getCorrelationLabel()}
      </div>
      <div className={styles.correlationBars}>
        <div className={`${styles.correlationBar} ${styles.bar1}`}></div>
        <div className={`${styles.correlationBar} ${styles.bar2} ${correlationLevel === 'low' ? styles.inactive : ''}`}></div>
        <div className={`${styles.correlationBar} ${styles.bar3} ${correlationLevel === 'high' ? styles.active : styles.inactive}`}></div>
      </div>
    </div>
  );
}
EOF

# Create EventCorrelationIndicator CSS module
echo "Creating EventCorrelationIndicator CSS module..."
cat > "$PROJECT_ROOT/styles/EventCorrelationIndicator.module.css" << 'EOF'
.correlationIndicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.correlationBadge {
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.9));
  border-radius: 12px;
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  position: relative;
  transform: skewX(-5deg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.correlationScore {
  font-weight: bold;
  font-size: 0.9rem;
}

.correlationLabel {
  font-size: 0.8rem;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.correlationBars {
  display: flex;
  gap: 3px;
  height: 4px;
  width: 100%;
  max-width: 60px;
}

.correlationBar {
  height: 100%;
  flex: 1;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.bar1 {
  animation: pulse 2s infinite alternate;
}

.bar2 {
  animation: pulse 2s infinite alternate 0.5s;
}

.bar3 {
  animation: pulse 2s infinite alternate 1s;
}

.inactive {
  opacity: 0.3;
  animation: none;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* High correlation styling */
.high .correlationBadge {
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.9), rgba(255, 107, 107, 0.9));
}

.high .correlationScore {
  color: white;
}

.high .correlationLabel {
  color: #ff6b6b;
}

.high .correlationBar {
  background-color: #ff6b6b;
}

/* Medium correlation styling */
.medium .correlationBadge {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.9), rgba(255, 107, 107, 0.7));
}

.medium .correlationScore {
  color: white;
}

.medium .correlationLabel {
  color: #ffc107;
}

.medium .correlationBar {
  background-color: #ffc107;
}

/* Low correlation styling */
.low .correlationBadge {
  background: linear-gradient(135deg, rgba(100, 100, 150, 0.9), rgba(70, 70, 100, 0.7));
}

.low .correlationScore {
  color: rgba(255, 255, 255, 0.9);
}

.low .correlationLabel {
  color: rgba(255, 255, 255, 0.7);
}

.low .correlationBar {
  background-color: rgba(100, 100, 150, 0.7);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .correlationBadge {
    padding: 3px 8px;
  }
  
  .correlationScore {
    font-size: 0.8rem;
  }
  
  .correlationLabel {
    font-size: 0.7rem;
  }
}
EOF

# Create EventsNavigationCard component
echo "Creating EventsNavigationCard component..."
cat > "$PROJECT_ROOT/components/EventsNavigationCard.js" << 'EOF'
import React from 'react';
import Link from 'next/link';
import styles from '../styles/EventsNavigationCard.module.css';

export default function EventsNavigationCard({ correlatedEvents = [], userTaste = {} }) {
  // Get top genres from user taste if available
  const topGenres = userTaste.topGenres ? userTaste.topGenres.slice(0, 3).map(g => g.name) : [];
  
  // Count events by correlation level
  const strongMatches = correlatedEvents.filter(event => event.correlationScore >= 80).length;
  const goodMatches = correlatedEvents.filter(event => event.correlationScore >= 50 && event.correlationScore < 80).length;
  
  return (
    <div className={styles.navigationCard}>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>Discover Events Based on Your Taste</h3>
        
        <div className={styles.matchSummary}>
          {correlatedEvents.length > 0 ? (
            <>
              <div className={styles.matchCount}>
                <span className={styles.countNumber}>{strongMatches}</span>
                <span className={styles.countLabel}>Strong Matches</span>
              </div>
              <div className={styles.matchCount}>
                <span className={styles.countNumber}>{goodMatches}</span>
                <span className={styles.countLabel}>Good Matches</span>
              </div>
              <div className={styles.matchCount}>
                <span className={styles.countNumber}>{correlatedEvents.length - strongMatches - goodMatches}</span>
                <span className={styles.countLabel}>Other Events</span>
              </div>
            </>
          ) : (
            <p className={styles.noEventsMessage}>
              We're finding events that match your taste profile
            </p>
          )}
        </div>
        
        {topGenres.length > 0 && (
          <div className={styles.genreTags}>
            <span className={styles.tagsLabel}>Based on your top genres:</span>
            <div className={styles.tags}>
              {topGenres.map((genre, index) => (
                <span key={index} className={styles.genreTag}>{genre}</span>
              ))}
            </div>
          </div>
        )}
        
        <div className={styles.actionButtons}>
          <Link href="/users/events">
            <a className={styles.primaryButton}>
              <span className={styles.buttonIcon}>🎭</span>
              Explore All Events
            </a>
          </Link>
          
          <Link href="/users/events?filter=nearby">
            <a className={styles.secondaryButton}>
              <span className={styles.buttonIcon}>📍</span>
              Nearby Events
            </a>
          </Link>
        </div>
        
        <div className={styles.decorativeLine}></div>
      </div>
    </div>
  );
}
EOF

# Create EventsNavigationCard CSS module
echo "Creating EventsNavigationCard CSS module..."
cat > "$PROJECT_ROOT/styles/EventsNavigationCard.module.css" << 'EOF'
.navigationCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  margin-top: 20px;
  margin-bottom: 40px;
  position: relative;
  transform: skewX(-2deg);
  transform-origin: top left;
  border-left: 4px solid #8a2be2;
}

.navigationCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), transparent 70%);
  z-index: 0;
}

.cardContent {
  padding: 24px;
  position: relative;
  z-index: 1;
  transform: skewX(2deg);
}

.cardTitle {
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 20px;
  color: #ff6b6b;
  position: relative;
  display: inline-block;
}

.cardTitle::after {
  content: '★';
  position: absolute;
  right: -24px;
  top: 0;
  color: #8a2be2;
}

.matchSummary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
  padding: 16px;
  background-color: rgba(20, 20, 30, 0.5);
  border-radius: 8px;
}

.matchCount {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.countNumber {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 4px;
  background: linear-gradient(90deg, #ff6b6b, #8a2be2);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.countLabel {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.noEventsMessage {
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-style: italic;
  margin: 0;
  padding: 10px 0;
}

.genreTags {
  margin-bottom: 24px;
}

.tagsLabel {
  display: block;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genreTag {
  background: rgba(138, 43, 226, 0.2);
  border: 1px solid rgba(138, 43, 226, 0.4);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.actionButtons {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.primaryButton, .secondaryButton {
  padding: 12px 20px;
  border-radius: 24px;
  font-size: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.primaryButton {
  background: linear-gradient(90deg, #8a2be2, #ff6b6b);
  color: white;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.primaryButton::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s ease;
}

.primaryButton:hover::before {
  left: 100%;
}

.secondaryButton {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.primaryButton:hover, .secondaryButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.buttonIcon {
  margin-right: 8px;
  font-size: 1.1rem;
}

.decorativeLine {
  height: 3px;
  background: linear-gradient(90deg, #8a2be2, transparent);
  width: 100px;
  margin: 0 auto;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .cardTitle {
    font-size: 1.3rem;
  }
  
  .countNumber {
    font-size: 1.6rem;
  }
  
  .actionButtons {
    flex-direction: column;
  }
  
  .primaryButton, .secondaryButton {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .cardContent {
    padding: 16px;
  }
  
  .matchSummary {
    flex-direction: column;
    gap: 16px;
  }
  
  .cardTitle {
    font-size: 1.2rem;
  }
  
  .cardTitle::after {
    right: -20px;
  }
}
EOF

# Update EventCard component
echo "Updating EventCard component..."
cat > "$PROJECT_ROOT/components/EventCard.js" << 'EOF'
import React from 'react';
import Link from 'next/link';
import styles from '../styles/EventCard.module.css';
import EventCorrelationIndicator from './EventCorrelationIndicator';

export default function EventCard({ event }) {
  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  // Format time
  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', options);
  };

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventImageContainer}>
        {event.image ? (
          <img 
            src={event.image} 
            alt={event.name} 
            className={styles.eventImage} 
          />
        ) : (
          <div className={styles.placeholderImage}>
            <span>EDM</span>
          </div>
        )}
        <div className={styles.eventDate}>
          <span className={styles.dateText}>{formatDate(event.date)}</span>
        </div>
      </div>
      
      <div className={styles.eventContent}>
        {/* Correlation indicator */}
        {event.correlationScore && (
          <EventCorrelationIndicator correlationScore={event.correlationScore} />
        )}
        
        <h3 className={styles.eventName}>{event.name}</h3>
        
        <div className={styles.eventDetails}>
          <div className={styles.eventDetail}>
            <span className={styles.detailIcon}>🕒</span>
            <span className={styles.detailText}>{formatTime(event.date)}</span>
          </div>
          
          <div className={styles.eventDetail}>
            <span className={styles.detailIcon}>📍</span>
            <span className={styles.detailText}>{event.venue}</span>
          </div>
          
          {event.distance && (
            <div className={styles.eventDetail}>
              <span className={styles.detailIcon}>📏</span>
              <span className={styles.detailText}>{Math.round(event.distance)} miles away</span>
            </div>
          )}
        </div>
        
        <div className={styles.eventGenres}>
          {event.genres && event.genres.map((genre, index) => (
            <span key={index} className={styles.genreTag}>{genre}</span>
          ))}
        </div>
        
        <div className={styles.eventActions}>
          {event.ticketUrl && (
            <a 
              href={event.ticketUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.ticketButton}
            >
              Get Tickets
            </a>
          )}
          
          <Link href={`/events/${event.id}`}>
            <a className={styles.detailsButton}>More Info</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
EOF

# Update EventCard CSS module
echo "Updating EventCard CSS module..."
cat > "$PROJECT_ROOT/styles/EventCard.module.css" << 'EOF'
.eventCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  transform: skewX(-2deg);
  transform-origin: top left;
}

.eventCard:hover {
  transform: skewX(-2deg) translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.eventImageContainer {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.eventImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.eventCard:hover .eventImage {
  transform: scale(1.05);
}

.placeholderImage {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #8a2be2, #ff6b6b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.eventDate {
  position: absolute;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, rgba(138, 43, 226, 0.9), rgba(255, 107, 107, 0.7));
  padding: 6px 12px;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  transform: skewX(4deg);
  transform-origin: bottom left;
}

.eventContent {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  transform: skewX(2deg);
}

.eventName {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  color: white;
  line-height: 1.3;
  position: relative;
  display: inline-block;
}

.eventName::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #ff6b6b, transparent);
}

.eventDetails {
  margin-bottom: 12px;
}

.eventDetail {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.detailIcon {
  margin-right: 8px;
  font-size: 1rem;
}

.eventGenres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.genreTag {
  background: rgba(138, 43, 226, 0.2);
  border: 1px solid rgba(138, 43, 226, 0.4);
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
}

.eventActions {
  margin-top: auto;
  display: flex;
  gap: 10px;
}

.ticketButton, .detailsButton {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
}

.ticketButton {
  background: linear-gradient(90deg, #8a2be2, #ff6b6b);
  color: white;
  flex: 1.5;
}

.detailsButton {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex: 1;
}

.ticketButton:hover, .detailsButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .eventImageContainer {
    height: 140px;
  }
  
  .eventName {
    font-size: 1.1rem;
  }
  
  .eventDetail {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .eventActions {
    flex-direction: column;
  }
  
  .ticketButton, .detailsButton {
    width: 100%;
  }
}
EOF

# Update Navigation component
echo "Updating Navigation component..."
cat > "$PROJECT_ROOT/components/Navigation.js" << 'EOF'
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import styles from '../styles/Navigation.module.css';

export default function Navigation({ activePage }) {
  const router = useRouter();
  
  // Handle sign out
  const handleSignOut = async (e) => {
    e.preventDefault();
    await signOut({ redirect: false });
    router.push('/');
  };
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link href="/users/music-taste">
            <a className={styles.logo}>
              <span className={styles.logoText}>Sonar</span>
              <span className={styles.logoAccent}>EDM</span>
            </a>
          </Link>
        </div>
        
        <div className={styles.navLinks}>
          <Link href="/users/music-taste">
            <a className={`${styles.navLink} ${activePage === 'music-taste' ? styles.active : ''}`}>
              <span className={styles.navIcon}>🎵</span>
              <span className={styles.navText}>Music Taste</span>
            </a>
          </Link>
          
          <Link href="/users/events">
            <a className={`${styles.navLink} ${activePage === 'events' ? styles.active : ''}`}>
              <span className={styles.navIcon}>🎭</span>
              <span className={styles.navText}>Events</span>
            </a>
          </Link>
          
          <a href="#" onClick={handleSignOut} className={styles.navLink}>
            <span className={styles.navIcon}>🚪</span>
            <span className={styles.navText}>Sign Out</span>
          </a>
        </div>
        
        <div className={styles.userMenu}>
          <div className={styles.userAvatar}>
            <span>S</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
EOF

# Update Navigation CSS module
echo "Updating Navigation CSS module..."
cat > "$PROJECT_ROOT/styles/Navigation.module.css" << 'EOF'
.navigation {
  background-color: rgba(20, 20, 30, 0.8);
  backdrop-filter: blur(10px);
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transform: skewY(-1deg);
  transform-origin: top left;
}

.navContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  transform: skewY(1deg);
}

.logoContainer {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  position: relative;
}

.logoText {
  color: white;
}

.logoAccent {
  background: linear-gradient(90deg, #ff6b6b, #8a2be2);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-left: 4px;
}

.navLinks {
  display: flex;
  gap: 20px;
}

.navLink {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.2s ease;
  position: relative;
}

.navLink:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.navLink.active {
  color: white;
  background: linear-gradient(90deg, rgba(138, 43, 226, 0.2), rgba(255, 107, 107, 0.2));
}

.navLink.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 12px;
  width: calc(100% - 24px);
  height: 2px;
  background: linear-gradient(90deg, #8a2be2, #ff6b6b);
}

.navIcon {
  margin-right: 8px;
  font-size: 1.1rem;
}

.userMenu {
  display: flex;
  align-items: center;
}

.userAvatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8a2be2, #ff6b6b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.userAvatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .navContainer {
    padding: 0 15px;
  }
  
  .logo {
    font-size: 1.3rem;
  }
  
  .navLinks {
    gap: 10px;
  }
  
  .navText {
    display: none;
  }
  
  .navIcon {
    margin-right: 0;
    font-size: 1.2rem;
  }
  
  .navLink {
    padding: 8px;
  }
}

@media (max-width: 480px) {
  .navContainer {
    padding: 0 10px;
  }
  
  .logo {
    font-size: 1.2rem;
  }
  
  .navLinks {
    gap: 5px;
  }
  
  .userAvatar {
    width: 32px;
    height: 32px;
  }
}
EOF

# Add mobile optimizations to MusicTaste.module.css
echo "Adding mobile optimizations to MusicTaste.module.css..."
cat >> "$PROJECT_ROOT/styles/MusicTaste.module.css" << 'EOF'

/* Mobile optimizations */
.quickNav {
  display: none;
  background-color: rgba(20, 20, 30, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 8px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 70px;
  z-index: 90;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.quickNav::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.quickNavButton {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 16px;
  margin: 0 4px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.quickNavButton:first-child {
  margin-left: 0;
}

.quickNavButton:last-child {
  margin-right: 0;
}

.quickNavButton:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.quickNavButton.active {
  color: white;
  background: linear-gradient(90deg, rgba(138, 43, 226, 0.3), rgba(255, 107, 107, 0.3));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.scrollToTopButton {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8a2be2, #ff6b6b);
  color: white;
  border: none;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  z-index: 99;
  opacity: 0.8;
}

.scrollToTopButton:hover {
  transform: translateY(-3px);
  opacity: 1;
}

/* Show quick nav on mobile */
@media (max-width: 768px) {
  .quickNav {
    display: flex;
  }
  
  .section {
    scroll-margin-top: 140px; /* Account for sticky header and quick nav */
  }
}

@media (max-width: 480px) {
  .quickNavButton {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  .scrollToTopButton {
    width: 36px;
    height: 36px;
    bottom: 15px;
    right: 15px;
  }
}
EOF

# Create API endpoint for updating taste preferences
echo "Creating API endpoint for updating taste preferences..."
mkdir -p "$PROJECT_ROOT/pages/api/user"
cat > "$PROJECT_ROOT/pages/api/user/update-taste-preferences.js" << 'EOF'
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

# Create API endpoint for correlated events
echo "Creating API endpoint for correlated events..."
mkdir -p "$PROJECT_ROOT/pages/api/events"
cat > "$PROJECT_ROOT/pages/api/events/correlated-events.js" << 'EOF'
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
        const geoResponse = await axios.get('https://ipapi.co/json/');
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
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
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
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
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
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
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
      const genreMatch = event.genres.reduce((score, genre) => {
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

# Update Music Taste page
echo "Updating Music Taste page..."
cat > "$PROJECT_ROOT/pages/users/music-taste.js" << 'EOF'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import styles from '../../styles/MusicTaste.module.css';
import Navigation from '../../components/Navigation';
import SpiderChart from '../../components/SpiderChart';
import ArtistCard from '../../components/ArtistCard';
import TrackCard from '../../components/TrackCard';
import SeasonalMoodCard from '../../components/SeasonalMoodCard';
import EventCard from '../../components/EventCard';
import VibeQuizCard from '../../components/VibeQuizCard';
import EventsNavigationCard from '../../components/EventsNavigationCard';

export default function MusicTaste() {
  const { data: session } = useSession();
  const [tasteData, setTasteData] = useState(null);
  const [correlatedEvents, setCorrelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Fetch music taste data
  useEffect(() => {
    const fetchTasteData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/spotify/user-taste');
        if (response.data.success) {
          setTasteData(response.data.taste);
        } else {
          setError('Failed to load music taste data');
        }
      } catch (err) {
        console.error('Error fetching music taste data:', err);
        setError('Error fetching music taste data');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchTasteData();
    }
  }, [session]);

  // Fetch correlated events
  useEffect(() => {
    const fetchCorrelatedEvents = async () => {
      try {
        // Get user's location if available
        let locationParams = '';
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                maximumAge: 600000
              });
            });
            
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            
            locationParams = `?lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
          } catch (locErr) {
            console.warn('Could not get user location:', locErr);
            // Continue without location params
          }
        }
        
        const response = await axios.get(`/api/events/correlated-events${locationParams}`);
        if (response.data.success) {
          setCorrelatedEvents(response.data.events);
          if (!userLocation && response.data.userLocation) {
            setUserLocation(response.data.userLocation);
          }
        }
      } catch (err) {
        console.error('Error fetching correlated events:', err);
        // Don't set error state here to avoid blocking the whole page if just events fail
      }
    };

    if (tasteData) {
      fetchCorrelatedEvents();
    }
  }, [tasteData]);

  // Handle scroll events for section highlighting and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide scroll to top button
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
      
      // Determine active section based on scroll position
      const sections = document.querySelectorAll('section[id]');
      let currentSection = null;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          currentSection = section.id;
        }
      });
      
      setActiveSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle taste update from Vibe Quiz
  const handleTasteUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/spotify/user-taste');
      if (response.data.success) {
        setTasteData(response.data.taste);
      }
    } catch (err) {
      console.error('Error updating taste data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing your sonic DNA...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.errorContainer}>
          <h2>Error loading music taste</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // If no taste data yet
  if (!tasteData) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loadingContainer}>
          <p>Preparing your music taste profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navigation activePage="music-taste" />
      
      <div className={styles.header}>
        <h1 className={styles.title}>Your Music Taste Profile</h1>
        <div className={styles.tasteLabels}>
          {tasteData.tasteLabels && tasteData.tasteLabels.map((label, index) => (
            <span key={index} className={styles.tasteLabel}>{label}</span>
          ))}
        </div>
      </div>
      
      {/* Quick Navigation for Mobile */}
      <div className={styles.quickNav}>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'genre-affinity' ? styles.active : ''}`}
          onClick={() => scrollToSection('genre-affinity')}
        >
          Genres
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'top-artists' ? styles.active : ''}`}
          onClick={() => scrollToSection('top-artists')}
        >
          Artists
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'top-tracks' ? styles.active : ''}`}
          onClick={() => scrollToSection('top-tracks')}
        >
          Tracks
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'seasonal-mood' ? styles.active : ''}`}
          onClick={() => scrollToSection('seasonal-mood')}
        >
          Seasons
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'discover-events' ? styles.active : ''}`}
          onClick={() => scrollToSection('discover-events')}
        >
          Events
        </button>
      </div>
      
      {/* Spider Chart Section */}
      <section id="genre-affinity" className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Genre Affinity</h2>
        <div className={styles.spiderChartContainer}>
          {tasteData.topGenres && tasteData.topGenres.length > 0 ? (
            <SpiderChart genres={tasteData.topGenres} />
          ) : (
            <p className={styles.noData}>No genre data available</p>
          )}
        </div>
      </section>
      
      {/* Music Personality Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Music Personality</h2>
        <p className={styles.personalityText}>{tasteData.tasteProfile}</p>
      </section>
      
      {/* Vibe Quiz Card */}
      <VibeQuizCard onTasteUpdate={handleTasteUpdate} />
      
      {/* Top Artists Section */}
      <section id="top-artists" className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Artists</h2>
        <div className={styles.artistsGrid}>
          {tasteData.topArtists && tasteData.topArtists.length > 0 ? (
            tasteData.topArtists.map((artist, index) => (
              <ArtistCard key={index} artist={artist} rank={index + 1} />
            ))
          ) : (
            <p className={styles.noData}>No artist data available</p>
          )}
        </div>
      </section>
      
      {/* Top Tracks Section */}
      <section id="top-tracks" className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Tracks</h2>
        <div className={styles.tracksGrid}>
          {tasteData.topTracks && tasteData.topTracks.length > 0 ? (
            tasteData.topTracks.map((track, index) => (
              <TrackCard key={index} track={track} rank={index + 1} />
            ))
          ) : (
            <p className={styles.noData}>No track data available</p>
          )}
        </div>
      </section>
      
      {/* Seasonal Mood Section */}
      <section id="seasonal-mood" className={styles.section}>
        <h2 className={styles.sectionTitle}>Seasonal Music Mood</h2>
        <div className={styles.seasonalMoodGrid}>
          {tasteData.seasonalMood && Object.keys(tasteData.seasonalMood).length > 0 ? (
            Object.entries(tasteData.seasonalMood).map(([season, genres], index) => (
              <SeasonalMoodCard key={index} season={season} genres={genres} />
            ))
          ) : (
            <p className={styles.noData}>No seasonal mood data available</p>
          )}
        </div>
      </section>
      
      {/* Events Navigation Card */}
      <EventsNavigationCard correlatedEvents={correlatedEvents} userTaste={tasteData} />
      
      {/* Discover Events Section */}
      <section id="discover-events" className={styles.section}>
        <h2 className={styles.sectionTitle}>Discover Events Based on Your Taste</h2>
        {userLocation && (
          <p className={styles.locationText}>
            Showing events near {userLocation.city || ''} {userLocation.region || ''}
          </p>
        )}
        <div className={styles.eventsGrid}>
          {correlatedEvents && correlatedEvents.length > 0 ? (
            correlatedEvents.slice(0, 3).map((event, index) => (
              <EventCard key={index} event={event} />
            ))
          ) : (
            <p className={styles.noData}>No matching events found in your area</p>
          )}
        </div>
      </section>
      
      {/* Scroll to top button */}
      {showScrollToTop && (
        <button className={styles.scrollToTopButton} onClick={scrollToTop}>
          ↑
        </button>
      )}
      
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Sonar EDM Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
EOF

echo "Implementation complete! All components and changes have been successfully implemented."
echo "Backups of modified files are available in $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Review the changes"
echo "2. Test locally with 'npm run dev'"
echo "3. Commit and deploy to Heroku"
echo ""
echo "For detailed documentation, refer to the flow-improvements-implementation-guide.md and deployment-testing-guide.md files."
