import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layers, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('alice.martin@example.com')
  const [password, setPassword] = useState('password123')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0d0f17] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <Layers size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">ArchitectAI</span>
        </div>

        <div className="bg-[#12141c] border border-[#1e2235] rounded-2xl p-8">
          <h2 className="text-white text-xl font-semibold mb-1">Connexion</h2>
          <p className="text-slate-400 text-sm mb-6">Accédez à votre espace de travail</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400">Mot de passe</label>
                <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
            >
              Se connecter
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300">
              Créer un compte
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © 2026 ArchitectAI — Plateforme UML & Analyse d'Architecture
        </p>
      </div>
    </div>
  )
}
