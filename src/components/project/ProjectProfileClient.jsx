'use client'
import ThemeToggle from '@/components/ThemeToggle'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fetchProfile, updateProfile } from '@/services/api'
import { uploadAvatar } from '@/lib/uploadAvatar'
import { useWallet } from '@/hooks/useWallet'

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}
function Spinner({ light = true }) {
  return <span className={`inline-block w-[18px] h-[18px] rounded-full border-2 spin-anim flex-shrink-0 ${light ? 'border-white/25 border-t-white' : 'border-black/10 border-t-black/40'}`} />
}

function Identicon({ seed = '', size = 80 }) {
  const hash = seed.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffffffff, 0)
  const hue = Math.abs(hash) % 360
  return (
    <div className="rounded-full flex-shrink-0" style={{
      width: size, height: size,
      background: `radial-gradient(circle at 35% 35%, hsl(${hue},70%,65%), hsl(${(hue+40)%360},60%,40%))`,
    }} />
  )
}

const INPUT_CLS = 'w-full font-sans text-[14px] font-light bg-white text-ink border border-black/[0.09] rounded-[10px] px-4 py-3 outline-none focus:border-[#1DC433] focus:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all placeholder-[#D0D0D0]'

export default function ProjectProfileClient() {
  const fileRef  = useRef(null)
  const { address: baseAddress, isConnected: baseConnected, openModal, disconnect } = useWallet()
  const [user,        setUser]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile,  setAvatarFile]  = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [email,       setEmail]       = useState('')
  const [bio,         setBio]         = useState('')
  const [website,     setWebsite]     = useState('')
  const [twitter,     setTwitter]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saveOk,      setSaveOk]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    fetchProfile().then(({ data }) => {
      if (data) {
        setUser(data)
        setDisplayName(data.displayName ?? '')
        setEmail(data.email ?? '')
        setBio(data.bio ?? '')
        setWebsite(data.socials?.website ?? '')
        setTwitter(data.socials?.twitter ?? '')
      }
      setLoading(false)
    })
  }, [])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (saving || !displayName.trim()) { setError('Display name is required'); return }
    setSaving(true); setError(''); setSaveOk(false)
    let avatarUrl = user?.avatarUrl
    if (avatarFile) {
      const { url, error: uploadErr } = await uploadAvatar(avatarFile)
      if (uploadErr) { setError(`Avatar upload failed: ${uploadErr}`); setSaving(false); return }
      avatarUrl = url
    }
    const { error: saveErr } = await updateProfile({
      displayName: displayName.trim(),
      email: email.trim() || undefined,
      bio: bio.trim() || undefined,
      avatarUrl,
      baseWallet: baseConnected ? baseAddress : user?.baseWallet,
      socials: { website: website.trim() || undefined, twitter: twitter.trim() || undefined },
    })
    setSaving(false)
    if (saveErr) { setError(saveErr); return }
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 3000)
  }

  const avatarSrc = avatarPreview ?? user?.avatarUrl ?? null

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[680px] mx-auto px-4 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/project" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Profile</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </nav>

      <div className="max-w-[680px] mx-auto px-4 sm:px-8 py-10 space-y-5">

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-[120px] rounded-[14px]" />)}
          </div>
        ) : (
          <>
            {/* ── AVATAR + NAME ─────────────────── */}
            <div className="flex items-center gap-5 mb-2 relative" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
              <img src="/images/wallet-earnings.png" alt="" className="absolute right-0 top-1/2 -translate-y-1/2 h-16 w-auto object-contain opacity-[0.12] pointer-events-none" />
              <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileRef.current?.click()}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="" className="w-[72px] h-[72px] rounded-full object-cover border-2 border-black/[0.07]" />
                  : <Identicon seed={displayName || 'project'} size={72} />
                }
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="bi bi-camera text-white text-[18px]" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
              <div>
                <h1 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink">{displayName || 'Your project'}</h1>
                <p className="text-[13px] font-light text-[#AAA]">{email || 'No email set'}</p>
              </div>
            </div>

            {/* ── ACCOUNT ───────────────────────── */}
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden" style={{ animation: 'up 0.5s 0.05s both' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <h2 className="font-sans text-[14.5px] font-medium text-ink tracking-[-0.02em]">Project details</h2>
              </div>
              <div className="px-6 py-6 space-y-4">
                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5">
                    <i className="bi bi-exclamation-circle text-red-500 text-[14px] flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-red-600 font-light">{error}</p>
                  </div>
                )}
                <div>
                  <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">
                    Project name <span className="text-amber-500">required</span>
                  </label>
                  <input className={INPUT_CLS} type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your project or organisation name" />
                </div>
                <div>
                  <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Email</label>
                  <input className={INPUT_CLS} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@project.xyz" />
                </div>
                <div>
                  <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Bio / description</label>
                  <textarea className={INPUT_CLS + ' resize-none leading-relaxed'} rows={3} value={bio} onChange={e => setBio(e.target.value.slice(0, 280))} placeholder="What does your project do?" />
                  <p className="text-right font-mono text-[10px] text-[#CCC] mt-1">{bio.length}/280</p>
                </div>
              </div>
            </div>

            {/* ── WALLET ───────────────────────── */}
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden" style={{ animation: 'up 0.5s 0.09s both' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <h2 className="font-sans text-[14.5px] font-medium text-ink tracking-[-0.02em]">Connected wallet</h2>
              </div>
              <div className="px-6 py-5 space-y-3">
                <p className="text-[12.5px] font-light text-[#888] leading-relaxed">
                  Connect your wallet to sign deal approvals and receive escrow payouts on Base.
                </p>
                {baseConnected && baseAddress ? (
                  <div className="flex items-center gap-3 bg-[#F4FAF7] border border-green-dark/15 rounded-[10px] px-4 py-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-dark flex-shrink-0" />
                    <p className="font-mono text-[12px] text-green-dark truncate flex-1">{baseAddress}</p>
                    <span className="font-mono text-[9px] text-green-dark/60 flex-shrink-0">Base</span>
                    <button type="button" onClick={() => disconnect()}
                      className="font-mono text-[9px] tracking-[0.06em] uppercase text-[#CCC] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0 ml-2 flex-shrink-0">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => openModal()}
                    className="w-full flex items-center justify-center gap-2.5 border border-black/[0.09] rounded-[10px] px-4 py-3 font-sans text-[13.5px] font-light text-[#555] hover:border-black/20 hover:text-ink hover:bg-black/[0.02] transition-all bg-transparent cursor-pointer">
                    <i className="bi bi-wallet2 text-[15px]" />Connect wallet (Base)
                  </button>
                )}
                {user?.baseWallet && !baseConnected && (
                  <p className="font-mono text-[10px] text-[#BBB]">Last connected: {user.baseWallet.slice(0,6)}…{user.baseWallet.slice(-4)}</p>
                )}
              </div>
            </div>

            {/* ── SOCIAL LINKS ──────────────────── */}
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden" style={{ animation: 'up 0.5s 0.08s both' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <h2 className="font-sans text-[14.5px] font-medium text-ink tracking-[-0.02em]">Social links</h2>
              </div>
              <div className="px-6 py-6 space-y-4">
                {[
                  { id: 'website', label: 'Website',    value: website,  set: setWebsite,  prefix: 'https://' },
                  { id: 'twitter', label: 'X / Twitter', value: twitter, set: setTwitter,  prefix: 'x.com/'   },
                ].map(({ id, label, value, set, prefix }) => (
                  <div key={id}>
                    <label htmlFor={id} className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">{label}</label>
                    <div className="flex items-center border border-black/[0.09] rounded-[10px] overflow-hidden focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all">
                      <span className="px-3 font-mono text-[12px] text-[#BBB] border-r border-black/[0.09] bg-[#FAFAF8] flex items-center py-3 flex-shrink-0">{prefix}</span>
                      <input id={id} type="text" value={value} onChange={e => set(e.target.value)}
                        placeholder="yourhandle"
                        className="flex-1 font-sans text-[14px] font-light text-ink bg-white px-3 py-3 outline-none placeholder-[#D0D0D0]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SAVE ──────────────────────────── */}
            <div className="flex items-center gap-4" style={{ animation: 'up 0.5s 0.1s both' }}>
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

            {/* ── SIGN OUT ──────────────────────── */}
            <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.12s both' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <h3 className="font-sans text-[13.5px] font-medium text-[#888]">Session</h3>
              </div>
              <div className="px-6 py-5">
                <Link href="/auth/login" onClick={() => { try { sessionStorage.removeItem('w3l_user_token') } catch {} document.cookie = 'w3l_user_auth=;path=/;Max-Age=0' }}
                  className="flex items-center gap-2 text-[13px] font-light text-red-400 hover:text-red-500 transition-colors">
                  <i className="bi bi-box-arrow-left text-[14px]" />Sign out
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
