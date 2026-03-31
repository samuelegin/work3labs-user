'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/api'
import ThemeToggle from '@/components/ThemeToggle'

const NOTIF_ICONS = {
  pod_invite: { icon: 'bi-people', color: '#3B82F6' },
  pod_application: { icon: 'bi-person-plus', color: '#8B5CF6' },
  application_accepted: { icon: 'bi-check-circle', color: '#1DC433' },
  application_rejected: { icon: 'bi-x-circle', color: '#EF4444' },
  job_assigned: { icon: 'bi-briefcase', color: '#1DC433' },
  work_submitted: { icon: 'bi-send-check', color: '#3B82F6' },
  work_approved: { icon: 'bi-patch-check', color: '#1DC433' },
  funds_released: { icon: 'bi-cash-coin', color: '#1DC433' },
  pop_minted: { icon: 'bi-patch-check-fill', color: '#3B82F6' },
  rating_received: { icon: 'bi-star-fill', color: '#F59E0B' },
  dispute_opened: { icon: 'bi-exclamation-triangle', color: '#EF4444' },
  dispute_resolved: { icon: 'bi-shield-check', color: '#1DC433' },
}

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
      .then(({ data }) => { if (data) setNotifications(data.notifications ?? []) })
      .finally(() => setLoading(false))
  }, [])

  async function handleMarkAll() {
    setMarkingAll(true)
    await markAllNotificationsRead()
    setNotifications(n => n.map(x => ({ ...x, read: true })))
    setMarkingAll(false)
  }

  async function handleMarkOne(id) {
    await markNotificationRead(id)
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x))
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[680px] mx-auto px-5 sm:px-8 h-[58px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
              <i className="bi bi-arrow-left text-[11px]" />Dashboard
            </Link>
            <span className="text-[#E0E0E0] text-[12px]">/</span>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Notifications</span>
            {unread > 0 && (
              <span className="font-mono text-[9px] bg-green-dark text-ink font-bold rounded-full px-2 py-0.5">{unread} new</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button onClick={handleMarkAll} disabled={markingAll}
                className="font-mono text-[9px] tracking-[0.08em] uppercase text-[#AAA] hover:text-ink transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50">
                Mark all read
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-5 sm:px-8 py-8">
        <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-16 flex flex-col items-center text-center">
              <img src="/images/action-icon.png" alt="" className="w-24 h-24 object-contain mb-2 opacity-70 mix-blend-multiply" />
              <div className="w-10 h-10 rounded-full bg-[#F4F4F2] flex items-center justify-center mb-3">
                <i className="bi bi-bell text-[18px] text-[#CCC]" />
              </div>
              <p className="font-serif text-[18px] font-light text-ink mb-2">All caught up</p>
              <p className="text-[13px] font-light text-[#AAA]">No notifications yet. Pod updates, job alerts, and ratings will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05]">
              {notifications.map(n => {
                const cfg = NOTIF_ICONS[n.type] ?? { icon: 'bi-bell', color: '#AAA' }
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkOne(n.id)}
                    className={`flex items-start gap-4 px-6 py-5 transition-colors ${!n.read ? 'bg-[#F9FFF9] cursor-pointer hover:bg-[#F0FDF4]' : 'hover:bg-[#FAFAFA]'}`}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.color + '15' }}>
                      <i className={`bi ${cfg.icon} text-[14px]`} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13.5px] leading-snug ${!n.read ? 'font-medium text-ink' : 'font-light text-[#555]'}`}>{n.title}</p>
                      {n.body && <p className="text-[12px] font-light text-[#888] mt-0.5 leading-relaxed">{n.body}</p>}
                      <p className="font-mono text-[10px] text-[#CCC] mt-1.5">
                        {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-green-dark flex-shrink-0 mt-2" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
