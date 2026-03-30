'use client'
import ThemeToggle from '@/components/ThemeToggle'

/**
 * Work3 Labs — User Forgot Password
 *
 * Route: /auth/forgot-password
 *
 * Security note: Success message is identical whether or not the email exists —
 * prevents user enumeration attacks.
 */

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { userForgotPassword } from '@/services/api'

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

function Spinner() {
  return <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-white/25 border-t-white spin-anim flex-shrink-0" />
}

export default function UserForgotPasswordClient() {
  const [email,       setEmail]       = useState('')
  const [emailError,  setEmailError]  = useState('')
  const [serverError, setServerError] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [sent,        setSent]        = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function validate() {
    if (!email.trim())                             { setEmailError('Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError('Enter a valid email address'); return false }
    return true
  }

  function handleKeyDown(e) { if (e.key === 'Enter') handleSubmit() }

  async function handleSubmit() {
    if (submitting) return
    setEmailError(''); setServerError('')
    if (!validate()) return

    setSubmitting(true)
    const { error } = await userForgotPassword({ email: email.trim() })
    setSubmitting(false)

    // Only show network errors — don't reveal whether email exists
    if (error && (error.includes('Network') || error.includes('fetch'))) {
      setServerError('Unable to connect. Check your internet connection.')
      return
    }

    setSent(true)
  }

  return (
    <div
      className="min-h-screen bg-paper flex flex-col relative overflow-hidden mesh-green-tr mesh-blue-bl"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="absolute top-5 left-5 sm:top-7 sm:left-7 z-10">
        <Link
          href="/auth/login"
          className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors"
        >
          <i className="bi bi-arrow-left text-[11px]" />
          <span className="hidden sm:inline">Back to login</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16 sm:py-20">
        <div
          className="w-full max-w-[400px]"
          style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            <img src="/logo.png" alt="Work3 Labs" className="h-9 mb-4" />
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#BBB]">Contributor Portal</span>
          </div>

          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] overflow-hidden">
            {sent ? (
              <div className="px-7 py-12 flex flex-col items-center text-center" style={{ animation: 'up 0.35s both' }}>
                <div className="w-14 h-14 rounded-full bg-[#2DFC44] flex items-center justify-center mb-5 pop-anim">
                  <i className="bi bi-envelope-check text-[22px] text-ink" />
                </div>
                <h2 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-2">
                  Check your inbox
                </h2>
                <p className="text-[13.5px] font-light text-[#888] leading-relaxed mb-2 max-w-[280px]">
                  If <strong className="text-ink font-medium">{email}</strong> is registered, you'll receive a reset link within a few minutes.
                </p>
                <p className="text-[12px] font-light text-[#CCC] mb-7">
                  Didn't receive it? Check your spam folder.
                </p>
                <Link
                  href="/auth/login"
                  className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink border border-black/[0.12] rounded-full px-5 py-2.5 hover:bg-black/[0.04] transition-colors"
                >
                  Back to login
                </Link>
              </div>
            ) : (
              <>
                <div className="px-7 pt-7 pb-6 border-b border-black/[0.06]">
                  <h1 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-0.5">
                    Reset password
                  </h1>
                  <p className="text-[13px] font-light text-[#AAA]">
                    Enter your email and we'll send a reset link.
                  </p>
                </div>

                <div className="px-7 py-6 space-y-4">
                  {serverError && (
                    <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5" style={{ animation: 'up 0.2s both' }}>
                      <i className="bi bi-exclamation-circle text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-red-600 font-light leading-snug">{serverError}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="reset-email" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">
                      Email address
                    </label>
                    <input
                      ref={inputRef}
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError(''); setServerError('') }}
                      onKeyDown={handleKeyDown}
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? 'reset-email-error' : undefined}
                      className={inputCls(Boolean(emailError))}
                    />
                    {emailError && (
                      <p id="reset-email-error" role="alert" className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
                        <i className="bi bi-exclamation-circle text-[11px] flex-shrink-0" />{emailError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-7 pb-7 space-y-2.5">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2.5 bg-ink text-paper py-3.5 rounded-[10px] font-sans text-[14px] font-medium tracking-[-0.01em] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-busy={submitting}
                  >
                    {submitting
                      ? <><Spinner /><span>Sending…</span></>
                      : <><i className="bi bi-send text-[14px]" />Send reset link</>
                    }
                  </button>
                  <Link
                    href="/auth/login"
                    className="w-full py-3 rounded-[10px] border border-black/[0.09] text-[#888] font-sans text-[13.5px] font-light hover:border-black/20 hover:text-ink transition-all flex items-center justify-center"
                  >
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </div>

          <p className="text-center font-mono text-[10px] tracking-[0.08em] text-[#CCC] mt-6">
            Work3 Labs · Contributor Portal
          </p>
        </div>
      </div>
    </div>
  )
}
