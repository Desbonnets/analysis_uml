import { useState } from 'react'
import { User, Bell, Shield, CreditCard, Check } from 'lucide-react'
import Header from '../components/layout/Header'
import Badge from '../components/ui/Badge'
import usersData from '../data/users.json'

const { currentUser } = usersData

const plans = [
  {
    name: 'Free',
    price: '0€',
    period: '/mois',
    features: ['3 projets max', '10 diagrammes', 'Analyse basique', 'Export PNG'],
    current: false,
  },
  {
    name: 'Pro',
    price: '29€',
    period: '/mois',
    features: ['Projets illimités', 'Diagrammes illimités', 'Analyse avancée', 'Assistant IA', 'Export PNG/SVG/PDF', 'Historique versions'],
    current: true,
  },
  {
    name: 'Entreprise',
    price: '99€',
    period: '/mois',
    features: ['Tout Pro inclus', 'Collaboration équipe', 'SSO / SAML', 'API dédiée', 'Support prioritaire', 'SLA 99.9%'],
    current: false,
  },
]

const tabs = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'billing', label: 'Abonnement', icon: CreditCard },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({ name: currentUser.name, email: currentUser.email, role: currentUser.role })
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Paramètres" subtitle="Gérez votre compte et vos préférences" />

      <div className="flex-1 px-8 py-6">
        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-48 shrink-0 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {activeTab === 'profile' && (
              <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-6 space-y-5">
                <h3 className="text-white font-semibold">Informations personnelles</h3>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-xl text-white font-bold">
                    {currentUser.avatar}
                  </div>
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{currentUser.name}</p>
                    <p className="text-slate-500 text-xs">{currentUser.email}</p>
                    <Badge label={currentUser.role} variant="purple" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Nom complet</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Adresse e-mail</label>
                    <input
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Rôle</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="developer">Développeur</option>
                    <option value="architect">Architecte logiciel</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <button
                  onClick={save}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    saved ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {saved && <Check size={14} />}
                  {saved ? 'Enregistré !' : 'Enregistrer'}
                </button>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-4 mb-6">
                  <p className="text-xs text-slate-400 mb-1">Plan actuel</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">Pro</span>
                    <Badge label="Actif" variant="success" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Renouvellement le 5 juin 2026</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {plans.map(plan => (
                    <div
                      key={plan.name}
                      className={`rounded-xl p-5 border ${
                        plan.current
                          ? 'border-violet-500/50 bg-violet-600/5'
                          : 'border-[#1e2235] bg-[#12141c]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold text-sm">{plan.name}</h4>
                        {plan.current && <Badge label="Actuel" variant="purple" />}
                      </div>
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                        <span className="text-slate-500 text-xs">{plan.period}</span>
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <Check size={11} className="text-violet-400 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                          plan.current
                            ? 'bg-violet-600/20 text-violet-300 cursor-default'
                            : 'bg-[#1e2235] text-slate-300 hover:bg-violet-600/20 hover:text-violet-300'
                        }`}
                      >
                        {plan.current ? 'Plan actuel' : 'Choisir'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-6 space-y-4">
                <h3 className="text-white font-semibold">Préférences de notifications</h3>
                {[
                  { label: 'Analyse terminée', desc: 'Notifier quand une analyse est complète', enabled: true },
                  { label: 'Nouvelle violation critique', desc: 'Alerte immédiate sur les violations critiques', enabled: true },
                  { label: 'Rapport hebdomadaire', desc: 'Résumé de l\'état de vos projets', enabled: false },
                  { label: 'Mises à jour produit', desc: 'Nouvelles fonctionnalités et améliorations', enabled: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#1e2235] last:border-0">
                    <div>
                      <p className="text-slate-200 text-sm">{item.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${item.enabled ? 'bg-violet-600' : 'bg-[#2a2d3e]'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-6 space-y-5">
                <h3 className="text-white font-semibold">Sécurité du compte</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Mot de passe actuel</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Nouveau mot de passe</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-[#0d0f17] border border-[#2a2d3e] rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors" />
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                  Mettre à jour
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
