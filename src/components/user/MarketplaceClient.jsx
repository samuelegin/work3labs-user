'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { fetchMarketplaceJobs } from '@/services/api'

const CATEGORIES = ['All', 'Community & Growth', 'Engineering', 'Design', 'Strategy & GTM', 'Marketing', 'Research', 'DevOps', 'Content']
const CHAINS = ['All chains', 'Base (USDC)', 'Solana (USDC)']
const TYPES = ['All types', 'Pod', 'Individual', 'Both']

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

function ChainBadge({ chain }) {
  const cfg = chain === 'base'
    ? { label: 'Base · USDC', color: '#3B82F6', bg: '#EFF6FF' }
    : { label: 'Solana · USDC', color: '#9945FF', bg: '#F5F3FF' }
  return (
    <span className="font-mono text-[9px] tracking-[0.06em] uppercase rounded-full px-2 py-0.5" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

function TypeBadge({ type }) {
  const labels = { pod: 'Pod', individual: 'Individual', both: 'Pod or Individual' }
  return (
    <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-[#888] border border-black/[0.09] rounded-full px-2 py-0.5">
      {labels[type] ?? type}
    </span>
  )
}

function JobCard({ job }) {
  const daysLeft = job.deadline ? Math.max(0, Math.round((new Date(job.deadline) - Date.now()) / 86400000)) : null

  return (
    <Link href={`/marketplace/${job.id}`}>
      <div className="group bg-white border border-black/[0.07] rounded-[14px] p-6 hover:border-black/[0.18] hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[15px] font-medium text-ink tracking-[-0.01em] leading-snug group-hover:text-green-dark transition-colors mb-1">
              {job.title}
            </p>
            <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA]">{job.category}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="font-serif text-[20px] font-light text-green-dark tracking-[-0.04em] leading-none">${job.budgetUsd?.toLocaleString()}</p>
            <p className="font-mono text-[9px] text-[#AAA] tracking-[0.06em] uppercase mt-0.5">
              {job.paymentStructure === 'milestone' ? 'Milestone' : 'Full payment'}
            </p>
          </div>
        </div>

        <p className="text-[13px] font-light text-[#666] leading-relaxed mb-4 line-clamp-2">{job.description}</p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <ChainBadge chain={job.chain} />
          <TypeBadge type={job.requiredType} />
          {job.kpis?.slice(0, 2).map((kpi, i) => (
            <span key={i} className="font-mono text-[9px] tracking-[0.04em] text-[#AAA] border border-black/[0.07] rounded-full px-2 py-0.5 bg-[#FAFAF8]">{kpi}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-black/[0.05]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11.5px] font-light text-[#AAA]">
              <i className="bi bi-people text-[11px]" />{job.applicantCount ?? 0} applicants
            </span>
            {daysLeft != null && (
              <span className={`flex items-center gap-1.5 text-[11.5px] font-light ${daysLeft <= 3 ? 'text-red-400' : 'text-[#AAA]'}`}>
                <i className="bi bi-clock text-[11px]" />{daysLeft}d left
              </span>
            )}
            {job.timeline && (
              <span className="flex items-center gap-1.5 text-[11.5px] font-light text-[#AAA]">
                <i className="bi bi-calendar2 text-[11px]" />{job.timeline}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {job.projectOwner?.avatarUrl ? (
              <img src={job.projectOwner.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center">
                <span className="font-mono text-[8px] text-paper">{job.projectOwner?.name?.[0]?.toUpperCase() ?? 'P'}</span>
              </div>
            )}
            <span className="text-[11.5px] font-light text-[#888]">{job.projectOwner?.name ?? 'Project Owner'}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function MarketplaceClient() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [chain, setChain] = useState('All chains')
  const [type, setType] = useState('All types')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (category !== 'All') params.category = category
    if (chain !== 'All chains') params.chain = chain === 'Base (USDC)' ? 'base' : 'solana'
    if (type !== 'All types') params.type = type.toLowerCase()
    if (debouncedQ) params.q = debouncedQ
    fetchMarketplaceJobs(params)
      .then(({ data }) => {
        if (data) { setJobs(data.jobs ?? []); setTotal(data.total ?? 0) }
      })
      .finally(() => setLoading(false))
  }, [category, chain, type, debouncedQ])

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Nav */}
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 h-[58px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
              <i className="bi bi-arrow-left text-[11px]" />Dashboard
            </Link>
            <span className="text-[#E0E0E0] text-[12px]">/</span>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Marketplace</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="bi bi-search text-[13px] text-[#CCC] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search jobs…"
                className="font-sans text-[13px] font-light text-ink bg-white border border-black/[0.09] rounded-[8px] pl-8 pr-3 py-1.5 outline-none focus:border-[#1DC433] focus:shadow-[0_0_0_3px_rgba(45,252,68,0.08)] transition-all w-[200px] placeholder-[#CCC]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] block mb-2">Open positions</span>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-serif text-[28px] sm:text-[36px] font-light tracking-[-0.04em] text-ink">
              Job Marketplace
            </h1>
            {!loading && <p className="font-mono text-[10.5px] text-[#AAA] tracking-[0.06em] mb-1">{total} open jobs</p>}
          </div>
          <p className="text-[14px] font-light text-[#888] mt-1">Apply as an individual or with your pod. All jobs are open for direct applications.</p>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <div className="w-[200px] flex-shrink-0 hidden lg:block" style={{ animation: 'up 0.5s 0.05s both' }}>
            <div className="sticky top-[78px] space-y-6">
              <div>
                <p className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#CCC] mb-3">Category</p>
                <div className="space-y-1">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className={`w-full text-left px-3 py-2 rounded-[8px] font-sans text-[12.5px] transition-all cursor-pointer border-none bg-transparent ${
                        category === c ? 'bg-ink text-paper font-medium' : 'text-[#666] hover:bg-black/[0.04] hover:text-ink'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#CCC] mb-3">Chain</p>
                <div className="space-y-1">
                  {CHAINS.map(c => (
                    <button key={c} type="button" onClick={() => setChain(c)}
                      className={`w-full text-left px-3 py-2 rounded-[8px] font-sans text-[12.5px] transition-all cursor-pointer border-none bg-transparent ${
                        chain === c ? 'bg-ink text-paper font-medium' : 'text-[#666] hover:bg-black/[0.04] hover:text-ink'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#CCC] mb-3">Looking for</p>
                <div className="space-y-1">
                  {TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      className={`w-full text-left px-3 py-2 rounded-[8px] font-sans text-[12.5px] transition-all cursor-pointer border-none bg-transparent ${
                        type === t ? 'bg-ink text-paper font-medium' : 'text-[#666] hover:bg-black/[0.04] hover:text-ink'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile filter pills */}
          <div className="lg:hidden flex-1">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
              {[...CATEGORIES.slice(1)].map(c => (
                <button key={c} type="button" onClick={() => setCategory(category === c ? 'All' : c)}
                  className={`flex-shrink-0 font-mono text-[10px] tracking-[0.06em] uppercase border rounded-full px-3 py-1.5 cursor-pointer transition-all bg-transparent ${
                    category === c ? 'bg-ink text-paper border-transparent' : 'text-[#AAA] border-black/[0.12] hover:border-black/25'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Job list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[200px]" />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white border border-black/[0.07] rounded-[14px] px-8 py-16 text-center" style={{ animation: 'up 0.4s both' }}>
                <i className="bi bi-briefcase text-[28px] text-[#CCC] block mb-4" />
                <p className="font-serif text-[20px] font-light text-ink mb-2">No jobs found</p>
                <p className="text-[13.5px] font-light text-[#AAA]">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="space-y-4" style={{ animation: 'up 0.4s both' }}>
                {jobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
