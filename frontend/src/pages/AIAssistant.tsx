import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Bot, User, Copy, Check } from 'lucide-react'
import Header from '../components/layout/Header'
import messagesData from '../data/ai-messages.json'
import type { AIMessage } from '../types'

const initialMessages = messagesData as AIMessage[]

const suggestions = [
  'Analyse l\'architecture du projet BankingSystem',
  'Explique les violations SOLID détectées',
  'Génère un diagramme UML pour un service d\'authentification',
  'Suggère des refactorings pour réduire le couplage',
]

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '')
          return (
            <pre key={i} style={{ background: 'var(--bg-0)', border: '1px solid var(--line-2)', borderRadius: 6, padding: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-1)', overflowX: 'auto', margin: '8px 0' }}>
              {code}
            </pre>
          )
        }
        return (
          <span key={i} dangerouslySetInnerHTML={{
            __html: part
              .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--fg-0);font-weight:600">$1</strong>')
              .replace(/\n/g, '<br/>')
              .replace(/`(.*?)`/g, '<code style="background:var(--accent-soft);color:var(--accent);padding:2px 5px;border-radius:4px;font-size:11px;font-family:var(--font-mono)">$1</code>')
          }} />
        )
      })}
    </div>
  )
}

export default function AIAssistant() {
  const [messages,  setMessages]  = useState<AIMessage[]>(initialMessages)
  const [input,     setInput]     = useState('')
  const [isTyping,  setIsTyping]  = useState(false)
  const [copied,    setCopied]    = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: AIMessage = { id: `msg-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const aiMsg: AIMessage = {
        id: `msg-${Date.now() + 1}`, role: 'assistant',
        content: `Je traite ta demande : **"${text}"**\n\nCette fonctionnalité sera connectée au service IA lors de l'intégration backend. Pour l'instant, les données sont simulées.\n\nJe peux t'aider avec :\n- L'analyse d'architecture\n- La génération de code\n- La détection d'anti-patterns\n- Les recommandations SOLID`,
        timestamp: new Date().toISOString(),
      }
      setMessages(m => [...m, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header title="Assistant IA" />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar suggestions */}
        <div style={{ width: 220, flexShrink: 0, background: 'var(--bg-1)', borderRight: '1px solid var(--line-1)', padding: 16, overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 10 }}>
            Suggestions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                style={{ background: 'transparent', border: 'none', padding: '8px 10px', borderRadius: 6, fontSize: 12, color: 'var(--fg-1)', cursor: 'pointer', textAlign: 'left', lineHeight: 1.5, fontFamily: 'var(--font-sans)', transition: 'all 120ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-0)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-1)' }}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--accent-soft)', borderRadius: 6 }}>
              <Sparkles size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: 'var(--accent)', margin: 0, lineHeight: 1.5 }}>IA connectée à tes projets analysés</p>
            </div>
          </div>
        </div>

        {/* Zone de chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                )}

                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    borderRadius: 10, padding: '10px 14px',
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-1)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--line-1)',
                    color: msg.role === 'user' ? 'var(--bg-0)' : 'var(--fg-0)',
                  }}>
                    <MessageContent content={msg.content} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0 }} className="msg-meta"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                  >
                    <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'assistant' && (
                      <button onClick={() => copyMessage(msg.content, msg.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--fg-3)' }}>
                        {copied === msg.id ? <Check size={11} style={{ color: 'var(--ok)' }} /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <User size={14} style={{ color: 'var(--fg-1)' }} />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={14} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Zone de saisie */}
          <div style={{ padding: '12px 24px 20px', borderTop: '1px solid var(--line-1)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 10, padding: '10px 12px' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Pose une question sur ton architecture..."
                rows={1}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 13, color: 'var(--fg-0)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="btn btn-primary btn-sm"
                style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', flexShrink: 0 }}
              >
                <Send size={13} />
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--fg-3)', margin: '6px 0 0', textAlign: 'center' }}>
              Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
