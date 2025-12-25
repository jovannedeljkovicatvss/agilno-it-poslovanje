import React, { useState, useEffect } from 'react';
import './Competition.css';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
    fetchMyStats();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/leaderboard');
      
      if (!response.ok) {
        throw new Error('Greška pri učitavanju rang liste');
      }
      
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError(err.message);
      // Fallback mock data ako server ne radi
      setLeaderboard(getMockLeaderboard());
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:5000/api/my-results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        calculateMyStats(data);
      }
    } catch (err) {
      console.error('Error fetching my stats:', err);
      // Fallback mock stats
      setMyStats({
        avgScore: 87,
        attempts: 15,
        rank: 8,
        bestScore: 95,
        avgTime: 52
      });
    }
  };

  const calculateMyStats = (results) => {
    if (!results || results.length === 0) {
      setMyStats({
        avgScore: 0,
        attempts: 0,
        rank: '-',
        bestScore: 0,
        avgTime: 0
      });
      return;
    }
    
    const avgScore = results.reduce((sum, result) => sum + result.percentage, 0) / results.length;
    const bestScore = Math.max(...results.map(r => r.percentage));
    const avgTime = results.reduce((sum, result) => sum + (result.timeSpent || 0), 0) / results.length;
    
    setMyStats({
      avgScore: Math.round(avgScore),
      attempts: results.length,
      rank: '-', // Ovo bi se izračunalo na serveru
      bestScore: Math.round(bestScore),
      avgTime: Math.round(avgTime)
    });
  };

  const getMockLeaderboard = () => {
    return [
      { username: 'Marko Marković', avgScore: 95, attempts: 10, bestScore: 98, avgTimePerQuiz: 45 },
      { username: 'Ana Anić', avgScore: 92, attempts: 8, bestScore: 96, avgTimePerQuiz: 50 },
      { username: 'Petar Petrović', avgScore: 88, attempts: 12, bestScore: 92, avgTimePerQuiz: 55 },
      { username: 'Jovana Jovanović', avgScore: 85, attempts: 6, bestScore: 90, avgTimePerQuiz: 48 },
      { username: 'Nikola Nikolić', avgScore: 82, attempts: 9, bestScore: 88, avgTimePerQuiz: 60 },
      { username: 'Mila Milić', avgScore: 80, attempts: 7, bestScore: 85, avgTimePerQuiz: 52 },
      { username: 'Stefan Stefanović', avgScore: 78, attempts: 11, bestScore: 83, avgTimePerQuiz: 58 },
      { username: 'Sara Savić', avgScore: 75, attempts: 5, bestScore: 80, avgTimePerQuiz: 47 },
      { username: 'Luka Lukić', avgScore: 72, attempts: 8, bestScore: 78, avgTimePerQuiz: 62 },
      { username: 'Ema Erić', avgScore: 70, attempts: 6, bestScore: 75, avgTimePerQuiz: 55 }
    ];
  };

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'; // zeleno
    if (score >= 80) return '#3b82f6'; // plavo
    if (score >= 70) return '#f59e0b'; // žuto
    if (score >= 60) return '#f97316'; // narandžasto
    return '#ef4444'; // crveno
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Učitavanje rang liste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <div className="header-content">
          <h1>🏆 Rang lista</h1>
          <p className="subtitle">Najbolji studenti po prosečnom rezultatu</p>
        </div>
        
        <div className="timeframe-selector">
          <button 
            className={timeframe === 'daily' ? 'active' : ''}
            onClick={() => setTimeframe('daily')}
          >
            Dnevno
          </button>
          <button 
            className={timeframe === 'weekly' ? 'active' : ''}
            onClick={() => setTimeframe('weekly')}
          >
            Nedeljno
          </button>
          <button 
            className={timeframe === 'monthly' ? 'active' : ''}
            onClick={() => setTimeframe('monthly')}
          >
            Mesečno
          </button>
          <button 
            className={timeframe === 'all' ? 'active' : ''}
            onClick={() => setTimeframe('all')}
          >
            Sve vreme
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
         ⚠️ {error} (prikazani su test podaci)
        </div>
      )}

      <div className="leaderboard-content">
        <div className="podium">
          {leaderboard.slice(0, 3).map((player, index) => (
            <div key={index} className={`podium-place place-${index + 1}`}>
              <div className="podium-medal">{getMedal(index)}</div>
              <div className="podium-avatar">
                {index === 0 && '👑'}
                {index === 1 && '⭐'}
                {index === 2 && '🔥'}
              </div>
              <div className="podium-name">{player.username}</div>
              <div className="podium-score" style={{ color: getScoreColor(player.avgScore) }}>
                {player.avgScore}%
              </div>
              <div className="podium-details">
                <span>{player.attempts} pokušaja</span>
                <span>Best: {player.bestScore}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="leaderboard-table">
          <div className="table-header">
            <div className="header-cell rank">Rang</div>
            <div className="header-cell name">Ime</div>
            <div className="header-cell score">Prosek</div>
            <div className="header-cell attempts">Pokušaja</div>
            <div className="header-cell best">Najbolji</div>
            <div className="header-cell time">Vreme</div>
          </div>
          
          <div className="table-body">
            {leaderboard.slice(3).map((player, index) => (
              <div key={index + 3} className="table-row">
                <div className="cell rank-cell">
                  <span className="rank-number">#{index + 4}</span>
                </div>
                <div className="cell name-cell">
                  <div className="player-info">
                    <span className="player-name">{player.username}</span>
                    <span className="player-id">{player.studentId || ''}</span>
                  </div>
                </div>
                <div className="cell score-cell">
                  <div className="score-bar-container">
                    <div className="score-bar">
                      <div 
                        className="score-fill"
                        style={{ 
                          width: `${player.avgScore}%`,
                          backgroundColor: getScoreColor(player.avgScore)
                        }}
                      ></div>
                    </div>
                    <span className="score-value">{player.avgScore}%</span>
                  </div>
                </div>
                <div className="cell attempts-cell">
                  <div className="attempts-badge">
                    {player.attempts}
                  </div>
                </div>
                <div className="cell best-cell">
                  <span className="best-score" style={{ color: getScoreColor(player.bestScore) }}>
                    {player.bestScore}%
                  </span>
                </div>
                <div className="cell time-cell">
                  <span className="time-value">
                    {player.avgTimePerQuiz}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {myStats && (
          <div className="my-stats-panel">
            <h3>📊 Tvoji rezultati</h3>
            <div className="my-stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">{myStats.avgScore}%</div>
                  <div className="stat-label">Prosek</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{myStats.attempts}</div>
                  <div className="stat-label">Pokušaja</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-value">#{myStats.rank}</div>
                  <div className="stat-label">Tvoj rang</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-value">{myStats.bestScore}%</div>
                  <div className="stat-label">Najbolji rezultat</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <div className="stat-value">{myStats.avgTime}s</div>
                  <div className="stat-label">Prosečno vreme</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">Dan 15</div>
                  <div className="stat-label">Streak</div>
                </div>
              </div>
            </div>
            
            <div className="progress-tip">
              <span className="tip-icon">💡</span>
              <p>
                Da bi se popeo na rang listu, pokušaj da ostvariš prosek iznad 85% 
                i rešiš više od 10 kvizova nedeljno!
              </p>
            </div>
          </div>
        )}

        <div className="leaderboard-actions">
          <button 
            className="refresh-btn"
            onClick={fetchLeaderboard}
            disabled={loading}
          >
            🔄 Osveži rang listu
          </button>
          <button 
            className="share-btn"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link kopiran u clipboard!');
            }}
          >
            📋 Podeli rang listu
          </button>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;