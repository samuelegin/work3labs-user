'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

export function UserForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-up">
        <img src="/logo.png" alt="Work3 Labs" style={{ height: 30, marginBottom: 36 }} />
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <i className="bi bi-envelope-check" style={{ fontSize: 48, color: 'var(--accent)', display: 'block', marginBottom: 16 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>Check your email</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 20 }}>We sent a reset link to <strong style={{ color: 'var(--ink)' }}>{email}</strong></p>
            <Link href="/auth/login" style={{ color: 'var(--accent)', fontSize: 13 }}>← Back to login</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Forgot password?</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 28 }}>Enter your email and we'll send a reset link.</p>
            {error && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,90,90,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>{error}</div>}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 6 }}>Email address</label>
                <input className="input-dark" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn-accent" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <i className="bi bi-arrow-repeat spin-anim" /> : null}
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p style={{ marginTop: 20, textAlign: 'center' }}>
              <Link href="/auth/login" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export function UserResetPasswordClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-up">
        <img src="/logo.png" alt="Work3 Labs" style={{ height: 30, marginBottom: 36 }} />
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 48, color: 'var(--accent)', display: 'block', marginBottom: 16 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>Password updated!</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 20 }}>You can now sign in with your new password.</p>
            <a href="/auth/login" className="btn-accent" style={{ display: 'inline-flex' }}>Sign in</a>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Set new password</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 28 }}>Choose a strong password for your account.</p>
            {error && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,90,90,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>{error}</div>}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 6 }}>New password</label>
                <input className="input-dark" type="password" required minLength={8} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 6 }}>Confirm password</label>
                <input className="input-dark" type="password" required placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className="btn-accent" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <i className="bi bi-arrow-repeat spin-anim" /> : null}
                {loading ? 'Saving…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
