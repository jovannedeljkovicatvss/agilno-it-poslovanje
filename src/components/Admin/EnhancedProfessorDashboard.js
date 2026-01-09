import React, { useState, useEffect } from 'react';
import { firebaseQuiz } from '../../services/firebaseQuiz';
import './ProfessorDashboard.css';

function EnhancedProfessorDashboard() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Uzmi sve podatke odjednom
      const [pendingResult, allStudentsResult, statsResult] = await Promise.all([
        firebaseQuiz.getPendingStudents(),
        firebaseQuiz.getAllStudents(),
        firebaseQuiz.getProfessorStats()
      ]);
      
      if (pendingResult.success) {
        setPendingStudents(pendingResult.data);
      }
      
      if (allStudentsResult.success) {
        const approved = allStudentsResult.data.filter(s => s.approved === true);
        setApprovedStudents(approved);
      }
      
      if (statsResult.success) {
        setStats(statsResult.data);
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setMessage('Greška pri učitavanju podataka.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId, studentName) => {
    try {
      const result = await firebaseQuiz.approveStudent(studentId);
      
      if (result.success) {
        setMessage(`✅ Student ${studentName} odobren!`);
        
        // Osveži listu
        setTimeout(() => {
          loadDashboardData();
          setMessage('');
        }, 2000);
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Greška pri odobravanju');
    }
  };

  const handleReject = async (studentId, studentName) => {
    if (!window.confirm(`Da li ste sigurni da želite da odbijete studenta ${studentName}?`)) {
      return;
    }
    
    try {
      const result = await firebaseQuiz.rejectStudent(studentId);
      
      if (result.success) {
        setMessage(`❌ Student ${studentName} odbijen.`);
        
        setTimeout(() => {
          loadDashboardData();
          setMessage('');
        }, 2000);
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Greška pri odbijanju');
    }
  };

  const approveAllPending = async () => {
    if (!window.confirm('Da li ste sigurni da želite da odobrite sve studente na čekanju?')) {
      return;
    }
    
    try {
      for (const student of pendingStudents) {
        await firebaseQuiz.approveStudent(student.id);
      }
      
      setMessage('✅ Svi studenti odobreni!');
      setTimeout(() => {
        loadDashboardData();
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage('❌ Greška pri masovnom odobravanju');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Učitavanje kontrolnog panela...</p>
      </div>
    );
  }

  return (
    <div className="professor-dashboard">
      <div className="dashboard-header">
        <h2>👨‍🏫 Kontrolni Panel Profesora</h2>
        <p>Upravljanje studentima i rezultatima kvizova</p>
      </div>
      
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      
      {/* Statistika */}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Ukupno studenata</h3>
              <p className="stat-number">{stats.totalStudents}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Na čekanju</h3>
              <p className="stat-number">{stats.pendingStudents}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Odobreni</h3>
              <p className="stat-number">{stats.approvedStudents}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Ukupno kvizova</h3>
              <p className="stat-number">{stats.totalQuizzes}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Na čekanju ({pendingStudents.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          ✅ Odobreni ({approvedStudents.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          ⚙️ Akcije
        </button>
      </div>
      
      {/* Content based on active tab */}
      <div className="tab-content">
        {activeTab === 'pending' && (
          <div className="students-section">
            <div className="section-header">
              <h3>📋 Studenti na čekanju</h3>
              {pendingStudents.length > 0 && (
                <button 
                  onClick={approveAllPending}
                  className="btn-approve-all"
                >
                  ✅ Odobri sve
                </button>
              )}
            </div>
            
            {pendingStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h4>Nema studenata na čekanju!</h4>
                <p>Svi zahtevi su obrađeni.</p>
              </div>
            ) : (
              <div className="students-grid">
                {pendingStudents.map(student => (
                  <div key={student.id} className="student-card pending">
                    <div className="student-avatar">
                      {student.name.charAt(0)}
                    </div>
                    <div className="student-info">
                      <h4>{student.name}</h4>
                      <p className="student-email">📧 {student.email}</p>
                      <p className="student-id">🎓 {student.studentId}</p>
                      <p className="student-date">
                        📅 Prijavljen: {new Date(student.createdAt).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                    <div className="student-actions">
                      <button 
                        onClick={() => handleApprove(student.id, student.name)}
                        className="btn-approve"
                      >
                        ✅ Odobri
                      </button>
                      <button 
                        onClick={() => handleReject(student.id, student.name)}
                        className="btn-reject"
                      >
                        ❌ Odbij
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'approved' && (
          <div className="students-section">
            <h3>✅ Odobreni studenti</h3>
            
            {approvedStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🎓</div>
                <h4>Nema odobrenih studenata</h4>
                <p>Odobrite neke studente sa liste na čekanju.</p>
              </div>
            ) : (
              <div className="students-grid">
                {approvedStudents.map(student => (
                  <div key={student.id} className="student-card approved">
                    <div className="student-avatar approved">
                      {student.name.charAt(0)}
                    </div>
                    <div className="student-info">
                      <h4>{student.name}</h4>
                      <p className="student-email">📧 {student.email}</p>
                      <p className="student-id">🎓 {student.studentId}</p>
                      <p className="student-status">
                        ✅ Odobren: {new Date(student.approvedAt || student.createdAt).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'actions' && (
          <div className="actions-section">
            <h3>⚙️ Administrativne akcije</h3>
            
            <div className="actions-grid">
              <div className="action-card">
                <h4>📊 Izvezi podatke</h4>
                <p>Preuzmi sve podatke o studentima i rezultatima u CSV formatu.</p>
                <button className="action-btn export">
                  📥 Preuzmi izveštaj
                </button>
              </div>
              
              <div className="action-card">
                <h4>📧 Pošalji obaveštenje</h4>
                <p>Pošaljite email svim studentima sa važnim obaveštenjima.</p>
                <button className="action-btn notify">
                  📨 Pošalji obaveštenje
                </button>
              </div>
              
              <div className="action-card">
                <h4>🔄 Resetuj kvizove</h4>
                <p>Obriši sve rezultate kvizova i počni iz početka.</p>
                <button className="action-btn reset">
                  🔄 Resetuj kvizove
                </button>
              </div>
            </div>
            
            <div className="system-info">
              <h4>ℹ️ Informacije o sistemu</h4>
              <ul>
                <li><strong>Baza podataka:</strong> Firebase Firestore</li>
                <li><strong>Autentifikacija:</strong> Firebase Auth</li>
                <li><strong>Ukupno korisnika:</strong> {stats?.totalStudents || 0}</li>
                <li><strong>Poslednje ažuriranje:</strong> {new Date().toLocaleString('sr-RS')}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedProfessorDashboard;