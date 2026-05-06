import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Settings } from 'lucide-react'
import Button from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Cliquer</Button>)
    expect(screen.getByRole('button', { name: /Cliquer/i })).toBeInTheDocument()
  })

  it('applies primary variant class', () => {
    render(<Button variant="primary">Sauvegarder</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })

  it('applies secondary variant by default', () => {
    render(<Button>Par défaut</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('btn')
    expect(btn).toHaveClass('btn-secondary')
  })

  it('applies danger variant class', () => {
    render(<Button variant="danger">Supprimer</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-danger')
  })

  it('applies sm size class', () => {
    render(<Button size="sm">Petit</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-sm')
  })

  it('does not apply sm class without size prop', () => {
    render(<Button>Normal</Button>)
    expect(screen.getByRole('button')).not.toHaveClass('btn-sm')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Cliquer</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Désactivé</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Désactivé</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders with type submit', () => {
    render(<Button type="submit">Envoyer</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('renders an icon when provided', () => {
    render(<Button icon={Settings}>Paramètres</Button>)
    expect(screen.getByRole('button').querySelector('svg')).not.toBeNull()
  })

  it('merges custom className', () => {
    render(<Button className="ma-classe">Texte</Button>)
    expect(screen.getByRole('button')).toHaveClass('ma-classe')
  })
})
