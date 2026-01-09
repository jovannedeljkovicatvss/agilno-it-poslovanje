// src/components/Professor/DeleteStudents.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, doc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const DeleteStudents = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApproved, setFilterApproved] = useState('all'); // 'all', 'approved', 'pending'
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMode, setDeleteMode] = useState('single'); // 'single' ili 'multiple'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadAllStudents();
  }, []);

  // Učitaj sve studente
  const loadAllStudents = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      
      const allStudents = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === "student") {
          allStudents.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
            approvedAt: data.approvedAt?.toDate?.() || null
          });
        }
      });
      
      // Sortiraj po datumu (najnoviji prvi)
      allStudents.sort((a, b) => b.createdAt - a.createdAt);
      
      setStudents(allStudents);
      setFilteredStudents(allStudents);
      
    } catch (error) {
      console.error("Greška pri učitavanju studenata:", error);
      alert("❌ Greška pri učitavanju: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtriraj studente
  useEffect(() => {
    let filtered = [...students];
    
    // Filter po statusu
    if (filterApproved === 'approved') {
      filtered = filtered.filter(s => s.approved === true);
    } else if (filterApproved === 'pending') {
      filtered = filtered.filter(s => !s.approved);
    }
    
    // Filter po pretrazi
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        (s.displayName && s.displayName.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.studentId && s.studentId.toLowerCase().includes(term))
      );
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, filterApproved, students]);

  // Obeleži/odobeleži studenta
  const toggleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Obeleži sve
  const selectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  // ODOBRI studenta (alternativna opcija)
  const approveStudent = async (studentId) => {
    try {
      const studentRef = doc(db, "users", studentId);
      await updateDoc(studentRef, {
        approved: true,
        approvedAt: new Date()
      });
      
      // Ažuriraj stanje
      setStudents(students.map(s => 
        s.id === studentId ? {...s, approved: true, approvedAt: new Date()} : s
      ));
      
      alert("✅ Student uspešno odobren!");
      
    } catch (error) {
      console.error("Greška pri odobravanju:", error);
      alert("❌ Greška: " + error.message);
    }
  };

  // ODBIJ studenta (postavi approved: false)
  const rejectStudent = async (studentId) => {
    try {
      const studentRef = doc(db, "users", studentId);
      await updateDoc(studentRef, {
        approved: false,
        approvedAt: null
      });
      
      // Ažuriraj stanje
      setStudents(students.map(s => 
        s.id === studentId ? {...s, approved: false, approvedAt: null} : s
      ));
      
      alert("⚠️ Student odbijen!");
      
    } catch (error) {
      console.error("Greška pri odbijanju:", error);
      alert("❌ Greška: " + error.message);
    }
  };

  // OBRIŠI jednog studenta
  const deleteSingleStudent = async (studentId) => {
    try {
      setIsDeleting(true);
      const studentRef = doc(db, "users", studentId);
      await deleteDoc(studentRef);
      
      // Ukloni iz state
      setStudents(students.filter(s => s.id !== studentId));
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
      
      alert("🗑️ Student uspešno obrisan!");
      
    } catch (error) {
      console.error("Greška pri brisanju studenta:", error);
      alert("❌ Greška: " + error.message);
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
      setStudentToDelete(null);
    }
  };

  // OBRIŠI više studenata
  const deleteMultipleStudents = async () => {
    if (selectedStudents.length === 0) {
      alert("⚠️ Niste odabrali nijednog studenta!");
      return;
    }
    
    if (!window.confirm(`Da li ste SIGURNI da želite da obrišete ${selectedStudents.length} student(a)? Ova akcija je TRAJNA i nepovratna!`)) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Obriši sve odabrane studente
      const deletePromises = selectedStudents.map(async (studentId) => {
        const studentRef = doc(db, "users", studentId);
        await deleteDoc(studentRef);
      });
      
      await Promise.all(deletePromises);
      
      // Ažuriraj stanje
      setStudents(students.filter(s => !selectedStudents.includes(s.id)));
      setSelectedStudents([]);
      
      alert(`✅ Uspešno obrisano ${selectedStudents.length} student(a)!`);
      
    } catch (error) {
      console.error("Greška pri brisanju studenata:", error);
      alert("❌ Greška: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Formatiraj datum
  const formatDate = (date) => {
    if (!date) return 'Nije odobren';
    return new Date(date).toLocaleDateString('sr-RS');
  };

  // Modal za potvrdu brisanja
  const ConfirmDeleteModal = () => {
    if (!showConfirmModal || !studentToDelete) return null;
    
    const student = students.find(s => s.id === studentToDelete);
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '10px',
          maxWidth: '500px',
          width: '90%'
        }}>
          <h2 style={{ color: '#dc3545', marginTop: 0 }}>⚠️ Potvrda brisanja</h2>
          
          <p>Da li ste SIGURNI da želite da trajno obrišete ovog studenta?</p>
          
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            margin: '15px 0'
          }}>
            <strong>{student.displayName || student.email}</strong><br />
            <small>{student.email}</small><br />
            <small>Status: {student.approved ? '✅ Odobren' : '⏳ Na čekanju'}</small>
          </div>
          
          <p style={{ color: '#666', fontSize: '14px' }}>
            <strong>UPOZORENJE:</strong> Ova akcija je trajna. Student će biti uklonjen iz baze podataka i neće moći da pristupi sistemu.
          </p>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => deleteSingleStudent(studentToDelete)}
              disabled={isDeleting}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '5px',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                flex: 1,
                fontWeight: 'bold'
              }}
            >
              {isDeleting ? 'Brisanje...' : '🗑️ DA, obriši'}
            </button>
            
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setStudentToDelete(null);
              }}
              disabled={isDeleting}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '5px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Otkaži
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '300px',
        fontSize: '18px'
      }}>
        🔄 Učitavanje studenata...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <ConfirmDeleteModal />
      
      {/* HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0' }}>
            🗑️ Upravljanje studentima
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Ukupno studenata: {students.length} | Prikazano: {filteredStudents.length}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/professor/pending')}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📋 Studenti na čekanju
          </button>
          
          <button
            onClick={loadAllStudents}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🔄 Osveži
          </button>
        </div>
      </div>
      
      {/* MODE SELECTOR */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div>
          <strong>Režim:</strong>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <button
              onClick={() => setDeleteMode('single')}
              style={{
                background: deleteMode === 'single' ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ⚪ Pojedinačno brisanje
            </button>
            <button
              onClick={() => setDeleteMode('multiple')}
              style={{
                background: deleteMode === 'multiple' ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ✅ Grupno brisanje
            </button>
          </div>
        </div>
        
        {deleteMode === 'multiple' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={selectAll}
              style={{
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {selectedStudents.length === filteredStudents.length ? '❌ Odobeleži sve' : '✅ Obeleži sve'}
            </button>
            
            <button
              onClick={deleteMultipleStudents}
              disabled={selectedStudents.length === 0 || isDeleting}
              style={{
                background: selectedStudents.length === 0 ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              🗑️ Obriši odabrane ({selectedStudents.length})
            </button>
          </div>
        )}
      </div>
      
      {/* FILTERI */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            🔍 Pretraži studente:
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ime, email ili broj indeksa..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            📊 Filter po statusu:
          </label>
          <select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              background: 'white'
            }}
          >
            <option value="all">Svi studenti</option>
            <option value="approved">Samo odobreni</option>
            <option value="pending">Samo na čekanju</option>
          </select>
        </div>
      </div>
      
      {/* LISTA STUDENATA */}
      <div>
        {filteredStudents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            background: '#f8f9fa',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
            <h3>Nema studenata</h3>
            <p style={{ color: '#666' }}>
              {searchTerm || filterApproved !== 'all' 
                ? 'Nema rezultata za trenutne filtere' 
                : 'Nema registrovanih studenata'}
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '15px'
          }}>
            {filteredStudents.map(student => (
              <div key={student.id} style={{
                background: selectedStudents.includes(student.id) ? '#fff3cd' : 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                border: selectedStudents.includes(student.id) ? '2px solid #ffc107' : '2px solid transparent',
                transition: 'all 0.3s'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '15px'
                }}>
                  {/* LEVI DEO: Informacije o studentu */}
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {deleteMode === 'multiple' && (
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleSelectStudent(student.id)}
                          style={{ width: '20px', height: '20px' }}
                        />
                      )}
                      
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: student.approved ? '#28a745' : '#ffc107',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}>
                        {student.displayName?.charAt(0)?.toUpperCase() || student.email?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      
                      <div>
                        <h3 style={{ margin: '0 0 5px 0' }}>
                          {student.displayName || student.email}
                          {student.approved && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#28a745' }}>✅</span>}
                        </h3>
                        <p style={{ margin: '0 0 5px 0', color: '#666' }}>
                          📧 {student.email}
                        </p>
                        {student.studentId && (
                          <p style={{ margin: '0 0 5px 0', color: '#666' }}>
                            🆔 {student.studentId}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '15px', 
                      marginTop: '15px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        background: student.approved ? '#d4edda' : '#fff3cd',
                        color: student.approved ? '#155724' : '#856404',
                        fontSize: '14px'
                      }}>
                        {student.approved ? '✅ Odobren' : '⏳ Na čekanju'}
                      </span>
                      
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        📅 Registrovan: {formatDate(student.createdAt)}
                      </span>
                      
                      {student.approvedAt && (
                        <span style={{ color: '#666', fontSize: '14px' }}>
                          ✅ Odobren: {formatDate(student.approvedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* DESNI DEO: Akcije */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '10px',
                    minWidth: '250px'
                  }}>
                    {/* AKCIJE ZA ODOBRAVANJE/ODBIJANJE */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {!student.approved && (
                        <button
                          onClick={() => approveStudent(student.id)}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            flex: 1,
                            fontSize: '14px'
                          }}
                        >
                          ✅ Odobri
                        </button>
                      )}
                      
                      {student.approved && (
                        <button
                          onClick={() => rejectStudent(student.id)}
                          style={{
                            background: '#ffc107',
                            color: '#212529',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            flex: 1,
                            fontSize: '14px'
                          }}
                        >
                          ↩️ Vrati na čekanje
                        </button>
                      )}
                    </div>
                    
                    {/* AKCIJE ZA BRISANJE */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => {
                          setStudentToDelete(student.id);
                          setShowConfirmModal(true);
                        }}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          flex: 1,
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        🗑️ Obriši
                      </button>
                      
                      <button
                        onClick={() => navigate(`/professor/student/${student.id}`)}
                        style={{
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          flex: 1,
                          fontSize: '14px'
                        }}
                      >
                        👁️ Detalji
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* FOOTER STATISTIKE */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{students.length}</div>
          <div style={{ color: '#666' }}>Ukupno studenata</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {students.filter(s => s.approved).length}
          </div>
          <div style={{ color: '#666' }}>Odobreni</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
            {students.filter(s => !s.approved).length}
          </div>
          <div style={{ color: '#666' }}>Na čekanju</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
            {selectedStudents.length}
          </div>
          <div style={{ color: '#666' }}>Odabrano za brisanje</div>
        </div>
      </div>
      
      {/* UPUTSTVA */}
      <div style={{ 
        marginTop: '30px',
        padding: '15px',
        background: '#fff3cd',
        borderRadius: '10px',
        border: '1px solid #ffc107'
      }}>
        <h4 style={{ marginTop: 0, color: '#856404' }}>📋 Uputstvo za korišćenje:</h4>
        <ul style={{ color: '#856404', margin: 0 }}>
          <li><strong>Odobri:</strong> Student dobija pristup kvizovima</li>
          <li><strong>Vrati na čekanje:</strong> Oduzima pristup ali ne briše nalog</li>
          <li><strong>Obriši:</strong> Trajno briše studenta iz sistema</li>
          <li><strong>Grupno brisanje:</strong> Obeležite više studenata pa obrišite odjednom</li>
        </ul>
      </div>
    </div>
  );
};

export default DeleteStudents;