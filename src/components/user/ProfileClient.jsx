'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { fetchProfile, updateProfile } from '@/services/api'
import { useWallet } from '@/hooks/useWallet'
import { uploadAvatar } from '@/lib/uploadAvatar'

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

function Field({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete, hint, disabled, prefix }) {
  return (
    <div>
      <label htmlFor={id} className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">{label}</label>
      {hint && <p className="text-[11.5px] text-[#BBB] font-light mb-1.5 leading-snug">{hint}</p>}
      {prefix ? (
        <div className={`flex items-center border rounded-[10px] overflow-hidden transition-all ${error ? 'border-red-300 focus-within:border-red-400' : 'border-black/[0.09] focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)]'}`}>
          <span className="px-3 font-mono text-[12px] text-[#BBB] border-r border-black/[0.09] bg-[#FAFAF8] h-full flex items-center py-3 flex-shrink-0">{prefix}</span>
          <input
            id={id} type={type} value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            className="flex-1 font-sans text-[14px] font-light text-ink bg-white px-3 py-3 outline-none placeholder-[#D0D0D0]"
          />
        </div>
      ) : (
        <input
          id={id} type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`${inputCls(Boolean(error))} ${disabled ? 'opacity-50 cursor-not-allowed bg-[#F7F7F5]' : ''}`}
        />
      )}
      {error && (
        <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
          <i className="bi bi-exclamation-circle text-[11px]" />{error}
        </p>
      )}
    </div>
  )
}

// Identicon — simple deterministic pattern from wallet address or name
function Identicon({ seed, size = 56 }) {
  const hash = seed ? seed.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffffffff, 0) : 0
  const hue = Math.abs(hash) % 360
  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 35% 35%, hsl(${hue},70%,65%), hsl(${(hue + 40) % 360},60%,40%))`,
      }}
    />
  )
}

// Skill tag pill builder — same pattern as role builder
function SkillsInput({ skills, onChange }) {
  const [input, setInput] = useState('')
  const ref = useRef(null)

  function add(label) {
    const clean = label.trim()
    if (!clean || skills.length >= 15) return
    if (skills.find(s => s.toLowerCase() === clean.toLowerCase())) return
    onChange([...skills, clean])
    setInput('')
    ref.current?.focus()
  }

  function remove(label) {
    onChange(skills.filter(s => s !== label))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && skills.length) onChange(skills.slice(0, -1))
  }

  const SUGGESTIONS = ['Community', 'Content', 'Growth', 'Marketing', 'Dev', 'Smart Contracts', 'DevOps', 'Design', 'UI/UX', 'Strategy', 'BD', 'Research', 'Writing', 'Analytics']
  const available = SUGGESTIONS.filter(s => !skills.find(x => x.toLowerCase() === s.toLowerCase()))

  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Skills</label>
      <p className="text-[11.5px] text-[#BBB] font-light mb-2 leading-snug">Add skills that describe what you bring to a pod.</p>
      <div
        className="min-h-[46px] flex flex-wrap gap-1.5 items-center border border-black/[0.09] rounded-[10px] px-3 py-2 focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all cursor-text"
        onClick={() => ref.current?.focus()}
      >
        {skills.map(s => (
          <span key={s} className="flex items-center gap-1 font-mono text-[10.5px] text-ink border border-black/[0.12] bg-[#F4F4F2] rounded-full px-2.5 py-[3px] flex-shrink-0">
            {s}
            <button type="button" onClick={e => { e.stopPropagation(); remove(s) }}
              className="ml-0.5 text-[#AAA] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0 leading-none">
              <i className="bi bi-x text-[11px]" />
            </button>
          </span>
        ))}
        {skills.length < 15 && (
          <input
            ref={ref} type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={skills.length === 0 ? 'Type a skill…' : ''}
            className="flex-1 min-w-[80px] font-sans text-[13.5px] font-light text-ink bg-transparent outline-none placeholder-[#D0D0D0]"
          />
        )}
      </div>
      {available.length > 0 && skills.length < 15 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {available.slice(0, 8).map(s => (
            <button key={s} type="button" onClick={() => add(s)}
              className="font-mono text-[10px] text-[#999] border border-black/[0.09] hover:border-black/[0.2] hover:text-ink rounded-full px-2.5 py-[3px] cursor-pointer bg-transparent transition-all">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfileClient() {
  const { address, isConnected } = useWallet()
  const fileRef = useRef(null)

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState([])
  const [twitter, setTwitter] = useState('')
  const [github, setGithub] = useState('')
  const [telegram, setTelegram] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchProfile().then(({ data }) => {
      if (data) {
        setUser(data)
        setDisplayName(data.displayName ?? '')
        setEmail(data.email ?? '')
        setBio(data.bio ?? '')
        setSkills(data.skills ?? [])
        setTwitter(data.socials?.twitter ?? '')
        setGithub(data.socials?.github ?? '')
        setTelegram(data.socials?.telegram ?? '')
      }
      setLoading(false)
    })
  }, [])

  // Avatar file pick + crop preview
  const handleAvatarClick = useCallback(() => {
    fileRef.current?.click()
  }, [])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrors(err => ({ ...err, avatar: 'Image must be under 5MB' })); return }
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
    setErrors(err => ({ ...err, avatar: null }))
  }

  function validate() {
    const next = {}
    if (!displayName.trim()) next.displayName = 'Display name is required'
    else if (displayName.trim().length < 2) next.displayName = 'Must be at least 2 characters'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (saving || !validate()) return
    setSaving(true)
    setSaveOk(false)
    setErrors(prev => ({ ...prev, server: null }))

    // Upload new avatar if user picked a file
    let avatarUrl = user?.avatarUrl
    if (avatarFile) {
      const { url, error: uploadError } = await uploadAvatar(avatarFile)
      if (uploadError) { setErrors({ server: `Avatar upload failed: ${uploadError}` }); setSaving(false); return }
      avatarUrl = url
    }

    const { error } = await updateProfile({
      displayName: displayName.trim(),
      email: email.trim() || undefined,
      walletAddress: isConnected ? address : user?.walletAddress,
      bio: bio.trim() || undefined,
      skills,
      avatarUrl,
      socials: {
        twitter: twitter.trim() || undefined,
        github: github.trim() || undefined,
        telegram: telegram.trim() || undefined,
      },
    })

    setSaving(false)
    if (error) { setErrors({ server: error }); return }
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 3000)
  }

  const avatarSrc = avatarPreview ?? user?.avatarUrl ?? null
  const initials = displayName?.[0]?.toUpperCase() ?? address?.[2]?.toUpperCase() ?? '?'
  const inviteBased = Boolean(user?.email && user?.inviteBased)

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <Spinner light={false} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[600px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Profile</span>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-5">

        {/* Avatar + name header */}
        <div className="flex items-center gap-5 mb-2" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          {/* Clickable avatar */}
          <div className="relative group cursor-pointer flex-shrink-0" onClick={handleAvatarClick}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="w-[72px] h-[72px] rounded-full object-cover border-2 border-black/[0.07]" />
            ) : address ? (
              <Identicon seed={address} size={72} />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-ink flex items-center justify-center">
                <span className="font-serif text-[28px] font-light text-paper">{initials}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="bi bi-camera text-white text-[18px]" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <div>
            <h1 className="font-serif text-[24px] font-light tracking-[-0.04em] text-ink">{displayName || 'Your profile'}</h1>
            <p className="text-[13px] font-light text-[#AAA]">{email || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'No email set')}</p>
            {errors.avatar && <p className="text-[11.5px] text-red-400 mt-1">{errors.avatar}</p>}
          </div>
        </div>

        {/* Account details */}
        <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] overflow-hidden" style={{ animation: 'up 0.5s 0.06s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="px-7 pt-7 pb-5 border-b border-black/[0.06]">
            <h2 className="font-sans text-[14.5px] font-medium text-ink tracking-[-0.02em]">Account</h2>
          </div>

          <div className="px-7 py-6 space-y-5">
            {errors.server && (
              <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5">
                <i className="bi bi-exclamation-circle text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-600 font-light">{errors.server}</p>
              </div>
            )}

            <Field id="displayName" label="Display name" value={displayName}
              onChange={v => { setDisplayName(v); setErrors(e => ({ ...e, displayName: null })) }}
              placeholder="How you appear to your pod"
              autoComplete="nickname" error={errors.displayName} />

            <Field id="email" label="Email address" type="email" value={email}
              onChange={v => { setEmail(v); setErrors(e => ({ ...e, email: null })) }}
              placeholder="you@example.com"
              autoComplete="email"
              hint={!user?.email ? 'Add an email to enable password-based login.' : undefined}
              disabled={inviteBased}
              error={errors.email} />

            <div>
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 280))}
                placeholder="Tell your pod what you bring to the table…"
                rows={3}
                className={`${inputCls(false)} resize-none leading-relaxed`}
              />
              <p className="text-right font-mono text-[10px] text-[#CCC] mt-1">{bio.length}/280</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] overflow-hidden" style={{ animation: 'up 0.5s 0.09s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="px-7 pt-6 pb-5 border-b border-black/[0.06]">
            <h2 className="font-sans text-[14.5px] font-medium text-ink tracking-[-0.02em]">Skills</h2>
          </div>
          <div className="px-7 py-6">
            <SkillsInput skills={skills} onChange={setSkills} />
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] overflow-hidden" style={{ animation: 'up 0.5s 0.12s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="px-7 pt-6 pb-5 border-b border-black/[0.06]">
            <h2 className="font-sans text-[14.5px] font-medium text-ink tracking-[-0.02em]">Wallet</h2>
          </div>
          <div className="px-7 py-6 space-y-3">
            <p className="text-[12.5px] font-light text-[#888] leading-relaxed">
              Connected on Base network. Required to receive PoP NFT badges and claim fund splits.
            </p>
            <div className="flex justify-start">
              <ConnectButton chainStatus="full" showBalance={false} accountStatus="address" />
            </div>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-dark flex-shrink-0" />
                <p className="font-mono text-[11.5px] text-[#888]">Connected on Base · {address?.slice(0, 6)}…{address?.slice(-4)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Social links */}
        <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] overflow-hidden" style={{ animation: 'up 0.5s 0.15s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="px-7 pt-6 pb-5 border-b border-black/[0.06]">
            <h2 className="font-sans text-[14.5px] font-medium text-ink tracking-[-0.02em]">Social links</h2>
          </div>
          <div className="px-7 py-6 space-y-4">
            <Field id="twitter" label="X / Twitter" value={twitter}
              onChange={setTwitter} placeholder="yourhandle" prefix="x.com/" />
            <Field id="github" label="GitHub" value={github}
              onChange={setGithub} placeholder="yourhandle" prefix="github.com/" />
            <Field id="telegram" label="Telegram" value={telegram}
              onChange={setTelegram} placeholder="yourhandle" prefix="t.me/" />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4" style={{ animation: 'up 0.5s 0.18s cubic-bezier(0.22,1,0.36,1) both' }}>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2.5 bg-ink text-paper py-3.5 px-6 rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <><Spinner />Saving…</> : <><i className="bi bi-check2 text-[15px]" />Save changes</>}
          </button>
          {saveOk && (
            <span className="flex items-center gap-1.5 text-[13px] font-light text-green-dark" style={{ animation: 'up 0.2s both' }}>
              <i className="bi bi-check-circle text-[13px]" />Saved
            </span>
          )}
        </div>

        {/* Session */}
        <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="px-6 py-4 border-b border-black/[0.06]">
            <h3 className="font-sans text-[13.5px] font-medium text-[#888] tracking-[-0.01em]">Session</h3>
          </div>
          <div className="px-6 py-5">
            <Link href="/auth/login"
              onClick={() => {
                try { sessionStorage.removeItem('w3l_user_token') } catch {}
                document.cookie = 'w3l_user_auth=; path=/; Max-Age=0'
              }}
              className="flex items-center gap-2 text-[13px] font-light text-red-400 hover:text-red-500 transition-colors">
              <i className="bi bi-box-arrow-left text-[14px]" />Sign out
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
