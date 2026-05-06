import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Users, Activity, AlertTriangle } from 'lucide-react'
import StatCard from './StatCard'

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Utilisateurs" value={128} icon={Users} />)
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
  })

  it('renders a numeric value', () => {
    render(<StatCard label="Projets" value={42} icon={Activity} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders a string value', () => {
    render(<StatCard label="Score" value="98%" icon={Activity} />)
    expect(screen.getByText('98%')).toBeInTheDocument()
  })

  it('renders a trend when provided', () => {
    render(<StatCard label="Violations" value={3} icon={AlertTriangle} trend="+2 ce mois" />)
    expect(screen.getByText(/\+2 ce mois/)).toBeInTheDocument()
  })

  it('does not render a trend when omitted', () => {
    render(<StatCard label="Violations" value={3} icon={AlertTriangle} />)
    expect(screen.queryByText(/ce mois/)).toBeNull()
  })

  it('renders an upward arrow when trendUp is true', () => {
    render(<StatCard label="Activité" value={10} icon={Activity} trend="5% vs hier" trendUp />)
    expect(screen.getByText(/↑/)).toBeInTheDocument()
  })

  it('renders a downward arrow when trendUp is false', () => {
    render(<StatCard label="Activité" value={10} icon={Activity} trend="3% vs hier" trendUp={false} />)
    expect(screen.getByText(/↓/)).toBeInTheDocument()
  })

  it('renders the icon as an SVG', () => {
    const { container } = render(<StatCard label="Users" value={5} icon={Users} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
