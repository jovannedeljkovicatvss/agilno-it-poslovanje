import React, { useState, useEffect } from 'react';
import './Admin.css';

function ProfessorDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Form states
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    explanation: '',
    category: 'Scrum Principi',
    difficulty: 'Srednje'
  });
  
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    studentIds: 'all',
    type: 'info'
  });

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'questions') {
      fetchQuestions();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/professor/results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/questions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/professor/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/professor/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewStudent = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/professor/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedStudent(data);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuestion)
      });
      
      if (response.ok) {
        alert('Pitanje uspešno dodato!');
        setNewQuestion({
          question: '',
          options: ['', '', '', ''],
          correct: 0,
          explanation: '',
          category: 'Scrum Principi',
          difficulty: 'Srednje'
        });
        fetchQuestions();
      } else {
        const error = await response.json();
        alert(`Greška: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Greška pri dodavanju pitanja');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/professor/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNotification)
      });
      
      if (response.ok) {
        alert('Obaveštenje uspešno poslato!');
        setNewNotification({
          title: '',
          message: '',
          studentIds: 'all',
          type: 'info'
        });
        fetchNotifications();
      } else {
        const error = await response.json();
        alert(`Greška: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Greška pri slanju obaveštenja');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Ime', 'Email', 'Indeks', 'Prosek %', 'Pokušaja', 'Najbolji %', 'Najlošiji %', 'Poslednji pokušaj'],
      ...students.map(s => [
        s.username,
        s.email,
        s.studentId,
        s.avgScore,
        s.attempts,
        s.bestScore,
        s.worstScore,
        new Date(s.lastAttempt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'studenti_rezultati.csv';
    a.click();
  };

  if (loading && activeTab === 'students') {
    return <div className="loading">Učitavanje podataka...</div>;
  }

  return (
    <div className="professor-dashboard">
      <div className="dashboard-header">
        <h1>👨‍🏫 Kontrolni panel profesora</h1>
        <p>Upravljaj studentima, pitanjima i obaveštenjima</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Studenti
        </button>
        <button 
          className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          ❓ Pitanja
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          📢 Obaveštenja
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistika
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'students' && (
          <div className="students-tab">
            <div className="tab-header">
              <h2>Lista studenata i rezultati</h2>
              <button onClick={exportToCSV} className="export-btn">
                📥 Izvezi u CSV
              </button>
            </div>
            
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>RB</th>
                    <th>Ime i prezime</th>
                    <th>Email</th>
                    <th>Indeks</th>
                    <th>Prosek</th>
                    <th>Pokušaja</th>
                    <th>Najbolji</th>
                    <th>Poslednji pokušaj</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.userId}>
                      <td>{index + 1}</td>
                      <td>{student.username}</td>
                      <td>{student.email}</td>
                      <td>{student.studentId}</td>
                      <td>
                        <div className="score-cell">
                          <div className="score-bar">
                            <div 
                              className="score-fill"
                              style={{ width: `${student.avgScore}%` }}
                            ></div>
                          </div>
                          <span className="score-value">{student.avgScore}%</span>
                        </div>
                      </td>
                      <td>{student.attempts}</td>
                      <td>
                        <span className="best-score">{student.bestScore}%</span>
                      </td>
                      <td>
                        {student.lastAttempt 
                          ? new Date(student.lastAttempt).toLocaleDateString('sr-RS')
                          : 'Nije pokušao'
                        }
                      </td>
                      <td className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => handleViewStudent(student.userId)}
                        >
                          👁️ Pregled
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedStudent && (
              <div className="student-details-modal">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>Detalji studenta: {selectedStudent.student.name}</h3>
                    <button onClick={() => setSelectedStudent(null)} className="close-btn">
                      ✕
                    </button>
                  </div>
                  
                  <div className="student-info">
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Email:</label>
                        <span>{selectedStudent.student.email}</span>
                      </div>
                      <div className="info-item">
                        <label>Broj indeksa:</label>
                        <span>{selectedStudent.student.studentId}</span>
                      </div>
                      <div className="info-item">
                        <label>Registrovan:</label>
                        <span>{new Date(selectedStudent.student.registeredAt).toLocaleDateString('sr-RS')}</span>
                      </div>
                    </div>
                    
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-value">{selectedStudent.stats.totalAttempts}</div>
                        <div className="stat-label">Ukupno pokušaja</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{selectedStudent.stats.avgScore}%</div>
                        <div className="stat-label">Prosečan rezultat</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{selectedStudent.stats.bestScore}%</div>
                        <div className="stat-label">Najbolji rezultat</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{selectedStudent.stats.worstScore}%</div>
                        <div className="stat-label">Najlošiji rezultat</div>
                      </div>
                    </div>
                    
                    <h4>Istorija testova</h4>
                    <div className="test-history">
                      {selectedStudent.results.map((result, index) => (
                        <div key={index} className="test-item">
                          <div className="test-date">
                            {new Date(result.createdAt).toLocaleDateString('sr-RS')}
                          </div>
                          <div className="test-score">
                            <span className={`score-badge ${result.percentage >= 80 ? 'good' : result.percentage >= 60 ? 'average' : 'poor'}`}>
                              {result.percentage}%
                            </span>
                          </div>
                          <div className="test-details">
                            {result.score}/{result.totalQuestions} tačnih
                          </div>
                          <div className="test-time">
                            {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="questions-tab">
            <div className="tab-header">
              <h2>Upravljanje pitanjima ({questions.length})</h2>
            </div>
            
            <div className="questions-grid">
              <div className="add-question-form">
                <h3>➕ Dodaj novo pitanje</h3>
                <form onSubmit={handleAddQuestion}>
                  <div className="form-group">
                    <label>Pitanje:</label>
                    <textarea
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                      required
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Opcije odgovora:</label>
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="option-input">
                        <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion({...newQuestion, options: newOptions});
                          }}
                          required
                          placeholder={`Opcija ${String.fromCharCode(65 + index)}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tačan odgovor:</label>
                      <select
                        value={newQuestion.correct}
                        onChange={(e) => setNewQuestion({...newQuestion, correct: parseInt(e.target.value)})}
                      >
                        <option value="0">A</option>
                        <option value="1">B</option>
                        <option value="2">C</option>
                        <option value="3">D</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Kategorija:</label>
                      <select
                        value={newQuestion.category}
                        onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                      >
                        <option value="Scrum Principi">Scrum Principi</option>
                        <option value="Sprint Planning">Sprint Planning</option>
                        <option value="Team Dinamika">Team Dinamika</option>
                        <option value="Agile Principi">Agile Principi</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Težina:</label>
                      <select
                        value={newQuestion.difficulty}
                        onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                      >
                        <option value="Lako">Lako</option>
                        <option value="Srednje">Srednje</option>
                        <option value="Teško">Teško</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Objašnjenje:</label>
                    <textarea
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                      rows="3"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    ✅ Dodaj pitanje
                  </button>
                </form>
              </div>
              
              <div className="questions-list">
                <h3>📋 Lista pitanja ({questions.length})</h3>
                <div className="questions-container">
                  {questions.map((q) => (
                    <div key={q.id} className="question-item">
                      <div className="question-header">
                        <span className="question-id">#{q.id}</span>
                        <span className="question-category">{q.category}</span>
                        <span className={`question-difficulty ${q.difficulty.toLowerCase()}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="question-text">{q.question}</p>
                      <div className="question-options">
                        {q.options.map((option, index) => (
                          <div 
                            key={index}
                            className={`question-option ${index === q.correct ? 'correct' : ''}`}
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </div>
                        ))}
                      </div>
                      <div className="question-actions">
                        <button className="edit-btn">✏️ Izmeni</button>
                        <button className="delete-btn">🗑️ Obriši</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-tab">
            <div className="tab-header">
              <h2>Slanje obaveštenja</h2>
            </div>
            
            <div className="notifications-grid">
              <div className="send-notification-form">
                <h3>📤 Pošalji novo obaveštenje</h3>
                <form onSubmit={handleSendNotification}>
                  <div className="form-group">
                    <label>Naslov:</label>
                    <input
                      type="text"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                      required
                      placeholder="Naslov obaveštenja"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Poruka:</label>
                    <textarea
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                      required
                      rows="4"
                      placeholder="Sadržaj obaveštenja..."
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Primalac:</label>
                      <select
                        value={newNotification.studentIds}
                        onChange={(e) => setNewNotification({...newNotification, studentIds: e.target.value})}
                      >
                        <option value="all">Svi studenti</option>
                        {students.map(s => (
                          <option key={s.userId} value={s.userId}>
                            {s.username} ({s.studentId})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Tip:</label>
                      <select
                        value={newNotification.type}
                        onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                      >
                        <option value="info">Info</option>
                        <option value="warning">Upozorenje</option>
                        <option value="reminder">Podsetnik</option>
                        <option value="announcement">Obaveštenje</option>
                      </select>
                    </div>
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    📤 Pošalji obaveštenje
                  </button>
                </form>
              </div>
              
              <div className="notifications-history">
                <h3>📨 Istorija obaveštenja</h3>
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-header">
                        <span className="notification-title">{notification.title}</span>
                        <span className={`notification-type ${notification.type}`}>
                          {notification.type}
                        </span>
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-footer">
                        <span className="notification-sender">
                          Poslao: {notification.sentBy}
                        </span>
                        <span className="notification-date">
                          {new Date(notification.sentAt).toLocaleDateString('sr-RS')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-tab">
            <div className="tab-header">
              <h2>📊 Statistika sistema</h2>
            </div>
            
            <div className="stats-overview">
              <div className="stats-grid-large">
                <div className="stat-card-large">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalStudents || 0}</div>
                    <div className="stat-label">Studenata</div>
                  </div>
                </div>
                
                <div className="stat-card-large">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalQuizAttempts || 0}</div>
                    <div className="stat-label">Pokušaja kviza</div>
                  </div>
                </div>
                
                <div className="stat-card-large">
                  <div className="stat-icon">❓</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalQuestions || 0}</div>
                    <div className="stat-label">Pitanja</div>
                  </div>
                </div>
                
                <div className="stat-card-large">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.avgStudentScore || 0}%</div>
                    <div className="stat-label">Prosek studenata</div>
                  </div>
                </div>
              </div>
              
              <div className="charts-section">
                <h3>Kategorije pitanja</h3>
                <div className="categories-chart">
                  {stats.categories && Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="category-item">
                      <div className="category-name">{category}</div>
                      <div className="category-bar">
                        <div 
                          className="category-fill"
                          style={{ 
                            width: `${(count / (stats.totalQuestions || 1)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="category-count">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="activity-section">
                <h3>Aktivnost studenata</h3>
                <div className="activity-stats">
                  <div className="activity-item">
                    <div className="activity-label">Aktivni ove nedelje:</div>
                    <div className="activity-value">{stats.activeThisWeek || 0} studenta</div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-label">Ukupno pokušaja:</div>
                    <div className="activity-value">{stats.totalQuizAttempts || 0}</div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-label">Prosečan rezultat:</div>
                    <div className="activity-value">{stats.avgStudentScore || 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfessorDashboard;