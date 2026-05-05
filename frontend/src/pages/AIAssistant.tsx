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
    <div className="text-sm leading-relaxed space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '')
          return (
            <pre key={i} className="bg-[#0d0f17] border border-[#2a2d3e] rounded-lg p-3 overflow-x-auto text-xs font-mono text-slate-300 mt-2">
              {code}
            </pre>
          )
        }
        return (
          <span key={i} dangerouslySetInnerHTML={{
            __html: part
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
              .replace(/\n/g, '<br/>')
              .replace(/`(.*?)`/g, '<code class="bg-violet-500/10 text-violet-300 px-1 rounded text-xs font-mono">$1</code>')
          }} />
        )
      })}
    </div>
  )
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(m => [...m, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const aiMsg: AIMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Je traite votre demande concernant : **"${text}"**\n\nCette fonctionnalité sera connectée au service IA lors de l'intégration backend. Pour l'instant, les données sont simulées.\n\nJe peux vous aider avec :\n- L'analyse d'architecture\n- La génération de code\n- La détection d'anti-patterns\n- Les recommandations SOLID`,
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
    <div className="flex flex-col h-screen">
      <Header title="Assistant IA" subtitle="Analyse d'architecture intelligente" />

      <div className="flex flex-1 overflow-hidden">
        {/* Suggestions sidebar */}
        <div className="w-56 bg-[#12141c] border-r border-[#1e2235] p-4 overflow-y-auto shrink-0">
          <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">Suggestions</p>
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="w-full text-left text-xs text-slate-400 hover:text-slate-200 p-2.5 rounded-lg hover:bg-white/5 transition-colors leading-relaxed"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#1e2235]">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-600/10 border border-violet-600/20">
              <Sparkles size={13} className="text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300 leading-relaxed">IA connectée à vos projets analysés</p>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={14} className="text-violet-400" />
                  </div>
                )}

                <div className={`max-w-[75%] group ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white text-sm'
                      : 'bg-[#12141c] border border-[#1e2235] text-slate-300'
                  }`}>
                    <MessageContent content={msg.content} />
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'assistant' && (
                      <button onClick={() => copyMessage(msg.content, msg.id)} className="text-slate-600 hover:text-slate-400 transition-colors">
                        {copied === msg.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User size={14} className="text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <Bot size={14} className="text-violet-400" />
                </div>
                <div className="bg-[#12141c] border border-[#1e2235] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 pb-5 pt-3 border-t border-[#1e2235]">
            <div className="flex items-end gap-3 bg-[#12141c] border border-[#2a2d3e] rounded-xl p-3 focus-within:border-violet-500 transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Posez une question sur votre architecture..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none resize-none leading-relaxed"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 text-center">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
          </div>
        </div>
      </div>
    </div>
  )
}
