// src/components/Auth/Register.js
import React, { useState } from 'react';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validacija
    if (!name.trim()) {
      setError('Molimo unesite ime i prezime.');
      return;
    }
    
    if (!email.trim()) {
      setError('Molimo unesite email adresu.');
      return;
    }
    
    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju.');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔧 Pokrećem Firebase registraciju...');
      
      // 1. Kreiraj u Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Firebase Auth uspešan:', user.uid);
      
      // 2. Sačuvaj u Firestore kao student
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        displayName: name.trim(),
        studentId: studentId.trim() || 'N/A',
        role: 'student',
        approved: false,
        status: 'pending',
        createdAt: new Date(),
        uid: user.uid
      });
      
      console.log('✅ Firestore uspešan: Student registrovan');
      
      // 3. Automatski prijavi korisnika nakon registracije
      // 4. Preusmeri na pending stranicu
      alert('✅ Registracija uspešna! Vaš nalog čeka odobrenje profesora.');
      navigate('/pending-approval'); // Kreirajte ovu stranicu ako već niste
      
    } catch (error) {
      console.error('❌ Greška pri registraciji:', error.code, error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('Email adresa je već registrovana.');
      } else if (error.code === 'auth/weak-password') {
        setError('Lozinka mora imati najmanje 6 karaktera.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email nije validan.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Registracija nije dozvoljena. Kontaktirajte administratora.');
      } else {
        setError('Došlo je do greške: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg style={styles.logoSvg} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 15.5c-4.14 0-7.5-3.36-7.5-7.5S7.86 3.5 12 3.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
            </svg>
          </div>
          <h2 style={styles.title}>Registracija studenta</h2>
          <p style={styles.subtitle}>Kreirajte nalog za pristup sistemu</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            <div style={styles.errorContent}>
              <svg style={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p style={styles.errorText}>{error}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ime i prezime *</label>
            <div style={styles.inputContainer}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
                placeholder="Marko Marković"
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Broj indeksa (opciono)</label>
            <div style={styles.inputContainer}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={styles.input}
                placeholder="RA-123/2023"
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email adresa *</label>
            <div style={styles.inputContainer}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="marko@student.edu.rs"
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Lozinka *</label>
            <div style={styles.inputContainer}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                style={styles.input}
                placeholder="Najmanje 6 karaktera"
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? (
                  <svg style={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg style={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Potvrdi lozinku *</label>
            <div style={styles.inputContainer}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Ponovite lozinku"
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
              >
                {showConfirmPassword ? (
                  <svg style={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg style={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={styles.passwordRequirements}>
            <p style={styles.requirementsTitle}>Zahtevi za lozinku:</p>
            <ul style={styles.requirementsList}>
              <li style={styles.requirementItem}>• Najmanje 6 karaktera</li>
              <li style={styles.requirementItem}>• Lozinke moraju da se poklapaju</li>
            </ul>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonLoading : {}),
              ...(loading ? {} : styles.submitButtonHover)
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.transform = 'translateY(0)';
            }}
          >
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                Registruje se...
              </div>
            ) : 'Registruj se'}
          </button>
        </form>

        {/* Login Link */}
        <div style={styles.loginLink}>
          <p style={styles.loginText}>
            Već imate nalog?{' '}
            <Link to="/login" style={styles.loginLinkStyle}>
              Prijavite se
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            * Obavezna polja<br />
            Nalog mora biti odobren od strane profesora pre korišćenja sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
    padding: '40px',
    position: 'relative'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logo: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  logoSvg: {
    width: '28px',
    height: '28px',
    color: 'white'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px',
    lineHeight: '1.2'
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: '0',
    lineHeight: '1.5'
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '24px'
  },
  errorContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  },
  errorIcon: {
    width: '20px',
    height: '20px',
    color: '#dc2626',
    flexShrink: '0',
    marginTop: '2px'
  },
  errorText: {
    margin: '0',
    fontSize: '14px',
    color: '#7f1d1d',
    lineHeight: '1.5'
  },
  form: {
    marginBottom: '32px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },
  inputContainer: {
    position: 'relative'
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    color: '#9ca3af',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '16px 16px 16px 48px',
    fontSize: '15px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  passwordToggle: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleIcon: {
    width: '20px',
    height: '20px'
  },
  passwordRequirements: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '24px'
  },
  requirementsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px'
  },
  requirementsList: {
    margin: '0',
    paddingLeft: '20px'
  },
  requirementItem: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '4px'
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
  },
  submitButtonHover: {
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
    }
  },
  submitButtonLoading: {
    opacity: '0.8',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loginLink: {
    textAlign: 'center',
    padding: '16px 0',
    borderTop: '1px solid #e5e7eb'
  },
  loginText: {
    margin: '0',
    fontSize: '15px',
    color: '#6b7280'
  },
  loginLinkStyle: {
    color: '#10b981',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s ease'
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb'
  },
  footerText: {
    margin: '0',
    fontSize: '13px',
    color: '#9ca3af',
    lineHeight: '1.5'
  }
};

// Dodajte ove stilove u vaš index.css fajl
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  input:focus {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
    outline: none;
  }
  
  a:hover {
    color: #059669 !important;
  }
`;

export default Register;