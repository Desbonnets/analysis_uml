import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import { register } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 12,          hint: 'Au moins 12 caractères' },
  { test: (p: string) => /[A-Z]/.test(p),         hint: 'Au moins une majuscule' },
  { test: (p: string) => /[a-z]/.test(p),         hint: 'Au moins une minuscule' },
  { test: (p: string) => /\d/.test(p),            hint: 'Au moins un chiffre' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), hint: 'Au moins un caractère spécial (!@#…)' },
]

function validatePassword(password: string): string | null {
  const failing = PASSWORD_RULES.find(r => !r.test(password))
  return failing ? failing.hint : null
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'developer' })
  const [error, setError] = useState<string | null>(null)
  const [passwordHint, setPasswordHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { saveAuth } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const hint = validatePassword(form.password)
    if (hint) { setPasswordHint(hint); return }
    setError(null)
    setLoading(true)
    try {
      const user = await register(form)
      saveAuth(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setForm(f => ({ ...f, password: val }))
    setPasswordHint(val ? validatePassword(val) : null)
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
          Créer un espace.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--fg-1)', margin: '0 0 24px' }}>
          Commence à analyser ton architecture dès maintenant.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Nom complet</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Jean Dupont" required />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="toi@exemple.com" required />
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
            <input
              type="password"
              value={form.password}
              onChange={handlePasswordChange}
              placeholder="Min. 12 caractères, majuscule, chiffre, symbole"
              required
            />
            {passwordHint && (
              <span style={{ fontSize: 11, color: 'var(--warn)', marginTop: 2 }}>{passwordHint}</span>
            )}
          </div>

          {error && (
            <p style={{ fontSize: 12, color: 'var(--bad)', margin: 0 }}>{error}</p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <UserPlus size={14} /> {loading ? 'Création…' : 'Créer mon compte'}
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
