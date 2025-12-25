import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Progress.css';

function ProgressChart({ results }) {
  // Mock podaci za primer
  const progressData = [
    { date: '1. Jan', score: 65, time: 120 },
    { date: '5. Jan', score: 72, time: 115 },
    { date: '10. Jan', score: 78, time: 105 },
    { date: '15. Jan', score: 85, time: 98 },
    { date: '20. Jan', score: 88, time: 92 },
    { date: '25. Jan', score: 90, time: 88 },
    { date: '30. Jan', score: 92, time: 85 }
  ];

  const categoryData = [
    { category: 'Scrum osnove', score: 95, questions: 30 },
    { category: 'Sprint planning', score: 85, questions: 25 },
    { category: 'Team dinamika', score: 75, questions: 20 },
    { category: 'Agile principi', score: 90, questions: 25 }
  ];

  return (
    <div className="progress-dashboard">
      <h2>📈 Tvoj napredak</h2>
      
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Prosek poena tokom vremena</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#8884d8" name="Prosek (%)" />
              <Line type="monotone" dataKey="time" stroke="#82ca9d" name="Vreme (s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Kategorije</h3>
          <div className="categories-list">
            {categoryData.map((cat, index) => (
              <div key={index} className="category-item">
                <div className="category-header">
                  <span className="category-name">{cat.category}</span>
                  <span className="category-score">{cat.score}%</span>
                </div>
                <div className="category-progress">
                  <div 
                    className="progress-bar"
                    style={{ width: `${cat.score}%` }}
                  ></div>
                </div>
                <div className="category-meta">
                  <span>{cat.questions} pitanja</span>
                  <button className="practice-btn">Vežbaj</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="stats-summary">
          <div className="stat-item">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">87%</div>
              <div className="stat-label">Ukupni prosek</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">12.5h</div>
              <div className="stat-label">Ukupno učenje</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-value">#8</div>
              <div className="stat-label">Rang</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">94</div>
              <div className="stat-label">Odgovoreno pitanja</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressChart;