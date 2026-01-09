// Utility skripta za kreiranje profesorskog naloga
// Pokreni u browser konzoli kada budeš na sajtu

const createProfessorAccount = async () => {
  const professorData = {
    name: "Profesor Agilno IT",
    email: "profesor@agilnoit.edu.rs",
    password: "Profesor123!",
    role: "professor"
  };
  
  try {
    // Ovde ubaci svoj Firebase konfig
    const firebaseConfig = {
      apiKey: "AIzaSyDyxT4NKNjc9ABECFlCNbxwHPakJcA0ahs",
      authDomain: "agilnoit.firebaseapp.com",
      projectId: "agilnoit",
      storageBucket: "agilnoit.firebasestorage.app",
      messagingSenderId: "135833558940",
      appId: "1:135833558940:web:01f1c054e99125a437f259"
    };
    
	// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

    // Importuj Firebase (ako već nije)
    if (!window.firebase) {
      console.error('Firebase nije učitan');
      return;
    }
    
    const app = window.firebase.initializeApp(firebaseConfig);
    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    
    // Kreiraj auth korisnika
    const userCredential = await auth.createUserWithEmailAndPassword(
      professorData.email,
      professorData.password
    );
    
    const user = userCredential.user;
    
    // Sačuvaj u Firestore
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      name: professorData.name,
      email: professorData.email,
      role: 'professor',
      approved: true,
      createdAt: new Date().toISOString(),
      isAdmin: true
    });
    
    console.log('✅ Profesorski nalog kreiran!');
    console.log('Email:', professorData.email);
    console.log('Password:', professorData.password);
    console.log('UID:', user.uid);
    
  } catch (error) {
    console.error('❌ Greška pri kreiranju naloga:', error.message);
  }
};

// Pokreni u browser konzoli
// createProfessorAccount();