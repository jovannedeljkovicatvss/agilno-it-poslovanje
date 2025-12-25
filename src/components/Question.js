import React, { useState } from 'react';

function Question({ question, onAnswer, showResults }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (index) => {
    if (!showResults) {
      setSelected(index);
      onAnswer(index);
    }
  };

  return (
    <div className="question-card">
      <h3>Pitanje {question.id}: {question.question}</h3>
      
      <div className="options">
        {question.options.map((option, index) => (
          <div 
            key={index}
            className={`option ${selected === index ? 'selected' : ''} 
                       ${showResults && index === question.correct ? 'correct' : ''}
                       ${showResults && selected === index && index !== question.correct ? 'wrong' : ''}`}
            onClick={() => handleSelect(index)}
          >
            <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
            {option}
          </div>
        ))}
      </div>

      {showResults && (
        <div className="explanation">
          <strong>Objašnjenje:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
}

export default Question;