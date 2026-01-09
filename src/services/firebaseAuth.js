import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const firebaseAuth = {
  // Registracija studenta
  registerStudent: async (studentData) => {
    try {
      // 1. Kreiraj Firebase auth korisnika
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        studentData.email,
        studentData.password
      );
      
      const user = userCredential.user;
      
      // 2. Sačuvaj studenta u Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: studentData.name,
        email: studentData.email,
        role: 'student',
        studentId: studentData.studentId,
        approved: false, // Profesor mora odobriti
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      
      return {
        success: true,
        userId: user.uid,
        message: 'Registracija uspešna! Sačekajte odobrenje profesora.'
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Uzmi podatke iz Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('Korisnički podaci nisu pronađeni');
      }
      
      const userData = userDoc.data();
      
      // Proveri da li je odobren (za studente)
      if (userData.role === 'student' && !userData.approved) {
        await signOut(auth);
        return {
          success: false,
          error: 'Vaš nalog još nije odobren. Sačekajte odobrenje profesora.'
        };
      }
      
      return {
        success: true,
        user: {
          id: user.uid,
          ...userData
        }
      };
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Proveri da li je korisnik ulogovan
  checkAuthState: (callback) => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        // Korisnik je ulogovan
        getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            callback({
              id: user.uid,
              ...userData
            });
          }
        });
      } else {
        // Niko nije ulogovan
        callback(null);
      }
    });
  },

  // Kreiraj profesorski nalog (samo admin)
  createProfessorAccount: async (professorData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        professorData.email,
        professorData.password
      );
      
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: professorData.name,
        email: professorData.email,
        role: 'professor',
        approved: true,
        createdAt: new Date().toISOString(),
        isAdmin: true
      });
      
      return {
        success: true,
        userId: user.uid,
        message: 'Profesorski nalog kreiran!'
      };
      
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Error messages
  getErrorMessage: (errorCode) => {
    const messages = {
      'auth/email-already-in-use': 'Email adresa je već u upotrebi.',
      'auth/invalid-email': 'Email adresa nije validna.',
      'auth/operation-not-allowed': 'Operacija nije dozvoljena.',
      'auth/weak-password': 'Lozinka je previše slaba. Minimalno 6 karaktera.',
      'auth/user-disabled': 'Korisnički nalog je onemogućen.',
      'auth/user-not-found': 'Korisnik sa ovim email-om nije pronađen.',
      'auth/wrong-password': 'Pogrešna lozinka.',
      'auth/too-many-requests': 'Previše neuspešnih pokušaja. Pokušajte kasnije.'
    };
    
    return messages[errorCode] || 'Došlo je do greške. Pokušajte ponovo.';
  }
};