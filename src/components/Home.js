import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home({ user }) {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Dobrodošao/la, {user?.name}!</h1>
        <p className="subtitle">
          {user?.role === 'professor' 
            ? 'Kontrolni panel za praćenje studenata' 
            : 'Spreman/na da savladaš Agilno IT poslovanje?'}
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => navigate('/kviz')}>
          <div className="card-icon">📝</div>
          <h3>Započni kviz</h3>
          <p>100 pitanja za pripremu ispita</p>
          <div className="card-stats">
            <span>🎯 87% prosek</span>
            <span>⏱️ 45 min</span>
          </div>
          <button className="card-btn">Pokreni</button>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/rang-lista')}>
          <div className="card-icon">🏆</div>
          <h3>Rang lista</h3>
          <p>Takmiči se sa drugim studentima</p>
          <div className="card-stats">
            <span>👥 50+ takmičara</span>
            <span>📊 Real-time ranking</span>
          </div>
          <button className="card-btn">Pogledaj</button>
        </div>

        {user?.role === 'student' && (
          <>
            <div className="dashboard-card" onClick={() => alert('Uskoro dostupno!')}>
              <div className="card-icon">⚡</div>
              <h3>Real-time takmičenje</h3>
              <p>Takmičenje u realnom vremenu</p>
              <div className="card-stats">
                <span>🎮 Live multiplayer</span>
                <span>🏅 Trofeji</span>
              </div>
              <button className="card-btn">Uskoro</button>
            </div>

            <div className="dashboard-card" onClick={() => alert('Uskoro dostupno!')}>
              <div className="card-icon">📈</div>
              <h3>Tvoj napredak</h3>
              <p>Prati svoje rezultate i statistiku</p>
              <div className="card-stats">
                <span>📊 Grafikoni</span>
                <span>📅 Istorija</span>
              </div>
              <button className="card-btn">Pregled</button>
            </div>
          </>
        )}

        {user?.role === 'professor' && (
          <>
            <div className="dashboard-card professor" onClick={() => navigate('/profesor')}>
              <div className="card-icon">👨‍🏫</div>
              <h3>Pregled studenata</h3>
              <p>Vidi rezultate svih studenata</p>
              <div className="card-stats">
                <span>📋 Lista studenata</span>
                <span>📊 Statistike</span>
              </div>
              <button className="card-btn">Pregled</button>
            </div>

            <div className="dashboard-card professor" onClick={() => alert('Uskoro dostupno!')}>
              <div className="card-icon">➕</div>
              <h3>Dodaj pitanja</h3>
              <p>Kreiraj nova pitanja za kviz</p>
              <div className="card-stats">
                <span>✏️ Editor</span>
                <span>📁 Import/Export</span>
              </div>
              <button className="card-btn">Kreiraj</button>
            </div>
          </>
        )}
      </div>

      <div className="quick-stats">
        <h3>Brzi pregled</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">100</div>
            <div className="stat-label">Ukupno pitanja</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {user?.role === 'professor' ? '35' : '#8'}
            </div>
            <div className="stat-label">
              {user?.role === 'professor' ? 'Studenata' : 'Tvoj rang'}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {user?.role === 'professor' ? '87%' : '15'}
            </div>
            <div className="stat-label">
              {user?.role === 'professor' ? 'Prosek' : 'Odrađenih kvizova'}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Dostupno</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>{user?.role === 'professor' ? 'Aktivnosti studenata' : 'Nedavna aktivnost'}</h3>
        <ul className="activity-list">
          {user?.role === 'professor' ? (
            <>
              <li>📊 Marko Marković završio test sa 92% tačnosti</li>
              <li>🎯 Ana Anić postigla novi lični rekord</li>
              <li>⏰ 5 studenata aktivno u poslednjih sat vremena</li>
              <li>📈 Prosečan rezultat klase: 78%</li>
            </>
          ) : (
            <>
              <li>✅ Završio si test sa 92% tačnosti</li>
              <li>📈 Tvoj rang je porastao za 2 mesta</li>
              <li>🎯 Postigao si novi lični rekord</li>
              <li>⏰ Sledeće ponavljanje za 3 sata</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Home;