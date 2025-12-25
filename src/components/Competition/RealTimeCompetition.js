import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Competition.css';

function RealTimeCompetition() {
  const [roomId, setRoomId] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [scores, setScores] = useState({});
  const [timer, setTimer] = useState(30);
  const [isHost, setIsHost] = useState(false);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('user-joined', (userId) => {
      setCompetitors(prev => [...prev, { id: userId, name: `Korisnik ${prev.length + 1}`, score: 0 }]);
    });
    
    socketRef.current.on('answer-update', (data) => {
      setScores(prev => ({
        ...prev,
        [data.userId]: (prev[data.userId] || 0) + (data.isCorrect ? 10 : 0)
      }));
    });
    
    return () => socketRef.current.disconnect();
  }, []);

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 6);
    setRoomId(newRoomId);
    setIsHost(true);
    socketRef.current.emit('join-competition', newRoomId);
  };

  const joinRoom = () => {
    if (roomId) {
      socketRef.current.emit('join-competition', roomId);
    }
  };

  const startCompetition = () => {
    // Generiši prvo pitanje
    const question = {
      id: 1,
      text: "Koja od sledećih nije tradicionalna Scrum aktivnost?",
      options: ["Planiranje Sprinta", "Pregled Sprinta", "Retrospektiva", "Nedeljna provera"],
      correct: 3
    };
    setCurrentQuestion(question);
    
    // Pokreni timer
    let timeLeft = 30;
    const interval = setInterval(() => {
      setTimer(timeLeft);
      timeLeft--;
      if (timeLeft < 0) {
        clearInterval(interval);
        // Pređi na sledeće pitanje
      }
    }, 1000);
  };

  const submitAnswer = (optionIndex) => {
    const isCorrect = optionIndex === currentQuestion.correct;
    socketRef.current.emit('submit-answer', {
      roomId,
      userId: socketRef.current.id,
      answer: optionIndex,
      isCorrect
    });
  };

  return (
    <div className="competition-container">
      <h2>⚡ Takmičenje u realnom vremenu</h2>
      
      {!roomId ? (
        <div className="room-creation">
          <button onClick={createRoom} className="primary-btn">
            🏁 Kreiraj takmičenje
          </button>
          <div className="join-room">
            <input
              type="text"
              placeholder="Unesi kod sobe"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={joinRoom} className="secondary-btn">
              Pridruži se
            </button>
          </div>
        </div>
      ) : (
        <div className="competition-room">
          <div className="room-info">
            <div className="room-id">
              Kod sobe: <strong>{roomId}</strong>
              <button onClick={() => navigator.clipboard.writeText(roomId)}>
                📋 Kopiraj
              </button>
            </div>
            <div className="timer">⏱️ {timer}s</div>
          </div>
          
          <div className="competition-grid">
            <div className="competitors-panel">
              <h3>Takmičari ({competitors.length})</h3>
              {competitors.map((comp, index) => (
                <div key={comp.id} className="competitor">
                  <span className="competitor-name">{comp.name}</span>
                  <span className="competitor-score">{scores[comp.id] || 0} poena</span>
                </div>
              ))}
            </div>
            
            <div className="question-panel">
              {currentQuestion ? (
                <>
                  <h3>Pitanje</h3>
                  <div className="competition-question">
                    {currentQuestion.text}
                  </div>
                  
                  <div className="competition-options">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => submitAnswer(index)}
                        className="competition-option"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="waiting-room">
                  <h3>💡 Čekamo takmičare...</h3>
                  <p>Podeli kod sobe drugima da se pridruže!</p>
                  {isHost && (
                    <button onClick={startCompetition} className="start-btn">
                      🚀 Započni takmičenje
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="scoreboard-panel">
              <h3>🏆 Trenutni rang</h3>
              {Object.entries(scores)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([userId, score], index) => (
                  <div key={userId} className="scoreboard-entry">
                    <span className="rank">#{index + 1}</span>
                    <span className="player-name">
                      {competitors.find(c => c.id === userId)?.name || 'Igrac'}
                    </span>
                    <span className="player-score">{score} pts</span>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTimeCompetition;