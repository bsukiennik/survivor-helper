import { useState } from 'react';
import { RegisterJobSeeker } from './components/RegisterJobSeeker';
import { RegisterEmployer } from './components/RegisterEmployer';

export function App() {
  const [tab, setTab] = useState<'seeker' | 'employer'>('seeker');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="brand-block">
            MINISTÈRE<br />DU JOB ET<br />BONHEUR
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#D1D5DB' }} />
          <span className="app-title">GéoEmploi</span>
        </div>
      </header>

      <main className="container" style={{ flex: 1 }}>
        <div className="card">
          <div className="nav-tabs">
            <button className={`tab-btn ${tab === 'seeker' ? 'active' : ''}`} onClick={() => setTab('seeker')}>
              Demandeur d'emploi
            </button>
            <button className={`tab-btn ${tab === 'employer' ? 'active' : ''}`} onClick={() => setTab('employer')}>
              Employeur
            </button>
          </div>

          {tab === 'seeker' ? <RegisterJobSeeker /> : <RegisterEmployer />}
        </div>
      </main>

      <footer className="app-footer">
        GéoEmploi — Ministère du Job et Bonheur © 2026.
      </footer>
    </div>
  );
}

export default App;
