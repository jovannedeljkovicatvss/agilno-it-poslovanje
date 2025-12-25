import React, { useState, useEffect } from 'react';
import './EnhancedQuestion.css';

function EnhancedQuestion({ 
  question, 
  onAnswer, 
  showImmediateFeedback = true,
  showStats = true,
  disabled = false,
  resetOnNewQuestion = true // Novi prop
}) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // RESET state kada se promeni pitanje
  useEffect(() => {
    if (resetOnNewQuestion) {
      setSelected(null);
      setAnswered(false);
      setShowExplanation(false);
    }
  }, [question.id, resetOnNewQuestion]);

  const handleSelect = (index) => {
    if (!answered && !disabled) {
      setSelected(index);
      setAnswered(true);
      if (onAnswer) {
        onAnswer(index);
      }
    }
  };

  const getOptionClass = (index) => {
    let className = 'enhanced-option';
    
    if (selected === index) {
      className += ' selected';
    }
    
    if (answered && showImmediateFeedback) {
      if (index === question.correct) {
        className += ' correct';
      }
      if (selected === index && index !== question.correct) {
        className += ' wrong';
      }
    }
    
    if (disabled) {
      className += ' disabled';
    }
    
    return className;
  };

  // Mock podaci za statistiku
  const questionStats = {
    correctPercentage: Math.floor(Math.random() * 30) + 70,
    averageTime: Math.floor(Math.random() * 30) + 30,
    attempts: Math.floor(Math.random() * 100) + 50
  };

  return (
    <div className="enhanced-question-card">
      <div className="question-header">
        <div className="question-meta">
          <span className="question-number">Pitanje {question.id}</span>
          <span className="question-difficulty">
            {question.difficulty || 'Srednje teško'}
          </span>
          {!answered && (
            <span className="question-hint">👆 Klikni na odgovor</span>
          )}
        </div>
        
        {answered && showImmediateFeedback && (
          <div className={`feedback-badge ${selected === question.correct ? 'correct' : 'incorrect'}`}>
            {selected === question.correct ? (
              <>
                <span className="feedback-icon">✅</span>
                <span className="feedback-text">Tačno!</span>
              </>
            ) : (
              <>
                <span className="feedback-icon">❌</span>
                <span className="feedback-text">Pogrešno</span>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="question-content">
        <p className="question-text">{question.question}</p>
      </div>
      
      <div className="enhanced-options">
        {question.options.map((option, index) => (
          <div 
            key={index}
            className={getOptionClass(index)}
            onClick={() => handleSelect(index)}
          >
            <div className="option-content">
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
              
              {answered && showImmediateFeedback && index === question.correct && (
                <span className="correct-indicator">
                  <span className="check-icon">✓</span>
                  <span className="correct-label">Tačan odgovor</span>
                </span>
              )}
              
              {answered && showImmediateFeedback && selected === index && index !== question.correct && (
                <span className="incorrect-indicator">
                  <span className="cross-icon">✗</span>
                  <span className="incorrect-label">Tvoj odgovor</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {answered && showImmediateFeedback && (
        <div className="enhanced-feedback">
          <div className="feedback-toggle">
            <button 
              className="toggle-btn"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? '👇 Sakrij objašnjenje' : '👆 Pokaži objašnjenje'}
            </button>
          </div>
          
          {showExplanation && (
            <div className="explanation-section">
              <h4 className="explanation-title">
                <span className="explanation-icon">💡</span>
                Objašnjenje
              </h4>
              <p className="explanation-text">{question.explanation}</p>
              
              <div className="explanation-details">
                {selected !== question.correct && (
                  <div className="correct-answer-box">
                    <div className="correct-answer-header">
                      <span className="correct-icon">✅</span>
                      <strong>Tačan odgovor:</strong>
                    </div>
                    <div className="correct-answer-content">
                      {String.fromCharCode(65 + question.correct)}. {question.options[question.correct]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {!answered && !disabled && (
        <div className="hint-section">
          <p className="hint-text">
            <span className="hint-icon">💡</span>
            <strong>Napomena:</strong> Odgovorićeš kada klikneš na jednu od opcija. 
            Možeš da preskočiš ovo pitanje.
          </p>
        </div>
      )}
    </div>
  );
}

export default EnhancedQuestion;