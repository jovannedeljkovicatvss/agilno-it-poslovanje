// src/components/Admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import './AdminDashboard.css';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [professorForm, setProfessorForm] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      loadAllUsers();
    }
  }, [activeTab]);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const usersList = [];
      snapshot.forEach(doc => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfessor = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!professorForm.email.endsWith('@agilnoit.edu.rs')) {
      setMessage('❌ Email mora biti u domeni @agilnoit.edu.rs');
      return;
    }
    
    if (professorForm.password.length < 6) {
      setMessage('❌ Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    try {
      // Kreiraj u Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        professorForm.email, 
        professorForm.password
      );
      const newUser = userCredential.user;
      
      // Sačuvaj u Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        email: professorForm.email,
        displayName: professorForm.name,
        role: 'professor',
        isApproved: true,
        createdAt: new Date(),
        createdBy: user.email,
        approvedAt: new Date()
      });

      setMessage(`✅ Profesor "${professorForm.name}" uspešno kreiran!`);
      
      // Resetuj formu
      setProfessorForm({ email: '', password: '', name: '' });
      
      // Osveži listu korisnika
      setTimeout(() => loadAllUsers(), 1000);
      
    } catch (error) {
      console.error('Error creating professor:', error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage('❌ Email je već u upotrebi.');
      } else {
        setMessage(`❌ Greška: ${error.message}`);
      }
    }
  };

  const handleInputChange = (e) => {
    setProfessorForm({
      ...professorForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>👑 Administratorski Panel</h1>
        <p>Dobrodošli, {user.name}!</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Pregled
        </button>
        <button 
          className={`tab-btn ${activeTab === 'createProfessor' ? 'active' : ''}`}
          onClick={() => setActiveTab('createProfessor')}
        >
          👨‍🏫 Kreiraj Profesora
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Svi Korisnici
        </button>
        <button 
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          ⚙️ Sistem
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview">
            <h2>Dobrodošli u Admin Panel</h2>
            <p>Ovde možete upravljati celim sistemom.</p>
            
            <div className="admin-stats">
              <div className="stat-card">
                <h3>👑 Vaša uloga</h3>
                <p>Administrator</p>
              </div>
              <div className="stat-card">
                <h3>📧 Vaš email</h3>
                <p>{user.email}</p>
              </div>
              <div className="stat-card">
                <h3>🆔 Vaš ID</h3>
                <p>{user.uid.substring(0, 10)}...</p>
              </div>
            </div>
            
            <div className="quick-actions">
              <h3>⚡ Brze akcije</h3>
              <div className="actions-grid">
                <button onClick={() => setActiveTab('createProfessor')} className="action-btn">
                  👨‍🏫 Kreiraj novog profesora
                </button>
                <button onClick={() => setActiveTab('users')} className="action-btn">
                  👥 Pregled svih korisnika
                </button>
                <button className="action-btn">
                  📊 Sistem statistika
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'createProfessor' && (
          <div className="create-professor">
            <h2>Kreiraj novog profesora</h2>
            
            {message && (
              <div className={`alert ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleCreateProfessor}>
              <div className="form-group">
                <label>Ime i prezime profesora:</label>
                <input
                  type="text"
                  name="name"
                  value={professorForm.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Marko Marković"
                />
              </div>
              
              <div className="form-group">
                <label>Email profesora:</label>
                <input
                  type="email"
                  name="email"
                  value={professorForm.email}
                  onChange={handleInputChange}
                  required
                  placeholder="marko.markovic@agilnoit.edu.rs"
                />
                <small>Mora biti u domeni @agilnoit.edu.rs</small>
              </div>
              
              <div className="form-group">
                <label>Privremena lozinka:</label>
                <input
                  type="password"
                  name="password"
                  value={professorForm.password}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  placeholder="Minimalno 6 karaktera"
                />
                <small>Profesor će moći da promeni lozinku nakon prvog logina</small>
              </div>
              
              <button type="submit" className="btn-primary">
                👨‍🏫 Kreiraj Professorski Nalog
              </button>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-list">
            <h2>Svi korisnici sistema ({users.length})</h2>
            
            {loading ? (
              <p>Učitavanje korisnika...</p>
            ) : (
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Ime</th>
                      <th>Email</th>
                      <th>Uloga</th>
                      <th>Status</th>
                      <th>Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.displayName || user.name || '-'}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role === 'admin' ? '👑 Admin' : 
                             user.role === 'professor' ? '👨‍🏫 Profesor' : 
                             '👨‍🎓 Student'}
                          </span>
                        </td>
                        <td>
                          {user.role === 'student' ? (
                            user.approved ? '✅ Odobren' : '⏳ Na čekanju'
                          ) : '✅ Aktivan'}
                        </td>
                        <td>
                          {user.createdAt?.toDate?.().toLocaleDateString('sr-RS') || 'Nepoznato'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="system-info">
            <h2>Sistemske informacije</h2>
            <div className="info-grid">
              <div className="info-card">
                <h3>📊 Baza podataka</h3>
                <p>Firebase Firestore</p>
                <p>Kolekcije: users, quizResults</p>
              </div>
              <div className="info-card">
                <h3>🔐 Autentifikacija</h3>
                <p>Firebase Authentication</p>
                <p>Metode: Email/Password</p>
              </div>
              <div className="info-card">
                <h3>👥 Korisnici</h3>
                <p>Admin: 1 (vi)</p>
                <p>Profesori: {users.filter(u => u.role === 'professor').length}</p>
                <p>Studenti: {users.filter(u => u.role === 'student').length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;