// src/components/Admin/CreateProfessor.js - POPRAVLJENA VERZIJA
import React, { useState } from 'react';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const CreateProfessor = ({ user }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // OBAVEZNO!
    e.stopPropagation(); // Sprečava propagaciju
    
    console.log('🔧 Submit pokrenut:', formData);
    
    // Validacija
    if (!formData.email.endsWith('@agilnoit.edu.rs')) {
      setMessage('❌ Email mora biti u domeni @agilnoit.edu.rs');
      return;
    }
    
    if (formData.password.length < 6) {
      setMessage('❌ Lozinka mora imati najmanje 6 karaktera');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      console.log('1. Kreiranje Firebase Auth korisnika...');
      
      // 1. Kreiraj u Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const newUser = userCredential.user;
      console.log('✅ Auth uspešan:', newUser.uid);
      
      // 2. Sačuvaj u Firestore
      console.log('2. Čuvanje u Firestore...');
      await setDoc(doc(db, "users", newUser.uid), {
        email: formData.email,
        displayName: formData.name,
        role: 'professor',
        isApproved: true,
        createdAt: new Date(),
        createdBy: user?.email || 'admin',
        approvedAt: new Date()
      });
      
      console.log('✅ Firestore uspešan');
      
      setMessage(`✅ Profesor "${formData.name}" uspešno kreiran!`);
      
      // Resetuj formu
      setFormData({ name: '', email: '', password: '' });
      
      // Auto-clear poruke
      setTimeout(() => setMessage(''), 5000);
      
    } catch (error) {
      console.error('❌ Greška pri kreiranju profesora:', error.code, error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        setMessage('❌ Email adresa je već u upotrebi.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('❌ Email adresa nije validna.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setMessage('❌ Email/password registracija nije omogućena.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('❌ Lozinka je previše slaba.');
      } else {
        setMessage(`❌ Greška: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Test funkcija za debug
  const testCreateProfessor = async () => {
    const testEmail = `testprof${Date.now()}@agilnoit.edu.rs`;
    const testPassword = 'test123';
    const testName = 'Test Profesor';
    
    console.log('🧪 Test kreiranje profesora...');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const newUser = userCredential.user;
      
      await setDoc(doc(db, "users", newUser.uid), {
        email: testEmail,
        displayName: testName,
        role: 'professor',
        isApproved: true,
        createdAt: new Date()
      });
      
      console.log('✅ Test profesor kreiran!');
      console.log('📧 Email:', testEmail);
      console.log('🔑 Password:', testPassword);
      
      setMessage(`✅ Test profesor kreiran!\nEmail: ${testEmail}\nPassword: ${testPassword}`);
      
    } catch (error) {
      console.error('❌ Test greška:', error);
      setMessage(`❌ Test greška: ${error.message}`);
    }
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '40px auto', 
      padding: '30px',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        👨‍🏫 Kreiranje novog profesora
      </h2>
      
      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '5px',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          whiteSpace: 'pre-line'
        }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} id="professorForm">
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Ime i prezime profesora:
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
            placeholder="Marko Marković"
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Email (mora biti @agilnoit.edu.rs):
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
            placeholder="marko.markovic@agilnoit.edu.rs"
          />
          <small style={{ color: '#666', fontSize: '14px', display: 'block', marginTop: '5px' }}>
            Mora biti u domeni @agilnoit.edu.rs
          </small>
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Privremena lozinka:
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength="6"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
            placeholder="Minimalno 6 karaktera"
          />
          <small style={{ color: '#666', fontSize: '14px', display: 'block', marginTop: '5px' }}>
            Profesor će moći da promeni lozinku nakon prvog logina
          </small>
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? 'Kreiram...' : '👨‍🏫 Kreiraj Professorski Nalog'}
        </button>
        
        <button 
          type="button"
          onClick={testCreateProfessor}
          style={{
            width: '100%',
            padding: '12px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          🧪 Kreiraj test profesora (debug)
        </button>
      </form>
      
      {/* Debug info */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#f9f9f9', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4 style={{ marginTop: 0 }}>🔍 Debug informacije:</h4>
        <p><strong>Trenutni admin:</strong> {user?.email || 'Nepoznato'}</p>
        <p><strong>Form data:</strong> {JSON.stringify(formData)}</p>
        <p><strong>Loading:</strong> {loading ? 'Da' : 'Ne'}</p>
        
        <div style={{ marginTop: '15px' }}>
          <button 
            onClick={() => {
              console.log('🔍 Debug podaci:');
              console.log('Form data:', formData);
              console.log('Current user:', user);
              console.log('Auth object:', auth);
              console.log('Firebase app:', auth?.app);
              
              // Testiraj Firebase direktno
              createUserWithEmailAndPassword(auth, 'test@test.com', 'test123')
                .then(res => console.log('Auth test OK:', res.user.uid))
                .catch(err => console.log('Auth test error:', err.code, err.message));
            }}
            style={{
              padding: '8px 15px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Testiraj Firebase u konzoli
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProfessor;