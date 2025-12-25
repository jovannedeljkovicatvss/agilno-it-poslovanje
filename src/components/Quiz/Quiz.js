import React, { useState, useEffect } from 'react';
import EnhancedQuestion from './EnhancedQuestion';
import questions from '../../data/questions';
import './Quiz.css';

function Quiz({ user }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizMode, setQuizMode] = useState('learning');
  const [timeSpent, setTimeSpent] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Timer
  useEffect(() => {
    let interval;
    if (quizMode === 'exam' && !quizFinished && startTime) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizMode, quizFinished, startTime]);

  // Pokreni timer kada se počne kviz
  useEffect(() => {
    if (quizMode === 'exam' && !startTime) {
      setStartTime(Date.now());
    }
  }, [quizMode, startTime]);

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = {
      selected: answerIndex,
      isCorrect: answerIndex === questions[currentQuestion].correct,
      answeredAt: new Date()
    };
    setAnswers(newAnswers);
    
    // U learning modu automatski pređi na sledeće
    if (quizMode === 'learning') {
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        }
      }, 1500); // Sačekaj 1.5s da se vidi feedback
    }
  };

  const nextQuestion = () => {
    // NE beleži null ako korisnik nije odgovorio
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishQuiz = async () => {
    // Filter - samo odgovorena pitanja
    const answeredQuestions = answers.filter(a => a !== null);
    const score = answeredQuestions.reduce((total, answer) => 
      answer.isCorrect ? total + 1 : total, 0
    );
    
    const percentage = Math.round((score / questions.length) * 100);
    
    // Sačuvaj rezultate na backend
    try {
      const token = localStorage.getItem('token');
      if (token && user) {
        await fetch('http://localhost:5000/api/quiz-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            score,
            totalQuestions: questions.length,
            percentage,
            timeSpent,
            answers: answeredQuestions
          })
        });
      }
    } catch (error) {
      console.error('Error saving results:', error);
    }
    
    setQuizFinished(true);
    setShowResults(true);
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
    setStartTime(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Pitanja koja su odgovorena
  const answeredCount = answers.filter(a => a !== null).length;
  const correctCount = answers.filter(a => a && a.isCorrect).length;

  if (quizFinished) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="quiz-results">
        <div className="results-header">
          <h2>🎉 Rezultati kviza</h2>
          <div className="mode-badge">{quizMode}</div>
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
            <div className="score-value">{answeredCount}/{questions.length}</div>
            <div className="score-label">Odgovoreno</div>
          </div>
          
          {quizMode === 'exam' && (
            <div className="score-card">
              <div className="score-value">{formatTime(timeSpent)}</div>
              <div className="score-label">Vreme</div>
            </div>
          )}
        </div>

        <h3>📋 Pregled odgovora:</h3>
        <div className="questions-review">
          {questions.map((question, index) => (
            <div key={question.id} className="question-review">
              <EnhancedQuestion
                question={question}
                onAnswer={() => {}}
                showImmediateFeedback={true}
                disabled={true}
              />
              <div className="review-status">
                {answers[index] ? (
                  answers[index].isCorrect ? (
                    <span className="status-correct">✅ Odgovoreno tačno</span>
                  ) : (
                    <span className="status-incorrect">❌ Odgovoreno pogrešno</span>
                  )
                ) : (
                  <span className="status-skipped">⏭️ Preskočeno</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="results-actions">
          <button onClick={resetQuiz} className="retry-btn">
            🔄 Pokušaj ponovo
          </button>
          <button onClick={() => window.location.reload()} className="home-btn">
            🏠 Nazad na početnu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-quiz-container">
      <div className="quiz-controls">
        <div className="mode-selector">
          <h2>Agilno IT Poslovanje - Kviz</h2>
          <div className="mode-buttons">
            <button 
              className={quizMode === 'learning' ? 'active' : ''}
              onClick={() => {
                setQuizMode('learning');
                setStartTime(null);
              }}
            >
              📚 Učenje
            </button>
            <button 
              className={quizMode === 'test' ? 'active' : ''}
              onClick={() => {
                setQuizMode('test');
                setStartTime(null);
              }}
            >
              📝 Test
            </button>
            <button 
              className={quizMode === 'exam' ? 'active' : ''}
              onClick={() => {
                setQuizMode('exam');
                if (!startTime) setStartTime(Date.now());
              }}
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
          
          {quizMode === 'exam' && startTime && (
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
        disabled={quizMode === 'learning' && answers[currentQuestion] !== null}
	resetOnNewQuestion={true} 
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
            {questions.slice(0, Math.min(10, questions.length)).map((_, index) => (
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
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Tačnih:</span>
            <span className="stat-value">
              {correctCount}/{answeredCount || 1}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Preostalo:</span>
            <span className="stat-value">
              {questions.length - answeredCount}
            </span>
          </div>
        </div>
        
        {quizMode !== 'learning' && (
          <div className="quiz-instructions">
            <p>
              <strong>💡 Uputstvo:</strong> Klikni na odgovor da bi ga odabrao/la. 
              Možeš da preskočiš pitanje - neće se računati kao pogrešno.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;