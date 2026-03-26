'use client'

/**
 * Work3 Labs — Pod Detail
 *
 * Route: /pod/[id]
 *
 * Sections:
 *  1. Pod header (name, status, roles, PoP score)
 *  2. Members list (Pod Admin can remove if project not yet assigned)
 *  3. Split negotiation (% input per member + chat)
 *  4. Work completion — "Notify project" button (pod admin only)
 *  5. Claim split — shown when status = claimable
 *  6. PoP records panel
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWallet } from '@/hooks/useWallet'
import {
  fetchPod, fetchProfile, removeMember,
  proposeSplit, fetchSplitChat, sendSplitMessage,
  notifyWorkComplete, claimSplit,
} from '@/services/api'

//Status config
const STATUS = {
  forming:   { label: 'Forming',    color: '#F59E0B', icon: 'bi-people'           },
  active:    { label: 'Active',     color: '#1DC433', icon: 'bi-lightning-charge'  },
  submitted: { label: 'Submitted',  color: '#3B82F6', icon: 'bi-send-check'        },
  reviewing: { label: 'Reviewing',  color: '#8B5CF6', icon: 'bi-hourglass-split'   },
  approved:  { label: 'Approved',   color: '#1DC433', icon: 'bi-patch-check'       },
  claimable: { label: 'Claimable',  color: '#2DFC44', icon: 'bi-cash-coin'         },
  completed: { label: 'Completed',  color: '#AAA',    icon: 'bi-check-circle'      },
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

//Section wrapper 
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

//Members section 
function MembersSection({ members, isAdmin, projectAssigned, currentUserId, onRemove, removing }) {
  return (
    <Section title="Members" tag="Pod">
      <div className="divide-y divide-black/[0.05]">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-3 px-6 py-4">
            <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[12px] text-paper">{m.displayName?.[0]?.toUpperCase() ?? '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[13.5px] font-medium text-ink tracking-[-0.01em] truncate">
                {m.displayName}
                {m.id === currentUserId && <span className="font-mono text-[9px] text-[#CCC] ml-1.5 tracking-[0.06em]">you</span>}
              </p>
              <p className="font-mono text-[10px] text-[#AAA] tracking-[0.04em] truncate">{m.role ?? 'Member'}</p>
            </div>

            {/* Reputation badge */}
            {m.reputationScore != null && (
              <div className="flex items-center gap-1 border border-black/[0.08] rounded-full px-2.5 py-1">
                <i className="bi bi-star-fill text-[9px] text-green-dark" />
                <span className="font-mono text-[10px] text-ink">{m.reputationScore}</span>
              </div>
            )}

            {/* PoP count */}
            {m.popCount != null && (
              <div className="flex items-center gap-1 border border-black/[0.08] rounded-full px-2.5 py-1">
                <i className="bi bi-patch-check-fill text-[9px] text-[#3B82F6]" />
                <span className="font-mono text-[10px] text-ink">{m.popCount}</span>
              </div>
            )}

            {/* Pod admin badge */}
            {m.isAdmin && (
              <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-green-dark border border-green-dark/20 bg-green-dark/5 rounded-full px-2 py-0.5">
                Admin
              </span>
            )}

            {/* Remove button — admin only, not self, no project assigned */}
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
        ))}

        {members.length === 0 && (
          <p className="px-6 py-6 text-[13px] font-light text-[#CCC]">No members yet.</p>
        )}
      </div>
    </Section>
  )
}

// Split negotiation 
function SplitSection({ members, isAdmin, podStatus, podId }) {
  const [splits,    setSplits]    = useState({})
  const [messages,  setMessages]  = useState([])
  const [msgInput,  setMsgInput]  = useState('')
  const [sending,   setSending]   = useState(false)
  const [proposing, setProposing] = useState(false)
  const [splitErr,  setSplitErr]  = useState('')
  const [splitOk,   setSplitOk]   = useState(false)
  const chatEndRef = useRef(null)

  const locked = ['submitted','reviewing','approved','claimable','completed'].includes(podStatus)

  useEffect(() => {
    fetchSplitChat(podId).then(({ data }) => {
      if (data?.messages) setMessages(data.messages)
    })
  }, [podId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Init splits equal on mount
  useEffect(() => {
    if (members.length === 0) return
    const equal = Math.floor(100 / members.length)
    const rem   = 100 - equal * members.length
    const init  = {}
    members.forEach((m, i) => { init[m.id] = equal + (i === 0 ? rem : 0) })
    setSplits(init)
  }, [members])

  const total = Object.values(splits).reduce((a, v) => a + (Number(v) || 0), 0)
  const valid = total === 100 && Object.values(splits).every(v => Number(v) >= 0)

  function updateSplit(id, val) {
    setSplits(s => ({ ...s, [id]: val === '' ? '' : Math.max(0, Math.min(100, parseInt(val) || 0)) }))
    setSplitErr('')
    setSplitOk(false)
  }

  async function handlePropose() {
    if (!valid) { setSplitErr('Splits must add up to exactly 100%'); return }
    setProposing(true)
    const { error } = await proposeSplit(podId, members.map(m => ({ memberId: m.id, percentage: Number(splits[m.id]) })))
    setProposing(false)
    if (error) { setSplitErr(error); return }
    setSplitOk(true)
    setSplitErr('')
  }

  async function handleSendMessage() {
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

  function handleMsgKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  return (
    <Section title="Fund Split" tag="Negotiation">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/[0.05]">

        {/* Split inputs */}
        <div className="px-6 py-5">
          <p className="text-[12.5px] font-light text-[#888] mb-4 leading-relaxed">
            Agree on how the project payment will be split. Total must equal 100%.
          </p>

          <div className="space-y-3 mb-4">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-[10px] text-paper">{m.displayName?.[0]?.toUpperCase() ?? '?'}</span>
                </div>
                <p className="flex-1 font-sans text-[13px] font-light text-ink truncate">{m.displayName}</p>
                <div className="flex items-center gap-1 border border-black/[0.09] rounded-[8px] overflow-hidden focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all">
                  <input
                    type="number"
                    min="0" max="100"
                    value={splits[m.id] ?? ''}
                    onChange={e => updateSplit(m.id, e.target.value)}
                    disabled={locked}
                    className="w-[52px] font-mono text-[13px] text-ink text-right px-2 py-1.5 outline-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="font-mono text-[11px] text-[#CCC] pr-2">%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total bar */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#CCC]">Total</span>
            <span className={`font-mono text-[13px] font-medium ${total === 100 ? 'text-green-dark' : total > 100 ? 'text-red-400' : 'text-[#AAA]'}`}>
              {total}%
            </span>
          </div>
          <div className="h-1.5 bg-[#F0F0EE] rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(total, 100)}%`,
                background: total === 100 ? '#1DC433' : total > 100 ? '#EF4444' : '#F59E0B',
              }}
            />
          </div>

          {splitErr && (
            <p className="text-[12px] text-red-500 font-light flex items-center gap-1.5 mb-3">
              <i className="bi bi-exclamation-circle text-[11px]" />{splitErr}
            </p>
          )}
          {splitOk && (
            <p className="text-[12px] text-green-dark font-light flex items-center gap-1.5 mb-3">
              <i className="bi bi-check-circle text-[11px]" />Split proposed to all members.
            </p>
          )}

          {!locked && (
            <button
              onClick={handlePropose}
              disabled={proposing || !valid}
              className="w-full flex items-center justify-center gap-2 bg-ink text-paper py-3 rounded-[10px] font-sans text-[13.5px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {proposing ? <><Spinner size={15} />Proposing…</> : <><i className="bi bi-send text-[13px]" />Propose split</>}
            </button>
          )}

          {locked && (
            <div className="flex items-center gap-2 text-[12px] font-light text-[#AAA]">
              <i className="bi bi-lock text-[11px]" />Split locked — work submitted
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex flex-col">
          <div className="flex-1 px-5 py-4 space-y-3 max-h-[280px] overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-[12.5px] font-light text-[#CCC] text-center py-6">
                Discuss the split here with your pod.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                {!msg.isOwn && (
                  <span className="font-mono text-[9px] text-[#CCC] mb-1 tracking-[0.06em]">{msg.senderName}</span>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-[10px] text-[13px] font-light leading-relaxed ${
                    msg.isOwn
                      ? 'bg-ink text-paper rounded-br-[3px]'
                      : 'bg-[#F4F4F2] text-ink rounded-bl-[3px]'
                  }`}
                >
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
              type="text"
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={handleMsgKeyDown}
              placeholder="Message your pod…"
              className="flex-1 font-sans text-[13px] font-light text-ink bg-[#F7F7F5] border border-black/[0.07] rounded-[8px] px-3 py-2 outline-none focus:border-[#1DC433] transition-colors placeholder-[#CCC]"
            />
            <button
              onClick={handleSendMessage}
              disabled={!msgInput.trim() || sending}
              className="w-9 h-9 flex items-center justify-center bg-ink text-paper rounded-[8px] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? <Spinner size={14} /> : <i className="bi bi-send text-[12px]" />}
            </button>
          </div>
        </div>
      </div>
    </Section>
  )
}

//Work completion section
function WorkCompletionSection({ podStatus, isAdmin, podId, onStatusChange }) {
  const [notifying, setNotifying]   = useState(false)
  const [notifyDone, setNotifyDone] = useState(false)
  const [error,      setError]      = useState('')

  async function handleNotify() {
    if (notifying) return
    setNotifying(true); setError('')
    const { error } = await notifyWorkComplete(podId)
    setNotifying(false)
    if (error) { setError(error); return }
    setNotifyDone(true)
    onStatusChange('submitted')
  }

  const canNotify  = podStatus === 'active'  && isAdmin
  const submitted  = ['submitted','reviewing'].includes(podStatus)
  const approved   = podStatus === 'approved'
  const claimable  = podStatus === 'claimable'
  const completed  = podStatus === 'completed'

  return (
    <Section title="Work Status" tag="Delivery">
      <div className="px-6 py-6 space-y-4">

        {/* Timeline */}
        <div className="space-y-0">
          {[
            { key: 'active',    label: 'Work in progress',             done: ['submitted','reviewing','approved','claimable','completed'].includes(podStatus) || podStatus === 'active' },
            { key: 'submitted', label: 'Pod notified project complete', done: ['submitted','reviewing','approved','claimable','completed'].includes(podStatus) },
            { key: 'reviewing', label: 'Project reviewing delivery',    done: ['approved','claimable','completed'].includes(podStatus) },
            { key: 'approved',  label: 'Project satisfied — notified admin', done: ['claimable','completed'].includes(podStatus) },
            { key: 'claimable', label: 'Admin released escrow',         done: ['claimable','completed'].includes(podStatus) },
            { key: 'completed', label: 'All splits claimed',            done: podStatus === 'completed' },
          ].map((step, i) => {
            const isCurrent = podStatus === step.key
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.done
                        ? 'bg-green-dark border-green-dark'
                        : isCurrent
                        ? 'border-[#1DC433] bg-white'
                        : 'border-[#E5E5E5] bg-white'
                    }`}
                  >
                    {step.done
                      ? <i className="bi bi-check text-paper text-[11px]" />
                      : isCurrent
                      ? <span className="w-2 h-2 rounded-full bg-green-dark pdot-blink" />
                      : <span className="w-2 h-2 rounded-full bg-[#E5E5E5]" />
                    }
                  </div>
                  {i < 5 && <div className={`w-px h-6 ${step.done ? 'bg-green-dark/30' : 'bg-[#E5E5E5]'}`} />}
                </div>
                <p className={`pt-0.5 pb-3 text-[13px] font-light leading-snug ${
                  step.done ? 'text-ink' : isCurrent ? 'text-ink font-medium' : 'text-[#CCC]'
                }`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Action */}
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
            <p className="text-[11.5px] font-light text-[#CCC] mt-2">Only the Pod Admin can submit this notification.</p>
          </div>
        )}

        {(submitted || notifyDone) && (
          <div className="flex items-center gap-3 bg-[#EFF6FF] border border-blue-100 rounded-[10px] px-4 py-3.5">
            <i className="bi bi-hourglass-split text-[#3B82F6] text-[15px] flex-shrink-0" />
            <p className="text-[13px] font-light text-[#3B82F6] leading-snug">
              Project notified. Awaiting their review and confirmation to admin.
            </p>
          </div>
        )}

        {approved && (
          <div className="flex items-center gap-3 bg-[#F4FAF7] border border-green-dark/15 rounded-[10px] px-4 py-3.5">
            <i className="bi bi-patch-check text-green-dark text-[15px] flex-shrink-0" />
            <p className="text-[13px] font-light text-green-dark leading-snug">
              Project approved delivery. Admin is releasing escrow funds.
            </p>
          </div>
        )}

        {completed && (
          <div className="flex items-center gap-3 bg-[#F4F4F2] border border-black/[0.07] rounded-[10px] px-4 py-3.5">
            <i className="bi bi-check-circle text-[#AAA] text-[15px] flex-shrink-0" />
            <p className="text-[13px] font-light text-[#888] leading-snug">
              This engagement is complete. PoP records have been generated.
            </p>
          </div>
        )}
      </div>
    </Section>
  )
}

// Claim section
function ClaimSection({ podId, mySplit, walletAddress, isConnected, onClaimed }) {
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')

  async function handleClaim() {
    if (!isConnected || !walletAddress) {
      setError('Connect your wallet first — go to Profile to connect.')
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
        <p className="text-[13px] font-light text-[#888]">Funds sent to your wallet.</p>
      </div>
    )
  }

  return (
    <Section title="Claim Your Split" tag="Earnings">
      <div className="px-6 py-6 space-y-4">
        <div className="bg-[#F4FAF7] border border-green-dark/15 rounded-[12px] px-5 py-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#AAA] mb-1">Your split</p>
            <p className="font-serif text-[34px] font-light text-green-dark tracking-[-0.06em] leading-none">
              {mySplit ?? '—'}%
            </p>
          </div>
          <i className="bi bi-cash-coin text-green-dark text-[28px] opacity-30" />
        </div>

        {!isConnected && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-[10px] px-4 py-3.5">
            <i className="bi bi-wallet2 text-amber-500 text-[14px] flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] font-light text-amber-700 leading-snug">
              No wallet connected.{' '}
              <Link href="/profile" className="underline underline-offset-2 font-medium">Go to Profile</Link>
              {' '}to connect your wallet before claiming.
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
          {claiming
            ? <><Spinner size={15} />Claiming…</>
            : <><i className="bi bi-cash-coin text-[15px]" />Claim split</>
          }
        </button>

        <p className="text-[11.5px] font-light text-[#CCC]">
          Funds will be sent directly to your connected wallet.
        </p>
      </div>
    </Section>
  )
}

//PoP records section
function PoPSection({ pod }) {
  const records = pod.popRecords ?? []

  return (
    <Section title="Proof-of-Performance" tag="Reputation">
      {records.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-[13px] font-light text-[#CCC]">
            PoP records are generated when this pod completes and delivers verified work.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.05]">
          {records.map((rec, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA]">{rec.workType}</span>
                <div className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.1em] uppercase text-green-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-dark" />
                  Verified
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Milestones', rec.milestones],
                  ['Delivery',   rec.delivery],
                  ['Chain',      rec.chainAnchor],
                  ['Score',      rec.score],
                ].map(([k, v]) => v != null && (
                  <div key={k}>
                    <p className="font-mono text-[9px] text-[#CCC] tracking-[0.08em] mb-0.5">{k}</p>
                    <p className={`font-mono text-[12px] ${k === 'Score' ? 'text-green-dark font-medium' : 'text-ink'}`}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pod reputation score */}
      {pod.reputationScore != null && (
        <div className="px-6 py-4 border-t border-black/[0.05] flex items-center justify-between">
          <span className="text-[13px] font-light text-[#888]">Pod reputation score</span>
          <span className="font-serif text-[28px] font-light text-green-dark tracking-[-0.06em] leading-none">
            {pod.reputationScore}
          </span>
        </div>
      )}
    </Section>
  )
}

//Main
export default function PodDetailClient({ podId }) {
  const router = useRouter()
  const { address: walletAddress, isConnected } = useWallet()
  const [pod, setPod] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    Promise.all([fetchPod(podId), fetchProfile()])
      .then(([podRes, profileRes]) => {
        if (podRes.data)     setPod(podRes.data)
        if (profileRes.data) setCurrentUser(profileRes.data)
      })
      .finally(() => setLoading(false))
  }, [podId])

  async function handleRemoveMember(memberId) {
    setRemoving(memberId)
    const { error } = await removeMember(podId, memberId)
    setRemoving(null)
    if (!error) {
      setPod(p => ({ ...p, members: p.members.filter(m => m.id !== memberId) }))
    }
  }

  function handleStatusChange(newStatus) {
    setPod(p => ({ ...p, status: newStatus }))
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
  const myMember = members.find(m => m.id === currentUser?.id)
  const mySplit = myMember?.splitPercentage ?? null

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[800px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors"
          >
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] truncate max-w-[200px]">{pod.name}</span>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-5">

        {/* Pod header */}
        <div style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="font-serif text-[26px] sm:text-[32px] font-light tracking-[-0.04em] text-ink mb-1">
                {pod.name}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] tracking-[0.1em] uppercase flex items-center gap-1.5"
                  style={{ color: status.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full pdot-blink" style={{ background: status.color }} />
                  {status.label}
                </span>
                {isAdmin && (
                  <>
                    <span className="text-[#E0E0E0]">·</span>
                    <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-green-dark">You're the admin</span>
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

          {pod.description && (
            <p className="text-[13.5px] font-light text-[#888] leading-relaxed mb-4">{pod.description}</p>
          )}

          {/* Roles */}
          {pod.roles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pod.roles.map(r => (
                <span key={r} className="font-mono text-[10px] text-[#999] border border-black/[0.1] rounded-full px-2.5 py-[3px] bg-black/[0.02]">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div style={{ animation: 'up 0.5s 0.06s cubic-bezier(0.22,1,0.36,1) both' }}>
          <MembersSection
            members={members}
            isAdmin={isAdmin}
            projectAssigned={projectAssigned}
            currentUserId={currentUser?.id}
            onRemove={handleRemoveMember}
            removing={removing}
          />
        </div>

        {/* Split negotiation — shown once pod is forming or active */}
        {['forming','active','submitted','reviewing'].includes(pod.status) && members.length > 0 && (
          <div style={{ animation: 'up 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}>
            <SplitSection
              members={members}
              isAdmin={isAdmin}
              podStatus={pod.status}
              podId={podId}
            />
          </div>
        )}

        {/* Work completion */}
        {['active','submitted','reviewing','approved','claimable','completed'].includes(pod.status) && (
          <div style={{ animation: 'up 0.5s 0.14s cubic-bezier(0.22,1,0.36,1) both' }}>
            <WorkCompletionSection
              podStatus={pod.status}
              isAdmin={isAdmin}
              podId={podId}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}

        {/* Claim — shown when escrow released */}
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

        {/* PoP */}
        <div style={{ animation: 'up 0.5s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}>
          <PoPSection pod={pod} />
        </div>
      </div>
    </div>
  )
}