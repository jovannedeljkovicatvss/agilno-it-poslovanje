import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Firebase konfiguracija
const firebaseConfig = {
  apiKey: "AIzaSyDyxT4NKNjc9ABECFlCNbxwHPakJcA0ahs",
  authDomain: "agilnoit.firebaseapp.com",
  projectId: "agilnoit",
  storageBucket: "agilnoit.firebasestorage.app",
  messagingSenderId: "135833558940",
  appId: "1:135833558940:web:01f1c054e99125a437f259"
};

// Inicijalizuj Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

// Funkcija za kreiranje admin naloga - OVO TREBA DA BUDE POSLE EXPORTA!
export const createAdminAccount = async () => {
  try {
    const adminEmail = 'admin@agilnoit.edu.rs';
    const adminPassword = 'Admin123!';
    
    console.log('🔧 Kreiranje admin naloga...');
    
    // Kreiraj u Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('✅ Auth uspešan:', user.uid);
    
    // Sačuvaj u Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: adminEmail,
      displayName: 'Administrator',
      role: 'admin',
      isApproved: true,
      createdAt: new Date(),
      permissions: ['create_professors', 'view_all_users', 'system_config']
    });
    
    console.log('✅ Firestore uspešan');
    console.log('====================');
    console.log('✅ Admin nalog kreiran!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 UID:', user.uid);
    console.log('====================');
    
    return { 
      success: true, 
      email: adminEmail, 
      password: adminPassword,
      uid: user.uid
    };
    
  } catch (error) {
    console.error('❌ Greška pri kreiranju admin naloga:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin već postoji. Pokušajte da se ulogujete.');
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
};

// Dodatna funkcija za kreiranje test profesora
export const createTestProfessor = async () => {
  try {
    const professorEmail = `profesor${Date.now()}@agilnoit.edu.rs`;
    const professorPassword = 'profesor123';
    const professorName = 'Test Profesor';
    
    console.log('🔧 Kreiranje test profesora...');
    
    const userCredential = await createUserWithEmailAndPassword(auth, professorEmail, professorPassword);
    const user = userCredential.user;
    
    await setDoc(doc(db, "users", user.uid), {
      email: professorEmail,
      displayName: professorName,
      role: 'professor',
      isApproved: true,
      createdAt: new Date()
    });
    
    console.log('====================');
    console.log('✅ Test profesor kreiran!');
    console.log('📧 Email:', professorEmail);
    console.log('🔑 Password:', professorPassword);
    console.log('🆔 UID:', user.uid);
    console.log('====================');
    
    return { 
      success: true, 
      email: professorEmail, 
      password: professorPassword,
      name: professorName
    };
    
  } catch (error) {
    console.error('❌ Greška pri kreiranju test profesora:', error);
    return { success: false, error: error.message };
  }
};