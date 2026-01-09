import React, { useState, useEffect } from 'react';
import EnhancedQuestion from './EnhancedQuestion';
import questions from '../../data/questions';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './Quiz.css';

function Quiz({ user }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizMode, setQuizMode] = useState('learning');
  const [timeSpent, setTimeSpent] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Timer
  useEffect(() => {
    let interval;
    if (quizMode === 'exam' && !quizFinished && startTime) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
        
        // Automatski završi ispit nakon 60 minuta
        if (Math.floor((Date.now() - startTime) / 1000) >= 3600) {
          finishQuiz();
        }
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
      }, 1500);
    }
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

  // FUNKCIJA ZA ČUVANJE REZULTATA - ISPRAVLJENA
  const saveQuizResult = async (resultData) => {
  console.log('🚀 Počinjem slanje rezultata...');
  
  // UVIJEK SAČUVAJ U LOCALSTORAGE
  try {
    const existingResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    existingResults.push({
      ...resultData,
      savedLocallyAt: new Date().toISOString()
    });
    localStorage.setItem('quizResults', JSON.stringify(existingResults.slice(-100)));
    console.log('✅ Rezultat sačuvan lokalno');
  } catch (localError) {
    console.error('Greška pri lokalnom čuvanju:', localError);
  }
  
  // POKUŠAJ DA POŠALJEŠ U FIREBASE
  try {
    console.log('📤 Pokušavam da pošaljem u Firebase...');
    
    // 1. Proveri da li Firebase radi
    if (!db) {
      throw new Error('Firebase nije inicijalizovan');
    }
    
    // 2. Pripremi podatke za Firebase
    const firebaseData = {
      // Student info
      studentName: user?.displayName || user?.name || user?.email || 'Student',
      email: user?.email || '',
      studentId: user?.studentId || user?.index || '',
      
      // Quiz info
      quizName: 'Agilno IT Poslovanje',
      quizType: quizMode,
      
      // Results
      percentage: Number(resultData.percentage) || 0,
      correctAnswers: Number(resultData.correctAnswers) || 0,
      totalQuestions: Number(resultData.totalQuestions) || questions.length,
      timeSpent: Number(resultData.timeSpent) || 0,
      timeSpentMinutes: Math.round((resultData.timeSpent || 0) / 60),
      
      // Metadata
      userId: user?.uid || user?.id || 'anonymous',
      submittedAt: new Date(), // Koristi običan Date za GitHub Pages
      createdAt: new Date().toISOString(),
      
      // Platform info
      platform: window.location.hostname,
      userAgent: navigator.userAgent.substring(0, 100)
    };
    
    console.log('📄 Šaljem ove podatke:', firebaseData);
    
    // 3. Pošalji u Firebase
    const docRef = await addDoc(collection(db, "quizResults"), firebaseData);
    
    console.log('🎉 USPEO! Rezultat poslat u Firebase sa ID:', docRef.id);
    
    // Prikaži poruku studentu
    alert(`✅ Rezultat sačuvan!\nID: ${docRef.id.substring(0, 8)}...\nProfesor će videti rezultat.`);
    
    return { success: true, id: docRef.id };
    
  } catch (firebaseError) {
    console.error('❌ NEUSPELO slanje u Firebase:', firebaseError);
    
    // Prikaži studentu da je samo lokalno sačuvano
    alert(`⚠️ Rezultat sačuvan samo lokalno.\nProfesor će videti kada se sledeći put uloguje.`);
    
    return { 
      success: false, 
      savedLocally: true, 
      error: firebaseError.message 
    };
  }
};

  // FINISH QUIZ FUNKCIJA - ISPRAVLJENA
  const finishQuiz = async () => {
    // Filter - samo odgovorena pitanja
    const answeredQuestions = answers.filter(a => a !== null);
    
    // Izračunaj broj tačnih odgovora
    const correctCount = answeredQuestions.reduce((total, answer) => 
      answer.isCorrect ? total + 1 : total, 0
    );
    
    // Score je procenat tačnih od UKUPNOG broja pitanja
    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    
    console.log('🎯 Rezultati kviza:', {
      totalQuestions: questions.length,
      answered: answeredQuestions.length,
      correct: correctCount,
      percentage: scorePercentage
    });
    
    // Podaci za čuvanje
    const resultData = {
      userId: user?.uid || user?.id || 'anonymous',
      userName: user?.displayName || user?.name || user?.email || 'Anonimni korisnik',
      studentName: user?.displayName || user?.name || 'Student',
      email: user?.email || '',
      studentId: user?.studentId || user?.index || '',
      
      quizName: 'Agilno IT Poslovanje',
      quizType: quizMode,
      
      percentage: scorePercentage,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      timeSpent: timeSpent,
      
      answeredQuestions: answeredQuestions.length,
      mode: quizMode,
      date: new Date().toISOString()
    };
    
    // Sačuvaj rezultat
    await saveQuizResult(resultData);
    
    // Ako je ispit mod i vreme je isteklo
    if (quizMode === 'exam' && timeSpent >= 3600) {
      console.log('⏰ Vreme za ispit je isteklo!');
    }
    
    // Prikaži rezultate
    setQuizFinished(true);
    setShowResults(true);
  };

  const calculateScore = () => {
    const answeredQuestions = answers.filter(a => a !== null);
    const correctCount = answeredQuestions.reduce((total, answer) => 
      answer.isCorrect ? total + 1 : total, 0
    );
    return Math.round((correctCount / questions.length) * 100);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers(Array(questions.length).fill(null));
    setQuizFinished(false);
    setShowResults(false);
    setTimeSpent(0);
    setStartTime(null);
    setSaveStatus('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pitanja koja su odgovorena
  const answeredCount = answers.filter(a => a !== null).length;
  const correctCount = answers.filter(a => a && a.isCorrect).length;
  const currentScore = calculateScore();

  if (quizFinished) {
    const score = currentScore;
    
    return (
      <div className="quiz-results">
        <div className="results-header">
          <h2>🎉 Rezultati kviza</h2>
          <div className={`mode-badge ${quizMode}`}>
            {quizMode === 'learning' ? '📚 Učenje' : 
             quizMode === 'test' ? '📝 Test' : '⏱️ Ispit'}
          </div>
        </div>
        
        {/* Status čuvanja */}
        {savingResult && (
          <div className="saving-indicator">
            <div className="spinner-small"></div>
            <p>Čuvanje rezultata...</p>
          </div>
        )}
        
        {saveStatus && (
          <div className="save-status" style={{
            background: saveStatus.includes('✅') ? '#d4edda' : '#fff3cd',
            color: saveStatus.includes('✅') ? '#155724' : '#856404',
            padding: '10px',
            borderRadius: '5px',
            margin: '10px 0',
            textAlign: 'center'
          }}>
            {saveStatus}
            {saveStatus.includes('samo lokalno') && (
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                Profesor će videti rezultat kada se sledeći put uloguje
              </div>
            )}
          </div>
        )}
        
        <div className="score-summary">
          <div className="score-card primary">
            <div className="score-value">{correctCount}/{questions.length}</div>
            <div className="score-label">Tačnih odgovora</div>
          </div>
          
          <div className="score-card" style={{
            background: score >= 80 ? '#d4edda' : 
                       score >= 60 ? '#fff3cd' : 
                       '#f8d7da'
          }}>
            <div className="score-value">{score}%</div>
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

        {/* Ocena */}
        <div className="grade-evaluation">
          {score >= 90 && <div className="grade excellent">⭐ Odličan (5)</div>}
          {score >= 75 && score < 90 && <div className="grade very-good">👍 Vrlo dobar (4)</div>}
          {score >= 60 && score < 75 && <div className="grade good">👌 Dobar (3)</div>}
          {score >= 50 && score < 60 && <div className="grade sufficient">✅ Dovoljan (2)</div>}
          {score < 50 && <div className="grade insufficient">❌ Nedovoljan (1)</div>}
          
          <div className="grade-info">
            {score >= 50 ? (
              <p>🎉 Čestitamo! Položili ste kviz.</p>
            ) : (
              <p>📚 Preporučujemo dodatno učenje pre sledećeg pokušaja.</p>
            )}
          </div>
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
                userAnswer={answers[index]?.selected}
              />
              <div className="review-status">
                {answers[index] ? (
                  answers[index].isCorrect ? (
                    <span className="status-correct">✅ Odgovoreno tačno</span>
                  ) : (
                    <span className="status-incorrect">
                      ❌ Odgovoreno pogrešno<br/>
                      <small>Tačan odgovor: {question.options[question.correct]}</small>
                    </span>
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
          <button onClick={() => window.location.href = '/#/'} className="home-btn">
            🏠 Nazad na početnu
          </button>
          {user?.role === 'professor' && (
            <button 
              onClick={() => window.location.href = '/#/professor/quiz-results'} 
              className="professor-btn"
            >
              👨‍🏫 Pregled rezultata
            </button>
          )}
        </div>
        
        <div className="result-note">
          <p>
            <small>
              ⓘ Rezultat je sačuvan u sistemu. Profesor može da vidi sve rezultate u delu za profesore.
            </small>
          </p>
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
                setTimeSpent(0);
              }}
            >
              📚 Učenje
            </button>
            <button 
              className={quizMode === 'test' ? 'active' : ''}
              onClick={() => {
                setQuizMode('test');
                setStartTime(null);
                setTimeSpent(0);
              }}
            >
              📝 Test
            </button>
            <button 
              className={quizMode === 'exam' ? 'active' : ''}
              onClick={() => {
                setQuizMode('exam');
                if (!startTime) {
                  setStartTime(Date.now());
                  setTimeSpent(0);
                }
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
              ⏱️ {formatTime(3600 - timeSpent)}
              <div className="timer-label">Preostalo vreme</div>
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
        userAnswer={answers[currentQuestion]?.selected}
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
                title={`Pitanje ${index + 1}${answers[index] ? ' (odgovoreno)' : ''}`}
              >
                {index + 1}
              </button>
            ))}
            {questions.length > 10 && (
              <span className="jump-more">+{questions.length - 10} više</span>
            )}
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
              {correctCount}/{answeredCount || 0}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Trenutni skor:</span>
            <span className="stat-value">
              {currentScore}%
            </span>
          </div>
        </div>
        
        {quizMode !== 'learning' && (
          <div className="quiz-instructions">
            <p>
              <strong>💡 Uputstvo:</strong> Klikni na odgovor da bi ga odabrao/la. 
              Možeš da preskočiš pitanje - neće se računati kao pogrešno.
              {quizMode === 'exam' && ' Ispit traje 60 minuta.'}
            </p>
          </div>
        )}
        
        {/* Student info */}
        <div className="student-info">
          <small>
            Student: <strong>{user?.displayName || user?.email || 'Gost'}</strong>
            {user?.studentId && ` (${user.studentId})`}
          </small>
        </div>
      </div>
    </div>
  );
}

export default Quiz;