import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {
  it('renders the email input with default value', () => {
    renderLogin()
    expect(screen.getByDisplayValue('claire@umla.io')).toBeInTheDocument()
  })

  it('renders the password input empty', () => {
    const { container } = renderLogin()
    const passwordInput = container.querySelector<HTMLInputElement>('[type="password"]')
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput?.value).toBe('')
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

  it('allows typing a new email', async () => {
    const user = userEvent.setup()
    renderLogin()
    const emailInput = screen.getByDisplayValue('claire@umla.io')
    await user.clear(emailInput)
    await user.type(emailInput, 'nouveau@exemple.com')
    expect(emailInput).toHaveValue('nouveau@exemple.com')
  })

  it('allows typing a password', async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()
    const passwordInput = container.querySelector<HTMLInputElement>('[type="password"]')!
    await user.type(passwordInput, 'secret123')
    expect(passwordInput).toHaveValue('secret123')
  })

  it('navigates to /dashboard on form submission', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /Se connecter/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })
})