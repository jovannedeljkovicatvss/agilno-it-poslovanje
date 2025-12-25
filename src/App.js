import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Komponente
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Quiz from './components/Quiz/Quiz'; // Ili SimpleQuiz ako koristiš taj
import Leaderboard from './components/Competition/Leaderboard';
import ProfessorDashboard from './components/Admin/ProfessorDashboard';
import Home from './components/Home';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Proveri da li je korisnik već ulogovan
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Učitavanje aplikacije...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user ? (
          <AuthenticatedApp user={user} onLogout={handleLogout} />
        ) : (
          <UnauthenticatedApp onLogin={handleLogin} onRegister={handleRegister} />
        )}
      </div>
    </Router>
  );
}

// Komponenta za autentifikovane korisnike
function AuthenticatedApp({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            🎓 Agilno IT Poslovanje
          </h1>
          <p className="subtitle">
            {user.role === 'professor' ? 'Kontrolni panel profesora' : 'Platforma za učenje'}
          </p>
        </div>
        
        <div className="user-menu">
          <div className="user-info">
            <span className="user-name">👤 {user.name}</span>
            <span className="user-role">
              {user.role === 'professor' ? '👨‍🏫 Profesor' : '👨‍🎓 Student'}
            </span>
            {user.studentId && (
              <span className="student-id">📘 {user.studentId}</span>
            )}
          </div>
          <button onClick={onLogout} className="logout-btn">
            🚪 Izloguj se
          </button>
        </div>
      </header>
      
      <nav className="main-nav">
        <button onClick={() => navigate('/')} className="nav-btn">
          🏠 Početna
        </button>
        <button onClick={() => navigate('/kviz')} className="nav-btn">
          📝 Kviz
        </button>
        <button onClick={() => navigate('/rang-lista')} className="nav-btn">
          🏆 Rang lista
        </button>
        {user.role === 'professor' && (
          <button onClick={() => navigate('/profesor')} className="nav-btn">
            👨‍🏫 Profesor Panel
          </button>
        )}
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/kviz" element={<Quiz user={user} />} />
          <Route path="/rang-lista" element={<Leaderboard />} />
          <Route path="/profesor" element={<ProfessorDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2024 Agilno IT Poslovanje - Platforma za učenje</p>
          <div className="footer-links">
            <span>👥 {user.role === 'professor' ? 'Profesor mod' : 'Student mod'}</span>
            <span>📧 {user.email}</span>
          </div>
        </div>
      </footer>
    </>
  );
}

// Komponenta za neautentifikovane korisnike
function UnauthenticatedApp({ onLogin, onRegister }) {
  return (
    <div className="unauth-container">
      <div className="unauth-header">
        <h1>🎓 Agilno IT Poslovanje</h1>
        <p className="subtitle">Interaktivna platforma za pripremu ispita</p>
      </div>
      
      <main className="unauth-main">
        <Routes>
          <Route path="/login" element={<Login onLogin={onLogin} />} />
          <Route path="/register" element={<Register onRegister={onRegister} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
      
      <footer className="unauth-footer">
        <p>Pridruži se da bi pristupio/la 100+ pitanja, rang listi i kvizovima!</p>
        <div className="auth-links">
          <a href="/login">Prijavi se</a>
          <span>•</span>
          <a href="/register">Registruj se</a>
        </div>
      </footer>
    </div>
  );
}

export default App;