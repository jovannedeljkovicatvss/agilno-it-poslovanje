// NOVO - ovako treba da izgleda
import React, { useState, useEffect } from 'react';
import EnhancedQuestion from './Quiz/EnhancedQuestion';
//import './Quiz.css';  Ako imaš poseban CSS za Quiz

function Quiz({ questions }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizMode, setQuizMode] = useState('learning'); // 'learning', 'test', 'exam'
  const [timeSpent, setTimeSpent] = useState(0);
  const [timer, setTimer] = useState(null);

  // Timer za praćenje vremena
  useEffect(() => {
    if (quizMode === 'exam' && !quizFinished) {
      const interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      setTimer(interval);
      
      return () => clearInterval(interval);
    }
  }, [quizMode, quizFinished]);

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = {
      selected: answerIndex,
      time: timeSpent,
      isCorrect: answerIndex === questions[currentQuestion].correct
    };
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    setShowResults(true);
    if (timer) clearInterval(timer);
  };

  const calculateScore = () => {
    return answers.reduce((score, answer) => {
      return answer && answer.isCorrect ? score + 1 : score;
    }, 0);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers(Array(questions.length).fill(null));
    setQuizFinished(false);
    setShowResults(false);
    setTimeSpent(0);
  };

  // Formatiranje vremena
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (quizFinished) {
    const score = calculateScore();
    const percentage = ((score / questions.length) * 100).toFixed(1);
    
    return (
      <div className="quiz-results">
        <div className="results-header">
          <h2>🎉 Rezultati kviza</h2>
          <div className="mode-badge">{quizMode === 'exam' ? 'Ispit' : 'Test'}</div>
        </div>
        
        <div className="score-summary">
          <div className="score-card">
            <div className="score-value">{score}/{questions.length}</div>
            <div className="score-label">Tačnih odgovora</div>
          </div>
          
          <div className="score-card">
            <div className="score-value">{percentage}%</div>
            <div className="score-label">Uspešnost</div>
          </div>
          
          <div className="score-card">
            <div className="score-value">{formatTime(timeSpent)}</div>
            <div className="score-label">Ukupno vreme</div>
          </div>
        </div>

        <h3>📋 Pregled odgovora:</h3>
        <div className="questions-review">
          {questions.map((question, index) => (
            <EnhancedQuestion
              key={question.id}
              question={question}
              onAnswer={() => {}}
              showImmediateFeedback={true}
              disabled={true}
            />
          ))}
        </div>

        <div className="results-actions">
          <button onClick={resetQuiz} className="retry-btn">
            🔄 Pokušaj ponovo
          </button>
          <button onClick={() => alert('Rezultati sačuvani!')} className="save-btn">
            💾 Sačuvaj rezultate
          </button>
          <button onClick={() => window.print()} className="print-btn">
            🖨️ Štampaj rezultate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-quiz-container">
      <div className="quiz-controls">
        <div className="mode-selector">
          <h2>Agilno IT Poslovanje</h2>
          <div className="mode-buttons">
            <button 
              className={quizMode === 'learning' ? 'active' : ''}
              onClick={() => setQuizMode('learning')}
            >
              📚 Učenje
            </button>
            <button 
              className={quizMode === 'test' ? 'active' : ''}
              onClick={() => setQuizMode('test')}
            >
              📝 Test (20 pitanja)
            </button>
            <button 
              className={quizMode === 'exam' ? 'active' : ''}
              onClick={() => setQuizMode('exam')}
            >
              ⏱️ Ispit (60 min)
            </button>
          </div>
        </div>

        <div className="quiz-header">
          <div className="progress-info">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="progress-text">
              Pitanje {currentQuestion + 1} od {questions.length}
            </div>
          </div>
          
          {quizMode === 'exam' && (
            <div className="timer-display">
              ⏱️ Preostalo: {formatTime(3600 - timeSpent)}
            </div>
          )}
        </div>
      </div>

      <EnhancedQuestion
        question={questions[currentQuestion]}
        onAnswer={handleAnswer}
        showImmediateFeedback={quizMode === 'learning'}
        showStats={quizMode === 'learning'}
        disabled={quizMode !== 'learning' && answers[currentQuestion] !== null}
      />

      <div className="quiz-navigation">
        <div className="nav-buttons">
          <button 
            onClick={prevQuestion} 
            disabled={currentQuestion === 0}
            className="nav-btn prev-btn"
          >
            ← Prethodno
          </button>
          
          <div className="quick-jump">
            {questions.map((_, index) => (
              <button
                key={index}
                className={`jump-btn ${currentQuestion === index ? 'active' : ''} ${answers[index] !== null ? 'answered' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {currentQuestion < questions.length - 1 ? (
            <button onClick={nextQuestion} className="nav-btn next-btn">
              Sledeće →
            </button>
          ) : (
            <button onClick={finishQuiz} className="nav-btn finish-btn">
              🏁 Završi kviz
            </button>
          )}
        </div>
        
        <div className="quiz-stats">
          <div className="stat">
            <span className="stat-label">Odgovoreno:</span>
            <span className="stat-value">
              {answers.filter(a => a !== null).length}/{questions.length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Tačnost:</span>
            <span className="stat-value">
              {answers.filter(a => a && a.isCorrect).length}/
              {answers.filter(a => a !== null).length || 1}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;