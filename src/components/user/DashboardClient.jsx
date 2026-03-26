'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchMyPods, fetchProfile, userLogout } from '@/services/api'

const STATUS = {
  forming: { label: 'Forming', color: '#F59E0B', icon: 'bi-people' },
  active: { label: 'Active', color: '#1DC433', icon: 'bi-lightning-charge' },
  submitted: { label: 'Submitted', color: '#3B82F6', icon: 'bi-send-check' },
  reviewing: { label: 'Reviewing', color: '#8B5CF6', icon: 'bi-hourglass-split' },
  approved: { label: 'Approved', color: '#1DC433', icon: 'bi-patch-check' },
  claimable: { label: 'Claimable', color: '#2DFC44', icon: 'bi-cash-coin' },
  completed: { label: 'Completed', color: '#AAA', icon: 'bi-check-circle' },
}

const ACTIVE_STATUSES = ['active', 'submitted', 'reviewing', 'approved', 'claimable']

function NavBar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-30 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 h-[58px] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Work3 Labs" className="h-7" />
          <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#CCC] hidden sm:block">Contributor</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/pod/create"
            className="hidden sm:flex items-center gap-1.5 bg-ink text-paper font-sans text-[12.5px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer">
            <i className="bi bi-plus text-[15px]" />New pod
          </Link>

          <div className="relative">
            <button onClick={() => setMenuOpen(s => !s)}
              className="flex items-center gap-2 border border-black/[0.09] rounded-[8px] px-3 py-1.5 hover:border-black/20 transition-all bg-transparent cursor-pointer">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-[9px] text-paper">{user?.displayName?.[0]?.toUpperCase() ?? '?'}</span>
                </div>
              )}
              <span className="font-sans text-[13px] font-light text-ink hidden sm:block max-w-[120px] truncate">
                {user?.displayName ?? 'You'}
              </span>
              <i className={`bi bi-chevron-down text-[10px] text-[#AAA] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-[180px] bg-white border border-black/[0.07] rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50" style={{ animation: 'up 0.15s both' }}>
                <Link href="/profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                  <i className="bi bi-person text-[14px] text-[#AAA]" />Profile
                </Link>
                <Link href="/profile/pop" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                  <i className="bi bi-patch-check text-[14px] text-[#AAA]" />PoP Records
                </Link>
                <button onClick={onLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-[#FFF5F5] transition-colors text-[13px] font-light text-red-500 bg-transparent border-none cursor-pointer text-left">
                  <i className="bi bi-box-arrow-left text-[14px]" />Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

// Stat card — clickable when href provided
function StatCard({ label, value, sub, icon, accent, href, onClick, active }) {
  const clickable = href || onClick
  const inner = (
    <div className={`bg-white rounded-[14px] px-5 py-5 flex items-start gap-4 transition-all ${
      active
        ? 'border-2 shadow-[0_2px_16px_rgba(0,0,0,0.08)] cursor-pointer'
        : clickable
        ? 'border border-black/[0.07] hover:border-black/[0.14] hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)] cursor-pointer'
        : 'border border-black/[0.07]'
    }`}
    style={active ? { borderColor: accent } : {}}
    >
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: accent + '18' }}>
        <i className={`${icon} text-[16px]`} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-[26px] font-light text-ink tracking-[-0.05em] leading-none mb-1">{value}</p>
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#AAA]">{label}</p>
        {sub && <p className="text-[11.5px] font-light text-[#BBB] mt-0.5">{sub}</p>}
      </div>
      {clickable && <i className="bi bi-arrow-right text-[12px] text-[#CCC] mt-1 flex-shrink-0" />}
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className="text-left w-full bg-transparent p-0 border-none">{inner}</button>
  return inner
}

function PodCard({ pod }) {
  const s = STATUS[pod.status] ?? STATUS.forming

  return (
    <Link href={`/pod/${pod.id}`}>
      <div className="group bg-white border border-black/[0.07] rounded-[14px] p-6 hover:border-black/[0.14] hover:shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[17px] font-light text-ink tracking-[-0.03em] leading-snug truncate group-hover:text-green-dark transition-colors">
              {pod.name}
            </p>
            <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase mt-0.5" style={{ color: s.color }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-px" style={{ background: s.color }} />
              {s.label}
            </p>
          </div>
          {pod.myRole === 'admin' && (
            <span className="flex-shrink-0 font-mono text-[9px] tracking-[0.08em] uppercase text-green-dark border border-green-dark/20 bg-green-dark/5 rounded-full px-2.5 py-1">
              Admin
            </span>
          )}
        </div>

        {pod.description && (
          <p className="text-[12.5px] font-light text-[#888] leading-relaxed mb-4 line-clamp-2">{pod.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-black/[0.05]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11.5px] font-light text-[#AAA]">
              <i className="bi bi-people text-[12px]" />{pod.memberCount ?? 0}
            </span>
            {pod.reputationScore != null && (
              <span className="flex items-center gap-1 text-[11.5px] font-light text-[#AAA]">
                <i className="bi bi-star text-[11px]" />{pod.reputationScore}
              </span>
            )}
            {pod.popCount > 0 && (
              <span className="flex items-center gap-1 text-[11.5px] font-light text-[#AAA]">
                <i className="bi bi-patch-check text-[11px] text-[#3B82F6]" />{pod.popCount} PoP
              </span>
            )}
          </div>
          <i className="bi bi-arrow-right text-[13px] text-[#CCC] group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="bg-white border border-black/[0.07] rounded-[14px] px-8 py-14 flex flex-col items-center text-center" style={{ animation: 'up 0.5s 0.15s both' }}>
      <div className="w-14 h-14 rounded-full bg-[#F4F4F2] flex items-center justify-center mb-5">
        <i className="bi bi-people text-[22px] text-[#CCC]" />
      </div>
      <h3 className="font-serif text-[20px] font-light text-ink tracking-[-0.03em] mb-2">No pods yet</h3>
      <p className="text-[13.5px] font-light text-[#888] leading-relaxed max-w-[300px] mb-7">
        Create your first Talent Pod to start executing work, building your on-chain reputation, and earning.
      </p>
      <Link href="/pod/create"
        className="inline-flex items-center gap-2 bg-ink text-paper font-sans text-[13.5px] font-medium px-5 py-3 rounded-[10px] hover:bg-[#1A1A1A] transition-colors">
        <i className="bi bi-plus text-[16px]" />Create your first pod
      </Link>
    </div>
  )
}

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

export default function DashboardClient() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [pods, setPods] = useState([])
  const [loading, setLoading] = useState(true)
  // filter: null = all, 'active' = active pods, 'completed' = completed pods
  const [filter, setFilter] = useState(null)

  useEffect(() => {
    Promise.all([fetchProfile(), fetchMyPods()])
      .then(([profileRes, podsRes]) => {
        if (profileRes.data) setUser(profileRes.data)
        if (podsRes.data) setPods(podsRes.data.pods ?? podsRes.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await userLogout().catch(() => {})
    try { sessionStorage.removeItem('w3l_user_token') } catch {}
    document.cookie = 'w3l_user_auth=; path=/; Max-Age=0'
    router.push('/auth/login')
  }

  const totalPoP = pods.reduce((a, p) => a + (p.popCount ?? 0), 0)
  const avgReputation = pods.length
    ? Math.round(pods.reduce((a, p) => a + (p.reputationScore ?? 0), 0) / pods.length * 10) / 10
    : null
  const activePods = pods.filter(p => ACTIVE_STATUSES.includes(p.status))
  const completedPods = pods.filter(p => p.status === 'completed')

  const displayedPods = filter === 'active' ? activePods
    : filter === 'completed' ? completedPods
    : pods

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <NavBar user={user} onLogout={handleLogout} />

      <main className="max-w-[1100px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-10" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          {loading
            ? <Skeleton className="h-8 w-48 mb-2" />
            : <h1 className="font-serif text-[28px] sm:text-[34px] font-light tracking-[-0.04em] text-ink mb-1">
                {user?.displayName ? `Hey, ${user.displayName.split(' ')[0]}.` : 'Dashboard'}
              </h1>
          }
          <p className="text-[13.5px] font-light text-[#AAA]">Your pods, reputation, and earnings at a glance.</p>
        </div>

        {/* Stat cards — active pods and completed are clickable filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10" style={{ animation: 'up 0.5s 0.06s cubic-bezier(0.22,1,0.36,1) both' }}>
          {loading ? (
            [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[88px]" />)
          ) : (
            <>
              <StatCard label="Reputation" value={avgReputation ?? '—'} sub="avg across pods" icon="bi-star-fill" accent="#1DC433" href="/profile/pop" />
              <StatCard label="PoP Records" value={totalPoP} sub="verified badges" icon="bi-patch-check-fill" accent="#3B82F6" href="/profile/pop" />
              <StatCard
                label="Active Pods" value={activePods.length} sub="tap to filter"
                icon="bi-lightning-charge-fill" accent="#F59E0B"
                onClick={() => setFilter(f => f === 'active' ? null : 'active')}
                active={filter === 'active'}
              />
              <StatCard
                label="Completed" value={completedPods.length} sub="tap to filter"
                icon="bi-check-circle-fill" accent="#AAA"
                onClick={() => setFilter(f => f === 'completed' ? null : 'completed')}
                active={filter === 'completed'}
              />
            </>
          )}
        </div>

        {/* Active / Completed filter chips */}
        {filter && (
          <div className="flex items-center gap-2 mb-5" style={{ animation: 'up 0.2s both' }}>
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA]">
              Showing: {filter === 'active' ? 'Active pods' : 'Completed pods'}
            </span>
            <button onClick={() => setFilter(null)}
              className="font-mono text-[9px] tracking-[0.06em] uppercase text-[#CCC] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0">
              <i className="bi bi-x text-[12px]" /> Clear
            </button>
          </div>
        )}

        {/* Pods list */}
        <div style={{ animation: 'up 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-[20px] font-light text-ink tracking-[-0.03em]">
              {filter === 'active' ? 'Active pods' : filter === 'completed' ? 'Completed pods' : 'Your pods'}
            </h2>
            <Link href="/pod/create"
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ink border border-black/[0.12] rounded-full px-4 py-2 hover:bg-black/[0.04] transition-colors">
              <i className="bi bi-plus text-[13px]" />New pod
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-[160px]" />)}
            </div>
          ) : displayedPods.length === 0 ? (
            filter ? (
              <div className="bg-white border border-black/[0.07] rounded-[14px] px-8 py-10 text-center">
                <p className="text-[13.5px] font-light text-[#AAA]">No {filter} pods.</p>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {displayedPods.map(pod => <PodCard key={pod.id} pod={pod} />)}
            </div>
          )}
        </div>

        {!loading && totalPoP === 0 && pods.length > 0 && (
          <div className="mt-8 border border-black/[0.07] rounded-[14px] px-6 py-5 bg-white flex items-start gap-4" style={{ animation: 'up 0.5s 0.2s both' }}>
            <div className="w-9 h-9 rounded-[10px] bg-[#1DC433]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="bi bi-info-circle text-green-dark text-[16px]" />
            </div>
            <div>
              <p className="text-[13.5px] font-medium text-ink mb-1 tracking-[-0.01em]">Build your Proof-of-Performance</p>
              <p className="text-[12.5px] font-light text-[#888] leading-relaxed">
                PoP NFT badges are minted on Base when your pod completes verified work. They form your on-chain execution identity and unlock higher-value projects.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}