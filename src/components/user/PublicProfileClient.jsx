'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchPublicProfile, fetchUserRatings } from '@/services/api'

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

function StarRating({ stars }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <i key={i} className={`bi ${i <= stars ? 'bi-star-fill text-[#F59E0B]' : 'bi-star text-[#DDD]'} text-[12px]`} />
      ))}
    </div>
  )
}

export default function PublicProfileClient({ username }) {
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchPublicProfile(username),
      fetchUserRatings(username),
    ]).then(([profileRes, ratingsRes]) => {
      if (profileRes.error || !profileRes.data) { setNotFound(true); return }
      setProfile(profileRes.data)
      if (ratingsRes.data) setRatings(ratingsRes.data.ratings ?? [])
    }).finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-14 space-y-4">
          <Skeleton className="h-[160px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="text-center">
          <p className="font-serif text-[22px] font-light text-ink mb-2">Profile not found</p>
          <p className="text-[13.5px] font-light text-[#AAA] mb-6">@{username} doesn't exist.</p>
          <Link href="/leaderboard" className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA] hover:text-ink transition-colors">
            View leaderboard
          </Link>
        </div>
      </div>
    )
  }

  const avgRating = ratings.length
    ? Math.round(ratings.reduce((a, r) => a + r.stars, 0) / ratings.length * 10) / 10
    : null

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[720px] mx-auto px-5 sm:px-8 h-[58px] flex items-center justify-between">
          <Link href="/leaderboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Leaderboard
          </Link>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">@{username}</span>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-5">

        {/* Profile header */}
        <div className="bg-white border border-black/[0.07] rounded-[14px] p-7" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="flex items-start gap-5 mb-5">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-black/[0.07] flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
                <span className="font-serif text-[26px] font-light text-paper">{profile.displayName?.[0]?.toUpperCase() ?? '?'}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h1 className="font-serif text-[24px] font-light tracking-[-0.04em] text-ink">{profile.displayName}</h1>
                {profile.blueTick && (
                  <span title="Blue Tick" className="flex items-center gap-1 font-mono text-[9px] tracking-[0.06em] uppercase text-[#3B82F6] border border-[#3B82F6]/20 bg-[#3B82F6]/05 rounded-full px-2 py-0.5">
                    <i className="bi bi-patch-check-fill text-[10px]" />Verified
                  </span>
                )}
                {profile.goldTick && (
                  <span title="Gold Tick" className="flex items-center gap-1 font-mono text-[9px] tracking-[0.06em] uppercase text-[#F59E0B] border border-[#F59E0B]/20 bg-[#F59E0B]/05 rounded-full px-2 py-0.5">
                    <i className="bi bi-patch-check-fill text-[10px]" />Gold
                  </span>
                )}
              </div>
              <p className="font-mono text-[10.5px] text-[#AAA]">@{profile.username}</p>
              {profile.bio && <p className="text-[13px] font-light text-[#666] mt-2 leading-relaxed">{profile.bio}</p>}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-black/[0.06]">
            <div className="text-center">
              <p className="font-serif text-[22px] font-light text-green-dark tracking-[-0.05em] leading-none mb-0.5">
                ${(profile.totalEarningsUsd ?? 0).toLocaleString()}
              </p>
              <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#AAA]">Total earned</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-[22px] font-light text-ink tracking-[-0.05em] leading-none mb-0.5">{profile.reputationScore ?? '—'}</p>
              <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#AAA]">Reputation</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-[22px] font-light text-[#3B82F6] tracking-[-0.05em] leading-none mb-0.5">{profile.totalPops ?? 0}</p>
              <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#AAA]">PoP badges</p>
            </div>
          </div>

          {/* Role tags */}
          {profile.roleTags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {profile.roleTags.map(r => (
                <span key={r} className="font-mono text-[10px] text-ink border border-black/[0.12] bg-[#F4F4F2] rounded-full px-2.5 py-[3px]">{r}</span>
              ))}
            </div>
          )}

          {/* Skill tags */}
          {profile.skillTags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {profile.skillTags.map(s => (
                <span key={s} className="font-mono text-[10px] text-[#999] border border-black/[0.09] rounded-full px-2.5 py-[3px]">{s}</span>
              ))}
            </div>
          )}

          {/* Wallet addresses */}
          <div className="space-y-1.5 mb-4">
            {profile.baseWallet && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-[#3B82F6] tracking-[0.06em] uppercase border border-[#3B82F6]/20 rounded-full px-1.5 py-0.5">Base</span>
                <span className="font-mono text-[11px] text-[#888]">{profile.baseWallet.slice(0, 8)}…{profile.baseWallet.slice(-6)}</span>
              </div>
            )}
            {profile.solanaWallet && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-[#9945FF] tracking-[0.06em] uppercase border border-[#9945FF]/20 rounded-full px-1.5 py-0.5">Solana</span>
                <span className="font-mono text-[11px] text-[#888]">{profile.solanaWallet.slice(0, 8)}…{profile.solanaWallet.slice(-6)}</span>
              </div>
            )}
          </div>

          {/* Social links */}
          {profile.socials && (
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'twitter', icon: 'bi-twitter-x', url: `https://x.com/${profile.socials.twitter}` },
                { key: 'github', icon: 'bi-github', url: `https://github.com/${profile.socials.github}` },
                { key: 'telegram', icon: 'bi-telegram', url: `https://t.me/${profile.socials.telegram}` },
                { key: 'discord', icon: 'bi-discord', url: profile.socials.discord },
              ].filter(s => profile.socials[s.key]).map(s => (
                <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-[10px] text-[#AAA] hover:text-ink transition-colors">
                  <i className={`bi ${s.icon} text-[13px]`} />
                  {profile.socials[s.key]}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* PoP badges */}
        {profile.popRecords?.length > 0 && (
          <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.08s both' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <h2 className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em]">Proof-of-Performance</h2>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {profile.popRecords.map((rec, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[10px] bg-[#F4FAF7] border border-green-dark/15 flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-patch-check-fill text-green-dark text-[16px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[13px] font-medium text-ink">{rec.workType}</p>
                    <p className="font-mono text-[10px] text-[#AAA]">{rec.podName}</p>
                  </div>
                  {rec.score != null && (
                    <span className="font-serif text-[20px] font-light text-green-dark tracking-[-0.05em]">{rec.score}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden" style={{ animation: 'up 0.5s 0.1s both' }}>
          <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
            <h2 className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em]">Ratings</h2>
            {avgRating != null && (
              <div className="flex items-center gap-2">
                <StarRating stars={Math.round(avgRating)} />
                <span className="font-mono text-[11px] text-[#888]">{avgRating} · {ratings.length} reviews</span>
              </div>
            )}
          </div>
          {ratings.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] font-light text-[#CCC]">No ratings yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05]">
              {ratings.map((r, i) => (
                <div key={i} className="px-6 py-5">
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating stars={r.stars} />
                    <span className="font-mono text-[10px] text-[#CCC]">
                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.feedback && <p className="text-[13px] font-light text-[#555] leading-relaxed">{r.feedback}</p>}
                  <p className="font-mono text-[10px] text-[#CCC] mt-1.5">by @{r.authorUsername}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
