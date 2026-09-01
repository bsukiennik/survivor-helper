import React, { useState } from 'react';
import { RegisterJobSeeker } from './components/RegisterJobSeeker';
import { RegisterEmployer } from './components/RegisterEmployer';

export function App() {
  const [tab, setTab] = useState<'seeker' | 'employer'>('seeker');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            borderLeft: '3px solid #E1000F',
            paddingLeft: '0.6rem',
            fontWeight: 800,
            fontSize: '0.7rem',
            lineHeight: '1.2',
            textTransform: 'uppercase',
            color: '#000000',
            fontFamily: 'Marianne, sans-serif'
          }}>
            MINISTÈRE<br />DU JOB ET<br />BONHEUR
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#D1D5DB' }} />
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brand-blue)', fontFamily: 'Marianne, sans-serif' }}>
            GéoEmploi
          </span>
        </div>
      </header>

      <main className="container" style={{ flex: 1 }}>
        <div className="card">
          <div className="nav-tabs">
            <button
              className={`tab-btn ${tab === 'seeker' ? 'active' : ''}`}
              onClick={() => setTab('seeker')}
            >
              Demandeur d'emploi
            </button>
            <button
              className={`tab-btn ${tab === 'employer' ? 'active' : ''}`}
              onClick={() => setTab('employer')}
            >
              Employeur
            </button>
          </div>

          {tab === 'seeker' ? <RegisterJobSeeker /> : <RegisterEmployer />}
        </div>
      </main>

      <footer style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#6B7280'
      }}>
        GéoEmploi — Ministère du Job et Bonheur © 2026.
      </footer>
    </div>
  );
}

export default App;
