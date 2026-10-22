// Vercel Function: POST /api/chat
// Uses an LLM only if ANTHROPIC_API_KEY is set in Vercel environment variables (server-side only).
// Without a key it returns { configured: false } and the website uses its built-in FAQ instead.
import { HOSPITAL_INFO } from '../src/data/hospitalInfo.js'

const SYSTEM = `You are the MediCare Hospital information assistant.
Answer ONLY from the approved information below. If the answer is not there, say you do not have it and suggest contacting reception.
Never invent doctor schedules, fees, or hospital policies.
Never give medical diagnoses, treatment advice or medicine recommendations; tell the person to consult a doctor, and in emergencies to go to the emergency department.
Never ask for or repeat personal medical details. Keep answers under 120 words.

APPROVED INFORMATION:
${JSON.stringify(HOSPITAL_INFO)}`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(200).json({ configured: false })

  const { message, history } = req.body || {}
  if (typeof message !== 'string' || !message.trim() || message.length > 500) {
    return res.status(400).json({ error: 'Invalid message' })
  }
  const msgs = (Array.isArray(history) ? history : [])
    .slice(-6)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))
  while (msgs.length && msgs[0].role !== 'user') msgs.shift()
  msgs.push({ role: 'user', content: message.trim() })

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.CHAT_MODEL || 'claude-sonnet-5-5', max_tokens: 400, system: SYSTEM, messages: msgs }),
    })
    if (!r.ok) return res.status(200).json({ configured: true, error: true })
    const data = await r.json()
    const reply = data.content?.find((b) => b.type === 'text')?.text
    return res.status(200).json(reply ? { configured: true, reply } : { configured: true, error: true })
  } catch {
    return res.status(200).json({ configured: true, error: true })
  }
}
