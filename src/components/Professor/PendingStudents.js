// src/components/Professor/PendingStudents.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const PendingStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingStudents();
  }, []);

  // Učitaj studente na čekanju
  const loadPendingStudents = async () => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      
      const pendingStudents = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === "student" && !data.approved) {
          pendingStudents.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now())
          });
        }
      });
      
      setStudents(pendingStudents);
    } catch (error) {
      console.error("Greška pri učitavanju studenata:", error);
    } finally {
      setLoading(false);
    }
  };

  // ODOBRI studenta (ISPRAVNA FUNKCIJA)
  const approveStudent = async (studentId) => {
    try {
      const studentRef = doc(db, "users", studentId);
      
      // ISPRAVNO: Samo postavi approved = true
      await updateDoc(studentRef, {
        approved: true,
        approvedAt: new Date()
      });
      
      // Ukloni studenta iz liste (refresh)
      setStudents(students.filter(s => s.id !== studentId));
      
      alert("✅ Student uspešno odobren!");
      
    } catch (error) {
      console.error("Greška pri odobravanju studenta:", error);
      alert("❌ Greška: " + error.message);
    }
  };

  // ODBIJ/OBDRIŠI studenta (ovo briše iz baze)
  const deleteStudent = async (studentId) => {
    if (!window.confirm("Da li ste sigurni da želite da OBRĐETE ovog studenta? Ova akcija je trajna!")) {
      return;
    }
    
    try {
      const studentRef = doc(db, "users", studentId);
      await deleteDoc(studentRef);
      
      // Ukloni studenta iz liste
      setStudents(students.filter(s => s.id !== studentId));
      
      alert("🗑️ Student uspešno obrisan!");
      
    } catch (error) {
      console.error("Greška pri brisanju studenta:", error);
      alert("❌ Greška: " + error.message);
    }
  };

  if (loading) {
    return <div>Učitavanje...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>👥 Studenti na čekanju</h1>
      <p>Ukupno: {students.length} student(a)</p>
      
      {students.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '10px'
        }}>
          <h3>🎉 Nema studenata na čekanju!</h3>
          <p>Svi studenti su već odobreni.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '15px',
          marginTop: '20px'
        }}>
          {students.map(student => (
            <div key={student.id} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>
                  {student.displayName || student.email}
                </h3>
                <p style={{ margin: '0 0 5px 0', color: '#666' }}>
                  {student.email}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                  📅 Registrovan: {new Date(student.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* DUGME ZA ODOBRAVANJE */}
                <button
                  onClick={() => approveStudent(student.id)}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ Odobri
                </button>
                
                {/* DUGME ZA BRISANJE */}
                <button
                  onClick={() => deleteStudent(student.id)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingStudents;