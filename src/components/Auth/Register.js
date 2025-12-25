import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Ime je obavezno');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email je obavezan');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email nije validan');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Lozinke se ne podudaraju');
      return false;
    }
    
    if (formData.role === 'student' && !formData.studentId.trim()) {
      setError('Broj indeksa je obavezan za studente');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          studentId: formData.role === 'student' ? formData.studentId : undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Registracija uspešna! Sada se možete prijaviti.');
        
        // Automatski prijavi korisnika
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (onRegister) {
          onRegister(data.user);
        }
        
        // Preusmeri na početnu stranu nakon 2 sekunde
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(data.message || 'Greška pri registraciji');
      }
    } catch (err) {
      setError('Server greška. Proveri da li je backend pokrenut.');
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🚀 Kreiraj novi nalog</h2>
          <p>Pridruži se platformi za učenje</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ime i prezime:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Marko Marković"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Email adresa:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="marko@example.com"
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
              placeholder="Najmanje 6 karaktera"
              disabled={loading}
            />
            <small className="form-hint">Najmanje 6 karaktera</small>
          </div>
          
          <div className="form-group">
            <label>Potvrdi lozinku:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Ponovite lozinku"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Želim da se registrujem kao:</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${formData.role === 'student' ? 'active' : ''}`}
                onClick={() => {
                  setFormData({...formData, role: 'student'});
                }}
                disabled={loading}
              >
                👨‍🎓 Student
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'professor' ? 'active' : ''}`}
                onClick={() => {
                  setFormData({...formData, role: 'professor', studentId: ''});
                }}
                disabled={loading}
              >
                👨‍🏫 Profesor
              </button>
            </div>
          </div>
          
          {formData.role === 'student' && (
            <div className="form-group">
              <label>Broj indeksa:</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required={formData.role === 'student'}
                placeholder="RA123/2023"
                disabled={loading}
              />
            </div>
          )}
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              ✅ {success}
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
                Registruje se...
              </>
            ) : 'Registruj se'}
          </button>
        </form>
        
        <p className="auth-switch">
          Već imaš nalog?{' '}
          <span onClick={() => navigate('/login')}>
            Prijavi se
          </span>
        </p>
        
        <div className="terms">
          <small>
            Klikom na "Registruj se" prihvatate{' '}
            <a href="/uslovi">Uslove korišćenja</a> i{' '}
            <a href="/privatnost">Politiku privatnosti</a>
          </small>
        </div>
      </div>
    </div>
  );
}

export default Register;