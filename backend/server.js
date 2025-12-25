const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Fiksn JWT ključ
const JWT_SECRET = 'agilno_it_poslovanje_tajni_kljuc_2024';

// PRAZNA baza podataka (u memoriji)
let users = [];
let quizResults = [];

// Middleware za proveru tokena
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ success: false, message: 'Token ne postoji' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token nije validan' });
    req.user = user;
    next();
  });
};

// Rute

// Registracija
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role, studentId } = req.body;
    
    // Provera da li korisnik već postoji
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Korisnik već postoji' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: Date.now().toString(), // Jedinstveni ID
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      studentId: role === 'student' ? studentId : undefined,
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    // Kreiranje JWT tokena
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role, 
        name: newUser.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ Novi korisnik registrovan: ${name} (${email})`);
    console.log(`📊 Ukupno korisnika: ${users.length}`);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentId: newUser.studentId
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri registraciji',
      error: error.message 
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Pogrešni podaci' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Pogrešni podaci' 
      });
    }
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ Korisnik prijavljen: ${user.name} (${user.email})`);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri prijavi',
      error: error.message 
    });
  }
});

// Sačuvaj rezultate kviza
app.post('/api/quiz-results', authenticateToken, async (req, res) => {
  try {
    const { score, totalQuestions, percentage, timeSpent, answers } = req.body;
    
    const user = users.find(u => u.id === req.user.userId);
    
    const newResult = {
      id: Date.now().toString(),
      userId: req.user.userId,
      username: req.user.name,
      score,
      totalQuestions,
      percentage,
      timeSpent: timeSpent || 0,
      answers: answers || [],
      createdAt: new Date()
    };
    
    quizResults.push(newResult);
    
    console.log(`📊 Rezultati sačuvani za: ${req.user.name}`);
    console.log(`   Rezultat: ${score}/${totalQuestions} (${percentage}%)`);
    console.log(`   Ukupno rezultata u bazi: ${quizResults.length}`);
    
    res.status(201).json({ 
      success: true,
      message: 'Rezultati sačuvani', 
      result: newResult 
    });
    
  } catch (error) {
    console.error('Save results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri čuvanju rezultata', 
      error: error.message 
    });
  }
});

// Dohvati rang listu
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Grupiši rezultate po korisniku
    const userStats = {};
    
    quizResults.forEach(result => {
      if (!userStats[result.userId]) {
        userStats[result.userId] = {
          username: result.username,
          totalScore: 0,
          attempts: 0,
          bestScore: 0,
          totalTime: 0
        };
      }
      
      userStats[result.userId].totalScore += result.percentage;
      userStats[result.userId].attempts++;
      userStats[result.userId].bestScore = Math.max(
        userStats[result.userId].bestScore, 
        result.percentage
      );
      userStats[result.userId].totalTime += (result.timeSpent || 0);
    });
    
    // Konvertuj u niz i izračunaj proseke
    const leaderboard = Object.entries(userStats).map(([userId, stats]) => ({
      userId,
      username: stats.username,
      avgScore: Math.round((stats.totalScore / stats.attempts) * 10) / 10,
      attempts: stats.attempts,
      bestScore: Math.round(stats.bestScore * 10) / 10,
      avgTimePerQuiz: Math.round((stats.totalTime / stats.attempts) * 10) / 10
    }));
    
    // Sortiraj po prosečnom rezultatu
    leaderboard.sort((a, b) => b.avgScore - a.avgScore);
    
    // Ako nema podataka, vrati praznu listu
    if (leaderboard.length === 0) {
      return res.json([]);
    }
    
    res.json(leaderboard.slice(0, 20));
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.json([]);
  }
});

// Dohvati moje rezultate
app.get('/api/my-results', authenticateToken, async (req, res) => {
  try {
    const myResults = quizResults
      .filter(result => result.userId === req.user.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(myResults);
    
  } catch (error) {
    console.error('My results error:', error);
    res.json([]);
  }
});

// Admin: Dohvati sve korisnike
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ success: false, message: 'Samo profesori' });
  }
  
  res.json({
    success: true,
    count: users.length,
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      studentId: u.studentId,
      createdAt: u.createdAt
    }))
  });
});

// Admin: Resetuj bazu (samo za testiranje)
app.post('/api/admin/reset', authenticateToken, (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ success: false, message: 'Samo profesori' });
  }
  
  users = users.filter(u => u.id === req.user.userId); // Ostanu samo trenutni korisnik
  quizResults = quizResults.filter(r => r.userId === req.user.userId);
  
  console.log('🔄 Baza resetovana na čistu');
  
  res.json({ 
    success: true, 
    message: 'Baza resetovana',
    usersCount: users.length,
    resultsCount: quizResults.length
  });
});

// Provera da li server radi
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    resultsCount: quizResults.length,
    message: 'Baza je ČISTA - samo registrovani korisnici'
  });
});
// ==================== PROFESOR FUNKCIONALNOSTI ====================

// 1. Dohvati sve rezultate svih studenata
app.get('/api/professor/results', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    // Grupiši po studentu
    const studentResults = {};
    
    quizResults.forEach(result => {
      if (!studentResults[result.userId]) {
        studentResults[result.userId] = {
          userId: result.userId,
          username: result.username,
          results: [],
          totalScore: 0,
          attempts: 0,
          bestScore: 0,
          worstScore: 100,
          avgTime: 0,
          lastAttempt: null
        };
      }
      
      studentResults[result.userId].results.push({
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        timeSpent: result.timeSpent,
        createdAt: result.createdAt
      });
      
      studentResults[result.userId].totalScore += result.percentage;
      studentResults[result.userId].attempts++;
      studentResults[result.userId].bestScore = Math.max(
        studentResults[result.userId].bestScore, 
        result.percentage
      );
      studentResults[result.userId].worstScore = Math.min(
        studentResults[result.userId].worstScore, 
        result.percentage
      );
      studentResults[result.userId].avgTime += result.timeSpent;
      
      if (!studentResults[result.userId].lastAttempt || 
          new Date(result.createdAt) > new Date(studentResults[result.userId].lastAttempt)) {
        studentResults[result.userId].lastAttempt = result.createdAt;
      }
    });
    
    // Izračunaj proseke
    const formattedResults = Object.values(studentResults).map(student => ({
      ...student,
      avgScore: Math.round((student.totalScore / student.attempts) * 10) / 10,
      avgTime: Math.round((student.avgTime / student.attempts) * 10) / 10,
      results: student.results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }));
    
    // Dodaj podatke o studentima
    const studentsWithInfo = formattedResults.map(student => {
      const user = users.find(u => u.id === student.userId);
      return {
        ...student,
        email: user?.email || 'Nepoznato',
        studentId: user?.studentId || 'Nepoznato',
        registeredAt: user?.createdAt || 'Nepoznato'
      };
    });
    
    res.json({
      success: true,
      count: studentsWithInfo.length,
      students: studentsWithInfo.sort((a, b) => b.avgScore - a.avgScore)
    });
    
  } catch (error) {
    console.error('Professor results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri dobavljanju rezultata', 
      error: error.message 
    });
  }
});

// 2. Dohvati detalje jednog studenta
app.get('/api/professor/students/:studentId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    const { studentId } = req.params;
    
    const student = users.find(u => u.id === studentId || u.email === studentId || u.studentId === studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student nije pronađen' });
    }
    
    const studentResults = quizResults
      .filter(result => result.userId === student.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const stats = {
      totalAttempts: studentResults.length,
      avgScore: studentResults.length > 0 
        ? Math.round(studentResults.reduce((sum, r) => sum + r.percentage, 0) / studentResults.length * 10) / 10
        : 0,
      bestScore: studentResults.length > 0
        ? Math.max(...studentResults.map(r => r.percentage))
        : 0,
      worstScore: studentResults.length > 0
        ? Math.min(...studentResults.map(r => r.percentage))
        : 0,
      totalTime: studentResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      lastAttempt: studentResults.length > 0 ? studentResults[0].createdAt : null
    };
    
    res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        role: student.role,
        registeredAt: student.createdAt
      },
      stats,
      results: studentResults,
      activity: {
        thisWeek: studentResults.filter(r => 
          new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        thisMonth: studentResults.filter(r => 
          new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length
      }
    });
    
  } catch (error) {
    console.error('Student details error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri dobavljanju detalja', 
      error: error.message 
    });
  }
});

// 3. Dodaj novo pitanje
let quizQuestions = []; // Mock baza pitanja

// Inicijalna pitanja
const initialQuestions = [
  {
    id: 1,
    question: "Zašto je vážno verovati timu?",
    options: [
      "Timovi sa visokim poverenjem ne moraju biti odgovorni jedni prema drugima",
      "Timovi sa visokim poverenjem ne zahtevaju predstavnika korisnika",
      "Projekt menadžer u tom slučaju ne mora da brine o rasporedu aktivnosti na projektu",
      "Prisustvo poverenja je u uzajamnoj vezi i pozitivno utiče na performanse tima"
    ],
    correct: 3,
    explanation: "Kada se SCRUM timu ukaže poverenje i stvorí se pogodno okruženje oko njega, tim preuzima odgovornost za svoje obaveze i ispunjava ih kako je očekivano od strane Product Owner-a i predstavnika biznisa.",
    category: "Scrum Principi",
    difficulty: "Srednje",
    createdAt: new Date(),
    createdBy: "system"
  }
];

quizQuestions = [...initialQuestions];

app.get('/api/questions', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    res.json({
      success: true,
      count: quizQuestions.length,
      questions: quizQuestions
    });
    
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri dobavljanju pitanja', 
      error: error.message 
    });
  }
});

app.post('/api/questions', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    const { question, options, correct, explanation, category, difficulty } = req.body;
    
    // Validacija
    if (!question || !options || !Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pitanje mora imati tačno 4 opcije' 
      });
    }
    
    if (correct < 0 || correct > 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tačan odgovor mora biti između 0 i 3' 
      });
    }
    
    const newQuestion = {
      id: quizQuestions.length > 0 ? Math.max(...quizQuestions.map(q => q.id)) + 1 : 1,
      question,
      options,
      correct: parseInt(correct),
      explanation,
      category: category || "Scrum Principi",
      difficulty: difficulty || "Srednje",
      createdAt: new Date(),
      createdBy: req.user.name
    };
    
    quizQuestions.push(newQuestion);
    
    console.log(`❓ Novo pitanje dodato: "${question.substring(0, 50)}..."`);
    
    res.status(201).json({
      success: true,
      message: 'Pitanje uspešno dodato',
      question: newQuestion
    });
    
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri dodavanju pitanja', 
      error: error.message 
    });
  }
});

app.put('/api/questions/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    const { id } = req.params;
    const { question, options, correct, explanation, category, difficulty } = req.body;
    
    const questionIndex = quizQuestions.findIndex(q => q.id === parseInt(id));
    
    if (questionIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pitanje nije pronađeno' 
      });
    }
    
    // Ažuriraj pitanje
    quizQuestions[questionIndex] = {
      ...quizQuestions[questionIndex],
      question: question || quizQuestions[questionIndex].question,
      options: options || quizQuestions[questionIndex].options,
      correct: correct !== undefined ? parseInt(correct) : quizQuestions[questionIndex].correct,
      explanation: explanation || quizQuestions[questionIndex].explanation,
      category: category || quizQuestions[questionIndex].category,
      difficulty: difficulty || quizQuestions[questionIndex].difficulty,
      updatedAt: new Date(),
      updatedBy: req.user.name
    };
    
    console.log(`✏️ Pitanje ažurirano: ID ${id}`);
    
    res.json({
      success: true,
      message: 'Pitanje uspešno ažurirano',
      question: quizQuestions[questionIndex]
    });
    
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri ažuriranju pitanja', 
      error: error.message 
    });
  }
});

app.delete('/api/questions/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    const { id } = req.params;
    
    const questionIndex = quizQuestions.findIndex(q => q.id === parseInt(id));
    
    if (questionIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pitanje nije pronađeno' 
      });
    }
    
    const deletedQuestion = quizQuestions.splice(questionIndex, 1)[0];
    
    console.log(`🗑️ Pitanje obrisano: "${deletedQuestion.question.substring(0, 50)}..."`);
    
    res.json({
      success: true,
      message: 'Pitanje uspešno obrisano',
      question: deletedQuestion
    });
    
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri brisanju pitanja', 
      error: error.message 
    });
  }
});

// 4. Šalji obaveštenja studentima
let notifications = [];

app.post('/api/professor/notifications', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    const { title, message, studentIds, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Naslov i poruka su obavezni' 
      });
    }
    
    const newNotification = {
      id: Date.now().toString(),
      title,
      message,
      type: type || 'info',
      studentIds: studentIds || 'all', // 'all' za sve studente
      sentBy: req.user.name,
      sentAt: new Date(),
      readBy: []
    };
    
    notifications.push(newNotification);
    
    // Simulacija slanja notifikacija
    const targetStudents = studentIds === 'all' 
      ? users.filter(u => u.role === 'student')
      : users.filter(u => studentIds.includes(u.id));
    
    console.log(`📢 Obaveštenje poslato: "${title}"`);
    console.log(`   Primalac: ${targetStudents.length} student(a)`);
    console.log(`   Poruka: ${message.substring(0, 100)}...`);
    
    res.status(201).json({
      success: true,
      message: 'Obaveštenje uspešno poslato',
      notification: newNotification,
      recipients: targetStudents.length
    });
    
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri slanju obaveštenja', 
      error: error.message 
    });
  }
});

app.get('/api/professor/notifications', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri dobavljanju obaveštenja', 
      error: error.message 
    });
  }
});

// Export pitanja za frontend kviz
app.get('/api/quiz-questions', (req, res) => {
  res.json(quizQuestions);
});

// Admin statistika
app.get('/api/professor/stats', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Samo profesori' });
    }
    
    const students = users.filter(u => u.role === 'student');
    const professors = users.filter(u => u.role === 'professor');
    
    const stats = {
      totalUsers: users.length,
      totalStudents: students.length,
      totalProfessors: professors.length,
      totalQuizAttempts: quizResults.length,
      totalQuestions: quizQuestions.length,
      avgStudentScore: quizResults.length > 0
        ? Math.round(quizResults.reduce((sum, r) => sum + r.percentage, 0) / quizResults.length * 10) / 10
        : 0,
      activeThisWeek: quizResults.filter(r => 
        new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      categories: {
        'Scrum Principi': quizQuestions.filter(q => q.category === 'Scrum Principi').length,
        'Sprint Planning': quizQuestions.filter(q => q.category === 'Sprint Planning').length,
        'Team Dinamika': quizQuestions.filter(q => q.category === 'Team Dinamika').length,
        'Agile Principi': quizQuestions.filter(q => q.category === 'Agile Principi').length
      }
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Greška pri dobavljanju statistike', 
      error: error.message 
    });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server radi na portu ${PORT}`);
  console.log(`🌐 Dostupan na: http://localhost:${PORT}`);
  console.log(`📊 Baza: PRAZNA (${users.length} korisnika, ${quizResults.length} rezultata)`);
  console.log(`👤 Registruj se prvi put da bi počeo!`);
  console.log(`📌 API endpoints:`);
  console.log(`   GET  /api/health          - Provera servera`);
  console.log(`   POST /api/register        - Registracija`);
  console.log(`   POST /api/login           - Prijava`);
  console.log(`   GET  /api/leaderboard     - Rang lista`);
  console.log(`   POST /api/quiz-results    - Sačuvaj rezultate`);
  console.log(`   GET  /api/my-results      - Moji rezultati`);
});