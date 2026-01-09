import React, { useState, useEffect } from 'react';
import './ProfessorDashboard.css';

function ProfessorDashboard() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' ili 'approved'

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      // Učitaj studente na čekanju iz localStorage
      const pending = JSON.parse(localStorage.getItem('pendingStudents') || '[]');
      
      // Učitaj sve korisnike i filtriraj odobrene studente
      const allUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      const approved = allUsers.filter(user => 
        user.role === 'student' && user.approved === true
      );
      
      setPendingStudents(pending);
      setApprovedStudents(approved);
    } catch (err) {
      console.error('Error loading students:', err);
      setMessage('Greška pri učitavanju studenata');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId) => {
    try {
      // Učitaj sve korisnike
      const allUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      
      // Pronađi studenta i postavi approved na true
      const updatedUsers = allUsers.map(user => {
        if (user.id === studentId) {
          return { ...user, approved: true };
        }
        return user;
      });
      
      // Sačuvaj ažurirane korisnike
      localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
      
      // Ukloni studenta iz pending liste
      const updatedPending = pendingStudents.filter(student => student.id !== studentId);
      localStorage.setItem('pendingStudents', JSON.stringify(updatedPending));
      
      // Ažuriraj stanje
      const approvedStudent = allUsers.find(user => user.id === studentId);
      if (approvedStudent) {
        setApprovedStudents([...approvedStudents, { ...approvedStudent, approved: true }]);
      }
      
      setPendingStudents(updatedPending);
      setMessage(`✅ Student ${approvedStudent?.name} je odobren!`);
      
      // Automatski osveži nakon 3 sekunde
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error approving student:', err);
      setMessage('❌ Greška pri odobravanju studenta');
    }
  };

  const handleReject = async (studentId) => {
    try {
      // Ukloni studenta iz pending liste
      const updatedPending = pendingStudents.filter(student => student.id !== studentId);
      localStorage.setItem('pendingStudents', JSON.stringify(updatedPending));
      
      // Ukloni studenta iz glavne baze
      const allUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      const updatedUsers = allUsers.filter(user => user.id !== studentId);
      localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
      
      // Ažuriraj stanje
      setPendingStudents(updatedPending);
      const rejectedStudent = pendingStudents.find(s => s.id === studentId);
      setMessage(`❌ Student ${rejectedStudent?.name} je odbijen.`);
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error rejecting student:', err);
      setMessage('❌ Greška pri odbijanju studenta');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (window.confirm('Da li ste sigurni da želite da uklonite ovog studenta?')) {
      try {
        // Ukloni studenta iz glavne baze
        const allUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        const updatedUsers = allUsers.filter(user => user.id !== studentId);
        localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
        
        // Ažuriraj listu odobrenih studenata
        const updatedApproved = approvedStudents.filter(student => student.id !== studentId);
        setApprovedStudents(updatedApproved);
        
        setMessage('✅ Student je uklonjen iz sistema.');
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
        
      } catch (err) {
        console.error('Error removing student:', err);
        setMessage('❌ Greška pri uklanjanju studenta');
      }
    }
  };

  const approveAll = () => {
    if (window.confirm('Da li ste sigurni da želite da odobrite sve studente na čekanju?')) {
      pendingStudents.forEach(student => {
        handleApprove(student.id);
      });
      setMessage('✅ Svi studenti su odobreni!');
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
        <p>Upravljajte studentima i pristupom platformi</p>
      </div>
      
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Na čekanju</h3>
            <p className="stat-number">{pendingStudents.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Odobreni</h3>
            <p className="stat-number">{approvedStudents.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-content">
            <h3>Ukupno</h3>
            <p className="stat-number">{pendingStudents.length + approvedStudents.length}</p>
          </div>
        </div>
      </div>
      
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
      </div>
      
      {activeTab === 'pending' && (
        <div className="students-section">
          <div className="section-header">
            <h3>📋 Studenti na čekanju</h3>
            {pendingStudents.length > 0 && (
              <button 
                onClick={approveAll}
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
            <div className="students-list">
              {pendingStudents.map(student => (
                <div key={student.id} className="student-card pending">
                  <div className="student-avatar">
                    {student.name.charAt(0)}
                  </div>
                  <div className="student-info">
                    <h4>{student.name}</h4>
                    <div className="student-details">
                      <p><strong>📧 Email:</strong> {student.email}</p>
                      <p><strong>🎓 Indeks:</strong> {student.studentId}</p>
                      <p><strong>📅 Prijavljen:</strong> {new Date(student.registeredAt).toLocaleDateString('sr-RS')}</p>
                    </div>
                  </div>
                  <div className="student-actions">
                    <button 
                      onClick={() => handleApprove(student.id)}
                      className="btn-approve"
                    >
                      ✅ Odobri
                    </button>
                    <button 
                      onClick={() => handleReject(student.id)}
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
            <div className="students-list">
              {approvedStudents.map(student => (
                <div key={student.id} className="student-card approved">
                  <div className="student-avatar approved">
                    {student.name.charAt(0)}
                  </div>
                  <div className="student-info">
                    <h4>{student.name}</h4>
                    <div className="student-details">
                      <p><strong>📧 Email:</strong> {student.email}</p>
                      <p><strong>🎓 Indeks:</strong> {student.studentId}</p>
                      <p><strong>✅ Odobren:</strong> Da</p>
                    </div>
                  </div>
                  <div className="student-actions">
                    <button 
                      onClick={() => handleRemoveStudent(student.id)}
                      className="btn-remove"
                    >
                      🗑️ Ukloni
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="dashboard-notes">
        <h4>📝 Napomene:</h4>
        <ul>
          <li>Studentima se šalje automatski email nakon odobrenja (u produkciji)</li>
          <li>Odbijeni studenti mogu ponovo da se registruju</li>
          <li>U ovom demo sistemu podaci se čuvaju samo u browseru</li>
        </ul>
      </div>
    </div>
  );
}

export default ProfessorDashboard;