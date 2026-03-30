'use client'
import ThemeToggle from '@/components/ThemeToggle'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { userLogin, userLoginWithWallet } from '@/services/api'
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

function Field({ id, label, type, value, onChange, onKeyDown, error, placeholder, autoComplete, rightSlot }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">{label}</label>
        {rightSlot}
      </div>
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={inputCls(Boolean(error))}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
          <i className="bi bi-exclamation-circle text-[11px] flex-shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

function TabBar({ active, onChange }) {
  return (
    <div className="flex bg-[#F4F4F2] rounded-[10px] p-[3px] gap-[3px]">
      {[
        { key: 'email', label: 'Email', icon: 'bi-envelope' },
        { key: 'wallet', label: 'Wallet', icon: 'bi-wallet2' },
      ].map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] font-mono text-[10px] tracking-[0.08em] uppercase transition-all cursor-pointer border-none ${
            active === t.key
              ? 'bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
              : 'text-[#AAA] hover:text-[#666] bg-transparent'
          }`}
        >
          <i className={`${t.icon} text-[11px]`} />
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function UserLoginClient() {
  const router = useRouter()
  const emailRef = useRef(null)
  const { address, isConnected, isConnecting, openModal, ensureBase, signLoginMessage, disconnect } = useWallet()

  const [tab, setTab] = useState('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [walletStep, setWalletStep] = useState('idle')
  const [walletError, setWalletError] = useState('')

  useEffect(() => {
    if (tab === 'email') setTimeout(() => emailRef.current?.focus(), 80)
  }, [tab])

  // When wallet becomes connected while on wallet tab, auto-trigger sign+verify
  useEffect(() => {
    if (tab === 'wallet' && isConnected && address && walletStep === 'awaiting_connection') {
      runSignAndVerify(address)
    }
  }, [isConnected, address, tab, walletStep])

  function saveSession(data) {
    if (data?.token) {
      try { sessionStorage.setItem('w3l_user_token', data.token) } catch {}
      document.cookie = `w3l_user_auth=${data.token}; path=/; SameSite=Lax; Max-Age=28800`
    }
    router.push('/dashboard')
  }

  function validateEmail() {
    const next = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleKeyDown(e) { if (e.key === 'Enter') handleEmailSubmit() }

  async function handleEmailSubmit() {
    if (submitting || !validateEmail()) return
    setSubmitting(true)
    setErrors(prev => ({ ...prev, server: null }))
    const { data, error } = await userLogin({ email: email.trim(), password })
    if (error) {
      const msg =
        error.includes('401') || error.toLowerCase().includes('invalid') || error.toLowerCase().includes('credential')
          ? 'Invalid email or password.'
          : error.includes('429') ? 'Too many attempts. Please wait a moment.'
          : error.includes('Network') || error.includes('fetch') ? 'Unable to connect. Check your internet connection.'
          : error
      setErrors({ server: msg })
      setSubmitting(false)
      return
    }
    saveSession(data)
  }

  // Sign + verify with a known address — called after wallet is connected
  async function runSignAndVerify(addr) {
    setWalletError('')
    setWalletStep('ensuring_base')

    const baseResult = await ensureBase()
    if (baseResult.error) { setWalletError(baseResult.error); setWalletStep('error'); return }

    setWalletStep('signing')
    const { signature, message, error: signError } = await signLoginMessage(addr)
    if (signError) { setWalletError(signError); setWalletStep('error'); return }

    setWalletStep('verifying')
    const { data, error } = await userLoginWithWallet({ walletAddress: addr, signature, message })
    if (error) {
      const msg =
        error.toLowerCase().includes('not found') || error.includes('404')
          ? 'No account found for this wallet. Try email login or check your profile.'
          : error.includes('Network') || error.includes('fetch') ? 'Unable to connect. Check your internet connection.'
          : error
      setWalletError(msg)
      setWalletStep('error')
      return
    }
    setWalletStep('idle')
    saveSession(data)
  }

  // Single button handler — if already connected, sign immediately.
  // If not connected, open the RainbowKit modal and wait for connection.
  const handleWalletButton = useCallback(async () => {
    setWalletError('')

    if (isConnected && address) {
      await runSignAndVerify(address)
      return
    }

    // Open RainbowKit modal — runSignAndVerify fires via useEffect once connected
    setWalletStep('awaiting_connection')
    const { error } = await openModal()
    if (error) {
      setWalletError(error)
      setWalletStep('error')
    }
  }, [isConnected, address, openModal])

  const walletBusy = ['awaiting_connection', 'ensuring_base', 'signing', 'verifying'].includes(walletStep)

  const walletButtonLabel = {
    awaiting_connection: 'Waiting for wallet…',
    ensuring_base: 'Switching to Base…',
    signing: 'Sign the message in your wallet…',
    verifying: 'Verifying…',
  }[walletStep] ?? 'Sign in with wallet'

  return (
    <div
      className="min-h-screen bg-paper flex flex-col relative overflow-hidden mesh-green-tr mesh-blue-bl"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      {/*
        IMAGE PLACEHOLDER — Login page
        PROMPT: "Dark futuristic Web3 identity portal, glowing green circuit nodes floating on near-black background, abstract digital network graph, cinematic, no text"
        REPLACE: add a full-bleed background image to this page:
        <img src="/images/userlogin-hero.jpg"
          className="fixed inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none z-0" />
      */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-[400px]" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            <img src="/logo.png" alt="Work3 Labs" className="h-9 mb-4" />
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#BBB]">Contributor Portal</span>
          </div>

          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-7 pt-7 pb-6 border-b border-black/[0.06]">
              <h1 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-0.5">Sign in</h1>
              <p className="text-[13px] font-light text-[#AAA]">Work3 Labs contributor dashboard</p>
            </div>

            <div className="px-7 py-6 space-y-4">
              <TabBar active={tab} onChange={t => { setTab(t); setErrors({}); setWalletError(''); setWalletStep('idle') }} />

              {tab === 'email' && (
                <div className="space-y-4" style={{ animation: 'up 0.25s both' }}>
                  {errors.server && (
                    <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5">
                      <i className="bi bi-shield-exclamation text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-red-600 font-light leading-snug">{errors.server}</p>
                    </div>
                  )}
                  <Field
                    id="email" label="Email address" type="email" value={email}
                    onChange={v => { setEmail(v); setErrors(e => ({ ...e, email: null, server: null })) }}
                    onKeyDown={handleKeyDown}
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.email}
                  />
                  <Field
                    id="password" label="Password" type={showPwd ? 'text' : 'password'} value={password}
                    onChange={v => { setPassword(v); setErrors(e => ({ ...e, password: null, server: null })) }}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={errors.password}
                    rightSlot={
                      <button type="button" onClick={() => setShowPwd(s => !s)}
                        className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC] hover:text-[#999] transition-colors bg-transparent border-none cursor-pointer p-0">
                        {showPwd ? 'Hide' : 'Show'}
                      </button>
                    }
                  />
                  <div className="flex justify-end">
                    <Link href="/auth/forgot-password" className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#BBB] hover:text-ink transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </div>
              )}

              {tab === 'wallet' && (
                <div className="space-y-3" style={{ animation: 'up 0.25s both' }}>
                  {walletError && (
                    <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5">
                      <i className="bi bi-shield-exclamation text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-red-600 font-light leading-snug">{walletError}</p>
                    </div>
                  )}

                  {walletBusy && (
                    <div className="flex items-center gap-3 bg-[#F4FAF7] border border-green-dark/10 rounded-[10px] px-4 py-3.5" style={{ animation: 'up 0.2s both' }}>
                      <Spinner light={false} />
                      <p className="text-[13px] font-light text-[#555]">{walletButtonLabel}</p>
                    </div>
                  )}

                  {/* Show connected address when wallet is linked */}
                  {isConnected && address && !walletBusy && (
                    <div className="flex items-center gap-2 bg-[#F4FAF7] border border-green-dark/15 rounded-[10px] px-4 py-3">
                      <span className="w-2 h-2 rounded-full bg-green-dark flex-shrink-0" />
                      <p className="text-[12.5px] font-light text-green-dark truncate flex-1">{address}</p>
                      <button
                        type="button"
                        onClick={() => disconnect()}
                        className="font-mono text-[9px] tracking-[0.06em] uppercase text-[#CCC] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0 flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  <p className="text-[11.5px] font-light text-[#CCC] leading-relaxed">
                    Signed up with email? Use the Email tab, then link your wallet in your profile.
                  </p>
                </div>
              )}
            </div>

            <div className="px-7 pb-7">
              {tab === 'email' ? (
                <button
                  onClick={handleEmailSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2.5 bg-ink text-paper py-3.5 rounded-[10px] font-sans text-[14px] font-medium tracking-[-0.01em] hover:bg-[#1A1A1A] active:bg-[#111] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <><Spinner />Signing in…</> : <><i className="bi bi-box-arrow-in-right text-[15px]" />Sign in</>}
                </button>
              ) : (
                <button
                  onClick={handleWalletButton}
                  disabled={walletBusy}
                  className="w-full flex items-center justify-center gap-2.5 bg-ink text-paper py-3.5 rounded-[10px] font-sans text-[14px] font-medium tracking-[-0.01em] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {walletBusy
                    ? <><Spinner />{walletButtonLabel}</>
                    : isConnected
                    ? <><i className="bi bi-box-arrow-in-right text-[15px]" />Sign in with wallet</>
                    : <><i className="bi bi-wallet2 text-[15px]" />Connect wallet &amp; sign in</>
                  }
                </button>
              )}
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
