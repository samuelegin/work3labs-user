'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPod } from '@/services/api'

const MIN_MEMBERS = 2
const MAX_MEMBERS = 5

const SUGGESTED_ROLES = [
  'Community Lead', 'Content Strategist', 'Growth Analyst', 'Social Manager',
  'Lead Engineer', 'Smart Contract Dev', 'DevOps', 'QA',
  'Art Director', 'UI Designer', 'Motion Designer',
  'Strategist', 'BD Lead', 'Research Analyst', 'Writer',
  'Project Manager', 'Marketing Lead', 'Developer Relations',
]

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

function SectionHeader({ n, title, sub }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <span className="font-mono text-[10px] tracking-[0.1em] text-[#CCC] mt-0.5 flex-shrink-0">{n}</span>
      <div>
        <p className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em]">{title}</p>
        {sub && <p className="text-[12px] font-light text-[#AAA] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function CreatePodClient() {
  const router = useRouter()
  const roleRef = useRef(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxMembers, setMaxMembers] = useState(MAX_MEMBERS)
  const [roles, setRoles] = useState([])
  const [roleInput, setRoleInput] = useState('')
  const [splits, setSplits] = useState([{ role: '', percentage: 100 }])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function addRole(label) {
    const clean = label.trim()
    if (!clean || roles.length >= maxMembers) return
    if (roles.find(r => r.toLowerCase() === clean.toLowerCase())) return
    const newRoles = [...roles, clean]
    setRoles(newRoles)
    setRoleInput('')
    // Keep splits in sync with roles — one split row per role
    const equal = Math.floor(100 / newRoles.length)
    const rem = 100 - equal * newRoles.length
    setSplits(newRoles.map((r, i) => ({ role: r, percentage: equal + (i === 0 ? rem : 0) })))
    setErrors(e => ({ ...e, roles: null, splits: null }))
    roleRef.current?.focus()
  }

  function removeRole(label) {
    const newRoles = roles.filter(r => r !== label)
    setRoles(newRoles)
    if (newRoles.length === 0) { setSplits([{ role: '', percentage: 100 }]); return }
    const equal = Math.floor(100 / newRoles.length)
    const rem = 100 - equal * newRoles.length
    setSplits(newRoles.map((r, i) => ({ role: r, percentage: equal + (i === 0 ? rem : 0) })))
  }

  function handleRoleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addRole(roleInput) }
    if (e.key === 'Backspace' && !roleInput && roles.length) removeRole(roles[roles.length - 1])
  }

  function updateSplit(index, val) {
    const n = val === '' ? '' : Math.max(0, Math.min(100, parseInt(val) || 0))
    setSplits(s => s.map((x, i) => i === index ? { ...x, percentage: n } : x))
    setErrors(e => ({ ...e, splits: null }))
  }

  function handleMaxMembersChange(val) {
    const n = Math.max(MIN_MEMBERS, Math.min(MAX_MEMBERS, parseInt(val) || MIN_MEMBERS))
    setMaxMembers(n)
    // Trim roles if they exceed new max
    if (roles.length > n) {
      const trimmed = roles.slice(0, n)
      setRoles(trimmed)
      const equal = Math.floor(100 / trimmed.length)
      const rem = 100 - equal * trimmed.length
      setSplits(trimmed.map((r, i) => ({ role: r, percentage: equal + (i === 0 ? rem : 0) })))
    }
  }

  const splitTotal = splits.reduce((a, s) => a + (Number(s.percentage) || 0), 0)
  const splitValid = splitTotal === 100 && splits.every(s => Number(s.percentage) >= 0)

  // Pod is matchable only when split is set and valid
  const isMatchable = roles.length >= 1 && splitValid

  function validate() {
    const next = {}
    if (!name.trim()) next.name = 'Pod name is required'
    else if (name.trim().length < 3) next.name = 'Must be at least 3 characters'
    if (!description.trim()) next.description = 'Description is required'
    else if (description.trim().length < 20) next.description = 'Please add more detail (min 20 chars)'
    if (roles.length === 0) next.roles = 'Add at least one role'
    if (!splitValid) next.splits = 'Split percentages must add up to exactly 100%'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (submitting || !validate()) return
    setSubmitting(true)
    setErrors(prev => ({ ...prev, server: null }))

    const { data, error } = await createPod({
      name: name.trim(),
      description: description.trim(),
      maxMembers,
      roles,
      splits: splits.map(s => ({ role: s.role, percentage: Number(s.percentage) })),
    })

    if (error) { setErrors({ server: error }); setSubmitting(false); return }
    router.push(`/pod/${data.id ?? data.podId}`)
  }

  const available = SUGGESTED_ROLES.filter(r => !roles.find(x => x.toLowerCase() === r.toLowerCase()))

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[680px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">New pod</span>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-10" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] block mb-3">Pod Formation</span>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-light tracking-[-0.04em] text-ink mb-2">Create a Talent Pod</h1>
          <p className="text-[14px] font-light text-[#888] leading-relaxed max-w-[480px]">
            You become Pod Admin. Set roles, member cap, and the fund split — a pod needs a confirmed split before it can be matched to a job.
          </p>
        </div>

        <div className="space-y-5" style={{ animation: 'up 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both' }}>

          {/* Section 1 — Identity */}
          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] px-7 py-7">
            <SectionHeader n="01" title="Pod identity" />

            {errors.server && (
              <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5 mb-5">
                <i className="bi bi-exclamation-circle text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-600 font-light">{errors.server}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="pod-name" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Pod name</label>
                  <span className="font-mono text-[10px] text-[#CCC]">{name.length}/60</span>
                </div>
                <input
                  id="pod-name" type="text" value={name} autoFocus maxLength={60}
                  onChange={e => { setName(e.target.value.slice(0, 60)); setErrors(err => ({ ...err, name: null })) }}
                  placeholder="e.g. Growth Alpha Pod"
                  className={inputCls(Boolean(errors.name))}
                />
                {errors.name && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.name}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="pod-desc" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Description</label>
                  <span className="font-mono text-[10px] text-[#CCC]">{description.length}/400</span>
                </div>
                <textarea
                  id="pod-desc" value={description} maxLength={400} rows={3}
                  onChange={e => { setDescription(e.target.value.slice(0, 400)); setErrors(err => ({ ...err, description: null })) }}
                  placeholder="What kind of work does this pod execute?"
                  className={`${inputCls(Boolean(errors.description))} resize-none leading-relaxed`}
                />
                {errors.description && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Section 2 — Team setup */}
          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] px-7 py-7">
            <SectionHeader n="02" title="Team setup" sub={`Min ${MIN_MEMBERS} members · Max ${MAX_MEMBERS} members`} />

            <div className="space-y-5">
              {/* Max members slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Maximum members</label>
                  <span className="font-mono text-[13px] font-medium text-ink">{maxMembers}</span>
                </div>
                <input
                  type="range" min={MIN_MEMBERS} max={MAX_MEMBERS} value={maxMembers}
                  onChange={e => handleMaxMembersChange(e.target.value)}
                  className="w-full accent-ink h-1.5 rounded-full bg-[#E5E5E5] cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  {[2, 3, 4, 5].map(n => (
                    <span key={n} className={`font-mono text-[9px] ${n === maxMembers ? 'text-ink font-medium' : 'text-[#CCC]'}`}>{n}</span>
                  ))}
                </div>
              </div>

              {/* Roles */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Roles needed</label>
                  <span className="font-mono text-[10px] text-[#CCC]">{roles.length}/{maxMembers}</span>
                </div>
                <p className="text-[11.5px] text-[#BBB] font-light mb-2">Type and press Enter. Each role = one seat in the pod.</p>
                <div
                  className={`min-h-[46px] flex flex-wrap gap-1.5 items-center border rounded-[10px] px-3 py-2 transition-all cursor-text ${
                    errors.roles
                      ? 'border-red-300 focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]'
                      : 'border-black/[0.09] focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)]'
                  }`}
                  onClick={() => roleRef.current?.focus()}
                >
                  {roles.map(r => (
                    <span key={r} className="flex items-center gap-1 font-mono text-[10.5px] text-ink border border-black/[0.12] bg-[#F4F4F2] rounded-full px-2.5 py-[3px] flex-shrink-0">
                      {r}
                      <button type="button" onClick={e => { e.stopPropagation(); removeRole(r) }}
                        className="ml-0.5 text-[#AAA] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0 leading-none">
                        <i className="bi bi-x text-[11px]" />
                      </button>
                    </span>
                  ))}
                  {roles.length < maxMembers && (
                    <input
                      ref={roleRef} type="text" value={roleInput}
                      onChange={e => setRoleInput(e.target.value)}
                      onKeyDown={handleRoleKeyDown}
                      placeholder={roles.length === 0 ? 'e.g. Community Lead…' : ''}
                      className="flex-1 min-w-[100px] font-sans text-[13.5px] font-light text-ink bg-transparent outline-none placeholder-[#D0D0D0]"
                    />
                  )}
                </div>
                {errors.roles && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.roles}</p>}

                {available.length > 0 && roles.length < maxMembers && (
                  <div className="mt-3">
                    <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#CCC] mb-2">Quick add</p>
                    <div className="flex flex-wrap gap-1.5">
                      {available.slice(0, 10).map(r => (
                        <button key={r} type="button" onClick={() => addRole(r)}
                          className="font-mono text-[10px] text-[#999] border border-black/[0.09] hover:border-black/[0.2] hover:text-ink hover:bg-black/[0.02] rounded-full px-2.5 py-[3px] cursor-pointer bg-transparent transition-all">
                          + {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3 — Fund split */}
          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] px-7 py-7">
            <SectionHeader
              n="03"
              title="Fund split"
              sub="Set at creation. Pod cannot be matched to a job until split totals 100%."
            />

            {roles.length === 0 ? (
              <div className="flex items-center gap-3 bg-[#FAFAF8] border border-black/[0.07] rounded-[10px] px-4 py-4">
                <i className="bi bi-info-circle text-[#CCC] text-[15px] flex-shrink-0" />
                <p className="text-[12.5px] font-light text-[#AAA]">Add roles above — one split row will appear per role.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {splits.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                        <span className="font-mono text-[10px] text-paper">{(s.role[0] ?? '?').toUpperCase()}</span>
                      </div>
                      <p className="flex-1 font-sans text-[13px] font-light text-ink truncate">{s.role || `Slot ${i + 1}`}</p>
                      <div className="flex items-center gap-1 border border-black/[0.09] rounded-[8px] overflow-hidden focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all">
                        <input
                          type="number" min="0" max="100"
                          value={s.percentage}
                          onChange={e => updateSplit(i, e.target.value)}
                          className="w-[52px] font-mono text-[13px] text-ink text-right px-2 py-1.5 outline-none bg-transparent"
                        />
                        <span className="font-mono text-[11px] text-[#CCC] pr-2">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PoP mint fee note */}
                <div className="flex items-start gap-2 bg-[#F4FAF7] border border-green-dark/15 rounded-[10px] px-4 py-3">
                  <i className="bi bi-patch-check-fill text-green-dark text-[13px] flex-shrink-0 mt-0.5" />
                  <p className="text-[11.5px] font-light text-[#666] leading-relaxed">
                    A PoP badge mint fee (~$0.05 on Base) is deducted from the split before distribution. Each member and the pod itself receive a badge per completed job.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#CCC]">Total</span>
                  <span className={`font-mono text-[13px] font-medium ${splitTotal === 100 ? 'text-green-dark' : splitTotal > 100 ? 'text-red-400' : 'text-[#AAA]'}`}>
                    {splitTotal}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#F0F0EE] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(splitTotal, 100)}%`,
                      background: splitTotal === 100 ? '#1DC433' : splitTotal > 100 ? '#EF4444' : '#F59E0B',
                    }}
                  />
                </div>

                {errors.splits && <p className="text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.splits}</p>}

                {/* Matchability indicator */}
                <div className={`flex items-center gap-2 rounded-[10px] px-4 py-3 border ${
                  isMatchable
                    ? 'bg-[#F4FAF7] border-green-dark/15'
                    : 'bg-[#FAFAF8] border-black/[0.07]'
                }`}>
                  <i className={`text-[13px] flex-shrink-0 ${isMatchable ? 'bi bi-check-circle-fill text-green-dark' : 'bi bi-x-circle text-[#CCC]'}`} />
                  <p className={`text-[12px] font-light ${isMatchable ? 'text-green-dark' : 'text-[#AAA]'}`}>
                    {isMatchable ? 'Pod is ready to be matched to a job.' : 'Pod cannot be matched until split equals 100%.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Admin notice */}
          <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-4 flex items-start gap-3">
            <i className="bi bi-shield-check text-green-dark text-[15px] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[12.5px] font-light text-[#555] leading-snug">
                You're the <strong className="font-medium text-ink">Pod Admin</strong>. You can invite members and manage the pod. Once a project is assigned, members cannot be removed.
              </p>
              <p className="text-[12px] font-light text-[#AAA]">
                As admin you can dissolve the pod at any time before a project is assigned.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2.5 bg-ink text-paper py-3.5 px-6 rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <><Spinner />Creating pod…</> : <><i className="bi bi-people text-[15px]" />Create pod</>}
            </button>
            <Link href="/dashboard" className="py-3.5 px-5 rounded-[10px] border border-black/[0.09] text-[#888] font-sans text-[13.5px] font-light hover:border-black/20 hover:text-ink transition-all flex items-center justify-center">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
