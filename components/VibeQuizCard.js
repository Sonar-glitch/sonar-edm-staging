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
