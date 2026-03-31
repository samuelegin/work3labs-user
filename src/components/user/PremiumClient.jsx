'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useWallet } from '@/hooks/useWallet'

const USDC_PRICES = {
  blue: 9,
  gold: 29,
}

const TIERS = [
  {
    key:     'blue',
    name:    'Blue',
    tagline: 'Verified contributor',
    color:   '#3B82F6',
    bg:      '#EFF6FF',
    border:  '#BFDBFE',
    darkBg:  'rgba(59,130,246,0.12)',
    imgSrc:  '/images/deals-icon.png',
    price:   USDC_PRICES.blue,
    perks: [
      'Blue badge on your public profile',
      'Priority visibility in pod matching',
      'Verified status on the leaderboard',
      'Early access to premium deals',
      'Standard support',
    ],
  },
  {
    key:     'gold',
    name:    'Gold',
    tagline: 'Elite contributor',
    color:   '#F59E0B',
    bg:      '#FFFBEB',
    border:  '#FDE68A',
    darkBg:  'rgba(245,158,11,0.12)',
    imgSrc:  '/images/wallet-earnings.png',
    price:   USDC_PRICES.gold,
    badge:   'Most value',
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

function Spinner() {
  return <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white spin-anim flex-shrink-0" />
}

export default function PremiumClient({ backHref = '/dashboard', backLabel = 'Dashboard' }) {
  const { address, isConnected, openModal, ensureBase } = useWallet()
  const [selected,   setSelected]   = useState(null)
  const [txStep,     setTxStep]     = useState('idle')  // idle | connect | approving | success | error
  const [txError,    setTxError]    = useState('')
  const [purchased,  setPurchased]  = useState(null)    // tier key that was bought

  async function handleBuy(tier) {
    if (txStep === 'approving') return

    // 1. Must connect wallet first
    if (!isConnected) {
      setSelected(tier.key)
      setTxStep('connect')
      await openModal()
      return
    }

    // 2. Ensure Base network
    setSelected(tier.key)
    setTxStep('approving')
    setTxError('')

    const { error: netErr } = await ensureBase()
    if (netErr) {
      setTxStep('error')
      setTxError(netErr)
      return
    }

    // 3. Real implementation: call USDC approve + transfer to escrow/treasury on Base
    // Replace this block with your actual contract call, e.g.:
    // const { hash, error: txErr } = await sendUsdcPayment({ to: TREASURY_ADDRESS, amount: tier.price, chain: 'base' })
    // Then POST to your API: await api.post('/user/premium/activate', { tier: tier.key, txHash: hash })

    // Simulating the wallet tx prompt (1.5s):
    await new Promise(r => setTimeout(r, 1500))

    // TODO: replace simulation with real tx
    // if (txErr) { setTxStep('error'); setTxError(txErr); return }

    setTxStep('success')
    setPurchased(tier.key)
  }

  const activeNetworkOk = isConnected

  return (
    <div className="min-h-screen bg-paper flex flex-col relative overflow-hidden mesh-green-tr mesh-blue-bl"
      style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* ── NAV ──────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href={backHref}
            className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />{backLabel}
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Get Premium</span>
          <div className="ml-auto flex items-center gap-2">
            {/* Wallet status pill */}
            {isConnected
              ? (
                <div className="hidden sm:flex items-center gap-1.5 bg-[#F4FAF7] border border-green-dark/15 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-dark" />
                  <span className="font-mono text-[10px] text-green-dark">{address?.slice(0,6)}…{address?.slice(-4)}</span>
                </div>
              ) : (
                <button onClick={() => openModal()}
                  className="hidden sm:flex items-center gap-1.5 border border-black/[0.09] rounded-full px-3 py-1 font-mono text-[10px] text-[#888] hover:border-black/20 hover:text-ink transition-all bg-transparent cursor-pointer">
                  <i className="bi bi-wallet2 text-[11px]" />Connect wallet
                </button>
              )
            }
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-10 sm:py-14">
        <div className="max-w-[800px] mx-auto" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>

          {/* ── SUCCESS STATE ──────────────────────────── */}
          {txStep === 'success' && purchased && (() => {
            const t = TIERS.find(x => x.key === purchased)
            return (
              <div className="text-center py-16">
                <img src="/images/success-hero.png" alt="" className="w-48 h-36 object-contain mx-auto mb-6" />
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: t.bg }}>
                  <i className={`bi bi-patch-check-fill text-[28px]`} style={{ color: t.color }} />
                </div>
                <h1 className="font-serif text-[30px] font-light tracking-[-0.04em] text-ink mb-2">
                  You're {t.name}! 🎉
                </h1>
                <p className="text-[14px] font-light text-[#888] mb-8 max-w-[360px] mx-auto">
                  Payment received via USDC on Base. Your {t.name} badge is now active.
                </p>
                <Link href={backHref}
                  className="inline-flex items-center gap-2 bg-ink text-paper font-sans text-[14px] font-medium px-6 py-3 rounded-[10px] hover:bg-[#1A1A1A] transition-colors">
                  <i className="bi bi-arrow-left text-[14px]" />Back to {backLabel}
                </Link>
              </div>
            )
          })()}

          {txStep !== 'success' && <>

          {/* ── HEADER ─────────────────────────────────── */}
          <div className="text-center mb-10">
            <img src="/images/action-icon.png" alt=""
              className="w-24 h-24 object-contain mx-auto mb-1 mix-blend-multiply opacity-90"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(45,200,150,0.25))' }} />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#AAA] mb-2">Upgrade your account</p>
            <h1 className="font-serif text-[30px] sm:text-[36px] font-light tracking-[-0.04em] text-ink mb-2">Get Premium</h1>
            <p className="text-[13.5px] font-light text-[#888] max-w-[380px] mx-auto leading-relaxed">
              Paid monthly in USDC on Base. Stand out, get matched faster, and unlock exclusive high-value deals.
            </p>
          </div>

          {/* ── WALLET CONNECT NOTICE ──────────────────── */}
          {!isConnected && (
            <div className="flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[14px] px-5 py-4 mb-6">
              <i className="bi bi-wallet2 text-[#3B82F6] text-[16px] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13.5px] font-medium text-[#1D4ED8] mb-0.5">Connect your wallet to pay</p>
                <p className="text-[12px] font-light text-[#3B82F6] leading-relaxed">
                  Premium subscriptions are paid in USDC on Base. Connect your wallet to proceed.
                </p>
              </div>
              <button onClick={() => openModal()}
                className="flex-shrink-0 flex items-center gap-1.5 bg-[#3B82F6] text-white font-sans text-[12.5px] font-medium px-4 py-2 rounded-[8px] border-none cursor-pointer hover:bg-[#2563EB] transition-colors">
                <i className="bi bi-wallet2 text-[12px]" />Connect
              </button>
            </div>
          )}

          {/* ── TIER CARDS ─────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
            {TIERS.map(tier => {
              const isSelected   = selected === tier.key
              const isBuying     = isSelected && txStep === 'approving'
              const needsConnect = isSelected && txStep === 'connect' && !isConnected

              return (
                <div key={tier.key}
                  className="bg-white border-2 rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col relative transition-all"
                  style={{ borderColor: isSelected ? tier.color : 'rgba(0,0,0,0.07)' }}>

                  {/* Most value badge */}
                  {tier.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="font-mono text-[9px] tracking-[0.1em] uppercase rounded-full px-2.5 py-1"
                        style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  {/* Card header */}
                  <div className="px-6 pt-6 pb-5 border-b border-black/[0.06] relative overflow-hidden">
                    <img src={tier.imgSrc} alt="" className="absolute right-0 top-0 h-full w-auto object-contain opacity-[0.09] pointer-events-none mix-blend-multiply" />
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: tier.bg }}>
                      <i className={`bi bi-patch-check-fill text-[22px]`} style={{ color: tier.color }} />
                    </div>
                    <h2 className="font-serif text-[22px] font-light tracking-[-0.03em] text-ink mb-0.5">{tier.name}</h2>
                    <p className="text-[12.5px] font-light text-[#AAA] mb-4">{tier.tagline}</p>
                    <div className="flex items-end gap-1">
                      <span className="font-serif text-[34px] font-light tracking-[-0.06em] leading-none" style={{ color: tier.color }}>
                        {tier.price}
                      </span>
                      <span className="font-mono text-[11px] text-[#AAA] mb-1">USDC/mo</span>
                    </div>
                    <p className="font-mono text-[9px] text-[#CCC] mt-1 tracking-[0.06em]">Paid on Base · Cancel anytime</p>
                  </div>

                  {/* Perks */}
                  <div className="px-6 py-5 flex-1">
                    <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#CCC] mb-3">What you get</p>
                    <div className="space-y-2.5">
                      {tier.perks.map((perk, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <i className="bi bi-check-circle-fill text-[12px] flex-shrink-0 mt-[1px]" style={{ color: tier.color }} />
                          <span className="text-[13px] font-light text-[#555]">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-6 pb-6 space-y-2">
                    {/* Error for this card */}
                    {isSelected && txStep === 'error' && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2.5">
                        <i className="bi bi-exclamation-circle text-red-500 text-[12px] flex-shrink-0 mt-0.5" />
                        <p className="text-[11.5px] text-red-600 font-light">{txError}</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleBuy(tier)}
                      disabled={isBuying}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[10px] font-sans text-[14px] font-medium transition-all border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: tier.color, color: '#fff' }}>
                      {isBuying
                        ? <><Spinner />Waiting for wallet…</>
                        : !isConnected
                          ? <><i className="bi bi-wallet2 text-[14px]" />Connect & Pay {tier.price} USDC</>
                          : <><i className="bi bi-patch-check-fill text-[14px]" />Pay {tier.price} USDC · Get {tier.name}</>
                      }
                    </button>

                    {isConnected && (
                      <p className="text-center font-mono text-[9.5px] text-[#CCC] tracking-[0.04em]">
                        {address?.slice(0,6)}…{address?.slice(-4)} on Base
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── PAYMENT INFO ───────────────────────────── */}
          <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-black/[0.05] flex items-center gap-2">
              <i className="bi bi-shield-check text-green-dark text-[14px]" />
              <p className="font-sans text-[13.5px] font-medium text-ink">How payment works</p>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {[
                { icon: 'bi-wallet2',         color: '#3B82F6', title: 'Connect Base wallet',   desc: 'Use MetaMask, Coinbase Wallet, or any Base-compatible wallet via RainbowKit.' },
                { icon: 'bi-currency-dollar', color: '#1DC433', title: 'Approve USDC transfer',  desc: 'Your wallet will prompt you to sign a USDC transfer. No gas fees beyond a small Base tx fee (~$0.01).' },
                { icon: 'bi-patch-check-fill',color: '#F59E0B', title: 'Badge activates instantly', desc: 'Once the transaction confirms on Base, your badge goes live on your profile immediately.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: step.color + '15' }}>
                    <i className={`bi ${step.icon} text-[13px]`} style={{ color: step.color }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink mb-0.5">{step.title}</p>
                    <p className="text-[12px] font-light text-[#888] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── COMPARISON NOTE ────────────────────────── */}
          <div className="flex items-start gap-3 bg-white border border-black/[0.07] rounded-[14px] px-5 py-4">
            <i className="bi bi-info-circle text-[#CCC] text-[14px] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-ink mb-1">Not sure which to pick?</p>
              <p className="text-[12.5px] font-light text-[#888] leading-relaxed">
                Start with <strong className="text-[#3B82F6]">Blue (9 USDC/mo)</strong> for verified status and priority matching.
                Upgrade to <strong className="text-[#F59E0B]">Gold (29 USDC/mo)</strong> for elite placement, KYC fast-track, and exclusive deals.
                Subscriptions are non-custodial — cancel anytime.
              </p>
            </div>
          </div>

          </>}
        </div>
      </div>
    </div>
  )
}
