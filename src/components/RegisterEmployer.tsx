import { useState, FormEvent } from 'react';
import { registerEmployer } from '../services/api';

export function RegisterEmployer() {
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [statut, setStatut] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fillExample = () => {
    setCompanyName('Tech Paris SAS');
    setSiret('12345678901234');
    setNom('Martin');
    setPrenom('Alice');
    setStatut('Responsable Recrutement');
    setEmail('recrutement@tech-paris.fr');
    setPassword('EmployerPass123!');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setLoading(true);
    try {
      await registerEmployer({ companyName, siret, nom, prenom, statut, email, password });
      setSuccess(`Compte Employeur créé pour ${companyName} ! Statut : En attente de vérification`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2>Inscription Employeur</h2>
        <button type="button" onClick={fillExample} className="btn-secondary">
          ✨ Remplir exemple
        </button>
      </div>
      <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Publiez vos offres localisées pour les candidats à proximité sur GéoEmploi.
      </p>

      <div className="alert-banner info">
        <span>ℹ️</span>
        <div>
          <strong>Vérification d'activité</strong>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#0369A1', lineHeight: '1.4' }}>
            Votre compte sera créé avec le statut <em>En attente de vérification</em>. La publication d'offres nécessite la validation préalable de votre numéro SIRET par l'administration.
          </p>
        </div>
      </div>

      {error && <div className="alert-banner error">⚠️ {error}</div>}
      {success && <div className="alert-banner success">✅ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom de l'entreprise *</label>
          <input
            className="form-control"
            type="text"
            placeholder="ex: Tech Paris SAS"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Numéro SIRET * (14 chiffres)</label>
          <input
            className="form-control"
            type="text"
            maxLength={14}
            placeholder="12345678901234"
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Nom du représentant *</label>
            <input
              className="form-control"
              type="text"
              placeholder="ex: Martin"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Prénom du représentant *</label>
            <input
              className="form-control"
              type="text"
              placeholder="ex: Alice"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Statut / Fonction dans l'entreprise *</label>
          <input
            className="form-control"
            type="text"
            placeholder="ex: Gérant, Responsable RH, Directeur..."
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Adresse e-mail professionnelle *</label>
          <input
            className="form-control"
            type="email"
            placeholder="ex: recrutement@tech-paris.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Mot de passe * (min. 8 caractères)</label>
          <input
            className="form-control"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Création en cours...' : "S'inscrire comme employeur"}
        </button>
      </form>
    </div>
  );
}
