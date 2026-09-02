import { useState, FormEvent } from 'react'
import { registerJobSeeker } from '../services/api'

export function RegisterJobSeeker() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [availability, setAvailability] = useState('Immédiate')
  const [rgpdConsent, setRgpdConsent] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fillExample = () => {
    setFullName('Jean Dupont')
    setEmail('jean.dupont@email.fr')
    setPassword('Password123!')
    setSkills('React, TypeScript')
    setExperience('3 ans en développement web')
    setAvailability('Immédiate')
    setRgpdConsent(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (!rgpdConsent) {
      setError('Vous devez accepter le traitement de vos données personnelles (RGPD) pour vous inscrire.')
      return
    }

    setLoading(true)
    try {
      await registerJobSeeker({ fullName, email, password, skills, experience, availability, rgpdConsent })
      setSuccess(`Compte créé avec succès pour ${fullName} !`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2>Inscription Demandeur d'emploi</h2>
        <button type="button" onClick={fillExample} className="btn-secondary">
          ✨ Remplir exemple
        </button>
      </div>
      <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Créez votre profil professionnel réutilisable sur GéoEmploi.
      </p>

      {error && <div className="alert-banner error">⚠️ {error}</div>}
      {success && <div className="alert-banner success">✅ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom complet *</label>
          <input
            className="form-control"
            type="text"
            placeholder="ex: Jean Dupont"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Adresse e-mail *</label>
          <input
            className="form-control"
            type="email"
            placeholder="ex: jean.dupont@email.fr"
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

        <div className="form-group">
          <label>Compétences principales *</label>
          <input
            className="form-control"
            type="text"
            placeholder="ex: React, TypeScript, Communication"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Expérience professionnelle *</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="ex: 3 ans en développement web"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Disponibilité *</label>
          <select
            className="form-control"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="Immédiate">Immédiate</option>
            <option value="Sous 1 mois">Sous 1 mois</option>
            <option value="Sous 3 mois">Sous 3 mois</option>
          </select>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '1rem' }}>
          <input
            type="checkbox"
            id="rgpd-seeker"
            checked={rgpdConsent}
            onChange={(e) => setRgpdConsent(e.target.checked)}
            style={{ marginTop: '0.2rem' }}
          />
          <label htmlFor="rgpd-seeker" style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 'normal' }}>
            J'accepte expressément le traitement de mes données à caractère personnel (nom, e-mail, compétences, expérience et disponibilité) par le Ministère du Job et Bonheur aux fins de création de mon profil professionnel et d'instruction de mes candidatures, conformément à l'article 6.1.a du RGPD. *
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Création en cours...' : "S'inscrire comme demandeur d'emploi"}
        </button>
      </form>
    </div>
  )
}
