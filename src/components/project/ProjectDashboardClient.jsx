'use client'
import ThemeToggle from '@/components/ThemeToggle'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchProjectDashboard, fetchProjectJobs, fetchProfile } from '@/services/api'

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

const JOB_STATUS = {
  draft:     { label: 'Draft',        color: '#AAA'     },
  open:      { label: 'Open',         color: '#F59E0B'  },
  matching:  { label: 'Matching',     color: '#8B5CF6'  },
  active:    { label: 'In progress',  color: '#1DC433'  },
  submitted: { label: 'Review',       color: '#3B82F6'  },
  completed: { label: 'Completed',    color: '#AAA'     },
  disputed:  { label: 'Disputed',     color: '#EF4444'  },
}

function DealRow({ job }) {
  const s = JOB_STATUS[job.status] ?? JOB_STATUS.draft
  return (
    <Link href={`/project/deals/${job.id}`}>
      <div className="group flex items-center gap-3 px-5 py-4 border-b border-black/[0.05] last:border-b-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="font-sans text-[13.5px] font-medium text-ink tracking-[-0.01em] truncate group-hover:text-green-dark transition-colors">{job.title}</p>
            <span className="font-mono text-[8px] tracking-[0.1em] uppercase rounded-full px-2 py-0.5 flex-shrink-0 whitespace-nowrap" style={{ color: s.color, background: s.color + '15' }}>
              {s.label}
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#AAA] tracking-[0.04em] truncate">{job.category} · {job.matchType === 'system' ? 'System match' : 'Manual'}</p>
        </div>
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="font-mono text-[13px] font-medium text-green-dark">${job.budgetUsd?.toLocaleString()}</p>
          {job.applicantCount != null && job.status === 'open' && (
            <p className="font-mono text-[10px] text-[#AAA]">{job.applicantCount} applicants</p>
          )}
        </div>
        <i className="bi bi-arrow-right text-[12px] text-[#CCC] group-hover:text-ink transition-colors flex-shrink-0" />
      </div>
    </Link>
  )
}

function Identicon({ seed = '', size = 40 }) {
  const hash = seed.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffffffff, 0)
  const hue = Math.abs(hash) % 360
  return (
    <div className="rounded-full flex-shrink-0" style={{
      width: size, height: size,
      background: `radial-gradient(circle at 35% 35%, hsl(${hue},70%,65%), hsl(${(hue+40)%360},60%,40%))`,
    }} />
  )
}

export default function ProjectDashboardClient() {
  const [summary, setSummary]   = useState(null)
  const [jobs, setJobs]         = useState([])
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    Promise.all([fetchProjectDashboard(), fetchProjectJobs(), fetchProfile()])
      .then(([summaryRes, jobsRes, profileRes]) => {
        if (summaryRes.data) setSummary(summaryRes.data)
        if (jobsRes.data)    setJobs(jobsRes.data.jobs ?? jobsRes.data ?? [])
        if (profileRes.data) setProfile(profileRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? jobs
    : filter === 'pending'
      ? jobs.filter(j => ['open','draft'].includes(j.status))
      : filter === 'active'
        ? jobs.filter(j => j.status === 'active')
        : filter === 'completed'
          ? jobs.filter(j => j.status === 'completed')
          : jobs

  const stats = {
    total:     jobs.length,
    pending:   jobs.filter(j => ['open','draft'].includes(j.status)).length,
    active:    jobs.filter(j => j.status === 'active').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    spent:     jobs.filter(j => j.status === 'completed').reduce((a, j) => a + (j.budgetUsd ?? 0), 0),
  }

  const displayName = profile?.displayName ?? 'Project'
  const avatarUrl   = profile?.avatarUrl ?? null

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 h-[58px] flex items-center justify-between gap-3">

          {/* Logo */}
          <Link href="/project" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="Work3 Labs" className="h-7" />
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#CCC] hidden sm:block">Projects</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Post deal — visible on desktop only */}
            <Link href="/project/create-deal"
              className="hidden sm:flex items-center gap-1.5 bg-ink text-paper font-sans text-[12.5px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#1A1A1A] transition-colors">
              <i className="bi bi-plus text-[15px]" />Post a deal
            </Link>

            <ThemeToggle />

            {/* Profile avatar + dropdown */}
            <div className="relative">
              <button onClick={() => setMenuOpen(s => !s)}
                className="flex items-center gap-2 border border-black/[0.09] rounded-[8px] px-2.5 py-1.5 hover:border-black/20 transition-all bg-transparent cursor-pointer">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  : <Identicon seed={displayName} size={24} />
                }
                <span className="font-sans text-[13px] font-light text-ink hidden sm:block max-w-[100px] truncate">{displayName}</span>
                <i className={`bi bi-chevron-down text-[10px] text-[#AAA] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[200px] bg-white border border-black/[0.07] rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50"
                  style={{ animation: 'up 0.15s both' }}>
                  <Link href="/project/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                    <i className="bi bi-person-circle text-[14px] text-[#AAA]" />Profile
                  </Link>
                  <Link href="/project/create-deal" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                    <i className="bi bi-plus-circle text-[14px] text-[#AAA]" />Post a deal
                  </Link>
                  <Link href="/project/premium" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                    <i className="bi bi-patch-check-fill text-[14px] text-[#F59E0B]" />Get Premium
                  </Link>
                  <Link href="/auth/login" onClick={() => { setMenuOpen(false); document.cookie = 'w3l_user_auth=;path=/;Max-Age=0' }}
                    className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FFF5F5] transition-colors text-[13px] font-light text-red-400">
                    <i className="bi bi-box-arrow-left text-[14px]" />Sign out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8 sm:py-10">

        {/* ── HERO / GREETING ─────────────────────── */}
        {/*
          IMAGE PLACEHOLDER — Project Dashboard Hero Banner
          PROMPT: "Abstract dark Web3 project management dashboard, glowing network nodes, floating task cards, deep indigo and green light, cinematic wide panoramic, no text"
          REPLACE: swap the gradient div below with:
          <img src="/images/project-dashboard-hero.jpg" className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-[18px]" />
        */}
        <div className="relative bg-white border border-black/[0.07] rounded-[18px] px-6 sm:px-8 py-7 mb-8 overflow-hidden"
          style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          {/* dashboard-hero + success-hero layered */}
          <img src="/images/success-hero.png" alt="" className="absolute right-0 top-0 h-full w-auto max-w-[45%] object-contain object-right opacity-[0.10] pointer-events-none mix-blend-multiply" />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(29,196,51,0.04) 0%, transparent 60%)' }} />
          <div className="relative">
            {loading
              ? <Skeleton className="h-8 w-48 mb-2" />
              : <>
                  <p className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-[#CCC] mb-2">Project dashboard</p>
                  <h1 className="font-serif text-[26px] sm:text-[32px] font-light tracking-[-0.04em] text-ink mb-1">
                    {displayName}
                    {profile?.blueTick  && <i className="bi bi-patch-check-fill text-[#F59E0B] text-[18px] ml-2 align-middle" title="Premium" />}
                    {profile?.goldTick  && <i className="bi bi-patch-check-fill text-[#F59E0B] text-[18px] ml-1 align-middle" title="Gold" />}
                  </h1>
                  <p className="text-[13.5px] font-light text-[#AAA]">
                    {stats.active > 0
                      ? `${stats.active} active deal${stats.active > 1 ? 's' : ''} in progress · ${stats.pending} pending`
                      : 'Post a deal to start matching with talent.'}
                  </p>
                </>
            }
          </div>
        </div>

        {/* ── STATS GRID ──────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          style={{ animation: 'up 0.5s 0.05s both' }}>
          {loading
            ? [1,2,3,4].map(i => <Skeleton key={i} className="h-[76px]" />)
            : [
                { label: 'Total',     value: stats.total,                             icon: 'bi-briefcase',         accent: '#888'    },
                { label: 'Pending',   value: stats.pending,                           icon: 'bi-hourglass-split',   accent: '#F59E0B' },
                { label: 'Active',    value: stats.active,                            icon: 'bi-lightning-charge-fill', accent: '#1DC433' },
                { label: 'Completed', value: stats.completed,                         icon: 'bi-check-circle-fill', accent: '#3B82F6' },
                { label: 'Spent',     value: `$${stats.spent.toLocaleString()}`,      icon: 'bi-cash-coin',         accent: '#2DFC44' },
              ].map(({ label, value, icon, accent }) => (
                <div key={label} className="bg-white border border-black/[0.07] rounded-[14px] px-4 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: accent + '18' }}>
                    <i className={`bi ${icon} text-[14px]`} style={{ color: accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-[20px] sm:text-[22px] font-light text-ink tracking-[-0.04em] leading-none mb-0.5">{value}</p>
                    <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#AAA] truncate">{label}</p>
                  </div>
                </div>
              ))
          }
        </div>

        {/* ── DEALS TABLE ─────────────────────────── */}
        <div style={{ animation: 'up 0.5s 0.08s both' }}>
          {/* Header: filters only — no extra post button here */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex gap-1 flex-wrap flex-1">
              {[
                { key: 'all',       label: 'All'       },
                { key: 'pending',   label: 'Pending',   dot: '#F59E0B' },
                { key: 'active',    label: 'Active',    dot: '#1DC433' },
                { key: 'completed', label: 'Completed', dot: '#3B82F6' },
              ].map(f => (
                <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] uppercase border rounded-full px-3 py-1.5 cursor-pointer transition-all bg-transparent whitespace-nowrap ${
                    filter === f.key
                      ? 'bg-ink text-paper border-transparent'
                      : 'text-[#AAA] border-black/[0.12] hover:border-black/25'
                  }`}>
                  {f.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: filter === f.key ? 'white' : f.dot }} />}
                  {f.label}
                  <span className="opacity-50 ml-0.5">
                    ({f.key === 'all' ? stats.total : f.key === 'pending' ? stats.pending : f.key === 'active' ? stats.active : stats.completed})
                  </span>
                </button>
              ))}
            </div>
            {/* Single "New deal" link — desktop only, mobile users use nav dropdown */}
            <Link href="/project/create-deal"
              className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ink border border-black/[0.12] rounded-full px-3.5 py-1.5 hover:bg-black/[0.04] transition-colors flex-shrink-0">
              <i className="bi bi-plus text-[13px]" />New deal
            </Link>
          </div>

          <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-14 flex flex-col items-center text-center">
                <img src="/images/empty-deals.png" alt="" className="w-20 h-20 object-contain mb-3 opacity-70" />
                <p className="font-serif text-[19px] font-light text-ink mb-2">
                  {filter === 'all' ? 'No deals yet' : `No ${filter} deals`}
                </p>
                <p className="text-[13px] font-light text-[#AAA] mb-5 max-w-[320px]">
                  {filter === 'all'
                    ? 'Post your first deal to get matched with talent.'
                    : `Deals with "${filter}" status will appear here.`}
                </p>
                {filter === 'all' && (
                  <Link href="/project/create-deal"
                    className="inline-flex items-center gap-2 bg-ink text-paper font-sans text-[13px] font-medium px-4 py-2.5 rounded-[10px] hover:bg-[#1A1A1A] transition-colors">
                    <i className="bi bi-plus text-[14px]" />Post a deal
                  </Link>
                )}
              </div>
            ) : (
              filtered.map(job => <DealRow key={job.id} job={job} />)
            )}
          </div>
        </div>

        {/* ── MOBILE: floating post button ────────── */}
        <Link href="/project/create-deal"
          className="sm:hidden fixed bottom-6 right-5 flex items-center gap-2 bg-ink text-paper font-sans text-[13.5px] font-medium px-5 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.18)] hover:bg-[#1A1A1A] transition-all z-40">
          <i className="bi bi-plus text-[17px]" />Post a deal
        </Link>

      </main>
    </div>
  )
}
