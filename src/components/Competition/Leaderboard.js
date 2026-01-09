import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'; // DODAJ OVO
import './Leaderboard.css';

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [dataSource, setDataSource] = useState('firebase'); // 'firebase' ili 'local'

  useEffect(() => {
    loadLeaderboard();
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📊 Učitavam rang listu...');
      
      // PRVO POKUŠAJ FIREBASE
      try {
        const results = await loadFromFirebase();
        if (results.length > 0) {
          setDataSource('firebase');
          processData(results);
          return;
        }
      } catch (firebaseError) {
        console.warn('Firebase greška:', firebaseError);
      }
      
      // PA POKUŠAJ LOCALSTORAGE
      const localResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
      if (localResults.length > 0) {
        setDataSource('local');
        processData(localResults);
      } else {
        // AKO NEMA PODATAKA - DEMO
        generateDemoLeaderboard();
        setDataSource('demo');
      }
      
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Greška pri učitavanju rang liste.');
      generateDemoLeaderboard();
    } finally {
      setLoading(false);
    }
  };

  const loadFromFirebase = async () => {
    console.log('🔍 Učitavam iz Firebase...');
    
    try {
      // Učitaj sve rezultate
      const resultsRef = collection(db, "quizResults");
      let q;
      
      // Prilagodi query za vremenski filter
      if (timeFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Ovo zahteva indeks, probaj bez filtera prvo
        q = query(resultsRef, orderBy("submittedAt", "desc"));
      } else if (timeFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        q = query(resultsRef, orderBy("submittedAt", "desc"));
      } else {
        q = query(resultsRef, orderBy("submittedAt", "desc"));
      }
      
      const snapshot = await getDocs(q);
      const results = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Filtriranje na klijentu za vremenski filter
        if (timeFilter !== 'all') {
          const submittedDate = data.submittedAt?.toDate?.() || new Date(data.submittedAt || data.createdAt);
          const now = new Date();
          
          if (timeFilter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (submittedDate < today) return;
          } else if (timeFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (submittedDate < weekAgo) return;
          }
        }
        
        results.push({
          id: doc.id,
          ...data,
          submittedDate: data.submittedAt?.toDate?.() || new Date(data.submittedAt || data.createdAt)
        });
      });
      
      console.log(`✅ Učitano ${results.length} rezultata iz Firebase`);
      return results;
      
    } catch (error) {
      console.error('❌ Greška pri učitavanju iz Firebase:', error);
      return [];
    }
  };

  const processData = (quizResults) => {
    const userStats = {};
    
    quizResults.forEach(result => {
      const userId = result.userId || result.email || 'anonymous';
      const userName = result.studentName || result.userName || result.email || 'Anonimni korisnik';
      const studentId = result.studentId || result.index || 'N/A';
      
      if (!userStats[userId]) {
        userStats[userId] = {
          userId: userId,
          name: userName,
          studentId: studentId,
          totalPercentage: 0,
          totalQuizzes: 0,
          bestPercentage: 0,
          averagePercentage: 0,
          lastActivity: result.submittedDate || result.submittedAt || result.createdAt || new Date(),
          // Dodatno za statistiku
          totalScore: 0,
          totalTime: 0
        };
      }
      
      // Koristi percentage (broj)
      const percentageValue = Number(result.percentage) || 0;
      const timeSpent = Number(result.timeSpent) || 0;
      
      userStats[userId].totalPercentage += percentageValue;
      userStats[userId].totalScore += percentageValue;
      userStats[userId].totalQuizzes += 1;
      userStats[userId].totalTime += timeSpent;
      userStats[userId].bestPercentage = Math.max(
        userStats[userId].bestPercentage, 
        percentageValue
      );
      
      // Ažuriraj poslednju aktivnost
      const resultDate = result.submittedDate || result.submittedAt || result.createdAt;
      if (resultDate) {
        const currentDate = new Date(userStats[userId].lastActivity);
        const newDate = new Date(resultDate);
        if (newDate > currentDate) {
          userStats[userId].lastActivity = newDate;
        }
      }
    });
    
    // Izračunaj proseke
    const processedData = Object.values(userStats)
      .map(user => ({
        ...user,
        averagePercentage: user.totalQuizzes > 0 
          ? Math.round(user.totalPercentage / user.totalQuizzes) 
          : 0,
        averageTime: user.totalQuizzes > 0
          ? Math.round(user.totalTime / user.totalQuizzes / 60) // u minutima
          : 0
      }))
      .filter(user => user.totalQuizzes > 0) // Prikaži samo one sa rezultatima
      .sort((a, b) => b.averagePercentage - a.averagePercentage)
      .slice(0, 50); // Povećaj limit
    
    // KREIRAJ PODATKE ZA GRAFIKON
    const chartDataForGraph = processedData
      .slice(0, 8) // Uzmi top 8 za grafikon
      .map((student, index) => ({
        id: student.userId,
        name: student.name.split(' ')[0] || student.name, // Samo prvo ime
        fullName: student.name,
        score: student.averagePercentage,
        quizzes: student.totalQuizzes,
        color: getColorForIndex(index)
      }));
    
    console.log('Processed data:', {
      totalStudents: processedData.length,
      source: dataSource,
      topStudent: processedData[0]?.name
    });
    
    if (processedData.length === 0) {
      setError('Nema rezultata za prikaz. Budite prvi koji će uraditi kviz!');
    } else {
      setLeaderboardData(processedData);
      setChartData(chartDataForGraph);
    }
  };

  const getColorForIndex = (index) => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
      '#9b59b6', '#1abc9c', '#d35400', '#34495e'
    ];
    return colors[index % colors.length];
  };

  const generateDemoLeaderboard = () => {
    console.log('Generating demo leaderboard');
    
    const demoData = [
      { 
        userId: 'demo-1', 
        name: 'Ana Petrović', 
        studentId: 'RA-001/2024', 
        totalPercentage: 850, 
        totalQuizzes: 10, 
        bestPercentage: 98, 
        averagePercentage: 85, 
        lastActivity: new Date().toISOString() 
      },
      // ... ostali demo podaci
    ];
    
    const demoChartData = demoData.map((student, index) => ({
      id: student.userId,
      name: student.name.split(' ')[0],
      fullName: student.name,
      score: student.averagePercentage,
      quizzes: student.totalQuizzes,
      color: getColorForIndex(index)
    }));
    
    setLeaderboardData(demoData);
    setChartData(demoChartData);
    setError('ℹ️ Prikazani su demo podaci. Uradite kviz da biste se pojavili na listi.');
    setDataSource('demo');
  };

  // Dodaj ovu funkciju za sinhronizaciju
  const syncToFirebase = async () => {
    try {
      const localResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
      if (localResults.length === 0) {
        alert('Nema lokalnih rezultata za sinhronizaciju.');
        return;
      }
      
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      let added = 0;
      
      for (const result of localResults) {
        try {
          // Proveri da li već postoji (pojednostavljeno)
          const firebaseResult = {
            userId: result.userId || 'local_' + Date.now(),
            studentName: result.userName || result.studentName || 'Student',
            email: result.email || '',
            studentId: result.studentId || '',
            quizName: result.quizName || 'Agilno IT Poslovanje',
            percentage: result.percentage || result.score || 0,
            correctAnswers: result.correctAnswers || 0,
            totalQuestions: result.totalQuestions || 20,
            timeSpent: result.timeSpent || 0,
            mode: result.mode || 'test',
            submittedAt: serverTimestamp(),
            createdAt: new Date().toISOString(),
            source: 'localStorage_sync'
          };
          
          await addDoc(collection(db, "quizResults"), firebaseResult);
          added++;
        } catch (error) {
          console.error('Greška pri sinhronizaciji:', error);
        }
      }
      
      if (added > 0) {
        alert(`✅ Sinhronizovano ${added} rezultata u Firebase!`);
        loadLeaderboard(); // Ponovo učitaj
      }
    } catch (error) {
      console.error('Greška pri sinhronizaciji:', error);
      alert('❌ Greška pri sinhronizaciji.');
    }
  };

  // Komponenta za jednostavan grafikonski prikaz (isti kod)
  const SimpleBarChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="empty-chart">
          <div className="empty-chart-icon">📊</div>
          <p>Nema podataka za grafikon</p>
        </div>
      );
    }
    
    const maxScore = Math.max(...data.map(d => d.score));
    
    return (
      <div className="simple-bar-chart">
        <div className="chart-title">Top {data.length} rezultata</div>
        <div className="chart-bars">
          {data.map((item, index) => (
            <div key={item.id || index} className="chart-bar-item">
              <div className="bar-info">
                <div className="bar-label">
                  <span className="bar-name">{item.name}</span>
                  <span className="bar-score">{item.score}%</span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${(item.score / maxScore) * 100}%`,
                      backgroundColor: item.color
                    }}
                  >
                    <span className="bar-value">{item.score}%</span>
                  </div>
                </div>
              </div>
              <div className="bar-tooltip">
                {item.fullName}: {item.score}% prosečno ({item.quizzes} kvizova)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Komponenta za pie chart (isti kod)
  const SimplePieChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    const total = data.reduce((sum, item) => sum + item.score, 0);
    let cumulativePercent = 0;
    
    return (
      <div className="simple-pie-chart">
        <div className="pie-title">Raspodela po proseku</div>
        <div className="pie-container">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {data.map((item, index) => {
              const percent = (item.score / total) * 100;
              const startPercent = cumulativePercent;
              cumulativePercent += percent;
              
              const startAngle = (startPercent / 100) * 360;
              const endAngle = (cumulativePercent / 100) * 360;
              
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              
              const x1 = 100 + 80 * Math.cos(startRad);
              const y1 = 100 + 80 * Math.sin(startRad);
              const x2 = 100 + 80 * Math.cos(endRad);
              const y2 = 100 + 80 * Math.sin(endRad);
              
              const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
              
              return (
                <path
                  key={index}
                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                  stroke="#fff"
                  strokeWidth="2"
                />
              );
            })}
            <circle cx="100" cy="100" r="40" fill="white" />
            <text x="100" y="100" textAnchor="middle" dy=".3em" className="pie-center-text">
              Top {data.length}
            </text>
          </svg>
          
          <div className="pie-legend">
            {data.map((item, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="legend-text">
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-percent">{item.score}%</span>
                  <span className="legend-quizzes">({item.quizzes})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const refreshLeaderboard = () => {
    loadLeaderboard();
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Rank', 'Ime', 'Indeks', 'Prosek %', 'Najbolji %', 'Broj kvizova', 'Poslednja aktivnost', 'Izvor'],
      ...leaderboardData.map((student, index) => [
        index + 1,
        student.name,
        student.studentId,
        `${student.averagePercentage}%`,
        `${student.bestPercentage}%`,
        student.totalQuizzes,
        new Date(student.lastActivity).toLocaleDateString('sr-RS'),
        dataSource === 'firebase' ? 'Firebase' : 'Local/Demo'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rang-lista-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Učitavanje rang liste...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>🏆 Rang lista studenata</h2>
        <p>Pregled najboljih rezultata na kvizovima iz Agilnog IT Poslovanja</p>
        
        <div className="data-source-info">
          <span className={`source-badge ${dataSource}`}>
            {dataSource === 'firebase' ? '🌐 Firebase podaci' : 
             dataSource === 'local' ? '💾 Lokalni podaci' : 
             '🎯 Demo podaci'}
          </span>
          
          {dataSource !== 'firebase' && (
            <button 
              onClick={syncToFirebase}
              className="sync-btn"
              title="Sinhronizuj lokalne rezultate sa Firebase"
            >
              🔄 Sinhronizuj sa Firebase
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className={`info-message ${dataSource === 'demo' ? 'demo-message' : ''}`}>
          {error}
        </div>
      )}
      
      <div className="leaderboard-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            Sve vreme
          </button>
          <button 
            className={`filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFilter('week')}
          >
            Poslednjih 7 dana
          </button>
          <button 
            className={`filter-btn ${timeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setTimeFilter('today')}
          >
            Danas
          </button>
        </div>
        
        <div className="action-buttons">
          <button onClick={refreshLeaderboard} className="refresh-btn">
            🔄 Osveži
          </button>
          <button onClick={exportToCSV} className="export-btn">
            📊 Izvezi CSV
          </button>
        </div>
      </div>
      
      <div className="leaderboard-content">
        <div className="table-section">
          <h3>📋 Tabela rangiranja</h3>
          
          {leaderboardData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h4>Nema rezultata za prikaz</h4>
              <p>Niko još nije uradio kviz sa ovim filterima.</p>
              <button 
                onClick={() => window.location.href = '/#/kviz'}
                className="quiz-btn"
              >
                🎯 Idi na kviz
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Indeks</th>
                    <th>Prosek</th>
                    <th>Najbolji</th>
                    <th>Kvizova</th>
                    <th>Poslednje</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((student, index) => (
                    <tr key={student.userId} className={index < 3 ? `top-${index + 1}` : ''}>
                      <td className="rank-cell">
                        <div className={`rank-badge ${index < 3 ? `rank-${index + 1}` : ''}`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="student-cell">
                        <div className="student-info">
                          <div className="student-avatar">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <strong>{student.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{student.studentId}</td>
                      <td className="score-cell">
                        <span className="score-badge">
                          {student.averagePercentage}%
                        </span>
                      </td>
                      <td>
                        <span className="best-score">
                          {student.bestPercentage}%
                        </span>
                      </td>
                      <td>{student.totalQuizzes}</td>
                      <td className="date-cell">
                        {student.lastActivity 
                          ? new Date(student.lastActivity).toLocaleDateString('sr-RS')
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="chart-section">
          <h3>📈 Grafički prikaz</h3>
          <div className="charts-container">
            <div className="chart-card">
              <SimpleBarChart data={chartData} />
            </div>
            <div className="chart-card">
              <SimplePieChart data={chartData.slice(0, 5)} />
            </div>
          </div>
          
          <div className="stats-summary">
            <h4>📊 Statistika rang liste</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{leaderboardData.length}</div>
                  <div className="stat-label">Studenata</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {leaderboardData.length > 0 ? `${leaderboardData[0].averagePercentage}%` : '0%'}
                  </div>
                  <div className="stat-label">Najbolji prosek</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {leaderboardData.length > 0 
                      ? Math.round(leaderboardData.reduce((sum, s) => sum + s.totalQuizzes, 0) / leaderboardData.length)
                      : 0
                    }
                  </div>
                  <div className="stat-label">Prosečno kvizova</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {leaderboardData.length > 0
                      ? new Date(Math.max(...leaderboardData.map(s => new Date(s.lastActivity))))?.toLocaleDateString('sr-RS')?.split('.')[0]
                      : 'N/A'
                    }
                  </div>
                  <div className="stat-label">Poslednji kviz</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="leaderboard-footer">
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color rank-1"></div>
            <span>1. mesto</span>
          </div>
          <div className="legend-item">
            <div className="legend-color rank-2"></div>
            <span>2. mesto</span>
          </div>
          <div className="legend-item">
            <div className="legend-color rank-3"></div>
            <span>3. mesto</span>
          </div>
        </div>
        
        <div className="update-info">
          <small>
            Poslednje ažuriranje: {new Date().toLocaleString('sr-RS')}
          </small>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;