import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Badge from './Badge'

describe('Badge', () => {
  it('renders the label', () => {
    render(<Badge label="Actif" />)
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  it('applies neutral tone by default', () => {
    render(<Badge label="Neutre" />)
    expect(screen.getByText('Neutre')).toHaveClass('pill-neutral')
  })

  it('maps success variant to ok tone', () => {
    render(<Badge label="OK" variant="success" />)
    expect(screen.getByText('OK')).toHaveClass('pill-ok')
  })

  it('maps warning variant to warn tone', () => {
    render(<Badge label="Alerte" variant="warning" />)
    expect(screen.getByText('Alerte')).toHaveClass('pill-warn')
  })

  it('maps danger variant to bad tone', () => {
    render(<Badge label="Critique" variant="danger" />)
    expect(screen.getByText('Critique')).toHaveClass('pill-bad')
  })

  it('maps info variant to info tone', () => {
    render(<Badge label="Info" variant="info" />)
    expect(screen.getByText('Info')).toHaveClass('pill-info')
  })

  it('maps purple variant to info tone', () => {
    render(<Badge label="Purple" variant="purple" />)
    expect(screen.getByText('Purple')).toHaveClass('pill-info')
  })

  it('always applies pill-square class', () => {
    render(<Badge label="Tag" />)
    expect(screen.getByText('Tag')).toHaveClass('pill-square')
  })
})
