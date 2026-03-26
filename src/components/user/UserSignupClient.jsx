'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { validateInviteToken, registerWithInvite } from '@/services/api'
import { useWallet } from '@/hooks/useWallet'

const INPUT_BASE = [
  'w-full font-sans text-[14px] font-light bg-white text-ink',
  'border rounded-[10px] px-4 py-3 outline-none transition-all',
  'placeholder-[#D0D0D0] appearance-none',
].join(' ')

function inputCls(hasError) {
  return hasError
    ? `${INPUT_BASE} border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]`
    : `${INPUT_BASE} border-black/[0.09] focus:border-[#1DC433] focus:shadow-[0_0_0_3px_rgba(45,252,68,0.08)]`
}

function Spinner({ light = true }) {
  return (
    <span className={`inline-block w-[18px] h-[18px] rounded-full border-2 spin-anim flex-shrink-0 ${
      light ? 'border-white/25 border-t-white' : 'border-black/10 border-t-black/40'
    }`} />
  )
}

function Field({ id, label, type, value, onChange, onKeyDown, error, placeholder, autoComplete, autoFocus, disabled, rightSlot, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">{label}</label>
        {rightSlot}
      </div>
      {hint && <p className="text-[11.5px] text-[#BBB] font-light mb-1.5 leading-snug">{hint}</p>}
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`${inputCls(Boolean(error))} ${disabled ? 'opacity-50 cursor-not-allowed bg-[#F7F7F5]' : ''}`}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
          <i className="bi bi-exclamation-circle text-[11px] flex-shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

function strengthOf(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
const STRENGTH_COLOR = ['', '#EF4444', '#F59E0B', '#3B82F6', '#1DC433', '#1DC433']

function PasswordStrength({ password }) {
  const s = strengthOf(password)
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-[3px] flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= s ? STRENGTH_COLOR[s] : '#E5E5E5' }} />
        ))}
      </div>
      <p className="font-mono text-[10px] tracking-[0.06em]" style={{ color: STRENGTH_COLOR[s] }}>
        {STRENGTH_LABEL[s]}
      </p>
    </div>
  )
}

export default function UserSignupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token') ?? ''
  const nameRef = useRef(null)

  const { address, isConnected } = useWallet()

  const [tokenState, setTokenState] = useState('validating')
  const [inviteEmail, setInviteEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!inviteToken) { setTokenState('invalid'); return }
    validateInviteToken(inviteToken)
      .then(({ data, error }) => {
        if (error || !data?.email) { setTokenState('invalid'); return }
        setInviteEmail(data.email)
        setTokenState('valid')
      })
      .catch(() => setTokenState('invalid'))
  }, [inviteToken])

  useEffect(() => {
    if (tokenState === 'valid') setTimeout(() => nameRef.current?.focus(), 100)
  }, [tokenState])

  function validate() {
    const next = {}
    if (!displayName.trim()) next.displayName = 'Display name is required'
    else if (displayName.trim().length < 2) next.displayName = 'Must be at least 2 characters'
    if (!password) next.password = 'Password is required'
    else if (password.length < 8) next.password = 'Must be at least 8 characters'
    if (!confirmPwd) next.confirmPwd = 'Please confirm your password'
    else if (confirmPwd !== password) next.confirmPwd = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleKeyDown(e) { if (e.key === 'Enter') handleSubmit() }

  async function handleSubmit() {
    if (submitting || !validate()) return
    setSubmitting(true)
    setErrors(prev => ({ ...prev, server: null }))

    const { data, error } = await registerWithInvite({
      token: inviteToken,
      displayName: displayName.trim(),
      password,
      walletAddress: isConnected ? address : undefined,
    })

    if (error) { setErrors({ server: error }); setSubmitting(false); return }

    if (data?.token) {
      try { sessionStorage.setItem('w3l_user_token', data.token) } catch {}
      document.cookie = `w3l_user_auth=${data.token}; path=/; SameSite=Lax; Max-Age=28800`
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  if (tokenState === 'validating') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center relative overflow-hidden mesh-green-tr mesh-blue-bl" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="flex flex-col items-center gap-4">
          <Spinner light={false} />
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#CCC]">Validating invite…</p>
        </div>
      </div>
    )
  }

  if (tokenState === 'invalid') {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 relative overflow-hidden mesh-green-tr mesh-blue-bl" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="w-full max-w-[400px] text-center" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <img src="/logo.png" alt="Work3 Labs" className="h-9 mx-auto mb-8" />
          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] px-8 py-10">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <i className="bi bi-link-45deg text-red-400 text-[24px]" />
            </div>
            <h1 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-2">Invalid invite link</h1>
            <p className="text-[13.5px] font-light text-[#888] leading-relaxed">
              This invite link is invalid or has expired. Please contact the team for a new one.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 relative overflow-hidden mesh-green-tr mesh-blue-bl" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="w-full max-w-[400px] text-center" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <img src="/logo.png" alt="Work3 Labs" className="h-9 mx-auto mb-8" />
          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] px-8 py-10">
            <div className="w-14 h-14 rounded-full bg-[#2DFC44] flex items-center justify-center mx-auto mb-5 pop-anim">
              <i className="bi bi-check2 text-ink text-[24px]" />
            </div>
            <h2 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-2">Account created</h2>
            <p className="text-[13.5px] font-light text-[#888]">Taking you to your dashboard…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col relative overflow-hidden mesh-green-tr mesh-blue-bl" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="absolute top-5 left-5 sm:top-7 sm:left-7 z-10">
        <Link href="/" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
          <i className="bi bi-arrow-left text-[11px]" />
          <span className="hidden sm:inline">Back to site</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-[420px]" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            <img src="/logo.png" alt="Work3 Labs" className="h-9 mb-4" />
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#BBB]">Contributor Portal</span>
          </div>

          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-7 pt-7 pb-6 border-b border-black/[0.06]">
              <h1 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-0.5">Create your account</h1>
              <p className="text-[13px] font-light text-[#AAA]">You've been invited to join Work3 Labs.</p>
            </div>

            <div className="px-7 py-6 space-y-4">
              {errors.server && (
                <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5" style={{ animation: 'up 0.2s both' }}>
                  <i className="bi bi-shield-exclamation text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-600 font-light leading-snug">{errors.server}</p>
                </div>
              )}

              <Field id="email" label="Email address" type="email" value={inviteEmail}
                onChange={() => {}} disabled
                hint="Pre-filled from your invite link." error={null} />

              <Field id="displayName" label="Display name" type="text" value={displayName}
                onChange={v => { setDisplayName(v); setErrors(e => ({ ...e, displayName: null })) }}
                onKeyDown={handleKeyDown}
                placeholder="How you appear to your pod"
                autoComplete="nickname" autoFocus error={errors.displayName} />

              <div>
                <Field id="password" label="Password" type={showPwd ? 'text' : 'password'} value={password}
                  onChange={v => { setPassword(v); setErrors(e => ({ ...e, password: null })) }}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  autoComplete="new-password" error={errors.password}
                  rightSlot={
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC] hover:text-[#999] transition-colors bg-transparent border-none cursor-pointer p-0">
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  } />
                <PasswordStrength password={password} />
              </div>

              <Field id="confirmPwd" label="Confirm password" type={showConfirm ? 'text' : 'password'} value={confirmPwd}
                onChange={v => { setConfirmPwd(v); setErrors(e => ({ ...e, confirmPwd: null })) }}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                autoComplete="new-password" error={errors.confirmPwd}
                rightSlot={
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC] hover:text-[#999] transition-colors bg-transparent border-none cursor-pointer p-0">
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                } />

              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-black/[0.06]" />
                <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC]">Wallet — Optional</span>
                <div className="flex-1 h-px bg-black/[0.06]" />
              </div>

              {/* RainbowKit handles wallet selection and connection */}
              <div className="flex justify-center">
                <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
              </div>

              {isConnected && (
                <div className="flex items-center gap-2 bg-[#F4FAF7] border border-green-dark/15 rounded-[10px] px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-green-dark flex-shrink-0" />
                  <p className="text-[12.5px] font-light text-green-dark truncate">{address}</p>
                  <span className="font-mono text-[9px] text-green-dark/60 ml-auto">Base</span>
                </div>
              )}

              {!isConnected && (
                <p className="text-[11.5px] font-light text-[#CCC]">
                  You can connect your wallet later from your profile.
                </p>
              )}
            </div>

            <div className="px-7 pb-7 space-y-2.5">
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 bg-ink text-paper py-3.5 rounded-[10px] font-sans text-[14px] font-medium tracking-[-0.01em] hover:bg-[#1A1A1A] active:bg-[#111] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <><Spinner />Creating account…</> : <><i className="bi bi-person-check text-[15px]" />Create account</>}
              </button>
              <p className="text-center text-[12px] font-light text-[#CCC] pt-1">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-ink underline underline-offset-2 hover:text-green-dark transition-colors">Sign in</Link>
              </p>
            </div>
          </div>

          <p className="text-center font-mono text-[10px] tracking-[0.08em] text-[#CCC] mt-6">
            Work3 Labs · Contributor Portal
          </p>
        </div>
      </div>
    </div>
  )
}