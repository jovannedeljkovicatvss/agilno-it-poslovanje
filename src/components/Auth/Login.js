// src/components/Auth/Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('🔐 Pokrećem Firebase login...');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth uspešan:', firebaseUser.email);
      
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('Korisnički podaci nisu pronađeni');
      }
      
      const userData = userDoc.data();
      console.log('✅ Firestore podaci:', userData);
      
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'professor') {
        navigate('/professor');
      } else if (userData.role === 'student') {
        if (userData.approved) {
          navigate('/');
        } else {
          navigate('/pending-approval');
        }
      }
      
    } catch (error) {
      console.error('❌ Login greška:', error.code, error.message);
      
      if (error.code === 'auth/user-not-found') {
        setError('Korisnik sa ovim email-om ne postoji.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Pogrešna lozinka.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email nije validan.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Previše neuspelih pokušaja. Pokušajte kasnije.');
      } else {
        setError('Došlo je do greške pri prijavi: ' + error.message);
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
              <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm3 10v8H9v-8h6zm-3-8c1.654 0 3 1.346 3 3v3H9V7c0-1.654 1.346-3 3-3z"/>
            </svg>
          </div>
          <h2 style={styles.title}>Prijava u sistem</h2>
          <p style={styles.subtitle}>Unesite svoje podatke za pristup</p>
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

        {/* Login Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email adresa</label>
            <div style={styles.inputContainer}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="ime.prezime@domen.com"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Lozinka</label>
            <div style={styles.inputContainer}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? (
                  <svg style={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg style={styles.toggleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonLoading : {})
            }}
          >
            {loading ? (
              <div style={styles.loadingContainer}>
                <svg style={styles.spinner} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" opacity="0.75"/>
                </svg>
                Prijavljujem...
              </div>
            ) : 'Prijavi se'}
          </button>
        </form>

        {/* Registration Link */}
        <div style={styles.registration}>
          <p style={styles.registrationText}>
            Nemate nalog?{' '}
            <Link to="/register" style={styles.registrationLink}>
  Registrujte se
</Link>
          </p>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Za pomoć ili tehničku podršku, kontaktirajte administratora sistema.
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
    maxWidth: '440px',
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
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
    marginBottom: '24px',
    animation: 'fadeIn 0.3s ease-in-out'
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
    marginBottom: '24px'
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
  inputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
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
    color: '#6b7280'
  },
  toggleIcon: {
    width: '20px',
    height: '20px'
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  submitButtonLoading: {
    opacity: '0.8',
    cursor: 'not-allowed'
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
    animation: 'spin 1s linear infinite'
  },
  registration: {
    textAlign: 'center',
    padding: '16px 0',
    borderTop: '1px solid #e5e7eb'
  },
  registrationText: {
    margin: '0',
    fontSize: '15px',
    color: '#6b7280'
  },
  registrationLink: {
    color: '#3b82f6',
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

// Dodajte ove stilove u globalni CSS fajl
const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    outline: none;
  }
  
  a:hover {
    color: #1d4ed8 !important;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
  }
`;

// Dodajte globalStyles u vaš index.css fajl
export default Login;