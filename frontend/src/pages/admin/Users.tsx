import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react'
import Header from '../../components/layout/Header'
import Pill from '../../components/ui/Pill'
import Avatar from '../../components/ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { getUsers, createUser, deleteUser, updateUserRole } from '../../api/users'
import { getRoles } from '../../api/roles'
import type { UserAdmin, RoleInfo, AdminCreateUserRequest, RoleName, PlanName } from '../../types'

const PLAN_TONE: Record<PlanName, 'ok' | 'info' | 'warn'> = {
  free: 'info',
  pro: 'ok',
  enterprise: 'warn',
}

const ROLE_TONE: Record<RoleName, 'warn' | 'info' | 'neutral' | 'bad'> = {
  admin: 'warn',
  architect: 'info',
  developer: 'neutral',
  superadmin: 'bad',
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

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

interface CreateModalProps {
  roles: RoleInfo[]
  onClose: () => void
  onCreated: (user: UserAdmin) => void
}

function CreateModal({ roles, onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState<AdminCreateUserRequest>({
    name: '', email: '', password: '', role: 'developer', plan: 'free',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof AdminCreateUserRequest, string>>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Nom requis'
    if (!form.email.trim()) next.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email invalide'
    if (!PASSWORD_RE.test(form.password))
      next.password = 'Min. 12 car., majuscule, minuscule, chiffre et caractère spécial'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      const created = await createUser(form)
      onCreated(created)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 480, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--fg-0)' }}>Créer un utilisateur</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Nom complet</label>
              <input
                style={inputStyleWith(errors.name)}
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })) }}
              />
              <FieldError msg={errors.name} />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                style={inputStyleWith(errors.email)}
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })) }}
              />
              <FieldError msg={errors.email} />
            </div>
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              style={inputStyleWith(errors.password)}
              value={form.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: undefined })) }}
              placeholder="12+ car., maj., min., chiffre, spécial"
            />
            <FieldError msg={errors.password} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Rôle</label>
              <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {roles.map(r => <option key={r.name} value={r.name}>{r.displayName}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Plan</label>
              <select style={inputStyle} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          {apiError && <div style={{ fontSize: 12, color: 'var(--bad)', padding: '8px 12px', background: 'rgba(255,90,90,.1)', borderRadius: 6 }}>{apiError}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditRoleProps {
  user: UserAdmin
  roles: RoleInfo[]
  onUpdated: (user: UserAdmin) => void
}

function EditRoleSelect({ user, roles, onUpdated }: EditRoleProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<string>(user.role.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value
    setValue(newRole)
    setError('')
    setLoading(true)
    try {
      const updated = await updateUserRole(user.id, newRole)
      onUpdated(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur')
      setValue(user.role.name)
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pill tone={ROLE_TONE[user.role.name]} square>{user.role.displayName}</Pill>
          <button onClick={() => { setEditing(true); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex' }} title="Modifier le rôle">
            <Pencil size={11} />
          </button>
        </div>
        {error && <span style={{ fontSize: 11, color: 'var(--bad)' }}>{error}</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <select
        autoFocus
        value={value}
        disabled={loading}
        onChange={handleChange}
        onBlur={() => { setEditing(false); setError('') }}
        style={{ ...inputStyle, padding: '4px 8px', width: 'auto', borderColor: error ? 'var(--bad)' : undefined }}
      >
        {roles.map(r => <option key={r.name} value={r.name}>{r.displayName}</option>)}
      </select>
      {error && <span style={{ fontSize: 11, color: 'var(--bad)' }}>{error}</span>}
    </div>
  )
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserAdmin[]>([])
  const [roles, setRoles] = useState<RoleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()])
      setUsers(u)
      setRoles(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleDelete(id: number) {
    await deleteUser(id)
    setUsers(prev => prev.filter(u => u.id !== id))
    setDeleteConfirm(null)
  }

  function handleUpdated(updated: UserAdmin) {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
  }

  const filtered = users.filter(u => {
    if (filterRole !== 'all' && u.role.name !== filterRole) return false
    if (filterPlan !== 'all' && u.plan !== filterPlan) return false
    return true
  })

  return (
    <div>
      <Header title="Gestion des utilisateurs" subtitle={`${users.length} membres`} />

      <div style={{ padding: '20px 28px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={{ ...inputStyle, width: 'auto' }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">Tous les rôles</option>
          {roles.map(r => <option key={r.name} value={r.name}>{r.displayName}</option>)}
        </select>
        <select style={{ ...inputStyle, width: 'auto' }} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
          <option value="all">Tous les plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          Créer un utilisateur
        </button>
      </div>

      {error && <div style={{ margin: '0 28px', padding: '10px 14px', background: 'var(--bad-soft, rgba(255,90,90,.1))', color: 'var(--bad)', borderRadius: 6, fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 28, color: 'var(--fg-2)', fontSize: 13 }}>Chargement...</div>
      ) : (
        <div style={{ padding: '0 28px 28px' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Plan</th>
                  <th>Membre depuis</th>
                  <th style={{ width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar initials={initials(u.name)} color="var(--accent)" size={28} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg-0)' }}>
                            {u.name}
                            {currentUser?.id === u.id && (
                              <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--fg-2)', fontWeight: 400 }}>vous</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <EditRoleSelect user={u} roles={roles} onUpdated={handleUpdated} />
                    </td>
                    <td><Pill tone={PLAN_TONE[u.plan]} square>{u.plan}</Pill></td>
                    <td className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      {deleteConfirm === u.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ padding: '4px 8px', background: 'var(--bad)', color: '#fff', border: 'none' }}
                            onClick={() => handleDelete(u.id)}
                          >
                            <Check size={12} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setDeleteConfirm(null)}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: 'var(--bad)' }}
                          onClick={() => setDeleteConfirm(u.id)}
                          disabled={currentUser?.id === u.id}
                          title={currentUser?.id === u.id ? 'Impossible de supprimer votre propre compte' : 'Supprimer'}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-2)', padding: '24px' }}>
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onCreated={user => {
            setUsers(prev => [...prev, user])
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}
