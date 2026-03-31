'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWallet } from '@/hooks/useWallet'
import {
  fetchPod, fetchProfile, removeMember,
  fetchSplitChat, sendSplitMessage,
  notifyWorkComplete, claimSplit, dissolvePod,
  exportPoPCV,
  fetchNotifications,
} from '@/services/api'
import ThemeToggle from '@/components/ThemeToggle'

const STATUS = {
  forming: { label: 'Forming', color: '#F59E0B', icon: 'bi-people' },
  active: { label: 'Active', color: '#1DC433', icon: 'bi-lightning-charge' },
  submitted: { label: 'Submitted', color: '#3B82F6', icon: 'bi-send-check' },
  reviewing: { label: 'Reviewing', color: '#8B5CF6', icon: 'bi-hourglass-split' },
  approved: { label: 'Approved', color: '#1DC433', icon: 'bi-patch-check' },
  claimable: { label: 'Claimable', color: '#2DFC44', icon: 'bi-cash-coin' },
  completed: { label: 'Completed', color: '#AAA', icon: 'bi-check-circle' },
  dissolved: { label: 'Dissolved', color: '#EF4444', icon: 'bi-x-circle' },
}

function Spinner({ light = true, size = 18 }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-block rounded-full border-2 spin-anim flex-shrink-0 ${
        light ? 'border-white/25 border-t-white' : 'border-black/10 border-t-black/40'
      }`}
    />
  )
}

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

function Section({ title, tag, children, action }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden">
      <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {tag && <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC]">{tag}</span>}
          {tag && <span className="text-[#E0E0E0]">·</span>}
          <h2 className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function MembersSection({ members, splits, isAdmin, projectAssigned, currentUserId, onRemove, removing }) {
  return (
    <Section title="Members" tag="Pod">
      <div className="divide-y divide-black/[0.05]">
        {members.map(m => {
          const memberSplit = splits?.find(s => s.role === m.role)
          return (
            <div key={m.id} className="flex items-center gap-3 px-6 py-4">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-[12px] text-paper">{m.displayName?.[0]?.toUpperCase() ?? '?'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[13.5px] font-medium text-ink tracking-[-0.01em] truncate">
                  {m.displayName}
                  {m.id === currentUserId && <span className="font-mono text-[9px] text-[#CCC] ml-1.5 tracking-[0.06em]">you</span>}
                </p>
                <p className="font-mono text-[10px] text-[#AAA] tracking-[0.04em] truncate">{m.role ?? 'Member'}</p>
              </div>

              {memberSplit && (
                <span className="font-mono text-[11px] text-[#888] border border-black/[0.08] rounded-full px-2 py-0.5">
                  {memberSplit.percentage}%
                </span>
              )}

              {m.reputationScore != null && (
                <div className="flex items-center gap-1 border border-black/[0.08] rounded-full px-2.5 py-1">
                  <i className="bi bi-star-fill text-[9px] text-green-dark" />
                  <span className="font-mono text-[10px] text-ink">{m.reputationScore}</span>
                </div>
              )}

              {m.popCount != null && m.popCount > 0 && (
                <div className="flex items-center gap-1 border border-black/[0.08] rounded-full px-2.5 py-1">
                  <i className="bi bi-patch-check-fill text-[9px] text-[#3B82F6]" />
                  <span className="font-mono text-[10px] text-ink">{m.popCount}</span>
                </div>
              )}

              {m.isAdmin && (
                <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-green-dark border border-green-dark/20 bg-green-dark/5 rounded-full px-2 py-0.5">
                  Admin
                </span>
              )}

              {isAdmin && !m.isAdmin && m.id !== currentUserId && !projectAssigned && (
                <button
                  onClick={() => onRemove(m.id)}
                  disabled={removing === m.id}
                  className="font-mono text-[9px] tracking-[0.06em] uppercase text-[#CCC] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {removing === m.id ? <Spinner light={false} size={14} /> : 'Remove'}
                </button>
              )}
            </div>
          )
        })}

        {members.length === 0 && (
          <p className="px-6 py-6 text-[13px] font-light text-[#CCC]">No members yet.</p>
        )}
      </div>
    </Section>
  )
}

function SplitDisplaySection({ splits, podStatus }) {
  const locked = ['submitted', 'reviewing', 'approved', 'claimable', 'completed'].includes(podStatus)

  return (
    <Section title="Fund Split" tag="Set at creation">
      <div className="px-6 py-5 space-y-3">
        <div className="flex items-start gap-2 mb-1">
          <i className="bi bi-info-circle text-[#CCC] text-[12px] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] font-light text-[#AAA]">
            Split was set when the pod was created. PoP mint fee (~$0.05 on Base) is deducted automatically before distribution.
          </p>
        </div>

        {splits.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[10px] text-paper">{(s.role[0] ?? '?').toUpperCase()}</span>
            </div>
            <p className="flex-1 font-sans text-[13px] font-light text-ink truncate">{s.role}</p>
            <span className="font-mono text-[13px] text-ink font-medium">{s.percentage}%</span>
          </div>
        ))}

        <div className="h-1.5 bg-[#F0F0EE] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-green-dark" style={{ width: '100%' }} />
        </div>

        {locked && (
          <div className="flex items-center gap-2 text-[12px] font-light text-[#AAA] pt-1">
            <i className="bi bi-lock text-[11px]" />Split locked — work submitted
          </div>
        )}
      </div>
    </Section>
  )
}

function SplitChatSection({ podId, podStatus }) {
  const [messages, setMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    fetchSplitChat(podId).then(({ data }) => {
      if (data?.messages) setMessages(data.messages)
    })
  }, [podId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = msgInput.trim()
    if (!text || sending) return
    setSending(true)
    setMsgInput('')
    const { error } = await sendSplitMessage(podId, { text })
    if (!error) {
      setMessages(m => [...m, { senderName: 'You', text, sentAt: new Date().toISOString(), isOwn: true }])
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <Section title="Pod Chat" tag="Communication">
      <div className="flex flex-col">
        <div className="px-5 py-4 space-y-3 max-h-[240px] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-[12.5px] font-light text-[#CCC] text-center py-4">Chat with your pod here.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
              {!msg.isOwn && <span className="font-mono text-[9px] text-[#CCC] mb-1 tracking-[0.06em]">{msg.senderName}</span>}
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-[10px] text-[13px] font-light leading-relaxed ${
                msg.isOwn ? 'bg-ink text-paper rounded-br-[3px]' : 'bg-[#F4F4F2] text-ink rounded-bl-[3px]'
              }`}>
                {msg.text}
              </div>
              <span className="font-mono text-[9px] text-[#CCC] mt-1">
                {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t border-black/[0.05] px-4 py-3 flex gap-2">
          <input
            type="text" value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your pod…"
            className="flex-1 font-sans text-[13px] font-light text-ink bg-[#F7F7F5] border border-black/[0.07] rounded-[8px] px-3 py-2 outline-none focus:border-[#1DC433] transition-colors placeholder-[#CCC]"
          />
          <button
            onClick={handleSend}
            disabled={!msgInput.trim() || sending}
            className="w-9 h-9 flex items-center justify-center bg-ink text-paper rounded-[8px] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sending ? <Spinner size={14} /> : <i className="bi bi-send text-[12px]" />}
          </button>
        </div>
      </div>
    </Section>
  )
}

function WorkCompletionSection({ podStatus, isAdmin, podId, onStatusChange }) {
  const [notifying, setNotifying] = useState(false)
  const [notifyDone, setNotifyDone] = useState(false)
  const [error, setError] = useState('')

  async function handleNotify() {
    if (notifying) return
    setNotifying(true); setError('')
    const { error } = await notifyWorkComplete(podId)
    setNotifying(false)
    if (error) { setError(error); return }
    setNotifyDone(true)
    onStatusChange('submitted')
  }

  const canNotify = podStatus === 'active' && isAdmin

  const steps = [
    { key: 'active', label: 'Work in progress' },
    { key: 'submitted', label: 'Pod notified project — work complete' },
    { key: 'reviewing', label: 'Project reviewing delivery' },
    { key: 'approved', label: 'Project confirmed — admin releasing escrow' },
    { key: 'claimable', label: 'Escrow released · PoP badges minting on Base' },
    { key: 'completed', label: 'All splits claimed · PoP records finalised' },
  ]

  const statusOrder = ['active', 'submitted', 'reviewing', 'approved', 'claimable', 'completed']
  const currentIndex = statusOrder.indexOf(podStatus)

  return (
    <Section title="Work Status" tag="Delivery">
      <div className="px-6 py-6 space-y-4">
        <div className="space-y-0">
          {steps.map((step, i) => {
            const done = currentIndex > i
            const isCurrent = currentIndex === i
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    done ? 'bg-green-dark border-green-dark'
                    : isCurrent ? 'border-[#1DC433] bg-white'
                    : 'border-[#E5E5E5] bg-white'
                  }`}>
                    {done
                      ? <i className="bi bi-check text-paper text-[11px]" />
                      : isCurrent
                      ? <span className="w-2 h-2 rounded-full bg-green-dark pdot-blink" />
                      : <span className="w-2 h-2 rounded-full bg-[#E5E5E5]" />
                    }
                  </div>
                  {i < steps.length - 1 && <div className={`w-px h-6 ${done ? 'bg-green-dark/30' : 'bg-[#E5E5E5]'}`} />}
                </div>
                <p className={`pt-0.5 pb-3 text-[13px] font-light leading-snug ${
                  done ? 'text-ink' : isCurrent ? 'text-ink font-medium' : 'text-[#CCC]'
                }`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>

        {canNotify && !notifyDone && (
          <div className="pt-2">
            {error && (
              <p className="text-[12px] text-red-500 font-light flex items-center gap-1.5 mb-3">
                <i className="bi bi-exclamation-circle text-[11px]" />{error}
              </p>
            )}
            <button
              onClick={handleNotify}
              disabled={notifying}
              className="flex items-center gap-2.5 bg-ink text-paper py-3.5 px-6 rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {notifying
                ? <><Spinner size={15} />Notifying…</>
                : <><i className="bi bi-send-check text-[15px]" />Notify project — work is done</>
              }
            </button>
            <p className="text-[11.5px] font-light text-[#CCC] mt-2">Pod Admin only.</p>
          </div>
        )}

        {podStatus === 'approved' && (
          <div className="flex items-center gap-3 bg-[#F4FAF7] border border-green-dark/15 rounded-[10px] px-4 py-3.5">
            <Spinner light={false} size={15} />
            <p className="text-[13px] font-light text-green-dark">Admin is processing escrow release automatically.</p>
          </div>
        )}
      </div>
    </Section>
  )
}

function ClaimSection({ podId, mySplit, walletAddress, isConnected, onClaimed }) {
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')

  async function handleClaim() {
    if (!isConnected || !walletAddress) {
      setError('Connect your wallet in Profile before claiming.')
      return
    }
    setClaiming(true); setError('')
    const { error } = await claimSplit(podId)
    setClaiming(false)
    if (error) { setError(error); return }
    setClaimed(true)
    onClaimed?.()
  }

  if (claimed) {
    return (
      <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-[#2DFC44] flex items-center justify-center mb-4 pop-anim">
          <i className="bi bi-check2 text-ink text-[24px]" />
        </div>
        <h3 className="font-serif text-[20px] font-light text-ink tracking-[-0.03em] mb-2">Split claimed!</h3>
        <p className="text-[13px] font-light text-[#888]">Funds sent to your wallet. Your PoP badge is minted on Base.</p>
      </div>
    )
  }

  return (
    <Section title="Claim Your Split" tag="Earnings">
      <div className="px-6 py-6 space-y-4">
        <div className="bg-[#F4FAF7] border border-green-dark/15 rounded-[12px] px-5 py-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#AAA] mb-1">Your split</p>
            <p className="font-serif text-[34px] font-light text-green-dark tracking-[-0.06em] leading-none">{mySplit ?? '—'}%</p>
          </div>
          <i className="bi bi-cash-coin text-green-dark text-[28px] opacity-30" />
        </div>

        <div className="flex items-start gap-2 bg-[#FAFAF8] border border-black/[0.07] rounded-[10px] px-4 py-3">
          <i className="bi bi-patch-check-fill text-green-dark text-[12px] flex-shrink-0 mt-0.5" />
          <p className="text-[11.5px] font-light text-[#666]">PoP badge mint fee (~$0.05) is deducted automatically before your split is sent.</p>
        </div>

        {!isConnected && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-[10px] px-4 py-3.5">
            <i className="bi bi-wallet2 text-amber-500 text-[14px] flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] font-light text-amber-700">
              No wallet connected.{' '}
              <Link href="/profile" className="underline underline-offset-2 font-medium">Go to Profile</Link>
              {' '}to connect first.
            </p>
          </div>
        )}

        {error && (
          <p className="text-[12px] text-red-500 font-light flex items-center gap-1.5">
            <i className="bi bi-exclamation-circle text-[11px]" />{error}
          </p>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full flex items-center justify-center gap-2.5 bg-ink text-paper py-3.5 rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {claiming ? <><Spinner size={15} />Claiming…</> : <><i className="bi bi-cash-coin text-[15px]" />Claim split & mint PoP badge</>}
        </button>
      </div>
    </Section>
  )
}

function PoPSection({ pod, currentUserId }) {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const records = pod.popRecords ?? []
  const podPoP = pod.podPopRecord

  async function handleExportCV() {
    setExporting(true); setExportError('')
    const { data, error } = await exportPoPCV(pod.id)
    setExporting(false)
    if (error) { setExportError(error); return }
    // data.url is the shareable on-chain verifiable DOC link
    if (data?.url) window.open(data.url, '_blank')
  }

  return (
    <Section
      title="Proof-of-Performance"
      tag="Reputation"
      action={
        records.length > 0 && (
          <button
            onClick={handleExportCV}
            disabled={exporting}
            className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] uppercase text-[#AAA] border border-black/[0.09] rounded-full px-3 py-1.5 hover:border-black/20 hover:text-ink transition-all bg-transparent cursor-pointer disabled:opacity-50"
          >
            {exporting ? <Spinner light={false} size={12} /> : <i className="bi bi-box-arrow-up-right text-[10px]" />}
            Export PoP
          </button>
        )
      }
    >
      {exportError && (
        <p className="px-6 pt-3 text-[12px] text-red-500 font-light">{exportError}</p>
      )}

      {/* Pod-level PoP record */}
      {podPoP && (
        <div className="px-6 py-4 border-b border-black/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#AAA]">Pod record</span>
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.1em] uppercase text-green-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-green-dark" />Verified
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['Jobs completed', podPoP.jobsCompleted],
              ['Avg score', podPoP.avgScore],
              ['Pod score', pod.reputationScore],
            ].map(([k, v]) => v != null && (
              <div key={k} className="bg-[#FAFAF8] rounded-[8px] px-3 py-2.5">
                <p className="font-mono text-[9px] text-[#CCC] tracking-[0.08em] uppercase mb-0.5">{k}</p>
                <p className="font-mono text-[12px] text-ink font-medium">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-member PoP records */}
      {records.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-[13px] font-light text-[#CCC]">
            PoP badges are minted on Base when this pod completes verified work.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.05]">
          {records.map((rec, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA]">{rec.workType}</span>
                  {rec.jobTitle && <p className="font-sans text-[13px] font-medium text-ink mt-0.5">{rec.jobTitle}</p>}
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.1em] uppercase text-green-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-dark" />Verified
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {[
                  ['Milestones', rec.milestones],
                  ['Delivery', rec.delivery],
                  ['Chain', rec.chainAnchor ?? 'Base'],
                  ['Score', rec.score],
                ].map(([k, v]) => v != null && (
                  <div key={k} className="bg-[#FAFAF8] rounded-[8px] px-3 py-2.5">
                    <p className="font-mono text-[9px] text-[#CCC] tracking-[0.08em] mb-0.5">{k}</p>
                    <p className={`font-mono text-[12px] ${k === 'Score' ? 'text-green-dark font-medium' : 'text-ink'}`}>{v}</p>
                  </div>
                ))}
              </div>
              {rec.contractAddress && rec.tokenId && (
                <a
                  href={`https://basescan.org/token/${rec.contractAddress}?a=${rec.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] uppercase text-[#AAA] hover:text-ink transition-colors"
                >
                  <i className="bi bi-box-arrow-up-right text-[10px]" />View on Basescan
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {pod.reputationScore != null && (
        <div className="px-6 py-4 border-t border-black/[0.05] flex items-center justify-between">
          <span className="text-[13px] font-light text-[#888]">Pod reputation score</span>
          <span className="font-serif text-[28px] font-light text-green-dark tracking-[-0.06em] leading-none">{pod.reputationScore}</span>
        </div>
      )}
    </Section>
  )
}

function DissolveSection({ podId, onDissolved }) {
  const [open, setOpen] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [error, setError] = useState('')

  async function handleDissolve() {
    setDissolving(true); setError('')
    const { error } = await dissolvePod(podId)
    setDissolving(false)
    if (error) { setError(error); return }
    onDissolved()
  }

  return (
    <div className="bg-white border border-red-100 rounded-[14px] overflow-hidden">
      <div className="px-6 py-4 border-b border-red-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-red-300">Admin</span>
          <span className="text-[#F0C0C0]">·</span>
          <h2 className="font-sans text-[14px] font-medium text-red-500 tracking-[-0.01em]">Dissolve pod</h2>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-[12.5px] font-light text-[#888] mb-4 leading-relaxed">
          Permanently dissolves this pod. This cannot be undone. Existing PoP records are preserved. Only available before a project is assigned.
        </p>
        {error && (
          <p className="text-[12px] text-red-500 font-light flex items-center gap-1.5 mb-3">
            <i className="bi bi-exclamation-circle text-[11px]" />{error}
          </p>
        )}
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 font-sans text-[13px] font-medium text-red-400 hover:text-red-500 transition-colors bg-transparent border border-red-200 hover:border-red-300 rounded-[10px] px-4 py-2.5 cursor-pointer"
          >
            <i className="bi bi-x-circle text-[13px]" />Dissolve pod
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5">
              <i className="bi bi-exclamation-triangle text-red-400 text-[14px] flex-shrink-0 mt-0.5" />
              <p className="text-[12.5px] font-light text-red-600">Are you sure? This is permanent and cannot be reversed.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDissolve}
                disabled={dissolving}
                className="flex items-center gap-2 bg-red-500 text-white font-sans text-[13px] font-medium px-5 py-2.5 rounded-[10px] hover:bg-red-600 transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dissolving ? <><Spinner size={14} />Dissolving…</> : 'Yes, dissolve'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-[10px] border border-black/[0.09] text-[#888] font-sans text-[13px] font-light hover:border-black/20 hover:text-ink transition-all bg-transparent cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PodDetailClient({ podId }) {
  const router = useRouter()
  const { address: walletAddress, isConnected } = useWallet()
  const [pod, setPod] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)
  const [activeTab, setActiveTab] = useState('pod')  // 'pod' | 'deals' | 'notifications'
  const [dealFilter, setDealFilter] = useState('active') // 'pending' | 'active' | 'completed'
  const [podDeals, setPodDeals] = useState([])
  const [podNotifications, setPodNotifications] = useState([])

  useEffect(() => {
    Promise.all([fetchPod(podId), fetchProfile(), fetchNotifications()])
      .then(([podRes, profileRes, notifsRes]) => {
        if (podRes.data) {
          setPod(podRes.data)
          // Pod deals come from pod.deals or pod.jobs array if present
          const dealsArr = podRes.data.deals ?? podRes.data.jobs ?? []
          setPodDeals(dealsArr)
        }
        if (profileRes.data) setCurrentUser(profileRes.data)
        if (notifsRes.data) setPodNotifications(notifsRes.data.notifications ?? [])
      })
      .finally(() => setLoading(false))
  }, [podId])

  async function handleRemoveMember(memberId) {
    setRemoving(memberId)
    const { error } = await removeMember(podId, memberId)
    setRemoving(null)
    if (!error) setPod(p => ({ ...p, members: p.members.filter(m => m.id !== memberId) }))
  }

  function handleStatusChange(newStatus) {
    setPod(p => ({ ...p, status: newStatus }))
  }

  function handleDissolved() {
    setPod(p => ({ ...p, status: 'dissolved' }))
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="max-w-[800px] mx-auto px-5 sm:px-8 py-14 space-y-4">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  if (!pod) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="text-center">
          <p className="font-serif text-[22px] font-light text-ink mb-2">Pod not found</p>
          <Link href="/dashboard" className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA] hover:text-ink transition-colors">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = pod.myRole === 'admin'
  const projectAssigned = pod.projectAssigned ?? false
  const status = STATUS[pod.status] ?? STATUS.forming
  const members = pod.members ?? []
  const splits = pod.splits ?? []
  const myMember = members.find(m => m.id === currentUser?.id)
  const mySplit = myMember?.splitPercentage ?? null
  const canDissolve = isAdmin && !projectAssigned && !['completed', 'dissolved'].includes(pod.status)
  const splitMatchable = splits.length > 0 && splits.reduce((a, s) => a + (s.percentage || 0), 0) === 100

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[800px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] truncate max-w-[200px]">{pod.name}</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-5">

        {/* Header */}
        <div style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="font-serif text-[26px] sm:text-[32px] font-light tracking-[-0.04em] text-ink mb-1">{pod.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase flex items-center gap-1.5" style={{ color: status.color }}>
                  <span className="w-1.5 h-1.5 rounded-full pdot-blink" style={{ background: status.color }} />
                  {status.label}
                </span>
                {isAdmin && (
                  <>
                    <span className="text-[#E0E0E0]">·</span>
                    <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-green-dark">Admin</span>
                  </>
                )}
                {!splitMatchable && pod.status === 'forming' && (
                  <>
                    <span className="text-[#E0E0E0]">·</span>
                    <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-amber-500">Not matchable</span>
                  </>
                )}
                {splitMatchable && pod.status === 'forming' && (
                  <>
                    <span className="text-[#E0E0E0]">·</span>
                    <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-green-dark">Ready to match</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isAdmin && (
                <Link
                  href={`/pod/${podId}/edit`}
                  className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-[#BBB] border border-black/[0.09] rounded-full px-3.5 py-1.5 hover:border-black/20 hover:text-ink transition-all"
                >
                  <i className="bi bi-pencil text-[10px]" />Edit
                </Link>
              )}
              {pod.reputationScore != null && (
                <div className="bg-white border border-black/[0.07] rounded-[12px] px-4 py-3 text-center">
                  <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC] mb-0.5">Reputation</p>
                  <p className="font-serif text-[26px] font-light text-green-dark tracking-[-0.06em] leading-none">{pod.reputationScore}</p>
                </div>
              )}
            </div>
          </div>

          {pod.description && <p className="text-[13.5px] font-light text-[#888] leading-relaxed mb-4">{pod.description}</p>}

          <div className="flex flex-wrap gap-1.5">
            {pod.roles?.map(r => (
              <span key={r} className="font-mono text-[10px] text-[#999] border border-black/[0.1] rounded-full px-2.5 py-[3px] bg-black/[0.02]">{r}</span>
            ))}
            <span className="font-mono text-[10px] text-[#BBB] border border-black/[0.07] rounded-full px-2.5 py-[3px]">
              Max {pod.maxMembers ?? 5} members
            </span>
          </div>
        </div>

        {/* Section tab nav */}
        <div className="flex items-center gap-1 border-b border-black/[0.06] -mt-2 mb-6" style={{ animation: 'up 0.5s 0.04s cubic-bezier(0.22,1,0.36,1) both' }}>
          {[
            { key: 'pod', label: 'Pod', icon: 'bi-people' },
            { key: 'deals', label: 'Deals', icon: 'bi-briefcase' },
            { key: 'notifications', label: 'Notifications', icon: 'bi-bell' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase px-4 py-3 border-b-2 transition-all bg-transparent cursor-pointer ${
                activeTab === tab.key
                  ? 'border-green-dark text-green-dark'
                  : 'border-transparent text-[#AAA] hover:text-ink'
              }`}
            >
              <i className={`bi ${tab.icon} text-[11px]`} />
              {tab.label}
              {tab.key === 'notifications' && podNotifications.filter(n => !n.read).length > 0 && (
                <span className="bg-green-dark text-ink font-bold rounded-full px-1.5 py-px text-[8px] ml-0.5">
                  {podNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Deals tab content */}
        {activeTab === 'deals' && (
          <div style={{ animation: 'up 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            {/* Deal status filter */}
            <div className="flex items-center gap-2 mb-4">
              {[
                { key: 'pending', label: 'Pending', color: '#F59E0B' },
                { key: 'active', label: 'Active', color: '#1DC433' },
                { key: 'completed', label: 'Completed', color: '#3B82F6' },
              ].map(f => {
                const count = podDeals.filter(d => (d.status ?? 'active') === f.key).length
                return (
                  <button
                    key={f.key}
                    onClick={() => setDealFilter(f.key)}
                    className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[0.07em] uppercase border rounded-full px-3 py-1.5 cursor-pointer transition-all bg-transparent ${
                      dealFilter === f.key
                        ? 'bg-ink text-paper border-transparent'
                        : 'text-[#888] border-black/[0.09] hover:border-black/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
                    {f.label}
                    <span className="opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>

            {podDeals.filter(d => (d.status ?? 'active') === dealFilter).length === 0 ? (
              <div className="bg-white border border-black/[0.07] rounded-[14px] px-8 py-12 text-center">
                <img src="/images/deals-icon.png" alt="" className="w-16 h-16 object-contain mx-auto mb-2 opacity-70 mix-blend-multiply" />
                <p className="font-serif text-[18px] font-light text-ink mb-1">No {dealFilter} deals</p>
                <p className="text-[13px] font-light text-[#AAA]">
                  {dealFilter === 'pending' ? 'Deals awaiting confirmation will appear here.' :
                   dealFilter === 'active' ? 'Active in-progress deals will appear here.' :
                   'Completed deals will show here after work is approved.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {podDeals.filter(d => (d.status ?? 'active') === dealFilter).map((deal, i) => (
                  <Link key={deal.id ?? i} href={`/marketplace/${deal.id}`}>
                    <div className="bg-white border border-black/[0.07] rounded-[14px] px-5 py-4 hover:border-black/[0.14] hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em] truncate">{deal.title ?? 'Untitled Deal'}</p>
                        <p className="text-[12px] font-light text-[#AAA] mt-0.5">{deal.category ?? 'Deal'} · {deal.timeline ?? 'No timeline'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-serif text-[18px] font-light text-green-dark tracking-[-0.04em]">${(deal.budgetUsd ?? 0).toLocaleString()}</p>
                        <p className="font-mono text-[9px] text-[#AAA] tracking-[0.06em] uppercase mt-0.5">
                          {dealFilter === 'pending' ? 'Pending' : dealFilter === 'active' ? 'In progress' : 'Completed'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications tab content */}
        {activeTab === 'notifications' && (
          <div style={{ animation: 'up 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden">
              {podNotifications.length === 0 ? (
                <div className="px-6 py-12 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F4F4F2] flex items-center justify-center mb-3">
                    <i className="bi bi-bell text-[20px] text-[#CCC]" />
                  </div>
                  <p className="font-serif text-[17px] font-light text-ink mb-1">No notifications</p>
                  <p className="text-[13px] font-light text-[#AAA]">Deal updates, work approvals, and ratings will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.05]">
                  {podNotifications.map((n, i) => {
                    const icons = {
                      job_assigned: { icon: 'bi-briefcase', color: '#1DC433' },
                      work_approved: { icon: 'bi-patch-check', color: '#1DC433' },
                      funds_released: { icon: 'bi-cash-coin', color: '#1DC433' },
                      rating_received: { icon: 'bi-star-fill', color: '#F59E0B' },
                      dispute_opened: { icon: 'bi-exclamation-triangle', color: '#EF4444' },
                    }
                    const cfg = icons[n.type] ?? { icon: 'bi-bell', color: '#AAA' }
                    return (
                      <div key={n.id ?? i} className={`flex items-start gap-4 px-6 py-5 transition-colors ${!n.read ? 'bg-[#F9FFF9]' : 'hover:bg-[#FAFAFA]'}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.color + '15' }}>
                          <i className={`bi ${cfg.icon} text-[13px]`} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13.5px] leading-snug ${!n.read ? 'font-medium text-ink' : 'font-light text-[#555]'}`}>{n.title}</p>
                          {n.body && <p className="text-[12px] font-light text-[#888] mt-0.5">{n.body}</p>}
                          <p className="font-mono text-[10px] text-[#CCC] mt-1">{new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-green-dark flex-shrink-0 mt-2" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pod tab content — original sections, gated by tab */}
        {activeTab === 'pod' && <>

        {/* Dissolved banner */}
        {pod.status === 'dissolved' && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-[14px] px-6 py-5">
            <i className="bi bi-x-circle text-red-400 text-[18px] flex-shrink-0" />
            <div>
              <p className="font-sans text-[14px] font-medium text-red-500">This pod has been dissolved.</p>
              <p className="text-[12.5px] font-light text-red-400 mt-0.5">PoP records are preserved on-chain.</p>
            </div>
          </div>
        )}

        <div style={{ animation: 'up 0.5s 0.06s cubic-bezier(0.22,1,0.36,1) both' }}>
          <MembersSection
            members={members}
            splits={splits}
            isAdmin={isAdmin}
            projectAssigned={projectAssigned}
            currentUserId={currentUser?.id}
            onRemove={handleRemoveMember}
            removing={removing}
          />
        </div>

        {splits.length > 0 && (
          <div style={{ animation: 'up 0.5s 0.09s cubic-bezier(0.22,1,0.36,1) both' }}>
            <SplitDisplaySection splits={splits} podStatus={pod.status} />
          </div>
        )}

        <div style={{ animation: 'up 0.5s 0.12s cubic-bezier(0.22,1,0.36,1) both' }}>
          <SplitChatSection podId={podId} podStatus={pod.status} />
        </div>

        {['active', 'submitted', 'reviewing', 'approved', 'claimable', 'completed'].includes(pod.status) && (
          <div style={{ animation: 'up 0.5s 0.15s cubic-bezier(0.22,1,0.36,1) both' }}>
            <WorkCompletionSection
              podStatus={pod.status}
              isAdmin={isAdmin}
              podId={podId}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}

        {pod.status === 'claimable' && mySplit != null && (
          <div style={{ animation: 'up 0.5s 0.18s cubic-bezier(0.22,1,0.36,1) both' }}>
            <ClaimSection
              podId={podId}
              mySplit={mySplit}
              walletAddress={walletAddress}
              isConnected={isConnected}
              onClaimed={() => handleStatusChange('completed')}
            />
          </div>
        )}

        <div style={{ animation: 'up 0.5s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}>
          <PoPSection pod={pod} currentUserId={currentUser?.id} />
        </div>

        {canDissolve && (
          <div style={{ animation: 'up 0.5s 0.22s cubic-bezier(0.22,1,0.36,1) both' }}>
            <DissolveSection podId={podId} onDissolved={handleDissolved} />
          </div>
        )}

        </> /* end pod tab */}
      </div>
    </div>
  )
}
