export const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '5px 14px', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer',
  borderRadius: 6, border: '1px solid',
  borderColor: active ? 'var(--accent)' : 'var(--line-2)',
  background: active ? 'rgba(91,192,190,0.12)' : 'var(--bg-2)',
  color: active ? 'var(--accent)' : 'var(--fg-1)',
})
