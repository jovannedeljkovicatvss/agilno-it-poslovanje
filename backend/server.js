const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock baza (za sada - kasnije dodaj pravu bazu)
let users = [
  {
    id: 'prof-001',
    name: 'Profesor Demo',
    email: 'profesor@skola.edu.rs',
    password: '$2a$10$example', // bcrypt hash za 'profesor123'
    role: 'professor',
    approved: true
  }
];

let students = [];
let quizResults = [];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'tajni-kljuc-za-projekat';

// Middleware za autentifikaciju
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Niste autentifikovani' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token nije validan' });
  }
};

// 1. REGISTRACIJA (samo studenti)
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;
    
    // Provera da li korisnik već postoji
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Email već postoji' });
    }
    
    // Hash lozinke
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Kreiraj studenta (neodobrenog)
    const newStudent = {
      id: 'stud-' + Date.now(),
      name,
      email,
      password: hashedPassword,
      role: 'student',
      studentId,
      approved: false, // Profesor mora da odobri
      createdAt: new Date()
    };
    
    users.push(newStudent);
    
    res.status(201).json({ 
      message: 'Registracija uspešna! Sačekajte odobrenje profesora.',
      user: {
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        role: newStudent.role,
        studentId: newStudent.studentId,
        approved: newStudent.approved
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Greška pri registraciji' });
  }
});

// 2. LOGIN (profesori automatski odobreni, studenti čekaju odobrenje)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Pogrešan email ili lozinka' });
    }
    
    // Proveri lozinku
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Pogrešan email ili lozinka' });
    }
    
    // Proveri da li je odobren
    if (user.role === 'student' && !user.approved) {
      return res.status(403).json({ 
        message: 'Vaš nalog još nije odobren od strane profesora.' 
      });
    }
    
    // Kreiraj token
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
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        approved: user.approved
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Greška pri prijavi' });
  }
});

// 3. PROFESOR PANEL (samo za profesore)

// 3a. Pregled svih studenata koji čekaju odobrenje
app.get('/api/students/pending', authenticate, (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Samo za profesore' });
  }
  
  const pendingStudents = users.filter(u => 
    u.role === 'student' && !u.approved
  );
  
  res.json(pendingStudents);
});

// 3b. Odobri/odbij studenta
app.post('/api/students/:id/approve', authenticate, (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Samo za profesore' });
  }
  
  const student = users.find(u => u.id === req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Student nije pronađen' });
  }
  
  student.approved = true;
  res.json({ message: 'Student odobren', student });
});

// 3c. Brisanje studenta
app.delete('/api/students/:id', authenticate, (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Samo za profesore' });
  }
  
  users = users.filter(u => u.id !== req.params.id);
  res.json({ message: 'Student obrisan' });
});

// 4. Čuvanje rezultata kviza
app.post('/api/quiz-results', authenticate, (req, res) => {
  const result = {
    ...req.body,
    userId: req.user.userId,
    userName: req.user.name,
    submittedAt: new Date()
  };
  
  quizResults.push(result);
  res.json({ message: 'Rezultat sačuvan', result });
});

// 5. Rang lista
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = quizResults
    .reduce((acc, result) => {
      const existing = acc.find(r => r.userId === result.userId);
      if (existing) {
        existing.totalScore += result.score;
        existing.totalQuizzes += 1;
      } else {
        acc.push({
          userId: result.userId,
          userName: result.userName,
          totalScore: result.score,
          totalQuizzes: 1
        });
      }
      return acc;
    }, [])
    .map(r => ({
      ...r,
      averageScore: r.totalScore / r.totalQuizzes
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 20);
  
  res.json(leaderboard);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});