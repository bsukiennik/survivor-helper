import React, { useState } from 'react';
import { registerJobSeeker, registerEmployer } from '../services/api';

export function RegisterJobSeeker() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    skills: '',
    experience: '',
    availability: 'Immédiate'
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ error?: string; success?: string }>({});

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fillExample = () => {
    setForm({
      fullName: 'Jean Dupont',
      email: 'jean.dupont@email.fr',
      password: 'Password123!',
      skills: 'React, TypeScript',
      experience: '3 ans en développement web',
      availability: 'Immédiate'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) return setStatus({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });

    setLoading(true);
    setStatus({});
    try {
      await registerJobSeeker(form);
      setStatus({ success: `Compte créé avec succès pour ${form.fullName} !` });
    } catch (err: any) {
      setStatus({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2>Inscription Demandeur d'emploi</h2>
        <button type="button" onClick={fillExample} className="btn-secondary">✨ Remplir exemple</button>
      </div>
      <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Créez votre profil professionnel réutilisable sur GéoEmploi.
      </p>

      {status.error && <div className="alert-banner error">⚠️ {status.error}</div>}
      {status.success && <div className="alert-banner success">✅ {status.success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom complet *</label>
          <input className="form-control" name="fullName" type="text" placeholder="ex: Jean Dupont" value={form.fullName} onChange={update} required />
        </div>
        <div className="form-group">
          <label>Adresse e-mail *</label>
          <input className="form-control" name="email" type="email" placeholder="ex: jean.dupont@email.fr" value={form.email} onChange={update} required />
        </div>
        <div className="form-group">
          <label>Mot de passe * (min. 8 caractères)</label>
          <input className="form-control" name="password" type="password" placeholder="••••••••" value={form.password} onChange={update} required />
        </div>
        <div className="form-group">
          <label>Compétences principales *</label>
          <input className="form-control" name="skills" type="text" placeholder="ex: React, TypeScript, Communication" value={form.skills} onChange={update} required />
        </div>
        <div className="form-group">
          <label>Expérience professionnelle *</label>
          <textarea className="form-control" name="experience" rows={2} placeholder="ex: 3 ans en développement web" value={form.experience} onChange={update} required />
        </div>
        <div className="form-group">
          <label>Disponibilité *</label>
          <select className="form-control" name="availability" value={form.availability} onChange={update}>
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
}

export function RegisterEmployer() {
  const [form, setForm] = useState({
    companyName: '',
    siret: '',
    nom: '',
    prenom: '',
    statut: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ error?: string; success?: string }>({});

  const update = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fillExample = () => {
    setForm({
      companyName: 'Tech Paris SAS',
      siret: '12345678901234',
      nom: 'Martin',
      prenom: 'Alice',
      statut: 'Responsable Recrutement',
      email: 'recrutement@tech-paris.fr',
      password: 'EmployerPass123!'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.siret.length !== 14) return setStatus({ error: 'Le numéro SIRET doit contenir exactement 14 chiffres.' });
    if (form.password.length < 8) return setStatus({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });

    setLoading(true);
    setStatus({});
    try {
      await registerEmployer(form);
      setStatus({ success: `Compte Employeur créé pour ${form.companyName} ! Statut : En attente de vérification` });
    } catch (err: any) {
      setStatus({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2>Inscription Employeur</h2>
        <button type="button" onClick={fillExample} className="btn-secondary">✨ Remplir exemple</button>
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

      {status.error && <div className="alert-banner error">⚠️ {status.error}</div>}
      {status.success && <div className="alert-banner success">✅ {status.success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom de l'entreprise *</label>
          <input className="form-control" name="companyName" type="text" placeholder="ex: Tech Paris SAS" value={form.companyName} onChange={update} required />
        </div>
        <div className="form-group">
          <label>Numéro SIRET * (14 chiffres)</label>
          <input className="form-control" name="siret" type="text" maxLength={14} placeholder="12345678901234" value={form.siret} onChange={update} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Nom du représentant *</label>
            <input className="form-control" name="nom" type="text" placeholder="ex: Martin" value={form.nom} onChange={update} required />
          </div>
          <div className="form-group">
            <label>Prénom du représentant *</label>
            <input className="form-control" name="prenom" type="text" placeholder="ex: Alice" value={form.prenom} onChange={update} required />
          </div>
        </div>
        <div className="form-group">
          <label>Statut / Fonction dans l'entreprise *</label>
          <input className="form-control" name="statut" type="text" placeholder="ex: Gérant, Responsable RH, Directeur..." value={form.statut} onChange={update} required />
        </div>
        <div className="form-group">
          <label>Adresse e-mail professionnelle *</label>
          <input className="form-control" name="email" type="email" placeholder="ex: recrutement@tech-paris.fr" value={form.email} onChange={update} required />
        </div>
        <div className="form-group">
          <label>Mot de passe * (min. 8 caractères)</label>
          <input className="form-control" name="password" type="password" placeholder="••••••••" value={form.password} onChange={update} required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Création en cours...' : "S'inscrire comme employeur"}
        </button>
      </form>
    </div>
  );
}
