import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, GitBranch } from 'lucide-react'
import Logo from '../../components/ui/Logo'

export default function Login() {
  const [email, setEmail] = useState('claire@umla.io')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

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
          Bon retour.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-1)', margin: '0 0 24px' }}>
          Connecte-toi pour reprendre tes analyses.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
            />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <a href="#" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', alignSelf: 'flex-end' }}>
              Mot de passe oublié ?
            </a>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <LogIn size={14} /> Se connecter
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--fg-2)', fontSize: 11 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
          <span>OU</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
        </div>

        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
          <GitBranch size={14} /> Continuer avec GitHub
        </button>

        <p style={{ fontSize: 11, color: 'var(--fg-2)', margin: '20px 0 0', textAlign: 'center' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Créer un espace
          </Link>
        </p>
      </div>
    </div>
  )
}
