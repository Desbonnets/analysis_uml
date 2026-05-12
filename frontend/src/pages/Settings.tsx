import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import Avatar from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'
import { getMe, updateMe } from '../api/profile'
import { getUsers } from '../api/users'
import type { UserAdmin, RoleName } from '../types'

const ROLE_DISPLAY: Record<RoleName, string> = {
  admin: 'Administrateur',
  architect: 'Architecte logiciel',
  developer: 'Développeur',
}

const ROLE_TONE: Record<RoleName, 'warn' | 'info' | 'neutral'> = {
  admin: 'warn',
  architect: 'info',
  developer: 'neutral',
}

const plans = [
  {
    name: 'Free', price: '0€', period: '/mois',
    features: ['3 projets max', '10 diagrammes', 'Analyse basique', 'Export PNG'],
  },
  {
    name: 'Pro', price: '29€', period: '/mois',
    features: ['Projets illimités', 'Diagrammes illimités', 'Analyse avancée', 'Assistant IA', 'Export PNG/SVG/PDF', 'Historique versions'],
  },
  {
    name: 'Équipe', price: '49€', period: '/siège/mois',
    features: ['Tout Pro inclus', 'Collaboration équipe', 'SSO / SAML', 'API dédiée', 'Support prioritaire', 'SLA 99.9%'],
  },
]

const TABS = [
  { id: 'general',      label: 'Général' },
  { id: 'analysis',     label: 'Analyse' },
  { id: 'team',         label: 'Équipe' },
  { id: 'integrations', label: 'Intégrations' },
  { id: 'billing',      label: 'Facturation' },
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

function inputStyleWith(error?: string): React.CSSProperties {
  return error ? { ...inputStyle, borderColor: 'var(--bad)' } : inputStyle
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <span style={{ fontSize: 11, color: 'var(--bad)', marginTop: 2 }}>{msg}</span>
}

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$/

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Settings() {
  const { token, user: authUser, saveAuth } = useAuth()
  const [tab, setTab] = useState('general')

  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; currentPassword?: string }>({})
  const [profileLoading, setProfileLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')

  const [teamUsers, setTeamUsers] = useState<UserAdmin[]>([])
  const [teamLoading, setTeamLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    getMe(token)
      .then(profile => setForm(f => ({ ...f, name: profile.name, email: profile.email })))
      .catch(() => {
        if (authUser) setForm(f => ({ ...f, name: authUser.name, email: authUser.email }))
      })
      .finally(() => setProfileLoading(false))
  }, [token, authUser])

  useEffect(() => {
    if (tab !== 'team' || !token || authUser?.role !== 'admin') return
    setTeamLoading(true)
    getUsers(token)
      .then(setTeamUsers)
      .finally(() => setTeamLoading(false))
  }, [tab, token, authUser?.role])

  function validatePassword(): boolean {
    if (!form.newPassword) return true
    const next: typeof fieldErrors = {}
    if (!form.currentPassword) next.currentPassword = 'Mot de passe actuel requis'
    if (!PASSWORD_RE.test(form.newPassword))
      next.newPassword = 'Min. 12 car., majuscule, minuscule, chiffre et caractère spécial'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!validatePassword()) return
    setSaveStatus('saving')
    setSaveError('')
    try {
      const payload: Parameters<typeof updateMe>[1] = {}
      if (form.name) payload.name = form.name
      if (form.email) payload.email = form.email
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }
      const updated = await updateMe(token, payload)
      if (authUser) saveAuth(token, { ...authUser, name: updated.name, email: updated.email })
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
      setSaveStatus('error')
    }
  }

  const currentPlan = authUser?.plan ?? 'free'

  return (
    <div>
      <Header title="Paramètres" subtitle={`Plan ${currentPlan}`} />

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px', maxWidth: 720 }}>
        {tab === 'general' && (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--bg-0)', flexShrink: 0 }}>
                {authUser ? initials(authUser.name) : '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg-0)' }}>{authUser?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-1)', margin: '2px 0 6px' }}>{authUser?.email}</div>
                {authUser?.role && <Pill tone={ROLE_TONE[authUser.role]} square>{ROLE_DISPLAY[authUser.role]}</Pill>}
              </div>
            </div>

            {profileLoading ? (
              <div style={{ color: 'var(--fg-2)', fontSize: 13 }}>Chargement du profil...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="field">
                    <label>Nom complet</label>
                    <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Adresse e-mail</label>
                    <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--line-1)', paddingTop: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Changer le mot de passe
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="field">
                      <label>Mot de passe actuel</label>
                      <input
                        type="password"
                        style={inputStyleWith(fieldErrors.currentPassword)}
                        value={form.currentPassword}
                        onChange={e => { setForm(f => ({ ...f, currentPassword: e.target.value })); setFieldErrors(er => ({ ...er, currentPassword: undefined })) }}
                        placeholder="Laisser vide pour ne pas changer"
                      />
                      <FieldError msg={fieldErrors.currentPassword} />
                    </div>
                    <div className="field">
                      <label>Nouveau mot de passe</label>
                      <input
                        type="password"
                        style={inputStyleWith(fieldErrors.newPassword)}
                        value={form.newPassword}
                        onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setFieldErrors(er => ({ ...er, newPassword: undefined })) }}
                        placeholder="12+ car., maj., min., chiffre, spécial"
                      />
                      <FieldError msg={fieldErrors.newPassword} />
                    </div>
                  </div>
                </div>

                {saveStatus === 'error' && saveError && (
                  <div style={{ fontSize: 12, color: 'var(--bad)', padding: '8px 12px', background: 'var(--bad-soft, rgba(255,90,90,.1))', borderRadius: 6 }}>
                    {saveError}
                  </div>
                )}
                <div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saveStatus === 'saving'}
                    style={saveStatus === 'saved' ? { background: 'var(--ok)' } : undefined}
                  >
                    {saveStatus === 'saved' && <Check size={14} />}
                    {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Enregistré !' : 'Enregistrer'}
                  </button>
                </div>
              </>
            )}
          </form>
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
          <div>
            {authUser?.role !== 'admin' ? (
              <div className="card">
                <div style={{ color: 'var(--fg-2)', fontSize: 13 }}>
                  La gestion de l'équipe est réservée aux administrateurs.
                </div>
              </div>
            ) : teamLoading ? (
              <div style={{ color: 'var(--fg-2)', fontSize: 13 }}>Chargement...</div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr><th>Membre</th><th>Rôle</th><th>Plan</th><th>Membre depuis</th></tr>
                  </thead>
                  <tbody>
                    {teamUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar initials={initials(u.name)} color="var(--accent)" size={26} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><Pill tone={ROLE_TONE[u.role.name]} square>{u.role.displayName}</Pill></td>
                        <td><Pill tone="neutral" square>{u.plan}</Pill></td>
                        <td className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--fg-0)', textTransform: 'capitalize' }}>{currentPlan}</span>
                <Pill tone="ok" square dot>Actif</Pill>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6 }}>Renouvellement le 5 juin 2026</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {plans.map(plan => {
                const isCurrent = plan.name.toLowerCase() === currentPlan || (plan.name === 'Équipe' && currentPlan === 'enterprise')
                return (
                  <div key={plan.name} className="card" style={isCurrent ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : {}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-0)' }}>{plan.name}</span>
                      {isCurrent && <Pill tone="info" square dot>Actuel</Pill>}
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
                      className={isCurrent ? 'btn btn-ghost btn-sm' : 'btn btn-secondary btn-sm'}
                      style={{ width: '100%', justifyContent: 'center', cursor: isCurrent ? 'default' : 'pointer' }}
                    >
                      {isCurrent ? 'Plan actuel' : 'Choisir'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
