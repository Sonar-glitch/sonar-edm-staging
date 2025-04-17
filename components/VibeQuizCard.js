import React, { useState } from 'react';
import styles from '../styles/VibeQuizCard.module.css';

const VibeQuizCard = ({ onSubmit }) => {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({
    genres: [],
    moods: [],
    venues: [],
    artists: []
  });

  const questions = [
    {
      id: 'genres',
      question: 'What genres are you into right now?',
      options: [
        { id: 'house', label: 'House' },
        { id: 'techno', label: 'Techno' },
        { id: 'trance', label: 'Trance' },
        { id: 'dubstep', label: 'Dubstep' },
        { id: 'dnb', label: 'Drum & Bass' },
        { id: 'ambient', label: 'Ambient' },
        { id: 'progressive', label: 'Progressive' },
        { id: 'melodic', label: 'Melodic' }
      ]
    },
    {
      id: 'moods',
      question: 'What mood are you looking for?',
      options: [
        { id: 'energetic', label: 'Energetic' },
        { id: 'chill', label: 'Chill' },
        { id: 'dark', label: 'Dark' },
        { id: 'uplifting', label: 'Uplifting' },
        { id: 'emotional', label: 'Emotional' },
        { id: 'euphoric', label: 'Euphoric' }
      ]
    },
    {
      id: 'venues',
      question: 'What type of venues do you prefer?',
      options: [
        { id: 'club', label: 'Club' },
        { id: 'festival', label: 'Festival' },
        { id: 'underground', label: 'Underground' },
        { id: 'warehouse', label: 'Warehouse' },
        { id: 'outdoor', label: 'Outdoor' }
      ]
    },
    {
      id: 'artists',
      question: 'Any specific artists you want to see?',
      options: [
        { id: 'local', label: 'Local DJs' },
        { id: 'international', label: 'International Acts' },
        { id: 'emerging', label: 'Emerging Artists' },
        { id: 'headliners', label: 'Headliners' }
      ]
    }
  ];

  const handleSelect = (questionId, optionId) => {
    setSelections(prev => {
      const current = [...prev[questionId]];
      const index = current.indexOf(optionId);
      
      if (index === -1) {
        current.push(optionId);
      } else {
        current.splice(index, 1);
      }
      
      return {
        ...prev,
        [questionId]: current
      };
    });
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (typeof onSubmit === 'function') {
      onSubmit(selections);
    }
  };

  const currentQuestion = questions[step];

  return (
    <div className={styles.vibeQuizCard}>
      <div className={styles.progressBar}>
        {questions.map((_, index) => (
          <div 
            key={index} 
            className={`${styles.progressStep} ${index <= step ? styles.activeStep : ''}`}
          ></div>
        ))}
      </div>
      
      <h3 className={styles.question}>{currentQuestion.question}</h3>
      
      <div className={styles.optionsGrid}>
        {currentQuestion.options.map(option => (
          <div 
            key={option.id}
            className={`${styles.optionCard} ${selections[currentQuestion.id].includes(option.id) ? styles.selectedOption : ''}`}
            onClick={() => handleSelect(currentQuestion.id, option.id)}
          >
            {option.label}
          </div>
        ))}
      </div>
      
      <div className={styles.navigationButtons}>
        <button 
          className={styles.backButton}
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </button>
        
        <button 
          className={styles.nextButton}
          onClick={handleNext}
        >
          {step === questions.length - 1 ? 'Submit' : 'Next'}
        </button>
      </div>
      
      <div className={styles.quizInfo}>
        <p>Your quiz responses influence 30% of your recommendations, while your listening data accounts for 70%.</p>
      </div>
    </div>
  );
};

export default VibeQuizCard;
