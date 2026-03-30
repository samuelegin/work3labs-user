'use client'
import ThemeToggle from '@/components/ThemeToggle'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createJob } from '@/services/api'

const CATEGORIES = ['Community & Growth', 'Engineering', 'Design', 'Strategy & GTM', 'Marketing', 'Research', 'DevOps', 'Content', 'Other']

function Spinner() {
  return <span className="inline-block w-[16px] h-[16px] rounded-full border-2 border-white/25 border-t-white spin-anim flex-shrink-0" />
}

function Step({ n, title, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
        done ? 'bg-green-dark border-green-dark' : active ? 'border-ink bg-white' : 'border-[#E5E5E5] bg-white'
      }`}>
        {done ? <i className="bi bi-check text-paper text-[10px]" /> : <span className={`font-mono text-[9px] font-bold ${active ? 'text-ink' : 'text-[#CCC]'}`}>{n}</span>}
      </div>
      <span className={`font-mono text-[10px] tracking-[0.08em] uppercase hidden sm:block ${active ? 'text-ink' : done ? 'text-[#888]' : 'text-[#CCC]'}`}>{title}</span>
    </div>
  )
}

const STEPS = ['Basics', 'Scope & KPIs', 'Payment', 'Matching']

export default function CreateJobClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Step 0 — basics
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [timeline, setTimeline] = useState('')

  // Step 1 — scope & KPIs
  const [description, setDescription] = useState('')
  const [kpiInput, setKpiInput] = useState('')
  const [kpis, setKpis] = useState([])

  // Step 2 — payment
  const [budgetUsd, setBudgetUsd] = useState('')
  const [paymentStructure, setPaymentStructure] = useState('full')
  const [chain, setChain] = useState('base')
  const [milestones, setMilestones] = useState([{ title: '', description: '', amount: '' }])

  // Step 3 — matching
  const [matchType, setMatchType] = useState('manual')
  const [requiredType, setRequiredType] = useState('both')

  function addKpi() {
    const clean = kpiInput.trim()
    if (!clean || kpis.includes(clean)) return
    setKpis(k => [...k, clean])
    setKpiInput('')
  }

  function addMilestone() {
    setMilestones(m => [...m, { title: '', description: '', amount: '' }])
  }

  function updateMilestone(i, field, val) {
    setMilestones(m => m.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
  }

  function removeMilestone(i) {
    setMilestones(m => m.filter((_, idx) => idx !== i))
  }

  function validateStep() {
    const next = {}
    if (step === 0) {
      if (!title.trim()) next.title = 'Deal title is required'
      if (!category) next.category = 'Select a category'
      if (!timeline.trim()) next.timeline = 'Timeline is required'
    }
    if (step === 1) {
      if (!description.trim() || description.trim().length < 30) next.description = 'Please describe the job in more detail (min 30 chars)'
      if (kpis.length === 0) next.kpis = 'Add at least one KPI or success criterion'
    }
    if (step === 2) {
      if (!budgetUsd || isNaN(Number(budgetUsd)) || Number(budgetUsd) <= 0) next.budgetUsd = 'Enter a valid budget'
      if (paymentStructure === 'milestone') {
        const milestoneTotal = milestones.reduce((a, m) => a + (Number(m.amount) || 0), 0)
        if (milestones.some(m => !m.title.trim())) next.milestones = 'Each milestone needs a title'
        if (Math.abs(milestoneTotal - Number(budgetUsd)) > 1) next.milestones = `Milestone amounts must total $${budgetUsd} (currently $${milestoneTotal})`
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function nextStep() {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    setErrors(prev => ({ ...prev, server: null }))

    const { data, error } = await createJob({
      title: title.trim(),
      category,
      timeline: timeline.trim(),
      description: description.trim(),
      kpis,
      budgetUsd: Number(budgetUsd),
      paymentStructure,
      chain,
      matchType,
      requiredType,
      milestones: paymentStructure === 'milestone' ? milestones.map(m => ({ ...m, amount: Number(m.amount) })) : undefined,
    })

    setSubmitting(false)
    if (error) { setErrors({ server: error }); return }
    router.push(`/project/jobs/${data.id ?? data.jobId}`)
  }

  const inputCls = (err) => [
    'w-full font-sans text-[14px] font-light bg-white text-ink border rounded-[10px] px-4 py-3 outline-none transition-all placeholder-[#D0D0D0] appearance-none',
    err ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]'
         : 'border-black/[0.09] focus:border-[#1DC433] focus:shadow-[0_0_0_3px_rgba(45,252,68,0.08)]',
  ].join(' ')

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[720px] mx-auto px-5 sm:px-8 h-[58px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/project" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
              <i className="bi bi-arrow-left text-[11px]" />Dashboard
            </Link>
            <span className="text-[#E0E0E0] text-[12px]">/</span>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Post a job</span>
          </div>
          <span className="font-mono text-[10px] text-[#CCC]">Step {step + 1} of {STEPS.length}</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-8 sm:py-12">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10" style={{ animation: 'up 0.4s both' }}>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <Step n={i + 1} title={s} active={step === i} done={step > i} />
              {i < STEPS.length - 1 && <div className={`h-px flex-1 w-8 ${step > i ? 'bg-green-dark' : 'bg-[#E5E5E5]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] overflow-hidden" style={{ animation: 'up 0.4s 0.05s both' }}>

          {errors.server && (
            <div className="mx-7 mt-7 flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5">
              <i className="bi bi-exclamation-circle text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-600 font-light">{errors.server}</p>
            </div>
          )}

          {/* Step 0 — Basics */}
          {step === 0 && (
            <div className="px-7 py-7 space-y-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] mb-1">Step 1</p>
                <h2 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-1">Job basics</h2>
                <p className="text-[13px] font-light text-[#AAA]">Define what you need and the expected timeline.</p>
              </div>
              <div>
                <label htmlFor="title" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Deal title</label>
                <input id="title" type="text" value={title} onChange={e => { setTitle(e.target.value); setErrors(err => ({ ...err, title: null })) }}
                  placeholder="e.g. Community Growth Strategy for Q2" autoFocus className={inputCls(errors.title)} />
                {errors.title && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.title}</p>}
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => { setCategory(c); setErrors(err => ({ ...err, category: null })) }}
                      className={`font-mono text-[10px] tracking-[0.06em] uppercase border rounded-full px-3.5 py-1.5 cursor-pointer transition-all bg-transparent ${
                        category === c ? 'bg-ink text-paper border-transparent' : 'text-[#AAA] border-black/[0.12] hover:border-black/25'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.category}</p>}
              </div>
              <div>
                <label htmlFor="timeline" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Timeline</label>
                <input id="timeline" type="text" value={timeline} onChange={e => { setTimeline(e.target.value); setErrors(err => ({ ...err, timeline: null })) }}
                  placeholder="e.g. 4 weeks, 2 months, ongoing" className={inputCls(errors.timeline)} />
                {errors.timeline && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.timeline}</p>}
              </div>
            </div>
          )}

          {/* Step 1 — Scope & KPIs */}
          {step === 1 && (
            <div className="px-7 py-7 space-y-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] mb-1">Step 2</p>
                <h2 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-1">Scope & success criteria</h2>
                <p className="text-[13px] font-light text-[#AAA]">Describe the work and what a successful outcome looks like.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="desc" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Job description</label>
                  <span className="font-mono text-[10px] text-[#CCC]">{description.length}/2000</span>
                </div>
                <textarea id="desc" value={description} onChange={e => { setDescription(e.target.value.slice(0, 2000)); setErrors(err => ({ ...err, description: null })) }} rows={6}
                  placeholder="Describe the scope of work in detail. Include context, goals, deliverables, and any constraints."
                  className={`${inputCls(errors.description)} resize-none leading-relaxed`} />
                {errors.description && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.description}</p>}
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">KPIs / Success criteria</label>
                <p className="text-[11.5px] text-[#BBB] font-light mb-2">What does success look like? Add measurable outcomes.</p>
                <div className="space-y-2 mb-2">
                  {kpis.map((kpi, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#F4FAF7] border border-green-dark/15 rounded-[10px] px-3.5 py-2.5">
                      <i className="bi bi-check-circle-fill text-green-dark text-[12px] flex-shrink-0" />
                      <span className="flex-1 text-[13px] font-light text-ink">{kpi}</span>
                      <button type="button" onClick={() => setKpis(k => k.filter((_, idx) => idx !== i))}
                        className="text-[#CCC] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0">
                        <i className="bi bi-x text-[13px]" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={kpiInput} onChange={e => setKpiInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKpi() } }}
                    placeholder="e.g. 20% increase in community members"
                    className={inputCls(errors.kpis)} />
                  <button type="button" onClick={addKpi}
                    className="px-4 py-3 bg-ink text-paper rounded-[10px] font-sans text-[13px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer flex-shrink-0">
                    Add
                  </button>
                </div>
                {errors.kpis && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.kpis}</p>}
              </div>
            </div>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <div className="px-7 py-7 space-y-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] mb-1">Step 3</p>
                <h2 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-1">Payment</h2>
                <p className="text-[13px] font-light text-[#AAA]">Set your budget and payment structure. Funds are locked in escrow before the job is published.</p>
              </div>

              <div>
                <label htmlFor="budget" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-1.5">Total budget (USD)</label>
                <div className="flex items-center border border-black/[0.09] rounded-[10px] overflow-hidden focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all">
                  <span className="px-4 font-mono text-[14px] text-[#BBB] border-r border-black/[0.09] bg-[#FAFAF8] py-3 flex-shrink-0">$</span>
                  <input id="budget" type="number" min="1" value={budgetUsd} onChange={e => { setBudgetUsd(e.target.value); setErrors(err => ({ ...err, budgetUsd: null })) }}
                    placeholder="0.00" className="flex-1 font-sans text-[14px] font-light text-ink bg-white px-4 py-3 outline-none placeholder-[#D0D0D0]" />
                  <span className="px-4 font-mono text-[12px] text-[#AAA] border-l border-black/[0.09] bg-[#FAFAF8] py-3 flex-shrink-0">USDC</span>
                </div>
                {errors.budgetUsd && <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.budgetUsd}</p>}
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-2">Payment structure</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'full', label: 'Full on completion', icon: 'bi-cash-coin', sub: 'Released when work is verified' },
                    { key: 'milestone', label: 'Milestone payments', icon: 'bi-list-check', sub: 'Released per milestone' },
                  ].map(({ key, label, icon, sub }) => (
                    <button key={key} type="button" onClick={() => setPaymentStructure(key)}
                      className={`flex items-start gap-3 px-4 py-4 rounded-[10px] border-2 transition-all cursor-pointer bg-transparent text-left ${paymentStructure === key ? 'border-ink bg-[#FAFAFA]' : 'border-black/[0.09] hover:border-black/20'}`}>
                      <i className={`bi ${icon} text-[16px] flex-shrink-0 mt-0.5 ${paymentStructure === key ? 'text-ink' : 'text-[#CCC]'}`} />
                      <div>
                        <p className={`font-sans text-[13px] font-medium ${paymentStructure === key ? 'text-ink' : 'text-[#666]'}`}>{label}</p>
                        <p className="text-[11.5px] font-light text-[#AAA] mt-0.5">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {paymentStructure === 'milestone' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Milestones</label>
                    <button type="button" onClick={addMilestone}
                      className="font-mono text-[9px] tracking-[0.08em] uppercase text-ink border border-black/[0.12] rounded-full px-3 py-1 hover:bg-black/[0.04] transition-colors bg-transparent cursor-pointer">
                      + Add milestone
                    </button>
                  </div>
                  <div className="space-y-3">
                    {milestones.map((m, i) => (
                      <div key={i} className="border border-black/[0.07] rounded-[10px] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-[#CCC] tracking-[0.08em]">Milestone {i + 1}</span>
                          {milestones.length > 1 && (
                            <button type="button" onClick={() => removeMilestone(i)}
                              className="text-[#CCC] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer">
                              <i className="bi bi-x text-[14px]" />
                            </button>
                          )}
                        </div>
                        <input type="text" value={m.title} onChange={e => updateMilestone(i, 'title', e.target.value)}
                          placeholder="Milestone title" className={inputCls(false)} />
                        <div className="flex items-center border border-black/[0.09] rounded-[10px] overflow-hidden focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all">
                          <span className="px-3 font-mono text-[13px] text-[#BBB] border-r border-black/[0.09] bg-[#FAFAF8] py-2.5 flex-shrink-0">$</span>
                          <input type="number" min="1" value={m.amount} onChange={e => updateMilestone(i, 'amount', e.target.value)}
                            placeholder="Amount" className="flex-1 font-sans text-[13.5px] font-light text-ink bg-white px-3 py-2.5 outline-none placeholder-[#D0D0D0]" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.milestones && <p className="mt-2 text-[12px] text-red-500 font-light flex items-center gap-1.5"><i className="bi bi-exclamation-circle text-[11px]" />{errors.milestones}</p>}
                </div>
              )}

              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-2">Payment chain</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'base', label: 'Base', sub: 'USDC · ~$0.02 gas', color: '#3B82F6' },
                    { key: 'solana', label: 'Solana', sub: 'USDC · <$0.005 gas', color: '#9945FF' },
                  ].map(c => (
                    <button key={c.key} type="button" onClick={() => setChain(c.key)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-[10px] border-2 transition-all cursor-pointer bg-transparent ${chain === c.key ? 'border-ink' : 'border-black/[0.09] hover:border-black/20'}`}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <div className="text-left">
                        <p className={`font-sans text-[13px] font-medium ${chain === c.key ? 'text-ink' : 'text-[#666]'}`}>{c.label}</p>
                        <p className="font-mono text-[10px] text-[#AAA]">{c.sub}</p>
                      </div>
                      {chain === c.key && <i className="bi bi-check-circle-fill text-ink text-[13px] ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Matching */}
          {step === 3 && (
            <div className="px-7 py-7 space-y-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] mb-1">Step 4</p>
                <h2 className="font-serif text-[22px] font-light tracking-[-0.04em] text-ink mb-1">Matching method</h2>
                <p className="text-[13px] font-light text-[#AAA]">Choose how you want to find your Jobber or Pod.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'system',
                    label: 'System Match',
                    icon: 'bi-cpu',
                    sub: 'Our system recommends the best available Pods or Jobbers based on your job requirements. You review and accept or ask for new recommendations.',
                  },
                  {
                    key: 'manual',
                    label: 'Manual Interview',
                    icon: 'bi-chat-text',
                    sub: 'Your job is posted to the public marketplace. Jobbers apply directly, and a DM chat opens with each applicant for you to interview them.',
                  },
                ].map(m => (
                  <button key={m.key} type="button" onClick={() => setMatchType(m.key)}
                    className={`w-full flex items-start gap-4 px-5 py-5 rounded-[12px] border-2 transition-all cursor-pointer bg-transparent text-left ${matchType === m.key ? 'border-ink bg-[#FAFAFA]' : 'border-black/[0.09] hover:border-black/20'}`}>
                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 ${matchType === m.key ? 'bg-ink' : 'bg-[#F4F4F2]'}`}>
                      <i className={`bi ${m.icon} text-[17px] ${matchType === m.key ? 'text-paper' : 'text-[#CCC]'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-sans text-[14px] font-semibold tracking-[-0.01em] mb-1 ${matchType === m.key ? 'text-ink' : 'text-[#555]'}`}>{m.label}</p>
                      <p className="text-[12.5px] font-light text-[#888] leading-relaxed">{m.sub}</p>
                    </div>
                    {matchType === m.key && <i className="bi bi-check-circle-fill text-ink text-[16px] flex-shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999] block mb-2">Looking for</label>
                <div className="flex gap-2">
                  {[
                    { key: 'pod', label: 'Pod only' },
                    { key: 'individual', label: 'Individual only' },
                    { key: 'both', label: 'Pod or Individual' },
                  ].map(t => (
                    <button key={t.key} type="button" onClick={() => setRequiredType(t.key)}
                      className={`flex-1 py-2.5 rounded-[10px] border-2 font-sans text-[12.5px] transition-all cursor-pointer bg-transparent ${requiredType === t.key ? 'border-ink bg-ink text-paper font-medium' : 'border-black/[0.09] text-[#666] hover:border-black/20'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#FAFAF8] border border-black/[0.07] rounded-[12px] px-5 py-5">
                <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#CCC] mb-3">Job summary</p>
                <div className="space-y-2">
                  {[
                    ['Title', title],
                    ['Category', category],
                    ['Budget', `$${Number(budgetUsd).toLocaleString()} USDC`],
                    ['Payment', paymentStructure === 'milestone' ? `${milestones.length} milestones` : 'Full on completion'],
                    ['Chain', chain === 'base' ? 'Base' : 'Solana'],
                    ['Matching', matchType === 'system' ? 'System match' : 'Manual interview (marketplace)'],
                    ['Looking for', requiredType === 'both' ? 'Pod or Individual' : requiredType],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="font-mono text-[10.5px] text-[#AAA] tracking-[0.04em]">{k}</span>
                      <span className="font-sans text-[12.5px] font-medium text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3.5 flex items-start gap-3">
                <i className="bi bi-lock-fill text-amber-500 text-[13px] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] font-light text-amber-700 leading-relaxed">
                  Your funds will be locked in escrow when you submit. They're only released after you verify deliverables or a dispute is resolved.
                </p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="px-7 py-5 border-t border-black/[0.06] flex items-center justify-between">
            <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/project')}
              className="flex items-center gap-2 py-3 px-5 rounded-[10px] border border-black/[0.09] text-[#888] font-sans text-[13.5px] font-light hover:border-black/20 hover:text-ink transition-all bg-transparent cursor-pointer">
              <i className="bi bi-arrow-left text-[13px]" />{step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep}
                className="flex items-center gap-2 py-3 px-6 bg-ink text-paper rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer">
                Continue <i className="bi bi-arrow-right text-[13px]" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2.5 py-3.5 px-6 bg-ink text-paper rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <><Spinner />Publishing job…</> : <><i className="bi bi-send-check text-[15px]" />Lock funds & publish</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
