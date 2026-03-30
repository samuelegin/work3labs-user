'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fetchMarketplaceJob, applyToMarketplaceJob, fetchMyPods, fetchJobChat, sendJobChatMessage, fetchProfile } from '@/services/api'
import ThemeToggle from '@/components/ThemeToggle'

function Spinner({ light = true }) {
  return <span className={`inline-block w-[16px] h-[16px] rounded-full border-2 spin-anim flex-shrink-0 ${light ? 'border-white/25 border-t-white' : 'border-black/10 border-t-black/40'}`} />
}

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

function ChainBadge({ chain }) {
  const cfg = chain === 'base' ? { label: 'Base · USDC', color: '#3B82F6', bg: '#EFF6FF' } : { label: 'Solana · USDC', color: '#9945FF', bg: '#F5F3FF' }
  return <span className="font-mono text-[9px] tracking-[0.06em] uppercase rounded-full px-2.5 py-1" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
}

export default function JobDetailClient({ jobId }) {
  const [job, setJob] = useState(null)
  const [myPods, setMyPods] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applyAs, setApplyAs] = useState('individual')
  const [coverNote, setCoverNote] = useState('')
  const [applied, setApplied] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [showApply, setShowApply] = useState(false)
  const [showKycModal, setShowKycModal] = useState(false)

  // Chat (shown after acceptance, placeholder here)
  const [messages, setMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    Promise.all([fetchMarketplaceJob(jobId), fetchMyPods(), fetchProfile()])
      .then(([jobRes, podsRes, profileRes]) => {
        if (jobRes.data) setJob(jobRes.data)
        if (podsRes.data) setMyPods(podsRes.data.pods ?? podsRes.data ?? [])
        if (profileRes.data) setCurrentUser(profileRes.data)
      })
      .finally(() => setLoading(false))
  }, [jobId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleApply() {
    if (applying) return
    setApplying(true); setApplyError('')
    const { error } = await applyToMarketplaceJob(jobId, {
      coverNote: coverNote.trim(),
      applyAs: applyAs === 'individual' ? 'individual' : applyAs,
    })
    setApplying(false)
    if (error) { setApplyError(error); return }
    setApplied(true)
  }

  async function handleSendMessage() {
    const text = msgInput.trim()
    if (!text || sending) return
    setSending(true); setMsgInput('')
    const { error } = await sendJobChatMessage(jobId, { text })
    if (!error) setMessages(m => [...m, { text, isOwn: true, sentAt: new Date().toISOString() }])
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="max-w-[800px] mx-auto px-5 sm:px-8 py-14 space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="text-center">
          <p className="font-serif text-[22px] font-light text-ink mb-2">Deal not found</p>
          <Link href="/marketplace" className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA] hover:text-ink transition-colors">
            Back to marketplace
          </Link>
        </div>
      </div>
    )
  }

  const adminPods = myPods.filter(p => p.myRole === 'admin' && ['forming', 'active'].includes(p.status))
  const daysLeft = job.deadline ? Math.max(0, Math.round((new Date(job.deadline) - Date.now()) / 86400000)) : null
  const needsKyc = (job.budgetUsd ?? 0) >= 1000 && !currentUser?.kycVerified

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* KYC Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-[20px] border border-black/[0.07] shadow-[0_8px_48px_rgba(0,0,0,0.14)] w-full max-w-[400px] overflow-hidden" style={{ animation: 'up 0.2s both' }}>
            <div className="px-7 pt-7 pb-6 border-b border-black/[0.06] text-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-shield-lock text-amber-500 text-[24px]" />
              </div>
              <h2 className="font-serif text-[22px] font-light tracking-[-0.03em] text-ink mb-1">KYC Required</h2>
              <p className="text-[13px] font-light text-[#888]">This deal has a budget of <strong className="text-ink">${job.budgetUsd?.toLocaleString()}</strong> — identity verification is required to apply.</p>
            </div>
            <div className="px-7 py-6 space-y-3">
              {['Government-issued ID', 'Proof of address', 'Selfie verification'].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#F4F4F2] flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-[10px] text-[#888]">{i + 1}</span>
                  </div>
                  <p className="text-[13px] font-light text-[#555]">{step}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowKycModal(false)} className="flex-1 border border-black/[0.09] text-[#888] font-sans text-[13px] py-3 rounded-[10px] hover:border-black/20 hover:text-ink transition-all bg-transparent cursor-pointer">Cancel</button>
                <Link href="/profile" className="flex-1 flex items-center justify-center gap-2 bg-ink text-paper font-sans text-[13.5px] font-medium py-3 rounded-[10px] hover:bg-[#1A1A1A] transition-colors">
                  <i className="bi bi-shield-plus text-[14px]" />Complete KYC
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[900px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/marketplace" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Marketplace
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] truncate max-w-[200px]">{job.title}</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — job detail */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header */}
            <div style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#AAA] mb-2">{job.category}</p>
              <h1 className="font-serif text-[26px] sm:text-[30px] font-light tracking-[-0.04em] text-ink mb-3">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <ChainBadge chain={job.chain} />
                {job.requiredType && (
                  <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-[#888] border border-black/[0.09] rounded-full px-2.5 py-1">
                    {job.requiredType === 'both' ? 'Pod or Individual' : job.requiredType}
                  </span>
                )}
                {daysLeft != null && (
                  <span className={`font-mono text-[9px] tracking-[0.06em] uppercase rounded-full px-2.5 py-1 border ${daysLeft <= 3 ? 'text-red-400 border-red-200 bg-red-50' : 'text-[#AAA] border-black/[0.09]'}`}>
                    {daysLeft}d left
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-6" style={{ animation: 'up 0.5s 0.05s both' }}>
              <h2 className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em] mb-3">About this deal</h2>
              <p className="text-[13.5px] font-light text-[#555] leading-[1.75] whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* KPIs */}
            {job.kpis?.length > 0 && (
              <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-6" style={{ animation: 'up 0.5s 0.08s both' }}>
                <h2 className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em] mb-3">Success criteria / KPIs</h2>
                <div className="space-y-2">
                  {job.kpis.map((kpi, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <i className="bi bi-check-circle-fill text-green-dark text-[13px] flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] font-light text-[#555]">{kpi}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            {job.milestones?.length > 0 && (
              <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-6" style={{ animation: 'up 0.5s 0.1s both' }}>
                <h2 className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em] mb-4">Milestones</h2>
                <div className="space-y-3">
                  {job.milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-black/[0.05] last:border-b-0">
                      <span className="font-mono text-[10px] text-[#CCC] tracking-[0.08em] w-5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <p className="font-sans text-[13.5px] font-medium text-ink">{m.title}</p>
                        {m.description && <p className="text-[12px] font-light text-[#888] mt-0.5">{m.description}</p>}
                      </div>
                      <span className="font-mono text-[12px] font-medium text-green-dark flex-shrink-0">${m.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applicant chat area — shown after application accepted */}
            {job.myStatus === 'accepted' && (
              <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.4s both' }}>
                <div className="px-6 py-4 border-b border-black/[0.06] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-dark" />
                  <h2 className="font-sans text-[14px] font-medium text-ink">Chat with Project Owner</h2>
                </div>
                <div className="px-5 py-4 max-h-[280px] overflow-y-auto space-y-3">
                  {messages.length === 0 && (
                    <p className="text-[12.5px] font-light text-[#CCC] text-center py-6">You've been accepted — start chatting.</p>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-[10px] text-[13px] font-light leading-relaxed ${msg.isOwn ? 'bg-ink text-paper rounded-br-[3px]' : 'bg-[#F4F4F2] text-ink rounded-bl-[3px]'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="border-t border-black/[0.05] px-4 py-3 flex gap-2">
                  <input type="text" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                    placeholder="Message project owner…"
                    className="flex-1 font-sans text-[13px] font-light text-ink bg-[#F7F7F5] border border-black/[0.07] rounded-[8px] px-3 py-2 outline-none focus:border-[#1DC433] transition-colors placeholder-[#CCC]"
                  />
                  <button onClick={handleSendMessage} disabled={!msgInput.trim() || sending}
                    className="w-9 h-9 flex items-center justify-center bg-ink text-paper rounded-[8px] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                    {sending ? <Spinner size={14} /> : <i className="bi bi-send text-[12px]" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — apply panel + job meta */}
          <div className="space-y-4">

            {/* Budget card */}
            <div className="bg-white border border-black/[0.07] rounded-[14px] p-5" style={{ animation: 'up 0.5s 0.05s both' }}>
              <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#AAA] mb-1">Budget</p>
              <p className="font-serif text-[32px] font-light text-green-dark tracking-[-0.06em] leading-none mb-1">
                ${job.budgetUsd?.toLocaleString()}
              </p>
              <p className="font-mono text-[10px] text-[#AAA]">
                {job.paymentStructure === 'milestone' ? `${job.milestones?.length ?? 0} milestones` : 'Full on completion'}
              </p>

              <div className="mt-4 space-y-2 pt-4 border-t border-black/[0.05]">
                {[
                  { icon: 'bi-calendar2', label: 'Timeline', val: job.timeline ?? 'TBD' },
                  { icon: 'bi-people', label: 'Looking for', val: job.requiredType === 'both' ? 'Pod or Individual' : job.requiredType },
                  { icon: 'bi-people-fill', label: 'Applicants', val: job.applicantCount ?? 0 },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[12px] font-light text-[#AAA]">
                      <i className={`bi ${icon} text-[11px]`} />{label}
                    </span>
                    <span className="font-mono text-[11px] text-ink">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply CTA */}
            <div className="bg-white border border-black/[0.07] rounded-[14px] p-5" style={{ animation: 'up 0.5s 0.08s both' }}>
              {applied || job.myStatus === 'applied' ? (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-[#2DFC44] flex items-center justify-center mb-3 pop-anim">
                    <i className="bi bi-check2 text-ink text-[20px]" />
                  </div>
                  <p className="font-sans text-[14px] font-medium text-ink mb-1">Application sent!</p>
                  <p className="text-[12px] font-light text-[#AAA]">The project team will review and may open a chat with you.</p>
                </div>
              ) : job.myStatus === 'accepted' ? (
                <div className="flex items-center gap-2 bg-[#F4FAF7] border border-green-dark/15 rounded-[10px] px-4 py-3">
                  <i className="bi bi-check-circle-fill text-green-dark text-[14px]" />
                  <p className="text-[13px] font-light text-green-dark">You're matched to this job.</p>
                </div>
              ) : showApply ? (
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Apply as</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="radio" name="applyAs" value="individual" checked={applyAs === 'individual'} onChange={e => setApplyAs(e.target.value)} className="accent-ink" />
                        <span className="text-[13px] font-light text-ink">Myself (individual)</span>
                      </label>
                      {adminPods.map(pod => (
                        <label key={pod.id} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="radio" name="applyAs" value={pod.id} checked={applyAs === pod.id} onChange={e => setApplyAs(e.target.value)} className="accent-ink" />
                          <div>
                            <span className="text-[13px] font-light text-ink">{pod.name}</span>
                            <span className="font-mono text-[9px] text-green-dark ml-1.5 tracking-[0.06em]">pod</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Cover note</label>
                    <textarea value={coverNote} onChange={e => setCoverNote(e.target.value.slice(0, 500))} rows={4}
                      placeholder="Why are you the best fit for this deal? What relevant experience do you have?"
                      className="w-full font-sans text-[13px] font-light text-ink border border-black/[0.09] rounded-[10px] px-3.5 py-3 outline-none focus:border-[#1DC433] focus:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all resize-none placeholder-[#CCC]"
                    />
                    <p className="text-right font-mono text-[10px] text-[#CCC] mt-1">{coverNote.length}/500</p>
                  </div>

                  {applyError && (
                    <p className="text-[12px] text-red-500 font-light flex items-center gap-1.5">
                      <i className="bi bi-exclamation-circle text-[11px]" />{applyError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={handleApply} disabled={applying}
                      className="flex-1 flex items-center justify-center gap-2 bg-ink text-paper py-3 rounded-[10px] font-sans text-[13.5px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      {applying ? <><Spinner />Sending…</> : 'Submit application'}
                    </button>
                    <button onClick={() => setShowApply(false)}
                      className="px-4 py-3 rounded-[10px] border border-black/[0.09] text-[#888] font-sans text-[13px] font-light hover:border-black/20 hover:text-ink transition-all bg-transparent cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {needsKyc && (
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3 mb-3">
                      <i className="bi bi-shield-exclamation text-amber-500 text-[14px] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12.5px] font-medium text-amber-800">KYC required for this deal</p>
                        <p className="text-[11.5px] font-light text-amber-700 mt-0.5">Deals worth $1,000+ require identity verification. <Link href="/profile" className="underline">Complete KYC →</Link></p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => needsKyc ? setShowKycModal(true) : setShowApply(true)}
                    className="w-full flex items-center justify-center gap-2.5 bg-ink text-paper py-3.5 rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer">
                    <i className={`bi ${needsKyc ? 'bi-shield-lock' : 'bi-send'} text-[14px]`} />
                    {needsKyc ? 'Verify identity to apply' : 'Apply now'}
                  </button>
                </>
              )}
            </div>

            {/* Project owner */}
            {job.projectOwner && (
              <div className="bg-white border border-black/[0.07] rounded-[14px] p-5" style={{ animation: 'up 0.5s 0.1s both' }}>
                <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#AAA] mb-3">Posted by</p>
                <div className="flex items-center gap-3">
                  {job.projectOwner.avatarUrl ? (
                    <img src={job.projectOwner.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[12px] text-paper">{job.projectOwner.name?.[0]?.toUpperCase() ?? 'P'}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-sans text-[13.5px] font-medium text-ink">{job.projectOwner.name}</p>
                    {job.projectOwner.completedJobs != null && (
                      <p className="text-[11.5px] font-light text-[#AAA]">{job.projectOwner.completedJobs} jobs completed</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
