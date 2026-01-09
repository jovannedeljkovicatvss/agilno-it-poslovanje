// src/components/Professor/AddQuestions.js
import React, { useState } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const AddQuestions = () => {
  const [question, setQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    category: 'agilno',
    difficulty: 'medium'
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.text.trim()) {
      setMessage('❌ Unesite pitanje');
      return;
    }
    
    if (question.options.some(opt => !opt.trim())) {
      setMessage('❌ Popunite sve opcije');
      return;
    }
    
    try {
      await addDoc(collection(db, "questions"), {
        ...question,
        createdAt: new Date(),
        createdBy: 'professor'
      });
      
      setMessage('✅ Pitanje uspešno dodato!');
      setQuestion({
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        category: 'agilno',
        difficulty: 'medium'
      });
      
    } catch (error) {
      console.error('Greška:', error);
      setMessage('❌ Greška pri dodavanju pitanja');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>➕ Dodaj nova pitanja</h2>
      
      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '5px'
        }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Pitanje:
          </label>
          <textarea
            value={question.text}
            onChange={(e) => setQuestion({...question, text: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              minHeight: '100px',
              fontSize: '16px'
            }}
            placeholder="Unesite tekst pitanja..."
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>
            Opcije odgovora:
          </label>
          {question.options.map((option, index) => (
            <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                name="correctAnswer"
                checked={question.correctAnswer === index}
                onChange={() => setQuestion({...question, correctAnswer: index})}
                style={{ marginRight: '10px' }}
              />
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...question.options];
                  newOptions[index] = e.target.value;
                  setQuestion({...question, options: newOptions});
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
                placeholder={`Opcija ${index + 1}`}
              />
            </div>
          ))}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Kategorija:
          </label>
          <select
            value={question.category}
            onChange={(e) => setQuestion({...question, category: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          >
            <option value="agilno">Agilno IT poslovanje</option>
            <option value="scrum">Scrum</option>
            <option value="kanban">Kanban</option>
          </select>
        </div>
        
        <button
          type="submit"
          style={{
            padding: '12px 30px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ➕ Dodaj pitanje
        </button>
      </form>
    </div>
  );
};

export default AddQuestions;