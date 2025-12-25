const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  answers: [{
    questionId: Number,
    selectedOption: Number,
    correctOption: Number,
    isCorrect: Boolean,
    timeSpent: Number // u sekundama
  }],
  categoryScores: {
    type: Map,
    of: Number
  },
  timeCompleted: {
    type: Number // u sekundama
  },
  mode: {
    type: String,
    enum: ['learning', 'test', 'exam', 'competition'],
    default: 'learning'
  },
  competitionId: {
    type: String,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizResult', QuizResultSchema);