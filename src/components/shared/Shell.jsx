'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard',     icon: 'bi-grid-1x2',         label: 'Dashboard' },
  { href: '/marketplace',   icon: 'bi-briefcase',         label: 'Deals' },
  { href: '/leaderboard',   icon: 'bi-trophy',            label: 'Leaderboard' },
  { href: '/notifications', icon: 'bi-bell',              label: 'Notifications' },
  { href: '/profile',       icon: 'bi-person-circle',     label: 'Profile' },
]

export default function Shell({ children, user }) {
  const path = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const logout = () => {
    document.cookie = 'w3l_user_auth=; Max-Age=0; path=/'
    router.push('/auth/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 40
      }} className="hidden lg:flex">
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <img src="/logo.png" alt="Work3 Labs" style={{ height: 28 }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(n => {
            const active = path.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                color: active ? 'var(--accent)' : 'var(--ink-muted)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                fontSize: 14, fontWeight: active ? 500 : 400,
                transition: 'all 0.15s',
                textDecoration: 'none'
              }}>
                <i className={`bi ${n.icon}`} style={{ fontSize: 16 }} />
                {n.label}
                {n.href === '/notifications' && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--accent)',
                    color: '#0D0D0F', borderRadius: '999px',
                    fontSize: 10, fontWeight: 700, padding: '1px 6px'
                  }}>3</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div style={{ padding: '14px 14px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-dim), var(--blue-dim))',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, color: 'var(--accent)'
              }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {user.name || 'User'}
                  {user.isPremium && <i className="bi bi-patch-check-fill" style={{ color: 'var(--premium)', fontSize: 12 }} />}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <button onClick={logout} style={{
              width: '100%', background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--ink-muted)', borderRadius: 8, padding: '7px', fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>
              <i className="bi bi-box-arrow-right" /> Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 50
      }} className="lg:hidden flex">
        <img src="/logo.png" alt="Work3 Labs" style={{ height: 24 }} />
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: 'var(--ink)', fontSize: 20, cursor: 'pointer' }}>
          <i className={`bi ${mobileOpen ? 'bi-x' : 'bi-list'}`} />
        </button>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 45,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
        }} onClick={() => setMobileOpen(false)}>
          <div style={{
            position: 'absolute', top: 56, left: 0, right: 0,
            background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
            padding: '8px 10px'
          }} onClick={e => e.stopPropagation()}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 10,
                color: path.startsWith(n.href) ? 'var(--accent)' : 'var(--ink-muted)',
                background: path.startsWith(n.href) ? 'var(--accent-dim)' : 'transparent',
                fontSize: 14, textDecoration: 'none'
              }}>
                <i className={`bi ${n.icon}`} style={{ fontSize: 17 }} />
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 0, paddingTop: 0 }} className="lg:ml-[220px]">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
