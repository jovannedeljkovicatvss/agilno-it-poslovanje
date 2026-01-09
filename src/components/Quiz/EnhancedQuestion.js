import React, { useState, useEffect } from 'react';
import './EnhancedQuestion.css';

function EnhancedQuestion({ 
  question, 
  onAnswer, 
  showImmediateFeedback = true,
  showStats = true,
  disabled = false,
  resetOnNewQuestion = true
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
      
      // Pozovi callback sa izabranim odgovorom
      if (onAnswer) {
        onAnswer(index);
      }
      
      // Automatski pokaži objašnjenje ako je pogrešan odgovor
      if (showImmediateFeedback && index !== question.correct) {
        setTimeout(() => {
          setShowExplanation(true);
        }, 500);
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

  // Procentualni prikaz za statistiku
  const getPercentageWidth = (index) => {
    if (!showStats || !question.stats) return 'auto';
    
    const stats = question.stats;
    if (stats[index] && stats.total > 0) {
      return `${(stats[index] / stats.total * 100)}%`;
    }
    return '0%';
  };

  return (
    <div className="enhanced-question-card">
      <div className="question-header">
        <div className="question-meta">
          <span className="question-number">Pitanje #{question.id}</span>
          <span className="question-difficulty">
            {question.difficulty || 'Srednje teško'}
            {question.topic && ` • ${question.topic}`}
          </span>
        </div>
        
        {answered && showImmediateFeedback && (
          <div className={`feedback-badge ${selected === question.correct ? 'correct' : 'incorrect'}`}>
            {selected === question.correct ? (
              <>
                <span className="feedback-icon">✅</span>
                <span className="feedback-text">Tačan odgovor!</span>
              </>
            ) : (
              <>
                <span className="feedback-icon">❌</span>
                <span className="feedback-text">Pogrešan odgovor</span>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="question-content">
        <h3 className="question-text">{question.question}</h3>
        {question.image && (
          <div className="question-image">
            <img src={question.image} alt="Ilustracija pitanja" />
          </div>
        )}
      </div>
      
      <div className="enhanced-options">
        {question.options.map((option, index) => (
          <div 
            key={index}
            className={getOptionClass(index)}
            onClick={() => handleSelect(index)}
          >
            <div className="option-content">
              <div className="option-header">
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="option-text">{option}</span>
              </div>
              
              {answered && showImmediateFeedback && (
                <div className="option-feedback">
                  {index === question.correct && (
                    <span className="correct-indicator">
                      <span className="check-icon">✓</span>
                      <span className="feedback-label">Tačan odgovor</span>
                    </span>
                  )}
                  
                  {selected === index && index !== question.correct && (
                    <span className="incorrect-indicator">
                      <span className="cross-icon">✗</span>
                      <span className="feedback-label">Tvoj odgovor</span>
                    </span>
                  )}
                </div>
              )}
              
              {showStats && question.stats && (
                <div className="option-stats">
                  <div className="stats-bar">
                    <div 
                      className="stats-fill"
                      style={{ width: getPercentageWidth(index) }}
                    ></div>
                  </div>
                  {question.stats[index] && (
                    <span className="stats-percentage">
                      {Math.round((question.stats[index] / question.stats.total) * 100)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {answered && showImmediateFeedback && (
        <div className="enhanced-feedback">
          <div className="feedback-toggle">
            <button 
              className={`toggle-btn ${showExplanation ? 'active' : ''}`}
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? (
                <>
                  <span className="toggle-icon">👇</span>
                  Sakrij objašnjenje
                </>
              ) : (
                <>
                  <span className="toggle-icon">👆</span>
                  Pokaži objašnjenje
                </>
              )}
            </button>
          </div>
          
          {showExplanation && (
            <div className="explanation-section">
              <div className="explanation-header">
                <span className="explanation-icon">💡</span>
                <h4 className="explanation-title">Objašnjenje</h4>
              </div>
              
              <div className="explanation-content">
                <p className="explanation-text">{question.explanation}</p>
                
                <div className="correct-answer-box">
                  <div className="correct-answer-header">
                    <span className="correct-icon">✅</span>
                    <strong>Tačan odgovor:</strong>
                  </div>
                  <div className="correct-answer-content">
                    {String.fromCharCode(65 + question.correct)}. {question.options[question.correct]}
                  </div>
                </div>
                
                {question.reference && (
                  <div className="reference-box">
                    <div className="reference-header">
                      <span className="reference-icon">📚</span>
                      <strong>Referenca:</strong>
                    </div>
                    <div className="reference-content">
                      {question.reference}
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
          <div className="hint-content">
            <span className="hint-icon">💡</span>
            <div className="hint-text">
              <strong>Kako odgovoriti:</strong> Klikni na jednu od opcija iznad. 
              {showImmediateFeedback ? ' Odmah ćeš videti da li je tačno.' : ' Rezultat ćeš videti na kraju.'}
            </div>
          </div>
        </div>
      )}
      
      {disabled && !answered && (
        <div className="disabled-note">
          <span className="disabled-icon">⏸️</span>
          Ovo pitanje je zaključano dok ne završiš trenutni mod.
        </div>
      )}
    </div>
  );
}

export default EnhancedQuestion;