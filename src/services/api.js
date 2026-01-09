const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  // Login
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  // Registracija (samo studenti)
  register: async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  // Profesor panel
  getPendingStudents: async (token) => {
    const response = await fetch(`${API_URL}/students/pending`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  approveStudent: async (studentId, token) => {
    const response = await fetch(`${API_URL}/students/${studentId}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  deleteStudent: async (studentId, token) => {
    const response = await fetch(`${API_URL}/students/${studentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  // Rang lista
  getLeaderboard: async () => {
    const response = await fetch(`${API_URL}/leaderboard`);
    return response.json();
  },

  // Čuvanje rezultata
  saveQuizResult: async (result, token) => {
    const response = await fetch(`${API_URL}/quiz-results`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(result)
    });
    return response.json();
  }
};