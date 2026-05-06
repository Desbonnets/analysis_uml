import { useState } from 'react'
import { Check } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import Avatar from '../components/ui/Avatar'
import usersData from '../data/users.json'

const { currentUser } = usersData

const plans = [
  {
    name: 'Free', price: '0€', period: '/mois',
    features: ['3 projets max', '10 diagrammes', 'Analyse basique', 'Export PNG'],
    current: false,
  },
  {
    name: 'Pro', price: '29€', period: '/mois',
    features: ['Projets illimités', 'Diagrammes illimités', 'Analyse avancée', 'Assistant IA', 'Export PNG/SVG/PDF', 'Historique versions'],
    current: true,
  },
  {
    name: 'Équipe', price: '49€', period: '/siège/mois',
    features: ['Tout Pro inclus', 'Collaboration équipe', 'SSO / SAML', 'API dédiée', 'Support prioritaire', 'SLA 99.9%'],
    current: false,
  },
]

const TABS = [
  { id: 'general',       label: 'Général' },
  { id: 'analysis',      label: 'Analyse' },
  { id: 'team',          label: 'Équipe' },
  { id: 'integrations',  label: 'Intégrations' },
  { id: 'billing',       label: 'Facturation' },
]

const team = [
  { name: 'Claire L.', initials: 'CL', color: '#5BC0BE', role: 'Owner', ago: 'il y a 4 min' },
  { name: 'Marie R.',  initials: 'MR', color: '#FF7A59', role: 'Admin', ago: 'il y a 1 h' },
  { name: 'Sam K.',    initials: 'SK', color: '#3FB984', role: 'Member', ago: 'hier' },
  { name: 'Jean D.',   initials: 'JD', color: '#A78BFA', role: 'Member', ago: 'il y a 3 j' },
]

const integrations = [
  { name: 'GitHub', connected: true },
  { name: 'GitLab', connected: false },
  { name: 'Slack',  connected: true },
  { name: 'Jira',   connected: false },
]

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-0)', border: '1px solid var(--line-2)',
  borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--fg-0)',
  outline: 'none', fontFamily: 'var(--font-sans)',
}

export default function Settings() {
  const [tab, setTab] = useState('general')
  const [form, setForm] = useState({ name: currentUser.name, email: currentUser.email, role: currentUser.role })
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <Header title="Paramètres" subtitle="Configuration de l'espace · plan Team" />

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px', maxWidth: 720 }}>
        {tab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Avatar */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--bg-0)', flexShrink: 0 }}>
                {currentUser.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg-0)' }}>{currentUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-1)', margin: '2px 0 6px' }}>{currentUser.email}</div>
                <Pill tone="info" square>{currentUser.role}</Pill>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field">
                <label>Nom complet</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              </div>
              <div className="field">
                <label>Adresse e-mail</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div className="field" style={{ maxWidth: 300 }}>
              <label>Rôle</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle }}>
                <option value="developer">Développeur</option>
                <option value="architect">Architecte logiciel</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div>
              <button
                onClick={save}
                className={`btn ${saved ? 'btn-primary' : 'btn-primary'}`}
                style={saved ? { background: 'var(--ok)' } : undefined}
              >
                {saved && <Check size={14} />}
                {saved ? 'Enregistré !' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {tab === 'analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label>Seuil de couplage (CBO)</label>
              <input style={inputStyle} defaultValue="14" />
              <span className="dim" style={{ fontSize: 11 }}>Au-dessus, une issue critique est levée.</span>
            </div>
            <div className="field">
              <label>Seuil LCOM</label>
              <input style={inputStyle} defaultValue="0.6" />
            </div>
            <div className="field">
              <label>Profondeur d'analyse</label>
              <select style={{ ...inputStyle }}>
                <option>3 niveaux (recommandé)</option>
                <option>5 niveaux</option>
                <option>Illimitée</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
              Lancer une analyse à chaque push
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
              Bloquer la PR sur issue critique
            </label>
          </div>
        )}

        {tab === 'team' && (
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr><th>Membre</th><th>Rôle</th><th>Dernière activité</th></tr>
              </thead>
              <tbody>
                {team.map(m => (
                  <tr key={m.name}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar initials={m.initials} color={m.color} size={26} />
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td><Pill tone={m.role === 'Owner' ? 'info' : 'neutral'} square>{m.role}</Pill></td>
                    <td className="muted">{m.ago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'integrations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {integrations.map(it => (
              <div key={it.name} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', flexShrink: 0 }}>
                  {it.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg-0)' }}>{it.name}</div>
                  <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>{it.connected ? 'Connecté' : 'Non connecté'}</div>
                </div>
                {it.connected
                  ? <Pill tone="ok" square dot>actif</Pill>
                  : <button className="btn btn-secondary btn-sm">Connecter</button>}
              </div>
            ))}
          </div>
        )}

        {tab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Plan actuel</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--fg-0)' }}>Pro</span>
                <Pill tone="ok" square dot>Actif</Pill>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6 }}>Renouvellement le 5 juin 2026</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {plans.map(plan => (
                <div
                  key={plan.name}
                  className="card"
                  style={plan.current ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : {}}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-0)' }}>{plan.name}</span>
                    {plan.current && <Pill tone="info" square dot>Actuel</Pill>}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg-0)' }}>{plan.price}</span>
                    <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>{plan.period}</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-1)' }}>
                        <Check size={11} style={{ color: 'var(--ok)', flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={plan.current ? 'btn btn-ghost btn-sm' : 'btn btn-secondary btn-sm'}
                    style={{ width: '100%', justifyContent: 'center', cursor: plan.current ? 'default' : 'pointer' }}
                  >
                    {plan.current ? 'Plan actuel' : 'Choisir'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
