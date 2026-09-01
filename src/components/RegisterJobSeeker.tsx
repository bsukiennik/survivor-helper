import React, { useState } from 'react';
import { apiService } from '../services/api';

export const RegisterJobSeeker: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    skills: '',
    experience: '',
    availability: 'Immédiate'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fillExampleData = () => {
    setFormData({
      fullName: 'Jean Dupont',
      email: 'jean.dupont@email.fr',
      password: 'Password123!',
      skills: 'React, TypeScript, UI Design',
      experience: '3 ans en développement web',
      availability: 'Immédiate'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.registerJobSeeker(formData);
      setSuccess(`Compte créé avec succès pour ${res.user.fullName} !`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2>Inscription Demandeur d'emploi</h2>
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
      <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Créez votre profil professionnel réutilisable sur GéoEmploi.
      </p>

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
          <label>Nom complet *</label>
          <input
            className="form-control"
            type="text"
            placeholder="ex: Jean Dupont"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Adresse e-mail *</label>
          <input
            className="form-control"
            type="email"
            placeholder="ex: jean.dupont@email.fr"
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

        <div className="form-group">
          <label>Compétences principales *</label>
          <input
            className="form-control"
            type="text"
            placeholder="ex: React, TypeScript, Communication"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Expérience professionnelle *</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="ex: 3 ans en développement web"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Disponibilité *</label>
          <select
            className="form-control"
            value={formData.availability}
            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          >
            <option value="Immédiate">Immédiate</option>
            <option value="Sous 1 mois">Sous 1 mois</option>
            <option value="Sous 3 mois">Sous 3 mois</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Création en cours...' : "S'inscrire comme demandeur d'emploi"}
        </button>
      </form>
    </div>
  );
};
