import { 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const firebaseQuiz = {
  // Sačuvaj rezultat kviza
  saveQuizResult: async (quizResult) => {
    try {
      const docRef = await addDoc(collection(db, 'quizResults'), {
        ...quizResult,
        submittedAt: new Date().toISOString(),
        timestamp: Date.now()
      });
      
      return {
        success: true,
        id: docRef.id,
        message: 'Rezultat uspešno sačuvan!'
      };
    } catch (error) {
      console.error('Error saving quiz result:', error);
      return {
        success: false,
        error: 'Greška pri čuvanju rezultata.'
      };
    }
  },

  // Dohvati sve rezultate za leaderboard
  getLeaderboard: async (itemsLimit = 20) => {
    try {
      const q = query(
        collection(db, 'quizResults'),
        orderBy('percentage', 'desc'),
        limit(itemsLimit)
      );
      
      const querySnapshot = await getDocs(q);
      const results = [];
      
      querySnapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return {
        success: false,
        error: 'Greška pri učitavanju rang liste.'
      };
    }
  },

  // Dohvati studente na čekanju (za profesora) - POPRAVLJENO
  getPendingStudents: async () => {
    try {
      // Uzmi sve studente
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      
      const querySnapshot = await getDocs(q);
      const students = [];
      
      // Ručno filtriranje
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Student je na čekanju ako:
        // 1. Nema approved polje ILI
        // 2. Ima approved: false ILI
        // 3. Ima status: 'pending'
        const isPending = 
          !data.hasOwnProperty('approved') || 
          data.approved === false || 
          data.status === 'pending';
        
        if (isPending) {
          students.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log(`Pronađeno ${students.length} studenata na čekanju`);
      
      return {
        success: true,
        data: students
      };
    } catch (error) {
      console.error('Error fetching pending students:', error);
      return {
        success: false,
        error: 'Greška pri učitavanju studenata.'
      };
    }
  },

  // Dohvati sve studente
  getAllStudents: async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      
      const querySnapshot = await getDocs(q);
      const students = [];
      
      querySnapshot.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        data: students
      };
    } catch (error) {
      console.error('Error fetching all students:', error);
      return {
        success: false,
        error: 'Greška pri učitavanju studenata.'
      };
    }
  },

  // Odobri studenta
  approveStudent: async (studentId) => {
    try {
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        approved: true,
        approvedAt: new Date().toISOString(),
        status: 'approved'
      });
      
      return {
        success: true,
        message: 'Student uspešno odobren!'
      };
    } catch (error) {
      console.error('Error approving student:', error);
      return {
        success: false,
        error: 'Greška pri odobravanju studenta.'
      };
    }
  },

  // Odbij studenta
  rejectStudent: async (studentId) => {
    try {
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        approved: false,
        rejectedAt: new Date().toISOString(),
        status: 'rejected'
      });
      
      return {
        success: true,
        message: 'Student odbijen.'
      };
    } catch (error) {
      console.error('Error rejecting student:', error);
      return {
        success: false,
        error: 'Greška pri odbijanju studenta.'
      };
    }
  },

  // Dohvati statistiku profesora - POPRAVLJENO
  getProfessorStats: async () => {
    try {
      // UZMI SVE STUDENTE ODJEDNOM
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      
      let pendingCount = 0;
      let approvedCount = 0;
      
      // Ručno brojanje
      studentsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Student je odobren SAMO ako ima approved: true
        if (data.approved === true) {
          approvedCount++;
        } else {
          // Svi ostali su na čekanju (bez approved ili approved: false)
          pendingCount++;
        }
      });
      
      // Broj kvizova (ako postoji kolekcija)
      let quizCount = 0;
      try {
        const quizzesSnapshot = await getDocs(collection(db, 'quizResults'));
        quizCount = quizzesSnapshot.size;
      } catch (quizError) {
        console.log('quizResults kolekcija možda ne postoji:', quizError.message);
      }
      
      // Izračunaj prosečan skor
      let averageScore = 0;
      try {
        const quizzesQuery = query(collection(db, 'quizResults'));
        const quizzesSnapshot = await getDocs(quizzesQuery);
        
        let totalScore = 0;
        let totalQuizzes = 0;
        
        quizzesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.percentage) {
            totalScore += data.percentage;
            totalQuizzes++;
          }
        });
        
        if (totalQuizzes > 0) {
          averageScore = Math.round(totalScore / totalQuizzes);
        }
      } catch (scoreError) {
        console.log('Greška pri računanju prosečnog skora:', scoreError);
      }
      
      console.log(`📊 Statistika: ${approvedCount} odobrenih, ${pendingCount} na čekanju`);
      
      return {
        success: true,
        data: {
          pendingStudents: pendingCount,
          approvedStudents: approvedCount,
          totalQuizzes: quizCount,
          totalStudents: pendingCount + approvedCount,
          averageScore: averageScore
        }
      };
      
    } catch (error) {
      console.error('Error fetching professor stats:', error);
      return {
        success: false,
        error: 'Greška pri učitavanju statistike.'
      };
    }
  },

  // DODATA FUNKCIJA: Popravi studente bez approved polja
  fixMissingApprovedField: async () => {
    try {
      console.log('🛠️ Pokrećem migraciju za studente bez approved polja...');
      
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      
      const querySnapshot = await getDocs(q);
      let fixedCount = 0;
      
      const updates = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Ako nema approved polje, dodaj ga
        if (!data.hasOwnProperty('approved')) {
          updates.push(
            updateDoc(doc.ref, {
              approved: false,
              status: 'pending'
            })
          );
          fixedCount++;
          console.log(`   Dodajem approved:false za ${data.email}`);
        }
      });
      
      // Izvrši sve ažuriranja
      await Promise.all(updates);
      
      console.log(`✅ Migracija završena. Popravljeno ${fixedCount} studenata.`);
      
      return {
        success: true,
        message: `Popravljeno ${fixedCount} studenata.`
      };
      
    } catch (error) {
      console.error('Error in migration:', error);
      return {
        success: false,
        error: 'Greška pri migraciji.'
      };
    }
  },

  // NOVA FUNKCIJA: Obriši studenta
  deleteStudent: async (studentId) => {
    try {
      await deleteDoc(doc(db, 'users', studentId));
      
      // Opciono: obrišite i rezultate kvizova za ovog studenta
      try {
        const quizResultsQuery = query(
          collection(db, 'quizResults'),
          where('studentId', '==', studentId)
        );
        const quizResultsSnapshot = await getDocs(quizResultsQuery);
        
        const deletePromises = [];
        quizResultsSnapshot.forEach(doc => {
          deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
      } catch (quizError) {
        console.log('Nema rezultata kvizova za brisanje:', quizError);
      }
      
      return {
        success: true,
        message: 'Student uspešno obrisan.'
      };
    } catch (error) {
      console.error('Error deleting student:', error);
      return {
        success: false,
        error: 'Greška pri brisanju studenta.'
      };
    }
  }
};