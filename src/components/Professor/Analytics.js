import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalQuizzes: 0,
    averageScore: 0,
    passRate: 0,
    topScore: 0,
    lowestScore: 0,
    quizCompletionRate: 0
  });
  
  const [quizResults, setQuizResults] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    
    try {
      // Učitaj sve studente
      const studentsQuery = query(collection(db, "users"), where("role", "==", "student"));
      const studentsSnapshot = await getDocs(studentsQuery);
      const totalStudents = studentsSnapshot.size;
      
      // Broj odobrenih studenata
      const approvedStudents = studentsSnapshot.docs.filter(doc => 
        doc.data().approved === true
      ).length;
      
      // Učitaj SVE rezultate kvizova
      const quizzesQuery = query(collection(db, "quizResults"));
      const quizzesSnapshot = await getDocs(quizzesQuery);
      const totalQuizzes = quizzesSnapshot.size;
      
      // Prikupi sve rezultate za analizu
      const allResults = [];
      let totalScore = 0;
      let passedQuizzes = 0;
      let topScore = 0;
      let lowestScore = 100;
      
      quizzesSnapshot.forEach(doc => {
        const data = doc.data();
        const percentage = data.percentage || 0;
        
        allResults.push({
          id: doc.id,
          ...data,
          percentage: percentage
        });
        
        totalScore += percentage;
        
        if (percentage >= 50) {
          passedQuizzes++;
        }
        
        // Pronađi najbolji i najlošiji rezultat
        if (percentage > topScore) topScore = percentage;
        if (percentage < lowestScore) lowestScore = percentage;
      });
      
      setQuizResults(allResults);
      
      // Izračunaj prosečan skor i pass rate
      const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
      const passRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;
      
      // Izračunaj performance po studentu
      const studentPerformanceMap = {};
      
      allResults.forEach(result => {
        const studentId = result.studentId || result.email;
        if (!studentPerformanceMap[studentId]) {
          studentPerformanceMap[studentId] = {
            studentName: result.studentName || result.email || 'Student',
            totalQuizzes: 0,
            totalScore: 0,
            bestScore: 0,
            passedQuizzes: 0
          };
        }
        
        studentPerformanceMap[studentId].totalQuizzes++;
        studentPerformanceMap[studentId].totalScore += result.percentage;
        
        if (result.percentage > studentPerformanceMap[studentId].bestScore) {
          studentPerformanceMap[studentId].bestScore = result.percentage;
        }
        
        if (result.percentage >= 50) {
          studentPerformanceMap[studentId].passedQuizzes++;
        }
      });
      
      // Pretvori u niz i izračunaj proseke
      const studentPerformanceArray = Object.values(studentPerformanceMap).map(student => ({
        ...student,
        averageScore: Math.round(student.totalScore / student.totalQuizzes),
        passRate: Math.round((student.passedQuizzes / student.totalQuizzes) * 100)
      }));
      
      setStudentPerformance(studentPerformanceArray);
      
      // Izračunaj stopu završetka kvizova
      const quizCompletionRate = totalStudents > 0 
        ? Math.round((totalQuizzes / (totalStudents * 3)) * 100) // Pretpostavka: 3 kviza po studentu
        : 0;
      
      setStats({
        totalStudents: totalStudents,
        activeStudents: approvedStudents,
        totalQuizzes: totalQuizzes,
        averageScore: averageScore,
        passRate: passRate,
        topScore: topScore,
        lowestScore: lowestScore,
        quizCompletionRate: Math.min(quizCompletionRate, 100)
      });
      
    } catch (error) {
      console.error('Greška pri učitavanju analitike:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '300px' 
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #2196F3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p>Učitavanje analitike...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>📈 Detaljne analize kvizova</h2>
      
      {/* Osnovne statistike */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '30px',
        marginBottom: '40px'
      }}>
        <div style={{ 
          padding: '25px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2196F3' }}>👥 Ukupno studenata</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.totalStudents}
          </p>
          <p style={{ color: '#666' }}>Registrovani korisnici</p>
        </div>
        
        <div style={{ 
          padding: '25px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#4CAF50' }}>📝 Ukupno kvizova</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.totalQuizzes}
          </p>
          <p style={{ color: '#666' }}>Urađeni testovi</p>
        </div>
        
        <div style={{ 
          padding: '25px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#FF9800' }}>🎯 Prosečan skor</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.averageScore}%
          </p>
          <p style={{ color: '#666' }}>Prosek na kvizovima</p>
        </div>
        
        <div style={{ 
          padding: '25px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#F44336' }}>📊 Stopa prolaznosti</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.passRate}%
          </p>
          <p style={{ color: '#666' }}>Procenat uspešnih</p>
        </div>
      </div>
      
      {/* Dodatne statistike */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ 
          padding: '25px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#9C27B0' }}>🏆 Najbolji rezultat</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.topScore}%
          </p>
          <p style={{ color: '#666' }}>Maksimalni skor</p>
        </div>
        
        <div style={{ 
          padding: '25px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#607D8B' }}>📉 Najlošiji rezultat</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.lowestScore}%
          </p>
          <p style={{ color: '#666' }}>Minimalni skor</p>
        </div>
        
        <div style={{ 
          padding: '25px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#00BCD4' }}>📈 Stopa završetka</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.quizCompletionRate}%
          </p>
          <p style={{ color: '#666' }}>Završeni kvizovi</p>
        </div>
        
        <div style={{ 
          padding: '25px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#8BC34A' }}>✅ Aktivni studenti</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
            {stats.activeStudents}
          </p>
          <p style={{ color: '#666' }}>Odobreni studenti</p>
        </div>
      </div>
      
      {/* Performance po studentu */}
      <div style={{ 
        background: 'white', 
        padding: '25px', 
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '40px'
      }}>
        <h3 style={{ marginBottom: '20px' }}>📋 Performance po studentu</h3>
        
        {studentPerformance.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Nema podataka o performance studenata.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Broj kvizova</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Prosečan skor</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Najbolji skor</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Stopa prolaznosti</th>
                </tr>
              </thead>
              <tbody>
                {studentPerformance.map((student, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{student.studentName}</td>
                    <td style={{ padding: '12px' }}>{student.totalQuizzes}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        background: student.averageScore >= 70 ? '#d4edda' : 
                                   student.averageScore >= 50 ? '#fff3cd' : '#f8d7da',
                        color: student.averageScore >= 70 ? '#155724' : 
                               student.averageScore >= 50 ? '#856404' : '#721c24'
                      }}>
                        {student.averageScore}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        background: '#2196F3',
                        color: 'white'
                      }}>
                        {student.bestScore}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        background: student.passRate >= 70 ? '#d4edda' : 
                                   student.passRate >= 50 ? '#fff3cd' : '#f8d7da',
                        color: student.passRate >= 70 ? '#155724' : 
                               student.passRate >= 50 ? '#856404' : '#721c24'
                      }}>
                        {student.passRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Poslednji kvizovi */}
      <div style={{ 
        background: 'white', 
        padding: '25px', 
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px' }}>🕒 Poslednji kvizovi</h3>
        
        {quizResults.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Nema rezultata kvizova.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Kviz</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Rezultat</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Tačno/Pogrešno</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Vreme</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Datum</th>
                </tr>
              </thead>
              <tbody>
                {quizResults.slice(0, 10).map((result) => (
                  <tr key={result.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{result.studentName || result.email || 'Student'}</td>
                    <td style={{ padding: '12px' }}>{result.quizName || 'Kviz'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        background: result.percentage >= 70 ? '#d4edda' : 
                                   result.percentage >= 50 ? '#fff3cd' : '#f8d7da',
                        color: result.percentage >= 70 ? '#155724' : 
                               result.percentage >= 50 ? '#856404' : '#721c24',
                        fontWeight: 'bold'
                      }}>
                        {result.percentage}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {result.correctAnswers || 0}/{result.totalQuestions || 0}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {Math.round(result.timeSpent / 60)} min
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(result.submittedAt).toLocaleDateString('sr-RS')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Dodajte CSS animaciju
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default Analytics;