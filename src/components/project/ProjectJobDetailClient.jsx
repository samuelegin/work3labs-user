'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fetchProjectJob, fetchSystemMatches, acceptMatch, rejectMatch, fetchJobApplicants, acceptApplicant, fetchProjectJobChat, sendProjectJobChatMessage, projectVerifyAndRelease, projectRaiseDispute, submitProjectRating } from '@/services/api'

function Spinner({ light = true }) {
  return <span className={`inline-block w-[16px] h-[16px] rounded-full border-2 spin-anim flex-shrink-0 ${light ? 'border-white/25 border-t-white' : 'border-black/10 border-t-black/40'}`} />
}

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className={`text-[22px] cursor-pointer bg-transparent border-none p-0 transition-colors ${i <= value ? 'text-[#F59E0B]' : 'text-[#DDD] hover:text-[#F59E0B]'}`}>
          <i className={`bi ${i <= value ? 'bi-star-fill' : 'bi-star'}`} />
        </button>
      ))}
    </div>
  )
}

export default function ProjectJobDetailClient({ jobId }) {
  const [job, setJob] = useState(null)
  const [matches, setMatches] = useState([])
  const [applicants, setApplicants] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [stars, setStars] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [ratingDone, setRatingDone] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    Promise.all([
      fetchProjectJob(jobId),
      fetchProjectJobChat(jobId),
    ]).then(([jobRes, chatRes]) => {
      if (jobRes.data) {
        const j = jobRes.data
        setJob(j)
        if (j.matchType === 'system' && j.status === 'matching') fetchSystemMatches(jobId).then(r => { if (r.data) setMatches(r.data.matches ?? []) })
        if (j.matchType === 'manual' && j.status === 'open') fetchJobApplicants(jobId).then(r => { if (r.data) setApplicants(r.data.applicants ?? []) })
      }
      if (chatRes.data) setMessages(chatRes.data.messages ?? [])
    }).finally(() => setLoading(false))
  }, [jobId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend() {
    const text = msgInput.trim()
    if (!text || sending) return
    setSending(true); setMsgInput('')
    const { error } = await sendProjectJobChatMessage(jobId, { text })
    if (!error) setMessages(m => [...m, { text, isOwn: true, sentAt: new Date().toISOString(), senderName: 'You' }])
    setSending(false)
  }

  async function handleAcceptMatch(matchId) {
    const { error } = await acceptMatch(jobId, matchId)
    if (!error) setJob(j => ({ ...j, status: 'active' }))
  }

  async function handleAcceptApplicant(appId) {
    const { error } = await acceptApplicant(jobId, appId)
    if (!error) { setApplicants(a => a.map(x => x.id === appId ? { ...x, status: 'accepted' } : x)); setJob(j => ({ ...j, status: 'active' })) }
  }

  async function handleVerify() {
    setVerifying(true)
    const { error } = await projectVerifyAndRelease(jobId)
    setVerifying(false)
    if (!error) { setJob(j => ({ ...j, status: 'completed' })); setShowRating(true) }
  }

  async function handleDispute() {
    if (!disputeReason.trim()) return
    setDisputing(true)
    await projectRaiseDispute(jobId, { reason: disputeReason.trim() })
    setDisputing(false)
    setJob(j => ({ ...j, status: 'disputed' }))
    setShowDisputeForm(false)
  }

  async function handleSubmitRating() {
    if (!stars) return
    await submitProjectRating({ jobId, targetId: job.matchedUserId ?? job.matchedPodId, targetType: job.matchedPodId ? 'pod' : 'user', stars, feedback: ratingFeedback.trim() })
    setRatingDone(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-14 space-y-4">
          <Skeleton className="h-10 w-2/3" /><Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <p className="font-serif text-[22px] font-light text-ink">Job not found.</p>
      </div>
    )
  }

  const STATUS_LABEL = { draft: 'Draft', open: 'Open', matching: 'Matching', active: 'In progress', submitted: 'Review needed', completed: 'Completed', disputed: 'Disputed' }
  const STATUS_COLOR = { draft: '#AAA', open: '#F59E0B', matching: '#8B5CF6', active: '#1DC433', submitted: '#3B82F6', completed: '#AAA', disputed: '#EF4444' }

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[900px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/project" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] truncate max-w-[200px]">{job.title}</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-5">

        {/* Header */}
        <div style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-[26px] sm:text-[30px] font-light tracking-[-0.04em] text-ink mb-2">{job.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase flex items-center gap-1.5" style={{ color: STATUS_COLOR[job.status] }}>
                  <span className="w-1.5 h-1.5 rounded-full pdot-blink" style={{ background: STATUS_COLOR[job.status] }} />
                  {STATUS_LABEL[job.status] ?? job.status}
                </span>
                <span className="text-[#E0E0E0]">·</span>
                <span className="font-mono text-[10px] text-[#AAA]">{job.matchType === 'system' ? 'System match' : 'Manual interview'}</span>
                <span className="text-[#E0E0E0]">·</span>
                <span className="font-mono text-[10px] text-green-dark">${job.budgetUsd?.toLocaleString()} USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* System match recommendations */}
        {job.matchType === 'system' && job.status === 'matching' && matches.length > 0 && (
          <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.06s both' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <h2 className="font-sans text-[14px] font-medium text-ink">System recommendations</h2>
              <p className="text-[12px] font-light text-[#AAA] mt-0.5">Ranked by skill match, reputation, and past performance.</p>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {matches.map(m => (
                <div key={m.id} className="flex items-center gap-4 px-6 py-5">
                  {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : (
                    <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[12px] text-paper">{m.name?.[0]?.toUpperCase() ?? '?'}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-sans text-[13.5px] font-medium text-ink">{m.name}</p>
                      {m.type === 'pod' && <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-green-dark border border-green-dark/20 bg-green-dark/5 rounded-full px-1.5 py-0.5">Pod</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {m.reputationScore != null && <span className="flex items-center gap-1 text-[11px] font-light text-[#AAA]"><i className="bi bi-star-fill text-[9px] text-[#F59E0B]" />{m.reputationScore}</span>}
                      {m.successRate != null && <span className="text-[11px] font-light text-[#AAA]">{Math.round(m.successRate * 100)}% success</span>}
                      {m.matchScore != null && <span className="font-mono text-[10px] text-green-dark">{Math.round(m.matchScore * 100)}% match</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleAcceptMatch(m.id)}
                      className="flex items-center gap-1.5 bg-ink text-paper font-sans text-[12.5px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer">
                      Accept
                    </button>
                    <button onClick={() => rejectMatch(jobId, m.id).then(() => setMatches(x => x.filter(r => r.id !== m.id)))}
                      className="px-4 py-2 rounded-[8px] border border-black/[0.09] text-[#888] font-sans text-[12.5px] font-light hover:border-black/20 hover:text-ink transition-all bg-transparent cursor-pointer">
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual interview — applicants */}
        {job.matchType === 'manual' && applicants.length > 0 && (
          <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.06s both' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <h2 className="font-sans text-[14px] font-medium text-ink">Applicants</h2>
              <p className="text-[12px] font-light text-[#AAA] mt-0.5">{applicants.length} applied · Review and accept to begin work</p>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {applicants.map(a => (
                <div key={a.id} className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    {a.avatarUrl ? <img src={a.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" /> : (
                      <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="font-mono text-[12px] text-paper">{a.displayName?.[0]?.toUpperCase() ?? '?'}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-sans text-[13.5px] font-medium text-ink">{a.displayName}</p>
                        {a.applyAs === 'pod' && <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-green-dark border border-green-dark/20 bg-green-dark/5 rounded-full px-1.5 py-0.5">Pod</span>}
                        {a.status === 'accepted' && <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-[#1DC433] border border-green-dark/20 bg-green-dark/5 rounded-full px-1.5 py-0.5">Accepted</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {a.roleTags?.slice(0, 3).map(r => <span key={r} className="font-mono text-[9px] text-[#AAA] border border-black/[0.08] rounded-full px-2 py-0.5">{r}</span>)}
                      </div>
                      {a.coverNote && <p className="text-[12.5px] font-light text-[#666] leading-relaxed">{a.coverNote}</p>}
                    </div>
                    {a.status !== 'accepted' && (
                      <button onClick={() => handleAcceptApplicant(a.id)}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-ink text-paper font-sans text-[12.5px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer">
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        {['active', 'submitted', 'completed', 'disputed'].includes(job.status) && (
          <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.08s both' }}>
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-dark" />
              <h2 className="font-sans text-[14px] font-medium text-ink">Chat</h2>
            </div>
            <div className="px-5 py-4 max-h-[280px] overflow-y-auto space-y-3">
              {messages.length === 0 && <p className="text-[12.5px] font-light text-[#CCC] text-center py-6">No messages yet.</p>}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                  {!msg.isOwn && <span className="font-mono text-[9px] text-[#CCC] mb-1 tracking-[0.06em]">{msg.senderName}</span>}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-[10px] text-[13px] font-light leading-relaxed ${msg.isOwn ? 'bg-ink text-paper rounded-br-[3px]' : 'bg-[#F4F4F2] text-ink rounded-bl-[3px]'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-black/[0.05] px-4 py-3 flex gap-2">
              <input type="text" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Message…"
                className="flex-1 font-sans text-[13px] font-light text-ink bg-[#F7F7F5] border border-black/[0.07] rounded-[8px] px-3 py-2 outline-none focus:border-[#1DC433] transition-colors placeholder-[#CCC]" />
              <button onClick={handleSend} disabled={!msgInput.trim() || sending}
                className="w-9 h-9 flex items-center justify-center bg-ink text-paper rounded-[8px] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                {sending ? <Spinner size={14} /> : <i className="bi bi-send text-[12px]" />}
              </button>
            </div>
          </div>
        )}

        {/* Verify / Dispute — shown when work submitted */}
        {job.status === 'submitted' && (
          <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-6 space-y-4" style={{ animation: 'up 0.5s 0.1s both' }}>
            <div>
              <h2 className="font-sans text-[14px] font-medium text-ink mb-1">Deliverable submitted</h2>
              <p className="text-[13px] font-light text-[#888]">The Jobber has submitted their work. Review it and either verify to release funds, or raise a dispute.</p>
            </div>
            {job.deliverable && (
              <div className="bg-[#FAFAF8] border border-black/[0.07] rounded-[10px] px-5 py-4">
                <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#AAA] mb-2">Submitted work</p>
                <p className="text-[13px] font-light text-[#555] leading-relaxed mb-3">{job.deliverable.description}</p>
                {job.deliverable.links?.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12.5px] font-light text-[#3B82F6] hover:underline mb-1">
                    <i className="bi bi-link-45deg text-[13px]" />{link}
                  </a>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleVerify} disabled={verifying}
                className="flex items-center gap-2 bg-ink text-paper py-3.5 px-6 rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {verifying ? <><Spinner />Releasing…</> : <><i className="bi bi-patch-check text-[15px]" />Verify & release funds</>}
              </button>
              <button onClick={() => setShowDisputeForm(true)}
                className="flex items-center gap-2 py-3.5 px-5 rounded-[10px] border border-red-200 text-red-400 font-sans text-[13.5px] font-medium hover:border-red-300 hover:text-red-500 transition-all bg-transparent cursor-pointer">
                <i className="bi bi-exclamation-triangle text-[14px]" />Dispute
              </button>
            </div>
            {showDisputeForm && (
              <div className="space-y-3 pt-2" style={{ animation: 'up 0.2s both' }}>
                <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={3}
                  placeholder="Describe why this deliverable doesn't meet the agreed KPIs…"
                  className="w-full font-sans text-[13px] font-light text-ink border border-red-300 rounded-[10px] px-3.5 py-3 outline-none focus:border-red-400 transition-all resize-none placeholder-[#CCC]" />
                <div className="flex gap-2">
                  <button onClick={handleDispute} disabled={disputing || !disputeReason.trim()}
                    className="flex items-center gap-2 bg-red-500 text-white py-2.5 px-5 rounded-[10px] font-sans text-[13px] font-medium hover:bg-red-600 transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {disputing ? 'Submitting…' : 'Submit dispute'}
                  </button>
                  <button onClick={() => setShowDisputeForm(false)}
                    className="px-4 py-2.5 rounded-[10px] border border-black/[0.09] text-[#888] font-sans text-[13px] font-light hover:border-black/20 hover:text-ink transition-all bg-transparent cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rating — shown after completion */}
        {showRating && !ratingDone && (
          <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-6 space-y-4" style={{ animation: 'up 0.4s both' }}>
            <h2 className="font-sans text-[14px] font-medium text-ink">Rate the Jobber</h2>
            <StarPicker value={stars} onChange={setStars} />
            <textarea value={ratingFeedback} onChange={e => setRatingFeedback(e.target.value)} rows={3}
              placeholder="Share your experience working with this Jobber or Pod…"
              className="w-full font-sans text-[13px] font-light text-ink border border-black/[0.09] rounded-[10px] px-3.5 py-3 outline-none focus:border-[#1DC433] transition-all resize-none placeholder-[#CCC]" />
            <button onClick={handleSubmitRating} disabled={!stars}
              className="flex items-center gap-2 bg-ink text-paper py-3 px-5 rounded-[10px] font-sans text-[13.5px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <i className="bi bi-star text-[13px]" />Submit rating
            </button>
          </div>
        )}

        {ratingDone && (
          <div className="flex items-center gap-3 bg-[#F4FAF7] border border-green-dark/15 rounded-[14px] px-6 py-4">
            <i className="bi bi-check-circle-fill text-green-dark text-[16px]" />
            <p className="text-[13px] font-light text-green-dark">Rating submitted. Thank you for the feedback.</p>
          </div>
        )}

        {job.status === 'disputed' && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-[14px] px-6 py-5">
            <i className="bi bi-exclamation-triangle text-red-400 text-[17px] flex-shrink-0" />
            <div>
              <p className="font-sans text-[14px] font-medium text-red-500">Dispute submitted</p>
              <p className="text-[12.5px] font-light text-red-400 mt-0.5">Platform Admin is reviewing. You'll be notified with a resolution.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
