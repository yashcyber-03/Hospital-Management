import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X } from 'lucide-react'
import { faqAnswer, SUGGESTIONS } from '../utils/faq'

const GREETING = { role: 'assistant', content: 'Hi! I can answer questions about departments, timings, services and how to book. I can\'t give medical advice.' }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([GREETING])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, open])

  async function send(q) {
    const question = q.trim()
    if (!question || busy) return
    const history = msgs.slice(1)
    setMsgs((m) => [...m, { role: 'user', content: question }]); setText(''); setBusy(true)
    let reply = null
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question, history }) })
      if (r.ok) { const d = await r.json(); if (d.reply) reply = d.reply }
    } catch { /* fall back to the FAQ */ }
    setMsgs((m) => [...m, { role: 'assistant', content: reply ?? faqAnswer(question) }]); setBusy(false)
  }

  if (!open) return (
    <button aria-label="Open hospital assistant" onClick={() => setOpen(true)}
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700">
      <Bot className="h-6 w-6" aria-hidden="true" /></button>
  )
  return (
    <section aria-label="Hospital assistant" className="fixed bottom-5 right-5 z-30 flex h-[28rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
      <header className="flex items-center justify-between rounded-t-2xl bg-brand-600 px-4 py-3 text-white">
        <span className="font-semibold">Hospital assistant</span>
        <button aria-label="Close assistant" onClick={() => setOpen(false)}><X className="h-5 w-5" aria-hidden="true" /></button>
      </header>
      <div role="log" aria-live="polite" className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {msgs.map((m, i) => (
          <p key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${m.role === 'user' ? 'ml-auto bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'}`}>{m.content}</p>))}
        {busy && <p className="text-slate-500">Typing…</p>}
        {msgs.length === 1 && <div className="flex flex-wrap gap-2">{SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="rounded-full border border-brand-500 px-3 py-1 text-xs text-brand-700 hover:bg-brand-50">{s}</button>))}</div>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="flex gap-2 border-t border-slate-200 p-3">
        <label htmlFor="chat-in" className="sr-only">Your question</label>
        <input id="chat-in" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Ask a question…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button aria-label="Send" className="btn-primary px-3" disabled={busy}><Send className="h-4 w-4" aria-hidden="true" /></button>
      </form>
    </section>
  )
}
