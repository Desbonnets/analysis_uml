import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('renders the initials', () => {
    render(<Avatar initials="JD" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('applies default size of 28px', () => {
    render(<Avatar initials="AB" />)
    const el = screen.getByText('AB')
    expect(el).toHaveStyle({ width: '28px', height: '28px' })
  })

  it('applies custom size', () => {
    render(<Avatar initials="XY" size={48} />)
    const el = screen.getByText('XY')
    expect(el).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('applies default accent color', () => {
    render(<Avatar initials="AC" />)
    expect(screen.getByText('AC')).toHaveStyle({ background: 'var(--accent)' })
  })

  it('applies custom background color', () => {
    render(<Avatar initials="ZZ" color="#ff0000" />)
    expect(screen.getByText('ZZ')).toHaveStyle({ background: '#ff0000' })
  })

  it('has the avatar class', () => {
    render(<Avatar initials="CD" />)
    expect(screen.getByText('CD')).toHaveClass('avatar')
  })
})
