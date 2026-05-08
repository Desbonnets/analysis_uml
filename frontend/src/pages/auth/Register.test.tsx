import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../api/auth', () => ({
  register: vi.fn().mockResolvedValue({
    token: 'test-token',
    user: { id: 1, name: 'Test User', email: 'test@test.com', role: 'developer', plan: 'free' },
  }),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ saveAuth: vi.fn(), clearAuth: vi.fn(), user: null, token: null }),
}))

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  )
}

describe('Register', () => {
  it('renders the name input', () => {
    renderRegister()
    expect(screen.getByPlaceholderText('Jean Dupont')).toBeInTheDocument()
  })

  it('renders the email input', () => {
    renderRegister()
    expect(screen.getByPlaceholderText('toi@exemple.com')).toBeInTheDocument()
  })

  it('renders the password input', () => {
    renderRegister()
    expect(screen.getByPlaceholderText(/12 caractères/)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderRegister()
    expect(screen.getByRole('button', { name: /Créer mon compte/i })).toBeInTheDocument()
  })

  it('renders the login link', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /Se connecter/i })).toBeInTheDocument()
  })

  it('shows hint when password is too short', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByPlaceholderText(/12 caractères/), 'Ab1!')
    expect(screen.getByText('Au moins 12 caractères')).toBeInTheDocument()
  })

  it('shows hint when password has no uppercase', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByPlaceholderText(/12 caractères/), 'alllower1234!')
    expect(screen.getByText('Au moins une majuscule')).toBeInTheDocument()
  })

  it('shows hint when password has no digit', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByPlaceholderText(/12 caractères/), 'NoDigitHere!!')
    expect(screen.getByText('Au moins un chiffre')).toBeInTheDocument()
  })

  it('shows hint when password has no special character', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByPlaceholderText(/12 caractères/), 'NoSpecial1234')
    expect(screen.getByText(/caractère spécial/)).toBeInTheDocument()
  })

  it('shows no hint for a valid password', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByPlaceholderText(/12 caractères/), 'Valid1234!@#')
    expect(screen.queryByText(/Au moins/)).not.toBeInTheDocument()
  })

  it('navigates to /dashboard after successful registration', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByPlaceholderText('Jean Dupont'), 'Test User')
    await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText(/12 caractères/), 'Valid1234!@#')
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })
})
