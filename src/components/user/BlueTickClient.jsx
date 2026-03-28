'use client'

import Link from 'next/link'

export default function BlueTickClient() {
  return (
    <div className="min-h-screen bg-paper flex flex-col relative overflow-hidden mesh-green-tr mesh-blue-bl" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[560px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Blue Tick</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-[460px]" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-7 pt-8 pb-6 border-b border-black/[0.06] text-center">
              <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-patch-check-fill text-[#3B82F6] text-[28px]" />
              </div>
              <h1 className="font-serif text-[24px] font-light tracking-[-0.04em] text-ink mb-1">Blue Tick</h1>
              <p className="text-[13px] font-light text-[#AAA]">Verified contributor status · Coming soon</p>
            </div>

            <div className="px-7 py-7 space-y-4">
              <div className="bg-[#FAFAF8] border border-black/[0.07] rounded-[12px] px-5 py-5">
                <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#CCC] mb-3">What you get</p>
                <div className="space-y-3">
                  {[
                    'Blue tick badge on your public profile',
                    'Priority visibility in pod matching',
                    'Verified status on the leaderboard',
                    'Early access to premium jobs',
                    'Gold Tick upgrade path (coming later)',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <i className="bi bi-check-circle-fill text-[#3B82F6] text-[12px] flex-shrink-0" />
                      <span className="text-[13px] font-light text-[#555]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] px-5 py-4">
                <span className="font-serif text-[28px] font-light text-[#3B82F6] tracking-[-0.05em]">$—</span>
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#93C5FD]">Price TBD</span>
              </div>

              <button disabled
                className="w-full flex items-center justify-center gap-2.5 bg-[#3B82F6] text-white py-3.5 rounded-[10px] font-sans text-[14px] font-medium opacity-50 cursor-not-allowed border-none">
                <i className="bi bi-patch-check-fill text-[15px]" />Buy Blue Tick — Coming soon
              </button>

              <p className="text-center text-[11.5px] font-light text-[#CCC] leading-relaxed">
                Pricing and requirements will be announced. This page is a placeholder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
