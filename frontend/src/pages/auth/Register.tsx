import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Logo from '../../components/ui/Logo'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'developer' })
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Logo size={32} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--fg-0)' }}>
              UML Analysis
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>Plateforme d'architecture</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 6px', color: 'var(--fg-0)' }}>
          Créer un espace.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-1)', margin: '0 0 24px' }}>
          Commence à analyser ton architecture dès maintenant.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Nom complet</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Jean Dupont" />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="toi@exemple.com" />
          </div>
          <div className="field">
            <label>Rôle</label>
            <select value={form.role} onChange={set('role')}>
              <option value="developer">Développeur</option>
              <option value="architect">Architecte logiciel</option>
              <option value="admin">Chef de projet / Admin</option>
            </select>
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 caractères" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <UserPlus size={14} /> Créer mon compte
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'var(--fg-2)', margin: '20px 0 0', textAlign: 'center' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
