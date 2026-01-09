// Utility za sinhronizaciju podataka izmedju localStorage entiteta
export const syncUserData = () => {
  try {
    // 1. Proveri da li postoji trenutni user
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) return;
    
    // 2. Proveri da li user postoji u mockUsers
    const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const userExists = mockUsers.find(u => u.id === currentUser.id);
    
    // 3. Ako ne postoji, dodaj ga
    if (!userExists) {
      mockUsers.push({
        ...currentUser,
        quizResults: [],
        registeredAt: new Date().toISOString()
      });
      localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
      console.log('User added to mockUsers');
    }
    
    // 4. Sinhronizuj quizResults sa user-om
    const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const userResults = quizResults.filter(r => r.userId === currentUser.id);
    
    if (userResults.length > 0) {
      const userIndex = mockUsers.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        mockUsers[userIndex].quizResults = userResults;
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
        console.log('Quiz results synced with user');
      }
    }
    
  } catch (error) {
    console.error('Error syncing user data:', error);
  }
};

// Pokreni sinhronizaciju na učitavanju stranice
if (typeof window !== 'undefined') {
  syncUserData();
}