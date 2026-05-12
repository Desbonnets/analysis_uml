import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockLogin = vi.fn()

vi.mock('../../api/auth', () => ({ login: mockLogin }))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ saveAuth: vi.fn(), clearAuth: vi.fn(), user: null, token: null }),
}))

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>)
}

const validUser = {
  token: 'test-token',
  user: { id: 1, name: 'Test User', email: 'test@test.com', role: 'developer', plan: 'free' },
}

describe('Login — rendering', () => {
  beforeEach(() => { mockLogin.mockResolvedValue(validUser) })

  it('renders the email input', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('toi@exemple.com')).toBeInTheDocument()
  })

  it('renders the password input', () => {
    const { container } = renderLogin()
    expect(container.querySelector('[type="password"]')).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument()
  })

  it('renders the GitHub button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /Continuer avec GitHub/i })).toBeInTheDocument()
  })

  it('renders the register link', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /Créer un espace/i })).toBeInTheDocument()
  })
})

describe('Login — interactions', () => {
  beforeEach(() => { mockLogin.mockResolvedValue(validUser) })

  it('allows typing an email', async () => {
    const user = userEvent.setup()
    renderLogin()
    const input = screen.getByPlaceholderText('toi@exemple.com')
    await user.type(input, 'alice@example.com')
    expect(input).toHaveValue('alice@example.com')
  })

  it('allows typing a password', async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()
    const input = container.querySelector<HTMLInputElement>('[type="password"]')!
    await user.type(input, 'Alice1234!@#')
    expect(input).toHaveValue('Alice1234!@#')
  })

  it('navigates to /dashboard on successful submission', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'Alice1234!@#')
    await user.click(screen.getByRole('button', { name: /Se connecter/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows loading state while submitting', async () => {
    mockLogin.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'Alice1234!@#')
    await user.click(screen.getByRole('button', { name: /Se connecter/i }))
    expect(screen.getByRole('button', { name: /Connexion/i })).toBeDisabled()
  })
})

describe('Login — error handling', () => {
  it('displays wrong-credentials message on 401', async () => {
    mockLogin.mockRejectedValue(new Error('Email ou mot de passe incorrect'))
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'bad@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /Se connecter/i }))
    await waitFor(() =>
      expect(screen.getByText('Email ou mot de passe incorrect')).toBeInTheDocument(),
    )
  })

  it('displays a network error message when the server is unreachable', async () => {
    mockLogin.mockRejectedValue(new Error('Impossible de joindre le serveur. Vérifiez votre connexion.'))
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'Alice1234!@#')
    await user.click(screen.getByRole('button', { name: /Se connecter/i }))
    await waitFor(() =>
      expect(screen.getByText(/Impossible de joindre le serveur/)).toBeInTheDocument(),
    )
  })

  it('clears the error message when the form is resubmitted', async () => {
    mockLogin
      .mockRejectedValueOnce(new Error('Email ou mot de passe incorrect'))
      .mockResolvedValueOnce(validUser)
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong')
    await user.click(screen.getByRole('button', { name: /Se connecter/i }))
    await waitFor(() => expect(screen.getByText('Email ou mot de passe incorrect')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Se connecter/i }))
    await waitFor(() =>
      expect(screen.queryByText('Email ou mot de passe incorrect')).not.toBeInTheDocument(),
    )
  })
})
