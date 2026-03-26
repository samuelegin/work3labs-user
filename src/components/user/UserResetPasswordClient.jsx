'use client'

/**
 * Work3 Labs — User Reset Password
 *
 * Route: /auth/reset-password?token=<reset_token>
 *
 * Flow:
 *  1. Token validated on mount
 *  2. User sets new password + confirm
 *  3. POST /api/user/reset-password → success → redirect to login
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { userResetPassword } from '@/services/api'

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

//Password strength 
function strengthOf(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8)           s++
  if (pw.length >= 12)          s++
  if (/[A-Z]/.test(pw))         s++
  if (/[0-9]/.test(pw))         s++
  if (/[^A-Za-z0-9]/.test(pw))  s++
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
        {[1,2,3,4,5].map(i => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= s ? STRENGTH_COLOR[s] : '#E5E5E5' }}
          />
        ))}
      </div>
      <p className="font-mono text-[10px] tracking-[0.06em]" style={{ color: STRENGTH_COLOR[s] }}>
        {STRENGTH_LABEL[s]}
      </p>
    </div>
  )
}

export default function UserResetPasswordClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const resetToken   = searchParams.get('token') ?? ''

  const pwRef = useRef(null)

  const [password,    setPassword]    = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors,      setErrors]      = useState({})
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)

  useEffect(() => {
    if (!resetToken) {
      setErrors({ server: 'Invalid or missing reset token. Please request a new reset link.' })
    } else {
      setTimeout(() => pwRef.current?.focus(), 100)
    }
  }, [resetToken])

  function validate() {
    const next = {}
    if (!password)            next.password   = 'Password is required'
    else if (password.length < 8) next.password = 'Must be at least 8 characters'
    if (!confirmPwd)          next.confirmPwd = 'Please confirm your password'
    else if (confirmPwd !== password) next.confirmPwd = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleKeyDown(e) { if (e.key === 'Enter') handleSubmit() }

  async function handleSubmit() {
    if (submitting || !resetToken) return
    if (!validate()) return
    setSubmitting(true)
    setErrors(prev => ({ ...prev, server: null }))

    const { error } = await userResetPassword({ token: resetToken, password })
    setSubmitting(false)

    if (error) {
      const msg =
        error.includes('expired') || error.includes('invalid') || error.includes('400')
          ? 'This reset link has expired or is invalid. Please request a new one.'
          : error.includes('Network') || error.includes('fetch')
          ? 'Unable to connect. Check your internet connection.'
          : error
      setErrors({ server: msg })
      return
    }

    setDone(true)
    setTimeout(() => router.push('/auth/login'), 2500)
  }

  // States

  if (done) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 relative overflow-hidden mesh-green-tr mesh-blue-bl" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="w-full max-w-[400px] text-center" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <img src="/logo.png" alt="Work3 Labs" className="h-9 mx-auto mb-8" />
          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] px-7 py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#2DFC44] flex items-center justify-center mb-5 pop-anim">
              <i className="bi bi-check2-circle text-[22px] text-ink" />
            </div>
            <h2 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-2">Password updated</h2>
            <p className="text-[13.5px] font-light text-[#888] leading-relaxed">Redirecting you to sign in…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-paper flex flex-col relative overflow-hidden mesh-green-tr mesh-blue-bl"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
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
            <div className="px-7 pt-7 pb-6 border-b border-black/[0.06]">
              <h1 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-0.5">
                Set new password
              </h1>
              <p className="text-[13px] font-light text-[#AAA]">
                Choose a strong password for your account.
              </p>
            </div>

            <div className="px-7 py-6 space-y-4">
              {errors.server && (
                <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5" style={{ animation: 'up 0.2s both' }}>
                  <i className="bi bi-shield-exclamation text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[13px] text-red-600 font-light leading-snug">{errors.server}</p>
                    {(errors.server.includes('expired') || errors.server.includes('invalid')) && (
                      <Link href="/auth/forgot-password" className="text-[12px] text-red-500 underline underline-offset-2 mt-1.5 block">
                        Request a new reset link
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* New password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="new-password" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">
                    New password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC] hover:text-[#999] transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  ref={pwRef}
                  id="new-password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(err => ({ ...err, password: null })) }}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={!resetToken}
                  aria-invalid={Boolean(errors.password)}
                  className={`${inputCls(Boolean(errors.password))} ${!resetToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.password && (
                  <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
                    <i className="bi bi-exclamation-circle text-[11px]" />{errors.password}
                  </p>
                )}
                <PasswordStrength password={password} />
              </div>

              {/* Confirm password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="confirm-password" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">
                    Confirm password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC] hover:text-[#999] transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={e => { setConfirmPwd(e.target.value); setErrors(err => ({ ...err, confirmPwd: null })) }}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={!resetToken}
                  aria-invalid={Boolean(errors.confirmPwd)}
                  className={`${inputCls(Boolean(errors.confirmPwd))} ${!resetToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.confirmPwd && (
                  <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
                    <i className="bi bi-exclamation-circle text-[11px]" />{errors.confirmPwd}
                  </p>
                )}
              </div>
            </div>

            <div className="px-7 pb-7 space-y-2.5">
              <button
                onClick={handleSubmit}
                disabled={submitting || !resetToken}
                className="w-full flex items-center justify-center gap-2.5 bg-ink text-paper py-3.5 rounded-[10px] font-sans text-[14px] font-medium tracking-[-0.01em] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={submitting}
              >
                {submitting
                  ? <><Spinner /><span>Updating password…</span></>
                  : <><i className="bi bi-lock text-[14px]" />Set new password</>
                }
              </button>
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