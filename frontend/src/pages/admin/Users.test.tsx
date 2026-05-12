import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminUsers from './Users'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'admin-token',
    user: { id: 1, name: 'Admin', email: 'admin@dev.local', role: 'admin', plan: 'pro' },
  }),
}))

const mockRoles = [
  { id: 1, name: 'admin',     displayName: 'Administrateur',      description: '', permissions: [] },
  { id: 2, name: 'architect', displayName: 'Architecte logiciel', description: '', permissions: [] },
  { id: 3, name: 'developer', displayName: 'Développeur',         description: '', permissions: [] },
]

const mockUsers = [
  {
    id: 2, name: 'Bob Dev', email: 'bob@dev.local',
    role: { id: 3, name: 'developer', displayName: 'Développeur', description: '', permissions: [] },
    plan: 'free', createdAt: '2025-01-01T00:00:00',
  },
]

const mockGetUsers  = vi.fn()
const mockGetRoles  = vi.fn()
const mockCreateUser = vi.fn()
const mockDeleteUser = vi.fn()
const mockUpdateUserRole = vi.fn()

vi.mock('../../api/users', () => ({
  getUsers:       mockGetUsers,
  createUser:     mockCreateUser,
  deleteUser:     mockDeleteUser,
  updateUserRole: mockUpdateUserRole,
}))

vi.mock('../../api/roles', () => ({ getRoles: mockGetRoles }))

function renderUsers() {
  return render(<MemoryRouter><AdminUsers /></MemoryRouter>)
}

describe('AdminUsers — table', () => {
  beforeEach(() => {
    mockGetUsers.mockResolvedValue(mockUsers)
    mockGetRoles.mockResolvedValue(mockRoles)
  })

  it('renders the user list', async () => {
    renderUsers()
    await waitFor(() => expect(screen.getByText('bob@dev.local')).toBeInTheDocument())
  })

  it('shows "Aucun utilisateur" when filters match nothing', async () => {
    mockGetUsers.mockResolvedValue([])
    renderUsers()
    await waitFor(() => expect(screen.getByText(/Aucun utilisateur trouvé/)).toBeInTheDocument())
  })
})

describe('AdminUsers — CreateModal validation', () => {
  beforeEach(() => {
    mockGetUsers.mockResolvedValue([])
    mockGetRoles.mockResolvedValue(mockRoles)
  })

  async function openModal() {
    const user = userEvent.setup()
    renderUsers()
    await waitFor(() => expect(screen.getByText(/Créer un utilisateur/)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Créer un utilisateur/i }))
    return user
  }

  it('shows name-required error when name is empty', async () => {
    const user = await openModal()
    await user.click(screen.getByRole('button', { name: /^Créer$/i }))
    expect(screen.getByText('Nom requis')).toBeInTheDocument()
  })

  it('shows email-required error when email is empty', async () => {
    const user = await openModal()
    await user.type(screen.getByLabelText(/Nom complet/i), 'Test User')
    await user.click(screen.getByRole('button', { name: /^Créer$/i }))
    expect(screen.getByText('Email requis')).toBeInTheDocument()
  })

  it('shows invalid-email error for bad email format', async () => {
    const user = await openModal()
    await user.type(screen.getByLabelText(/Nom complet/i), 'Test')
    await user.type(screen.getByLabelText(/Email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /^Créer$/i }))
    expect(screen.getByText('Email invalide')).toBeInTheDocument()
  })

  it('shows password error for weak password', async () => {
    const user = await openModal()
    await user.type(screen.getByLabelText(/Nom complet/i), 'Test')
    await user.type(screen.getByLabelText(/Email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/Mot de passe/i), 'weak')
    await user.click(screen.getByRole('button', { name: /^Créer$/i }))
    expect(screen.getByText(/Min\. 12 car\./)).toBeInTheDocument()
  })

  it('clears field error when user starts typing', async () => {
    const user = await openModal()
    await user.click(screen.getByRole('button', { name: /^Créer$/i }))
    expect(screen.getByText('Nom requis')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Nom complet/i), 'A')
    expect(screen.queryByText('Nom requis')).not.toBeInTheDocument()
  })

  it('does not call createUser when validation fails', async () => {
    const user = await openModal()
    await user.click(screen.getByRole('button', { name: /^Créer$/i }))
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('calls createUser and closes modal on valid submission', async () => {
    const newUser = {
      id: 99, name: 'New User', email: 'new@test.com',
      role: { id: 3, name: 'developer', displayName: 'Développeur', description: '', permissions: [] },
      plan: 'free', createdAt: '2025-01-01T00:00:00',
    }
    mockCreateUser.mockResolvedValue(newUser)
    const user = await openModal()
    await user.type(screen.getByLabelText(/Nom complet/i), 'New User')
    await user.type(screen.getByLabelText(/Email/i), 'new@test.com')
    await user.type(screen.getByLabelText(/Mot de passe/i), 'Valid1234!@#$')
    await user.click(screen.getByRole('button', { name: /^Créer$/i }))
    await waitFor(() => expect(mockCreateUser).toHaveBeenCalledOnce())
    await waitFor(() => expect(screen.queryByText('Créer un utilisateur')).not.toBeInTheDocument())
  })

  it('shows API error when createUser fails', async () => {
    mockCreateUser.mockRejectedValue(new Error('Email already in use'))
    const user = await openModal()
    await user.type(screen.getByLabelText(/Nom complet/i), 'Test')
    await user.type(screen.getByLabelText(/Email/i), 'existing@test.com')
    await user.type(screen.getByLabelText(/Mot de passe/i), 'Valid1234!@#$')
    await user.click(screen.getByRole('button', { name: /^Créer$/i }))
    await waitFor(() => expect(screen.getByText('Email already in use')).toBeInTheDocument())
  })
})

describe('AdminUsers — EditRoleSelect', () => {
  beforeEach(() => {
    mockGetUsers.mockResolvedValue(mockUsers)
    mockGetRoles.mockResolvedValue(mockRoles)
  })

  it('shows updated role pill after successful role change', async () => {
    const updatedUser = {
      ...mockUsers[0],
      role: { id: 2, name: 'architect', displayName: 'Architecte logiciel', description: '', permissions: [] },
    }
    mockUpdateUserRole.mockResolvedValue(updatedUser)
    const user = userEvent.setup()
    renderUsers()
    await waitFor(() => expect(screen.getByText('Développeur')).toBeInTheDocument())

    await user.click(screen.getByTitle('Modifier le rôle'))
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'architect')
    await waitFor(() => expect(screen.getByText('Architecte logiciel')).toBeInTheDocument())
  })

  it('shows API error and reverts role when updateUserRole fails', async () => {
    mockUpdateUserRole.mockRejectedValue(new Error('Erreur serveur'))
    const user = userEvent.setup()
    renderUsers()
    await waitFor(() => expect(screen.getByText('Développeur')).toBeInTheDocument())

    await user.click(screen.getByTitle('Modifier le rôle'))
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'architect')
    await waitFor(() => expect(screen.getByText('Erreur serveur')).toBeInTheDocument())
    expect(screen.getByText('Développeur')).toBeInTheDocument()
  })
})
