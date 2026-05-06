import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Pill from './Pill'

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill>Actif</Pill>)
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  it('applies neutral tone by default', () => {
    render(<Pill>Statut</Pill>)
    expect(screen.getByText('Statut')).toHaveClass('pill-neutral')
  })

  it('applies ok tone class', () => {
    render(<Pill tone="ok">Succès</Pill>)
    expect(screen.getByText('Succès')).toHaveClass('pill-ok')
  })

  it('applies warn tone class', () => {
    render(<Pill tone="warn">Attention</Pill>)
    expect(screen.getByText('Attention')).toHaveClass('pill-warn')
  })

  it('applies bad tone class', () => {
    render(<Pill tone="bad">Erreur</Pill>)
    expect(screen.getByText('Erreur')).toHaveClass('pill-bad')
  })

  it('applies info tone class', () => {
    render(<Pill tone="info">Info</Pill>)
    expect(screen.getByText('Info')).toHaveClass('pill-info')
  })

  it('applies pill-square class when square is true', () => {
    render(<Pill square>Tag</Pill>)
    expect(screen.getByText('Tag')).toHaveClass('pill-square')
  })

  it('does not apply pill-square when square is false', () => {
    render(<Pill>Tag</Pill>)
    expect(screen.getByText('Tag')).not.toHaveClass('pill-square')
  })

  it('renders a dot element when dot is true', () => {
    const { container } = render(<Pill dot>En ligne</Pill>)
    expect(container.querySelector('.dot')).toBeInTheDocument()
  })

  it('does not render a dot element by default', () => {
    const { container } = render(<Pill>Sans point</Pill>)
    expect(container.querySelector('.dot')).toBeNull()
  })
})
