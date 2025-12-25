import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Sačuvaj token i podatke o korisniku
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Pozovi callback
        onLogin(data.user);
        
        // Preusmeri na početnu stranu
        navigate('/');
      } else {
        setError(data.message || 'Greška pri prijavi');
      }
    } catch (err) {
      setError('Server greška. Proveri da li je backend pokrenut.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>👋 Dobrodošli nazad</h2>
          <p>Prijavite se da biste nastavili sa učenjem</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email adresa:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="unesite@email.com"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Lozinka:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Vaša lozinka"
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="auth-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Prijavljivanje...
              </>
            ) : 'Prijavi se'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>ili</span>
        </div>
        
        <div className="demo-login">
          <p>Želiš da testiraš aplikaciju?</p>
          <div className="demo-buttons">
            <button 
              className="demo-btn student"
              onClick={() => {
                setFormData({
                  email: 'student@test.com',
                  password: 'student123'
                });
              }}
            >
              👨‍🎓 Demo Student
            </button>
            <button 
              className="demo-btn professor"
              onClick={() => {
                setFormData({
                  email: 'profesor@test.com',
                  password: 'profesor123'
                });
              }}
            >
              👨‍🏫 Demo Profesor
            </button>
          </div>
        </div>
        
        <p className="auth-switch">
          Nemaš nalog?{' '}
          <span onClick={() => navigate('/register')}>
            Registruj se
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;