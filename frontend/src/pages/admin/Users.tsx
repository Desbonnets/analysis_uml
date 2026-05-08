import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react'
import Header from '../../components/layout/Header'
import Pill from '../../components/ui/Pill'
import Avatar from '../../components/ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { getUsers, createUser, updateUser, deleteUser, updateUserRole } from '../../api/users'
import { getRoles } from '../../api/roles'
import type { UserAdmin, RoleInfo, AdminCreateUserRequest, RoleName, PlanName } from '../../types'

const PLAN_TONE: Record<PlanName, 'ok' | 'info' | 'warn'> = {
  free: 'info',
  pro: 'ok',
  enterprise: 'warn',
}

const ROLE_TONE: Record<RoleName, 'warn' | 'info' | 'neutral'> = {
  admin: 'warn',
  architect: 'info',
  developer: 'neutral',
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-0)', border: '1px solid var(--line-2)',
  borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--fg-0)',
  outline: 'none', fontFamily: 'var(--font-sans)',
}

interface CreateModalProps {
  roles: RoleInfo[]
  onClose: () => void
  onCreated: (user: UserAdmin) => void
  token: string
}

function CreateModal({ roles, onClose, onCreated, token }: CreateModalProps) {
  const [form, setForm] = useState<AdminCreateUserRequest>({
    name: '', email: '', password: '', role: 'developer', plan: 'free',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const created = await createUser(token, form)
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
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
              <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Email</label>
              <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input required type="password" style={inputStyle} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="12+ car., maj., min., chiffre, spécial" />
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
          {error && <div style={{ fontSize: 12, color: 'var(--bad)', padding: '8px 12px', background: 'var(--bad-soft, rgba(255,90,90,.1))', borderRadius: 6 }}>{error}</div>}
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
  token: string
  onUpdated: (user: UserAdmin) => void
}

function EditRoleSelect({ user, roles, token, onUpdated }: EditRoleProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(user.role.name)
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value
    setValue(newRole)
    setLoading(true)
    try {
      const updated = await updateUserRole(token, user.id, newRole)
      onUpdated(updated)
    } finally {
      setLoading(false)
      setEditing(false)
    }
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Pill tone={ROLE_TONE[user.role.name]} square>{user.role.displayName}</Pill>
        <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex' }} title="Modifier le rôle">
          <Pencil size={11} />
        </button>
      </div>
    )
  }

  return (
    <select
      autoFocus
      value={value}
      disabled={loading}
      onChange={handleChange}
      onBlur={() => setEditing(false)}
      style={{ ...inputStyle, padding: '4px 8px', width: 'auto' }}
    >
      {roles.map(r => <option key={r.name} value={r.name}>{r.displayName}</option>)}
    </select>
  )
}

export default function AdminUsers() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserAdmin[]>([])
  const [roles, setRoles] = useState<RoleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [u, r] = await Promise.all([getUsers(token), getRoles(token)])
      setUsers(u)
      setRoles(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { void load() }, [load])

  async function handleDelete(id: number) {
    if (!token) return
    await deleteUser(token, id)
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
                      <EditRoleSelect user={u} roles={roles} token={token!} onUpdated={handleUpdated} />
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

      {showCreate && token && (
        <CreateModal
          roles={roles}
          token={token}
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
