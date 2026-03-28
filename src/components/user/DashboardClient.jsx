'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchProfile, fetchMyPods, fetchDashboardSummary, fetchNotifications, userLogout } from '@/services/api'

const STATUS = {
  forming: { label: 'Forming', color: '#F59E0B' },
  active: { label: 'Active', color: '#1DC433' },
  submitted: { label: 'Submitted', color: '#3B82F6' },
  reviewing: { label: 'Reviewing', color: '#8B5CF6' },
  approved: { label: 'Approved', color: '#1DC433' },
  claimable: { label: 'Claimable', color: '#2DFC44' },
  completed: { label: 'Completed', color: '#AAA' },
}

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

function NavBar({ user, unreadCount, onLogout }) {
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

          {/* Notifications bell */}
          <Link href="/notifications" className="relative w-9 h-9 flex items-center justify-center border border-black/[0.09] rounded-[8px] hover:border-black/20 transition-colors">
            <i className="bi bi-bell text-[15px] text-[#555]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-dark rounded-full flex items-center justify-center font-mono text-[8px] text-ink font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
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
              <div className="absolute right-0 top-full mt-1.5 w-[200px] bg-white border border-black/[0.07] rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50" style={{ animation: 'up 0.15s both' }}>
                {user?.username && (
                  <Link href={`/u/${user.username}`} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                    <i className="bi bi-person-circle text-[14px] text-[#AAA]" />Public profile
                  </Link>
                )}
                <Link href="/profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                  <i className="bi bi-sliders text-[14px] text-[#AAA]" />Edit profile
                </Link>
                <Link href="/profile/pop" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                  <i className="bi bi-patch-check text-[14px] text-[#AAA]" />Performance Book
                </Link>
                <Link href="/marketplace" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                  <i className="bi bi-briefcase text-[14px] text-[#AAA]" />Marketplace
                </Link>
                <Link href="/blue-tick" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 hover:bg-[#FAFAFA] transition-colors text-[13px] font-light text-ink border-b border-black/[0.05]">
                  <i className="bi bi-patch-check-fill text-[14px] text-[#3B82F6]" />Get Blue Tick
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

function StatCard({ label, value, sub, icon, accent, href, onClick, active }) {
  const clickable = href || onClick
  const inner = (
    <div className={`bg-white rounded-[14px] px-5 py-5 flex items-start gap-4 transition-all ${
      active ? 'border-2 shadow-[0_2px_16px_rgba(0,0,0,0.08)] cursor-pointer'
      : clickable ? 'border border-black/[0.07] hover:border-black/[0.14] hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)] cursor-pointer'
      : 'border border-black/[0.07]'
    }`} style={active ? { borderColor: accent } : {}}>
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
      <div className="group bg-white border border-black/[0.07] rounded-[14px] p-5 hover:border-black/[0.14] hover:shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em] truncate group-hover:text-green-dark transition-colors">{pod.name}</p>
            <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase mt-0.5" style={{ color: s.color }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-px" style={{ background: s.color }} />
              {s.label}
            </p>
          </div>
          {pod.myRole === 'admin' && (
            <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-green-dark border border-green-dark/20 bg-green-dark/5 rounded-full px-2 py-0.5 flex-shrink-0">Admin</span>
          )}
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-black/[0.05]">
          <span className="flex items-center gap-1 text-[11px] font-light text-[#AAA]">
            <i className="bi bi-people text-[11px]" />{pod.memberCount ?? 0}
          </span>
          {pod.reputationScore != null && (
            <span className="flex items-center gap-1 text-[11px] font-light text-[#AAA]">
              <i className="bi bi-star text-[10px]" />{pod.reputationScore}
            </span>
          )}
          {pod.popCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-light text-[#AAA]">
              <i className="bi bi-patch-check text-[10px] text-[#3B82F6]" />{pod.popCount}
            </span>
          )}
          {pod.earningsUsd > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-light text-green-dark ml-auto">
              <i className="bi bi-cash-coin text-[10px]" />${pod.earningsUsd.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function NotificationRow({ notif }) {
  const icons = {
    pod_invite: 'bi-people text-[#3B82F6]',
    job_assigned: 'bi-briefcase text-green-dark',
    work_approved: 'bi-patch-check text-green-dark',
    pop_minted: 'bi-patch-check-fill text-[#3B82F6]',
    rating_received: 'bi-star-fill text-[#F59E0B]',
    dispute_opened: 'bi-exclamation-triangle text-red-400',
    funds_released: 'bi-cash-coin text-green-dark',
  }
  const iconCls = icons[notif.type] ?? 'bi-bell text-[#AAA]'

  return (
    <div className={`flex items-start gap-3 px-5 py-4 border-b border-black/[0.05] last:border-b-0 ${!notif.read ? 'bg-[#F9FFF9]' : 'hover:bg-[#FAFAFA]'} transition-colors`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!notif.read ? 'bg-green-dark/10' : 'bg-[#F4F4F2]'}`}>
        <i className={`bi ${iconCls} text-[13px]`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug ${!notif.read ? 'font-medium text-ink' : 'font-light text-[#555]'}`}>{notif.title}</p>
        {notif.body && <p className="text-[11.5px] font-light text-[#AAA] mt-0.5">{notif.body}</p>}
        <p className="font-mono text-[9.5px] text-[#CCC] mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
      </div>
      {!notif.read && <span className="w-2 h-2 rounded-full bg-green-dark flex-shrink-0 mt-1.5" />}
    </div>
  )
}

export default function DashboardClient() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [summary, setSummary] = useState(null)
  const [pods, setPods] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [podFilter, setPodFilter] = useState(null)

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchMyPods(),
      fetchDashboardSummary(),
      fetchNotifications({ unreadOnly: false }),
    ]).then(([profileRes, podsRes, summaryRes, notifsRes]) => {
      if (profileRes.data) setUser(profileRes.data)
      if (podsRes.data) setPods(podsRes.data.pods ?? podsRes.data ?? [])
      if (summaryRes.data) setSummary(summaryRes.data)
      if (notifsRes.data) setNotifications(notifsRes.data.notifications ?? [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await userLogout().catch(() => {})
    try { sessionStorage.removeItem('w3l_user_token') } catch {}
    document.cookie = 'w3l_user_auth=; path=/; Max-Age=0'
    router.push('/auth/login')
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const activePods = pods.filter(p => ['active', 'submitted', 'reviewing', 'approved', 'claimable'].includes(p.status))
  const completedPods = pods.filter(p => p.status === 'completed')
  const displayedPods = podFilter === 'active' ? activePods : podFilter === 'completed' ? completedPods : pods
  const recentNotifs = notifications.slice(0, 5)

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <NavBar user={user} unreadCount={unreadCount} onLogout={handleLogout} />

      <main className="max-w-[1100px] mx-auto px-5 sm:px-8 py-8 sm:py-12">

        {/* Greeting */}
        <div className="mb-8" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          {loading ? <Skeleton className="h-8 w-48 mb-2" /> : (
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-[28px] sm:text-[34px] font-light tracking-[-0.04em] text-ink">
                {user?.displayName ? `Hey, ${user.displayName.split(' ')[0]}.` : 'Dashboard'}
              </h1>
              {user?.blueTick && <i className="bi bi-patch-check-fill text-[#3B82F6] text-[20px]" title="Blue Tick" />}
              {user?.goldTick && <i className="bi bi-patch-check-fill text-[#F59E0B] text-[20px]" title="Gold Tick" />}
            </div>
          )}
          <p className="text-[13.5px] font-light text-[#AAA]">Your performance, pods, and earnings.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" style={{ animation: 'up 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) both' }}>
          {loading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-[88px]" />) : (
            <>
              <StatCard
                label="Total Earnings" icon="bi-cash-coin" accent="#1DC433"
                value={`$${(user?.totalEarningsUsd ?? 0).toLocaleString()}`}
                sub="exact earnings"
                href="/leaderboard"
              />
              <StatCard
                label="Reputation" icon="bi-star-fill" accent="#F59E0B"
                value={user?.reputationScore ?? '—'}
                sub="overall score"
                href="/profile/pop"
              />
              <StatCard
                label="PoP Badges" icon="bi-patch-check-fill" accent="#3B82F6"
                value={user?.totalPops ?? 0}
                sub="verified on-chain"
                href="/profile/pop"
              />
              <StatCard
                label="Active Pods" icon="bi-lightning-charge-fill" accent="#8B5CF6"
                value={activePods.length}
                sub="tap to filter"
                onClick={() => setPodFilter(f => f === 'active' ? null : 'active')}
                active={podFilter === 'active'}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — pods + create */}
          <div className="lg:col-span-2 space-y-5">

            {/* Pods section */}
            <div style={{ animation: 'up 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-[19px] font-light text-ink tracking-[-0.03em]">Your pods</h2>
                  {podFilter && (
                    <button onClick={() => setPodFilter(null)}
                      className="font-mono text-[9px] tracking-[0.06em] uppercase text-[#CCC] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0">
                      <i className="bi bi-x text-[12px]" /> clear
                    </button>
                  )}
                </div>
                <Link href="/pod/create"
                  className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ink border border-black/[0.12] rounded-full px-3.5 py-1.5 hover:bg-black/[0.04] transition-colors">
                  <i className="bi bi-plus text-[13px]" />New
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-[100px]" />)}</div>
              ) : displayedPods.length === 0 ? (
                <div className="bg-white border border-black/[0.07] rounded-[14px] px-8 py-12 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F4F4F2] flex items-center justify-center mb-4">
                    <i className="bi bi-people text-[20px] text-[#CCC]" />
                  </div>
                  <p className="font-serif text-[18px] font-light text-ink tracking-[-0.03em] mb-2">{podFilter ? `No ${podFilter} pods` : 'No pods yet'}</p>
                  {!podFilter && (
                    <Link href="/pod/create" className="mt-4 inline-flex items-center gap-2 bg-ink text-paper font-sans text-[13px] font-medium px-4 py-2.5 rounded-[10px] hover:bg-[#1A1A1A] transition-colors">
                      <i className="bi bi-plus text-[14px]" />Create your first pod
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedPods.map(pod => <PodCard key={pod.id} pod={pod} />)}
                </div>
              )}
            </div>

            {/* Active jobs section */}
            <div style={{ animation: 'up 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-[19px] font-light text-ink tracking-[-0.03em]">Active projects</h2>
              </div>
              <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-10 flex flex-col items-center text-center">
                <i className="bi bi-briefcase text-[24px] text-[#CCC] mb-3" />
                <p className="text-[13px] font-light text-[#AAA]">No active projects. Jobs you're assigned to will appear here.</p>
              </div>
            </div>
          </div>

          {/* Right column — notifications + quick actions */}
          <div className="space-y-5">

            {/* Quick actions */}
            <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div className="px-5 py-4 border-b border-black/[0.06]">
                <h3 className="font-sans text-[13.5px] font-medium text-ink tracking-[-0.01em]">Quick actions</h3>
              </div>
              <div className="divide-y divide-black/[0.05]">
                {[
                  { href: '/marketplace', icon: 'bi-briefcase', label: 'Marketplace', sub: 'Browse open jobs' },
                  { href: '/pod/create', icon: 'bi-people', label: 'Create a pod', sub: 'Min 2, max 5 members' },
                  { href: '/profile/pop', icon: 'bi-patch-check-fill text-[#3B82F6]', label: 'Performance Book', sub: 'View all PoP badges' },
                  { href: '/leaderboard', icon: 'bi-trophy text-[#F59E0B]', label: 'Leaderboard', sub: 'See top earners' },
                  { href: '/blue-tick', icon: 'bi-patch-check-fill text-[#3B82F6]', label: 'Buy Blue Tick', sub: 'Verified status' },
                ].map(({ href, icon, label, sub }) => (
                  <Link key={href} href={href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">
                    <i className={`bi ${icon} text-[16px] w-5 text-center`} />
                    <div>
                      <p className="font-sans text-[13px] font-medium text-ink tracking-[-0.01em]">{label}</p>
                      <p className="text-[11px] font-light text-[#AAA]">{sub}</p>
                    </div>
                    <i className="bi bi-arrow-right text-[11px] text-[#CCC] ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Notifications preview */}
            <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.12s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
                <h3 className="font-sans text-[13.5px] font-medium text-ink tracking-[-0.01em]">Notifications</h3>
                <Link href="/notifications" className="font-mono text-[9px] tracking-[0.08em] uppercase text-[#AAA] hover:text-ink transition-colors">
                  See all
                  {unreadCount > 0 && <span className="ml-1.5 bg-green-dark text-ink font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>}
                </Link>
              </div>
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : recentNotifs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <i className="bi bi-bell text-[22px] text-[#DDD] block mb-2" />
                  <p className="text-[12.5px] font-light text-[#CCC]">No notifications yet</p>
                </div>
              ) : (
                recentNotifs.map(n => <NotificationRow key={n.id} notif={n} />)
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
