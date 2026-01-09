import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { auth, db } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './App.css';

// Komponente
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Quiz from './components/Quiz/Quiz';
import Leaderboard from './components/Competition/Leaderboard';
import ProfessorDashboard from './components/Professor/ProfessorDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import CreateProfessor from './components/Admin/CreateProfessor';
import Home from './components/Home';
import DeleteStudents from './components/Professor/DeleteStudents';
import PendingApproval from './components/Auth/PendingApproval';

// Nove profesorske komponente
import PendingStudents from './components/Professor/PendingStudents';
import QuizResults from './components/Professor/QuizResults';
import Analytics from './components/Professor/Analytics';
import AddQuestions from './components/Professor/AddQuestions';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pratite Firebase Auth stanje
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Korisnik je ulogovan preko Firebase
        console.log('✅ Firebase user detected:', firebaseUser.email);
        
        try {
          // Uzmi dodatne podatke iz Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Sačuvaj u state
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.displayName || userData.name || firebaseUser.email,
              role: userData.role || 'student',
              studentId: userData.studentId,
              approved: userData.approved || false,
              ...userData
            });
          } else {
            // Ako nema podataka u Firestore, koristi osnovne
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.email,
              role: 'student',
              approved: false
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email,
            role: 'student',
            approved: false
          });
        }
      } else {
        // Korisnik nije ulogovan
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
          <UnauthenticatedApp />
        )}
      </div>
    </Router>
  );
}

// Komponenta za autentifikovane korisnike
function AuthenticatedApp({ user, onLogout }) {
  const navigate = useNavigate();

  // Provera da li je korisnik odobren (za studente)
  const isStudentApproved = user.role === 'student' ? user.approved === true : true;

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            🎓 Agilno IT Poslovanje
          </h1>
          <p className="subtitle">
            {user.role === 'admin' ? 'Administratorski panel' : 
             user.role === 'professor' ? 'Kontrolni panel profesora' : 
             isStudentApproved ? 'Platforma za učenje' : 'Čeka se odobrenje'}
          </p>
        </div>
        
        <div className="user-menu">
          <div className="user-info">
            <span className="user-name">👤 {user.name}</span>
            <span className={`user-role ${user.role}`}>
              {user.role === 'admin' ? '👑 Admin' : 
               user.role === 'professor' ? '👨‍🏫 Profesor' : 
               '👨‍🎓 Student'}
            </span>
            {user.studentId && (
              <span className="student-id">📘 {user.studentId}</span>
            )}
            {user.role === 'student' && !user.approved && (
              <span className="pending-badge">⏳ Čeka odobrenje</span>
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
        
        {user.role === 'admin' && (
          <>
            <button onClick={() => navigate('/admin')} className="nav-btn">
              👑 Admin Panel
            </button>
            <button onClick={() => navigate('/admin/create-professor')} className="nav-btn">
              ➕ Dodaj Profesora
            </button>
          </>
        )}
        
        {user.role === 'professor' && (
  <>
    <button onClick={() => navigate('/professor')} className="nav-btn">
      👨‍🏫 Profesor Panel
    </button>
    <button onClick={() => navigate('/professor/pending')} className="nav-btn">
      👥 Studenti na čekanju
    </button>
    <button onClick={() => navigate('/professor/quiz-results')} className="nav-btn">
      📊 Rezultati kvizova
    </button>
<button onClick={() => navigate('/professor/delete-students')} className="nav-btn">
  🗑️ Obriši Studente
</button>
    <button onClick={() => navigate('/professor/add-questions')} className="nav-btn">
      ➕ Dodaj Pitanja
    </button>
  </>
)}
        
        {user.role === 'student' && isStudentApproved && (
          <>
            <button onClick={() => navigate('/kviz')} className="nav-btn">
              📝 Započni Kviz
            </button>
            <button onClick={() => navigate('/rang-lista')} className="nav-btn">
              🏆 Rang Lista
            </button>
          </>
        )}
        
        {user.role === 'student' && !isStudentApproved && (
          <button className="nav-btn disabled" disabled>
            ⏳ Čeka se odobrenje profesora
          </button>
        )}
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          
          {/* Admin rute */}
          {user.role === 'admin' && (
            <>
              <Route path="/admin" element={<AdminDashboard user={user} />} />
              <Route path="/admin/create-professor" element={<CreateProfessor user={user} />} />
            </>
          )}
          
          {/* Profesor rute */}
          {user.role === 'professor' && (
            <>
              <Route path="/professor" element={<ProfessorDashboard user={user} />} />
              <Route path="/professor/pending" element={<PendingStudents />} />
              <Route path="/professor/quiz-results" element={<QuizResults />} />
              <Route path="/professor/analytics" element={<Analytics />} />
              <Route path="/professor/add-questions" element={<AddQuestions />} />
		<Route path="/professor/delete-students" element={<DeleteStudents />} />
		<Route path="/pending-approval" element={<PendingApproval />} />
            </>
          )}
          
          {/* Student rute (samo odobreni) */}
          {user.role === 'student' && isStudentApproved && (
            <>
              <Route path="/kviz" element={<Quiz user={user} />} />
              <Route path="/rang-lista" element={<Leaderboard />} />
            </>
          )}
          
          {/* Student rute (nije odobren) */}
          {user.role === 'student' && !isStudentApproved && (
            <Route path="*" element={
              <div className="pending-approval">
                <h2>⏳ Čeka se odobrenje</h2>
                <p>Vaš nalog čeka odobrenje profesora.</p>
                <p>Možete pristupiti aplikaciji tek nakon što vas profesor odobri.</p>
                <p>Kontaktirajte svog profesora za više informacija.</p>
              </div>
            } />
          )}
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2024 Agilno IT Poslovanje - Platforma za učenje</p>
          <div className="footer-links">
            <span className={`mode-badge ${user.role}`}>
              {user.role === 'admin' ? '👑 Admin' : 
               user.role === 'professor' ? '👨‍🏫 Profesor' : 
               '👨‍🎓 Student'}
            </span>
            <span>📧 {user.email}</span>
            {user.role === 'student' && (
              <span>{user.approved ? '✅ Odobren' : '⏳ Na čekanju'}</span>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}

// Komponenta za neautentifikovane korisnike
function UnauthenticatedApp() {
  return (
    <div className="unauth-container">
      <div className="unauth-header">
        <h1>🎓 Agilno IT Poslovanje</h1>
        <p className="subtitle">Interaktivna platforma za pripremu ispita</p>
      </div>
      
      <main className="unauth-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
      
      <footer className="unauth-footer">
        <p>Pridruži se da bi pristupio/la kvizovima i rang listi!</p>
        <div className="auth-links">
          <Link to="/login">Prijavi se</Link>
          <span>•</span>
          <Link to="/register">Registruj se</Link>
        </div>
      </footer>
    </div>
  );
}

export default App;