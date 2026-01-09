import React, { useState, useEffect } from 'react';

const QuizResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Klikni "Učitaj" da vidiš rezultate');

  // Firebase konfiguracija
  const FIREBASE_CONFIG = {
    projectId: 'agilnoit',
    apiKey: 'AIzaSyDyxT4NKNjc9ABECFlCNbxwHPakJcA0ahs',
    collection: 'quizResults'
  };

  const loadResults = async () => {
    console.log('🔄 Pokrećem učitavanje...');
    setLoading(true);
    setStatus('Povezujem se sa Firebase...');
    
    try {
      // REST API URL
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${FIREBASE_CONFIG.collection}?key=${FIREBASE_CONFIG.apiKey}`;
      
      console.log('📡 URL:', url);
      setStatus('Šaljem zahtev Firebase-u...');
      
      const response = await fetch(url);
      
      console.log('📊 Odgovor status:', response.status, response.statusText);
      setStatus(`Firebase odgovorio: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📄 Podaci:', data);
      
      if (!data.documents || data.documents.length === 0) {
        setStatus('✅ Firebase radi ali nema rezultata. Studenti još nisu radili kvizove.');
        setResults([]);
        return;
      }
      
      // Parsiraj podatke
      const parsedResults = data.documents.map(doc => {
        const fields = doc.fields || {};
        
        // Helper funkcija za ekstrakciju vrednosti
        const extractValue = (field) => {
          if (!field) return null;
          return field.stringValue || 
                 field.integerValue || 
                 field.doubleValue || 
                 field.timestampValue;
        };
        
        return {
          id: doc.name.split('/').pop(),
          student: extractValue(fields.studentName) || 
                   extractValue(fields.userName) || 
                   extractValue(fields.email) || 
                   'Student',
          email: extractValue(fields.email) || '',
          score: Number(extractValue(fields.percentage) || 0),
          correct: Number(extractValue(fields.correctAnswers) || 0),
          total: Number(extractValue(fields.totalQuestions) || 0),
          time: Number(extractValue(fields.timeSpent) || 0),
          date: extractValue(fields.submittedAt) || 
                extractValue(fields.createdAt) || 
                new Date().toISOString()
        };
      });
      
      // Sortiraj
      parsedResults.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setResults(parsedResults);
      setStatus(`✅ Učitano ${parsedResults.length} rezultata iz Firebase`);
      
    } catch (error) {
      console.error('❌ Kritična greška:', error);
      setStatus(`❌ Greška: ${error.message}`);
      setResults([]);
      
      // Pokušaj sa localStorage kao fallback
      try {
        const localResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        if (localResults.length > 0) {
          setResults(localResults.slice(0, 20).map(r => ({
            ...r,
            id: 'local_' + Date.now(),
            date: r.date || r.savedAt || new Date().toISOString()
          })));
          setStatus(`⚠️ Prikazujem ${localResults.length} lokalnih rezultata (Firebase ne radi)`);
        }
      } catch (localError) {
        console.error('LocalStorage greška:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Formatiraj datum
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Nepoznato';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📊 Rezultati kvizova</h1>
      <p>Direktno čitanje iz Firebase baze podataka</p>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div>
            <h3 style={{ margin: 0 }}>Status: {status}</h3>
            <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
              Rezultata: {results.length}
            </p>
          </div>
          
          <button 
            onClick={loadResults}
            disabled={loading}
            style={{
              background: loading ? '#6c757d' : '#0d6efd',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? '🔄 Učitavam...' : '🚀 Učitaj iz Firebase'}
          </button>
        </div>
        
        <div style={{ 
          background: '#e8f4fd', 
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <strong>Firebase info:</strong> Project: agilnoit | Kolekcija: quizResults
          <br/>
          <small>API key iz konfiguracije se koristi za autentifikaciju</small>
        </div>
      </div>
      
      {results.length > 0 && (
        <div style={{ 
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '800px'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Rezultat</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Tačno</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Vreme</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Datum</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr 
                  key={item.id} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    background: index % 2 === 0 ? '#fff' : '#f8f9fa'
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <div><strong>{item.student}</strong></div>
                    {item.email && (
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.email}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '15px',
                      background: item.score >= 80 ? '#d4edda' : 
                                 item.score >= 60 ? '#fff3cd' : 
                                 item.score >= 50 ? '#d1ecf1' : '#f8d7da',
                      color: item.score >= 80 ? '#155724' : 
                             item.score >= 60 ? '#856404' : 
                             item.score >= 50 ? '#0c5460' : '#721c24',
                      fontWeight: 'bold'
                    }}>
                      {item.score}%
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.correct}/{item.total}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.time ? Math.round(item.time / 60) + ' min' : 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {formatDate(item.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuizResults;