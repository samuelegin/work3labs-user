'use client'
import ThemeToggle from '@/components/ThemeToggle'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchLeaderboard } from '@/services/api'

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

const PERIODS = [
  { key: 'weekly', label: 'This week' },
  { key: 'monthly', label: 'This month' },
  { key: 'alltime', label: 'All time' },
]

export default function LeaderboardClient() {
  const [period, setPeriod] = useState('alltime')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchLeaderboard({ period })
      .then(({ data }) => { if (data) setEntries(data.entries ?? []) })
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[760px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Leaderboard</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-8" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] block mb-3">Rankings</span>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-light tracking-[-0.04em] text-ink mb-2">Leaderboard</h1>
          <p className="text-[14px] font-light text-[#888]">Top contributors ranked by earnings and performance.</p>
        </div>

        {/* Period tabs */}
        <div className="flex bg-[#F4F4F2] rounded-[10px] p-[3px] gap-[3px] mb-6" style={{ animation: 'up 0.5s 0.05s both' }}>
          {PERIODS.map(p => (
            <button key={p.key} type="button" onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-[8px] font-mono text-[10px] tracking-[0.08em] uppercase transition-all cursor-pointer border-none ${
                period === p.key ? 'bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'text-[#AAA] hover:text-[#666] bg-transparent'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.08s both' }}>
          <div className="px-5 py-3 border-b border-black/[0.06] grid grid-cols-[40px_1fr_80px_80px_80px] gap-3 items-center">
            {['#', 'Contributor', 'Earnings', 'Reputation', 'PoPs'].map(h => (
              <span key={h} className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC]">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : entries.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <i className="bi bi-trophy text-[28px] text-[#CCC] block mb-3" />
              <p className="text-[13.5px] font-light text-[#AAA]">No data yet for this period.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05]">
              {entries.map((e, i) => (
                <Link key={e.userId} href={`/u/${e.username}`}>
                  <div className="px-5 py-4 grid grid-cols-[40px_1fr_80px_80px_80px] gap-3 items-center hover:bg-[#FAFAFA] transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                      i === 0 ? 'bg-[#F59E0B] text-white'
                      : i === 1 ? 'bg-[#9CA3AF] text-white'
                      : i === 2 ? 'bg-[#CD7C2E] text-white'
                      : 'bg-[#F4F4F2] text-[#888]'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      {e.avatarUrl ? (
                        <img src={e.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                          <span className="font-mono text-[10px] text-paper">{e.displayName?.[0]?.toUpperCase() ?? '?'}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-sans text-[13px] font-medium text-ink truncate">{e.displayName}</p>
                          {e.blueTick && <i className="bi bi-patch-check-fill text-[#3B82F6] text-[11px] flex-shrink-0" />}
                          {e.goldTick && <i className="bi bi-patch-check-fill text-[#F59E0B] text-[11px] flex-shrink-0" />}
                        </div>
                        <p className="font-mono text-[10px] text-[#AAA]">@{e.username}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[12px] font-medium text-green-dark">${e.earningsUsd?.toLocaleString() ?? 0}</span>
                    <span className="font-mono text-[12px] text-ink">{e.reputationScore ?? '—'}</span>
                    <span className="font-mono text-[12px] text-[#3B82F6]">{e.popCount ?? 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
