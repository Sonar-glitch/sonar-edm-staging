import React, { useState } from 'react';
import styles from '@/styles/TasteQuiz.module.css';

export default function TasteQuiz({ onSubmit, onCancel }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    venueType: [],
    vibeType: [],
    eventType: [],
    priceRange: 'medium',
    locationRadius: 25
  });
  
  // Quiz data - options for each question
  const quizData = [
    {
      question: "What type of venues do you prefer?",
      type: "multiSelect",
      field: "venueType",
      options: [
        { value: "club", label: "Club" },
        { value: "warehouse", label: "Warehouse" },
        { value: "rooftop", label: "Rooftop" },
        { value: "festival", label: "Festival" },
        { value: "openAir", label: "Open Air" },
        { value: "venue", label: "Venue" }
      ]
    },
    {
      question: "What vibe are you looking for?",
      type: "multiSelect",
      field: "vibeType",
      options: [
        { value: "highEnergy", label: "High Energy" },
        { value: "deep", label: "Deep" },
        { value: "eclectic", label: "Eclectic" },
        { value: "underground", label: "Underground" },
        { value: "mainstream", label: "Mainstream" },
        { value: "chill", label: "Chill" }
      ]
    },
    {
      question: "What type of events do you enjoy?",
      type: "multiSelect",
      field: "eventType",
      options: [
        { value: "liveSet", label: "Live Set" },
        { value: "allNight", label: "All Night" },
        { value: "dayParty", label: "Day Party" },
        { value: "afterhours", label: "Afterhours" },
        { value: "boatParty", label: "Boat Party" },
        { value: "showcase", label: "Artist Showcase" }
      ]
    },
    {
      question: "What's your ticket price comfort zone?",
      type: "singleSelect",
      field: "priceRange",
      options: [
        { value: "budget", label: "Budget ($0-40)" },
        { value: "medium", label: "Medium ($40-80)" },
        { value: "premium", label: "Premium ($80-150)" },
        { value: "vip", label: "VIP ($150+)" }
      ]
    },
    {
      question: "How far are you willing to travel?",
      type: "range",
      field: "locationRadius",
      min: 5,
      max: 100,
      step: 5,
      labels: {
        min: "Nearby only (5mi)",
        max: "Anywhere (100mi)"
      }
    }
  ];
  
  // Current question data
  const currentQuestion = quizData[currentStep];
  
  // Handle changes to the current question
  const handleChange = (field, value) => {
    setAnswers({
      ...answers,
      [field]: value
    });
  };
  
  // Handle checkbox selections for multi-select questions
  const handleCheckboxChange = (field, value) => {
    const currentValues = answers[field] || [];
    
    if (currentValues.includes(value)) {
      // Remove the value if already selected
      handleChange(field, currentValues.filter(v => v !== value));
    } else {
      // Add the value if not selected
      handleChange(field, [...currentValues, value]);
    }
  };
  
  // Handle radio button selections for single-select questions
  const handleRadioChange = (field, value) => {
    handleChange(field, value);
  };
  
  // Handle range slider changes
  const handleRangeChange = (field, value) => {
    handleChange(field, parseInt(value));
  };
  
  // Navigate to the next question
  const nextStep = () => {
    if (currentStep < quizData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the quiz if on the last question
      if (onSubmit) {
        onSubmit(answers);
      }
    }
  };
  
  // Navigate to the previous question
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      // Cancel the quiz if on the first question
      if (onCancel) {
        onCancel();
      }
    }
  };
  
  // Check if current question has been answered
  const isCurrentQuestionAnswered = () => {
    const field = currentQuestion.field;
    const value = answers[field];
    
    if (currentQuestion.type === 'multiSelect') {
      return Array.isArray(value) && value.length > 0;
    }
    
    return value !== undefined && value !== null;
  };
  
  // Render the current question based on its type
  const renderQuestion = () => {
    const { question, type, field, options, min, max, step, labels } = currentQuestion;
    
    switch (type) {
      case 'multiSelect':
        return (
          <div className={styles.questionContent}>
            <h3 className={styles.questionText}>{question}</h3>
            <div className={styles.optionsGrid}>
              {options.map((option) => (
                <label key={option.value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={answers[field]?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange(field, option.value)}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkbox}></span>
                  <span className={styles.checkboxText}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
        
      case 'singleSelect':
        return (
          <div className={styles.questionContent}>
            <h3 className={styles.questionText}>{question}</h3>
            <div className={styles.optionsStack}>
              {options.map((option) => (
                <label key={option.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name={field}
                    value={option.value}
                    checked={answers[field] === option.value}
                    onChange={() => handleRadioChange(field, option.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radio}></span>
                  <span className={styles.radioText}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
        
      case 'range':
        return (
          <div className={styles.questionContent}>
            <h3 className={styles.questionText}>{question}</h3>
            <div className={styles.rangeContainer}>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={answers[field]}
                onChange={(e) => handleRangeChange(field, e.target.value)}
                className={styles.rangeInput}
              />
              <div className={styles.rangeLabels}>
                <span className={styles.minLabel}>{labels.min}</span>
                <span className={styles.valueLabel}>{answers[field]} miles</span>
                <span className={styles.maxLabel}>{labels.max}</span>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizHeader}>
        <h2 className={styles.quizTitle}>Help us fine-tune your recommendations</h2>
        <button className={styles.closeButton} onClick={onCancel}>×</button>
      </div>
      
      <div className={styles.quizProgress}>
        <div className={styles.progressText}>
          Question {currentStep + 1} of {quizData.length}
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${((currentStep + 1) / quizData.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className={styles.quizContent}>
        {renderQuestion()}
      </div>
      
      <div className={styles.quizControls}>
        <button 
          className={styles.prevButton}
          onClick={prevStep}
        >
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </button>
        
        <button 
          className={styles.nextButton}
          onClick={nextStep}
          disabled={!isCurrentQuestionAnswered()}
        >
          {currentStep === quizData.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}