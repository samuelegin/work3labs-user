'use client'
import { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

const TIERS = [
  {
    key:      'blue',
    name:     'Blue',
    tagline:  'Verified contributor',
    color:    '#3B82F6',
    bg:       '#EFF6FF',
    border:   '#BFDBFE',
    icon:     'bi-patch-check-fill',
    price:    9,
    period:   '/mo',
    perks: [
      'Blue badge on your public profile',
      'Priority visibility in pod matching',
      'Verified status on the leaderboard',
      'Early access to premium deals',
      'Standard support',
    ],
  },
  {
    key:      'gold',
    name:     'Gold',
    tagline:  'Elite contributor',
    color:    '#F59E0B',
    bg:       '#FFFBEB',
    border:   '#FDE68A',
    icon:     'bi-patch-check-fill',
    price:    29,
    period:   '/mo',
    badge:    'Most value',
    perks: [
      'Gold badge — highest trust signal',
      'Top placement in all deal searches',
      'KYC fast-track for high-value deals',
      'Dedicated account manager',
      'Revenue share on referrals',
      'Exclusive Gold-only deal access',
    ],
  },
]

export default function BlueTickClient() {
  const [selected, setSelected] = useState(null)  // 'blue' | 'gold'
  const [buying,   setBuying]   = useState(false)

  async function handleBuy(tier) {
    if (buying) return
    setSelected(tier.key)
    setBuying(true)
    // TODO: wire to payment API — e.g. await api.post('/user/premium/buy', { tier: tier.key })
    await new Promise(r => setTimeout(r, 1200))
    setBuying(false)
    alert(`${tier.name} Premium purchased! (placeholder — wire to payment API)`)
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col relative overflow-hidden mesh-green-tr mesh-blue-bl"
      style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* Nav */}
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[760px] mx-auto px-4 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Get Premium</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </div>

      <div className="flex-1 px-4 py-12 sm:py-16">
        <div className="max-w-[760px] mx-auto" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>

          {/* Header */}
          {/*
            IMAGE PLACEHOLDER — Premium page hero
            PROMPT: "Two glowing badges side by side, one blue sapphire and one gold, floating on a dark background with soft light rays, luxury Web3 aesthetic, no text"
            REPLACE: add <img src="/images/premium-hero.jpg" className="w-full h-32 object-cover rounded-[18px] mb-8 opacity-80" /> here
          */}
          <div className="text-center mb-10">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#AAA] mb-3">Upgrade your account</p>
            <h1 className="font-serif text-[32px] sm:text-[38px] font-light tracking-[-0.04em] text-ink mb-3">Get Premium</h1>
            <p className="text-[14px] font-light text-[#888] max-w-[400px] mx-auto leading-relaxed">
              Stand out, get matched faster, and unlock exclusive high-value deals.
            </p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            {TIERS.map(tier => (
              <div key={tier.key}
                className="bg-white border rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col relative"
                style={{ borderColor: selected === tier.key ? tier.color : 'rgba(0,0,0,0.07)' }}>

                {/* Most value badge */}
                {tier.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="font-mono text-[9px] tracking-[0.1em] uppercase rounded-full px-2.5 py-1"
                      style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="px-6 pt-7 pb-5 border-b border-black/[0.06]">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: tier.bg }}>
                    <i className={`bi ${tier.icon} text-[26px]`} style={{ color: tier.color }} />
                  </div>
                  <h2 className="font-serif text-[22px] font-light tracking-[-0.03em] text-ink mb-1">{tier.name}</h2>
                  <p className="text-[13px] font-light text-[#AAA]">{tier.tagline}</p>
                  <div className="flex items-end gap-1 mt-4">
                    <span className="font-serif text-[36px] font-light tracking-[-0.06em] leading-none" style={{ color: tier.color }}>
                      ${tier.price}
                    </span>
                    <span className="font-mono text-[11px] text-[#AAA] mb-1">{tier.period}</span>
                  </div>
                </div>

                {/* Perks */}
                <div className="px-6 py-5 flex-1">
                  <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#CCC] mb-4">What you get</p>
                  <div className="space-y-3">
                    {tier.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <i className="bi bi-check-circle-fill text-[12px] flex-shrink-0 mt-0.5" style={{ color: tier.color }} />
                        <span className="text-[13px] font-light text-[#555]">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => handleBuy(tier)}
                    disabled={buying && selected === tier.key}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-[10px] font-sans text-[14px] font-medium transition-all border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: tier.color, color: '#fff' }}>
                    {buying && selected === tier.key
                      ? <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white spin-anim" />
                      : <i className={`bi ${tier.icon} text-[15px]`} />
                    }
                    {buying && selected === tier.key ? 'Processing…' : `Get ${tier.name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison note */}
          <div className="bg-white border border-black/[0.07] rounded-[14px] px-6 py-5">
            <div className="flex items-start gap-3">
              <i className="bi bi-info-circle text-[#CCC] text-[14px] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-ink mb-1">Not sure which to pick?</p>
                <p className="text-[12.5px] font-light text-[#888] leading-relaxed">
                  Start with <strong className="text-[#3B82F6]">Blue</strong> to get verified and unlock priority matching.
                  Upgrade to <strong className="text-[#F59E0B]">Gold</strong> for elite placement, KYC fast-track, and exclusive deal access.
                  Both can be cancelled anytime.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-[11.5px] font-light text-[#CCC] mt-6 leading-relaxed">
            Subscriptions renew monthly. Cancel anytime from your profile settings. Pricing in USD.
          </p>
        </div>
      </div>
    </div>
  )
}
