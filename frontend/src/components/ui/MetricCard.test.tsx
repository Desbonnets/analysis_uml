import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MetricCard from './MetricCard'

describe('MetricCard', () => {
  it('renders the label', () => {
    render(<MetricCard label="Projets" value={42} />)
    expect(screen.getByText('Projets')).toBeInTheDocument()
  })

  it('renders a numeric value', () => {
    render(<MetricCard label="Erreurs" value={7} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders a string value', () => {
    render(<MetricCard label="Couverture" value="87%" />)
    expect(screen.getByText('87%')).toBeInTheDocument()
  })

  it('renders a delta pill when provided', () => {
    render(<MetricCard label="Activité" value={100} delta="+12%" />)
    expect(screen.getByText('+12%')).toBeInTheDocument()
  })

  it('does not render a delta pill when omitted', () => {
    render(<MetricCard label="Score" value={99} />)
    expect(screen.queryByText(/\+/)).toBeNull()
  })

  it('applies ok tone to delta pill by default', () => {
    render(<MetricCard label="Tendance" value={5} delta="+3%" />)
    expect(screen.getByText('+3%')).toHaveClass('pill-ok')
  })

  it('applies bad tone to delta pill when deltaTone is bad', () => {
    render(<MetricCard label="Erreurs" value={5} delta="-2%" deltaTone="bad" />)
    expect(screen.getByText('-2%')).toHaveClass('pill-bad')
  })

  it('renders the spark SVG when sparkPoints is provided', () => {
    const { container } = render(
      <MetricCard label="Charge" value={5} sparkPoints="0,30 50,10 100,20" />
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelector('polyline')).toBeInTheDocument()
  })

  it('does not render the spark SVG when sparkPoints is omitted', () => {
    const { container } = render(<MetricCard label="Simple" value={1} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
