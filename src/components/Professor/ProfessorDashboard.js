// src/components/Professor/ProfessorDashboard.js - KOMPLETNO POPRAVLJENO
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ProfessorDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingStudents: 0,
    approvedStudents: 0,
    activeToday: 0,
    averageScore: 0,
    totalQuizzes: 0,
    passRate: 0
  });
  
  const [recentStudents, setRecentStudents] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // FUNKCIJA ZA SINHRONIZACIJU LOKALNIH REZULTATA
  const syncLocalResults = async () => {
    setSyncing(true);
    setSyncStatus('🔄 Proveravam lokalne rezultate...');
    
    try {
      // Proveri da li ima lokalnih rezultata
      const localResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
      
      if (localResults.length === 0) {
        setSyncStatus('ℹ️ Nema lokalnih rezultata za sinhronizaciju');
        setSyncing(false);
        return;
      }
      
      setSyncStatus(`📁 Pronađeno ${localResults.length} rezultata, šaljem u Firebase...`);
      
      // Importuj Firebase funkcije
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      
      let syncedCount = 0;
      let errorCount = 0;
      
      // Šalji svaki rezultat u Firebase
      for (const result of localResults) {
        try {
          const firebaseResult = {
            studentName: result.userName || result.studentName || result.email || 'Student',
            email: result.email || '',
            studentId: result.studentId || result.index || '',
            quizName: result.quizName || 'Agilno IT Poslovanje',
            percentage: Number(result.percentage) || 0,
            correctAnswers: Number(result.correctAnswers) || 0,
            totalQuestions: Number(result.totalQuestions) || 0,
            timeSpent: Number(result.timeSpent) || 0,
            mode: result.mode || result.quizType || 'test',
            submittedAt: serverTimestamp(),
            createdAt: result.date || result.savedAt || new Date().toISOString(),
            source: 'localStorage_sync',
            synchronized: true
          };
          
          await addDoc(collection(db, "quizResults"), firebaseResult);
          syncedCount++;
          
          // Pauza da ne preopteretimo Firebase
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.warn('Greška pri sinhronizaciji rezultata:', error);
          errorCount++;
        }
      }
      
      // Očisti localStorage nakon uspešne sinhronizacije
      if (syncedCount > 0) {
        localStorage.removeItem('quizResults');
      }
      
      setSyncStatus(`✅ Uspešno sinhronizovano ${syncedCount} rezultata!`);
      if (errorCount > 0) {
        setSyncStatus(prev => prev + ` (${errorCount} grešaka)`);
      }
      
      // Ponovo učitaj podatke nakon sinhronizacije
      setTimeout(() => {
        loadDashboardData();
        setSyncing(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Kritična greška pri sinhronizaciji:', error);
      setSyncStatus(`❌ Greška: ${error.message}`);
      setSyncing(false);
    }
  };

  // GLAVNA FUNKCIJA ZA UČITAVANJE PODATAKA
  const loadDashboardData = async () => {
  console.log('🚀 Počinjem učitavanje dashboard podataka...');
  setLoading(true);
  setError(null);
  
  try {
    // 1. DEBUG: Proveri Firebase konekciju
    console.log('🔍 Proveravam Firebase db:', db ? '✅ Postoji' : '❌ Nema');
    
    // 2. UČITAJ SVE REZULTATE IZ FIREBASE (OVO JE KLJUČNO!)
    console.log('📥 Učitavam rezultate iz kolekcije "quizResults"...');
    
    let allResults = [];
    try {
      const resultsRef = collection(db, "quizResults");
      const resultsSnapshot = await getDocs(resultsRef);
      
      console.log(`📊 Firebase odgovor: ${resultsSnapshot.size} dokumenta`);
      
      resultsSnapshot.forEach((doc, index) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log(`📄 Dokument ${index + 1} (${doc.id}):`, {
            studentName: data.studentName,
            percentage: data.percentage,
            submittedAt: data.submittedAt
          });
          
          allResults.push({
            id: doc.id,
            ...data,
            // Konvertuj timestamp
            submittedDate: data.submittedAt?.toDate?.() || 
                         (data.submittedAt ? new Date(data.submittedAt) : new Date())
          });
        }
      });
      
      console.log(`✅ Učitano ${allResults.length} rezultata iz Firebase`);
      
    } catch (firebaseError) {
      console.error('❌ Greška pri učitavanju iz Firebase:', firebaseError);
      setError(`Greška pri učitavanju rezultata: ${firebaseError.message}`);
    }
    
    // 3. UČITAJ SVE STUDENTE
    console.log('👥 Učitavam studente...');
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    
    const allStudents = [];
    let pendingCount = 0;
    let approvedCount = 0;
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.role === "student") {
        allStudents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now())
        });
        
        if (data.approved === true) {
          approvedCount++;
        } else {
          pendingCount++;
        }
      }
    });
    
    console.log(`✅ Pronađeno ${allStudents.length} studenata`);
    
    // 4. IZRAČUNAJ STATISTIKE
    console.log('📈 Računam statistike...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeToday = allStudents.filter(student => {
      return student.createdAt >= today;
    }).length;
    
    // STATISTIKE REZULTATA
    let totalScore = 0;
    let passedQuizzes = 0;
    let totalQuizzes = allResults.length;
    
    allResults.forEach(result => {
      const percentage = Number(result.percentage) || 0;
      totalScore += percentage;
      
      if (percentage >= 50) {
        passedQuizzes++;
      }
    });
    
    const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
    const passRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;
    
    // 5. PRIKAŽI STATISTIKE U CONSOLE
    console.log('📊 FINALNE STATISTIKE:', {
      totalStudents: allStudents.length,
      pendingStudents: pendingCount,
      approvedStudents: approvedCount,
      activeToday: activeToday,
      totalQuizzes: totalQuizzes,
      averageScore: averageScore,
      passRate: passRate,
      allResultsCount: allResults.length
    });
    
    // 6. SETUJ STATE
    setStats({
      totalStudents: allStudents.length,
      pendingStudents: pendingCount,
      approvedStudents: approvedCount,
      activeToday: activeToday,
      averageScore: averageScore,
      totalQuizzes: totalQuizzes,
      passRate: passRate
    });
    
    // 7. NOVI STUDENTI
    const sortedByDate = [...allStudents]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
    setRecentStudents(sortedByDate);
    
    // 8. TOP STUDENTI
    const studentMap = {};
    
    allResults.forEach(result => {
      const key = result.email || result.studentId || result.userId || 'unknown';
      
      if (!studentMap[key]) {
        studentMap[key] = {
          studentName: result.studentName || result.email || 'Student',
          email: result.email || '',
          studentId: result.studentId || '',
          scores: [],
          bestScore: 0,
          quizCount: 0,
          lastActivity: result.submittedDate
        };
      }
      
      const score = Number(result.percentage) || 0;
      studentMap[key].scores.push(score);
      studentMap[key].quizCount++;
      studentMap[key].bestScore = Math.max(studentMap[key].bestScore, score);
      
      if (result.submittedDate > studentMap[key].lastActivity) {
        studentMap[key].lastActivity = result.submittedDate;
      }
    });
    
    const topStudentsList = Object.values(studentMap)
  .map(student => ({
    ...student,
    // PROMENI OVO: averageScore → averagePercentage
    averagePercentage: student.scores.length > 0
      ? Math.round(student.scores.reduce((sum, score) => sum + score, 0) / student.scores.length)
      : 0
  }))
  .sort((a, b) => b.averagePercentage - a.averagePercentage)
  .slice(0, 5);
    
    // 9. AKO NEMA REZULTATA, PRIKAŽI PORUKU
    if (allResults.length === 0) {
      setError('ℹ️ Nema rezultata kvizova u bazi. Studenti još nisu radili kvizove.');
    }
    
  } catch (error) {
    console.error('❌ KRITIČNA GREŠKA:', error);
    setError(`Greška: ${error.message}`);
  } finally {
    setLoading(false);
    console.log('🏁 Završeno učitavanje dashboard podataka');
  }
};

  const formatDate = (date) => {
    if (!date) return 'Nepoznato';
    
    try {
      return new Date(date).toLocaleDateString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Nepoznato';
    }
  };

  // STILOVI
  const styles = {
    container: { padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' },
    header: { 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '30px',
      borderRadius: '15px',
      marginBottom: '30px',
      textAlign: 'center'
    },
    syncSection: {
      background: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '10px',
      padding: '15px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    syncButton: {
      background: syncing ? '#6c757d' : '#28a745',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: syncing ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '16px',
      marginTop: '10px'
    },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '40px'
    },
    statCard: { 
      background: 'white', 
      padding: '25px', 
      borderRadius: '15px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
      textAlign: 'center',
      transition: 'transform 0.3s'
    },
    statIcon: { 
      fontSize: '40px', 
      marginBottom: '15px',
      display: 'block'
    },
    statNumber: { 
      fontSize: '36px', 
      fontWeight: 'bold', 
      margin: '10px 0',
      color: '#333'
    },
    statLabel: { 
      color: '#666', 
      fontSize: '14px',
      margin: 0
    },
    columnsContainer: { 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr',
      gap: '30px',
      marginBottom: '40px'
    },
    column: { 
      background: 'white', 
      padding: '25px', 
      borderRadius: '15px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
    },
    columnHeader: { 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: '2px solid #f0f0f0'
    },
    columnTitle: { 
      fontSize: '20px', 
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    badge: { 
      background: '#667eea', 
      color: 'white',
      padding: '5px 15px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    studentsList: { 
      maxHeight: '400px', 
      overflowY: 'auto',
      paddingRight: '10px'
    },
    studentItem: { 
      display: 'flex', 
      alignItems: 'center',
      padding: '15px',
      borderBottom: '1px solid #eee',
      transition: 'background 0.3s'
    },
    studentAvatar: { 
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      marginRight: '15px',
      flexShrink: 0
    },
    studentInfo: { flex: 1 },
    studentName: { 
      fontWeight: 'bold', 
      margin: '0 0 5px 0',
      fontSize: '16px'
    },
    studentEmail: { 
      color: '#666', 
      fontSize: '14px', 
      margin: '0 0 8px 0'
    },
    studentMeta: { 
      display: 'flex', 
      gap: '15px', 
      alignItems: 'center'
    },
    statusBadge: { 
      padding: '4px 12px',
      borderRadius: '15px',
      fontSize: '12px',
      fontWeight: '500'
    },
    statusApproved: { background: '#d4edda', color: '#155724' },
    statusPending: { background: '#fff3cd', color: '#856404' },
    dateBadge: { 
      color: '#666', 
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    topStudentItem: { 
      display: 'flex', 
      alignItems: 'center',
      padding: '15px',
      borderBottom: '1px solid #eee'
    },
    rankBadge: { 
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#333',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '18px',
      marginRight: '15px',
      flexShrink: 0
    },
    scoreBadge: { 
      background: '#4CAF50',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '15px',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    quizBadge: { 
      background: '#9C27B0',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '15px',
      fontSize: '12px',
      marginTop: '5px'
    },
    quickActions: { 
      background: 'white', 
      padding: '25px', 
      borderRadius: '15px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
    },
    actionsTitle: { 
      fontSize: '20px', 
      margin: '0 0 20px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    actionsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '15px'
    },
    actionBtn: { 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: '15px 20px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'transform 0.2s'
    },
    loadingContainer: { 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '300px',
      textAlign: 'center'
    },
    spinner: {
      width: '60px',
      height: '60px',
      border: '6px solid #f3f3f3',
      borderTop: '6px solid #667eea',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    },
    errorBox: {
      background: '#f8d7da',
      color: '#721c24',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      textAlign: 'center'
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <h3>Učitavanje dashboard-a...</h3>
        <p style={{color: '#666'}}>Prikupljam podatke o studentima i rezultatima</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={{fontSize: '32px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px'}}>
          <span>👨‍🏫</span> 
          Profesorski Dashboard
        </h1>
        <p style={{fontSize: '18px', opacity: 0.9, margin: 0}}>
          Kontrolna tabla za upravljanje studentima i pregled rezultata
        </p>
        
        <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center'}}>
          <button 
            onClick={loadDashboardData}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔄 Osveži podatke
          </button>
          
          {/* Dugme za sinhronizaciju */}
          <button 
            onClick={syncLocalResults}
            disabled={syncing}
            style={{
              background: syncing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: syncing ? 0.7 : 1
            }}
          >
            {syncing ? '🔄 Sinhronizujem...' : '📤 Sinhronizuj rezultate'}
          </button>
        </div>
      </div>

      {/* Status sinhronizacije */}
      {syncStatus && (
        <div style={styles.syncSection}>
          <strong>Status:</strong> {syncStatus}
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <h4 style={{marginTop: 0}}>⚠️ Greška</h4>
          <p>{error}</p>
          <button 
            onClick={loadDashboardData}
            style={{
              background: '#721c24',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Pokušaj ponovo
          </button>
        </div>
      )}

      {/* STATISTIKE */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statNumber}>{stats.totalStudents}</div>
          <h3 style={{margin: '10px 0', fontSize: '16px'}}>Ukupno studenata</h3>
          <p style={styles.statLabel}>Registrovani korisnici</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: '#ff9800'}}>⏳</div>
          <div style={{...styles.statNumber, color: '#ff9800'}}>{stats.pendingStudents}</div>
          <h3 style={{margin: '10px 0', fontSize: '16px'}}>Na čekanju</h3>
          <p style={styles.statLabel}>Čekaju odobrenje</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: '#4CAF50'}}>✅</div>
          <div style={{...styles.statNumber, color: '#4CAF50'}}>{stats.approvedStudents}</div>
          <h3 style={{margin: '10px 0', fontSize: '16px'}}>Odobreni</h3>
          <p style={styles.statLabel}>Aktivni studenti</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: '#2196F3'}}>📈</div>
          <div style={{...styles.statNumber, color: '#2196F3'}}>{stats.activeToday}</div>
          <h3 style={{margin: '10px 0', fontSize: '16px'}}>Novi danas</h3>
          <p style={styles.statLabel}>Današnje registracije</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: '#9C27B0'}}>🎯</div>
          <div style={{...styles.statNumber, color: '#9C27B0'}}>{stats.averageScore}%</div>
          <h3 style={{margin: '10px 0', fontSize: '16px'}}>Prosečan skor</h3>
          <p style={styles.statLabel}>Na kvizovima</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: '#673AB7'}}>📝</div>
          <div style={{...styles.statNumber, color: '#673AB7'}}>{stats.totalQuizzes}</div>
          <h3 style={{margin: '10px 0', fontSize: '16px'}}>Urađeni kvizovi</h3>
          <p style={styles.statLabel}>Ukupno testova</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, color: '#00BCD4'}}>📊</div>
          <div style={{...styles.statNumber, color: '#00BCD4'}}>{stats.passRate}%</div>
          <h3 style={{margin: '10px 0', fontSize: '16px'}}>Stopa prolaznosti</h3>
          <p style={styles.statLabel}>Procenat uspešnih</p>
        </div>
      </div>

      {/* DVE KOLONE */}
      <div style={styles.columnsContainer}>
        {/* LEVA KOLONA: Novi studenti */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <h3 style={styles.columnTitle}>
              <span>📋</span>
              Novi studenti
            </h3>
            <span style={styles.badge}>{recentStudents.length}</span>
          </div>
          
          {recentStudents.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
              <div style={{fontSize: '48px', marginBottom: '20px'}}>👥</div>
              <p>Trenutno nema novih studenata</p>
            </div>
          ) : (
            <div style={styles.studentsList}>
              {recentStudents.map((student, index) => (
                <div key={student.id} style={styles.studentItem}>
                  <div style={styles.studentAvatar}>
                    {student.displayName?.charAt(0)?.toUpperCase() || student.email?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div style={styles.studentInfo}>
                    <h4 style={styles.studentName}>
                      {student.displayName || student.email}
                      {index < 3 && <span style={{marginLeft: '8px', fontSize: '12px', color: '#ff9800'}}>🆕</span>}
                    </h4>
                    <p style={styles.studentEmail}>{student.email}</p>
                    <div style={styles.studentMeta}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(student.approved ? styles.statusApproved : styles.statusPending)
                      }}>
                        {student.approved ? '✅ Odobren' : '⏳ Na čekanju'}
                      </span>
                      <span style={styles.dateBadge}>
                        📅 {formatDate(student.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {recentStudents.length > 0 && (
            <div style={{marginTop: '20px', textAlign: 'center'}}>
              <button 
                onClick={() => navigate('/professor/pending')}
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '16px'
                }}
              >
                👁️ Pregledaj sve studente na čekanju
              </button>
            </div>
          )}
        </div>
        
        {/* DESNA KOLONA: Top studenti */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <h3 style={styles.columnTitle}>
              <span>🏆</span>
              Top studenti
            </h3>
            <span style={styles.badge}>{topStudents.length}</span>
          </div>
          
          {topStudents.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
              <div style={{fontSize: '48px', marginBottom: '20px'}}>📝</div>
              <p>Nema rezultata kvizova</p>
              <p style={{fontSize: '14px', marginTop: '10px'}}>
                Studenti još nisu radili kvizove
              </p>
              <button 
                onClick={syncLocalResults}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '15px'
                }}
              >
                🔄 Sinhronizuj lokalne rezultate
              </button>
            </div>
          ) : (
            <div>
              {topStudents.map((student, index) => (
                <div key={student.email || student.studentId || index} style={styles.topStudentItem}>
                  <div style={styles.rankBadge}>
                    #{index + 1}
                  </div>
                  <div style={{flex: 1}}>
                    <h4 style={{margin: '0 0 5px 0', fontSize: '16px'}}>
                      {student.studentName}
                    </h4>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <span style={styles.scoreBadge}>
  {student.averagePercentage || student.averageScore || 0}%
</span>
                      <span style={{color: '#666', fontSize: '14px'}}>
                        {student.totalQuizzes} kviz(ova)
                      </span>
                    </div>
                    <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                      Najbolji: {student.bestPercentage}%
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{color: '#666', fontSize: '12px'}}>
                      📅 {formatDate(student.lastActivity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {topStudents.length > 0 && (
            <div style={{marginTop: '20px', textAlign: 'center'}}>
              <button 
                onClick={() => navigate('/professor/quiz-results')}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '16px'
                }}
              >
                📊 Pregledaj sve rezultate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BRZE AKCIJE */}
      <div style={styles.quickActions}>
        <h3 style={styles.actionsTitle}>
          <span>⚡</span>
          Brze akcije
        </h3>
        
        <div style={styles.actionsGrid}>
          <button 
            onClick={() => navigate('/professor/pending')}
            style={styles.actionBtn}
          >
            <span>👁️</span>
            <div>
              <div style={{fontWeight: 'bold'}}>Pregled studenata na čekanju</div>
              <div style={{fontSize: '13px', opacity: 0.9}}>
                {stats.pendingStudents} student(a) čeka odobrenje
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/professor/quiz-results')}
            style={styles.actionBtn}
          >
            <span>📊</span>
            <div>
              <div style={{fontWeight: 'bold'}}>Svi rezultati kvizova</div>
              <div style={{fontSize: '13px', opacity: 0.9}}>
                {stats.totalQuizzes} urađenih testova
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/professor/analytics')}
            style={styles.actionBtn}
          >
            <span>📈</span>
            <div>
              <div style={{fontWeight: 'bold'}}>Detaljne analize</div>
              <div style={{fontSize: '13px', opacity: 0.9}}>
                Statistike i grafikon
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/professor/add-questions')}
            style={styles.actionBtn}
          >
            <span>➕</span>
            <div>
              <div style={{fontWeight: 'bold'}}>Dodaj nova pitanja</div>
              <div style={{fontSize: '13px', opacity: 0.9}}>
                Proširi bazu pitanja
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/professor/delete-students')}
            style={{
              ...styles.actionBtn,
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
            }}
          >
            <span>🗑️</span>
            <div>
              <div style={{fontWeight: 'bold'}}>Obriši studente</div>
              <div style={{fontSize: '13px', opacity: 0.9}}>
                Upravljaj korisničkim nalozima
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* CSS za animacije */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfessorDashboard;