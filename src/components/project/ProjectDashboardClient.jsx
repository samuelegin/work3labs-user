'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchProjectDashboard, fetchProjectJobs } from '@/services/api'

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

const JOB_STATUS = {
  draft: { label: 'Draft', color: '#AAA' },
  open: { label: 'Open', color: '#F59E0B' },
  matching: { label: 'Matching', color: '#8B5CF6' },
  active: { label: 'In progress', color: '#1DC433' },
  submitted: { label: 'Review needed', color: '#3B82F6' },
  completed: { label: 'Completed', color: '#AAA' },
  disputed: { label: 'Disputed', color: '#EF4444' },
}

function JobRow({ job }) {
  const s = JOB_STATUS[job.status] ?? JOB_STATUS.draft
  return (
    <Link href={`/project/jobs/${job.id}`}>
      <div className="group flex items-center gap-4 px-6 py-4 border-b border-black/[0.05] last:border-b-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em] truncate group-hover:text-green-dark transition-colors">{job.title}</p>
            <span className="font-mono text-[8px] tracking-[0.1em] uppercase rounded-full px-2 py-0.5 flex-shrink-0" style={{ color: s.color, background: s.color + '15' }}>
              {s.label}
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#AAA] tracking-[0.04em]">{job.category} · {job.matchType === 'system' ? 'System match' : 'Manual interview'}</p>
        </div>
        <div className="text-right flex-shrink-0">
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

export default function ProjectDashboardClient() {
  const [summary, setSummary] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([fetchProjectDashboard(), fetchProjectJobs()])
      .then(([summaryRes, jobsRes]) => {
        if (summaryRes.data) setSummary(summaryRes.data)
        if (jobsRes.data) setJobs(jobsRes.data.jobs ?? jobsRes.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    review: jobs.filter(j => j.status === 'submitted').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    spent: jobs.filter(j => j.status === 'completed').reduce((a, j) => a + (j.budgetUsd ?? 0), 0),
  }

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 h-[58px] flex items-center justify-between">
          <Link href="/project" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Work3 Labs" className="h-7" />
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#CCC] hidden sm:block">Projects</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/project/create-job"
              className="flex items-center gap-1.5 bg-ink text-paper font-sans text-[12.5px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer">
              <i className="bi bi-plus text-[15px]" />Post a job
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <div className="mb-8" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-light tracking-[-0.04em] text-ink mb-1">Project Dashboard</h1>
          <p className="text-[13.5px] font-light text-[#AAA]">Manage your jobs, track progress, verify deliverables.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" style={{ animation: 'up 0.5s 0.05s both' }}>
          {loading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-[80px]" />) : (
            <>
              {[
                { label: 'Total jobs', value: stats.total, icon: 'bi-briefcase', accent: '#888' },
                { label: 'In progress', value: stats.active, icon: 'bi-lightning-charge-fill', accent: '#1DC433' },
                { label: 'Needs review', value: stats.review, icon: 'bi-send-check', accent: '#3B82F6' },
                { label: 'Total spent', value: `$${stats.spent.toLocaleString()}`, icon: 'bi-cash-coin', accent: '#F59E0B' },
              ].map(({ label, value, icon, accent }) => (
                <div key={label} className="bg-white border border-black/[0.07] rounded-[14px] px-5 py-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: accent + '18' }}>
                    <i className={`bi ${icon} text-[14px]`} style={{ color: accent }} />
                  </div>
                  <div>
                    <p className="font-serif text-[22px] font-light text-ink tracking-[-0.04em] leading-none mb-0.5">{value}</p>
                    <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#AAA]">{label}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Jobs table */}
        <div style={{ animation: 'up 0.5s 0.08s both' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {['all', 'open', 'active', 'submitted', 'completed'].map(f => (
                <button key={f} type="button" onClick={() => setFilter(f)}
                  className={`font-mono text-[10px] tracking-[0.06em] uppercase border rounded-full px-3.5 py-1.5 cursor-pointer transition-all bg-transparent ${
                    filter === f ? 'bg-ink text-paper border-transparent' : 'text-[#AAA] border-black/[0.12] hover:border-black/25'
                  }`}>
                  {f === 'all' ? 'All' : f === 'submitted' ? 'Review' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <Link href="/project/create-job"
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ink border border-black/[0.12] rounded-full px-3.5 py-1.5 hover:bg-black/[0.04] transition-colors">
              <i className="bi bi-plus text-[13px]" />New job
            </Link>
          </div>

          <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-14 flex flex-col items-center text-center">
                <i className="bi bi-briefcase text-[28px] text-[#CCC] block mb-4" />
                <p className="font-serif text-[19px] font-light text-ink mb-2">No jobs yet</p>
                <p className="text-[13px] font-light text-[#AAA] mb-5">Post your first job to get matched with talent or receive applications.</p>
                <Link href="/project/create-job"
                  className="inline-flex items-center gap-2 bg-ink text-paper font-sans text-[13px] font-medium px-4 py-2.5 rounded-[10px] hover:bg-[#1A1A1A] transition-colors">
                  <i className="bi bi-plus text-[14px]" />Post a job
                </Link>
              </div>
            ) : (
              filtered.map(job => <JobRow key={job.id} job={job} />)
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
