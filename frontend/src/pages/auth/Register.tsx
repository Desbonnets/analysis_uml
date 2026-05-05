import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'

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
    <div className="min-h-screen bg-[#0d0f17] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <Layers size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">ArchitectAI</span>
        </div>

        <div className="bg-[#12141c] border border-[#1e2235] rounded-2xl p-8">
          <h2 className="text-white text-xl font-semibold mb-1">Créer un compte</h2>
          <p className="text-slate-400 text-sm mb-6">Commencez à analyser votre architecture</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nom complet</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Adresse e-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Rôle</label>
              <select
                value={form.role}
                onChange={set('role')}
                className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors"
              >
                <option value="developer">Développeur</option>
                <option value="architect">Architecte logiciel</option>
                <option value="admin">Chef de projet / Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
                placeholder="Min. 8 caractères"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
            >
              Créer mon compte
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
