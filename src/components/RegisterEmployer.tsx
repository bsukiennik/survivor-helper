import { useState, FormEvent } from 'react';
import { apiService } from '../services/api';

export function RegisterEmployer() {
  const [formData, setFormData] = useState({
    companyName: '',
    siret: '',
    contactName: '',
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fillExampleData = () => {
    setFormData({
      companyName: 'Tech Paris SAS',
      siret: '12345678901234',
      contactName: 'Alice Martin',
      email: 'recrutement@tech-paris.fr',
      password: 'EmployerPass123!'
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);
    try {
      const res = await apiService.registerEmployer(formData);
      setSuccess(`Compte Employeur créé pour ${res.user.companyName} ! Statut : ${res.user.verificationStatus}`);
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
        <button
          type="button"
          onClick={fillExampleData}
          style={{
            background: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: '4px',
            padding: '0.3rem 0.6rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#4B5563'
          }}
        >
          ✨ Remplir exemple
        </button>
      </div>
      <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Publiez vos offres localisées pour les candidats à proximité sur GéoEmploi.
      </p>

      <div className="alert-banner info">
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>ℹ️</span>
        <div>
          <strong>Vérification d'activité</strong>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#0369A1', lineHeight: '1.4' }}>
            Votre compte sera créé avec le statut <em>En attente de vérification</em>. La publication d'offres nécessite la validation préalable de votre numéro SIRET.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert-banner error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert-banner success">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom de l'entreprise *</label>
          <input
            className="form-control"
            type="text"
            placeholder="ex: Tech Paris SAS"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
            value={formData.siret}
            onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Nom du contact *</label>
          <input
            className="form-control"
            type="text"
            placeholder="ex: Alice Martin"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Adresse e-mail professionnelle *</label>
          <input
            className="form-control"
            type="email"
            placeholder="ex: recrutement@tech-paris.fr"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Mot de passe * (min. 8 caractères)</label>
          <input
            className="form-control"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
