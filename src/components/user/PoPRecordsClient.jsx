'use client'
import ThemeToggle from '@/components/ThemeToggle'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchProfile, fetchMyPods, exportUserPoPCV } from '@/services/api'

const BASE_EXPLORER = 'https://basescan.org/token'

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

function Spinner({ size = 12 }) {
  return <span style={{ width: size, height: size }} className="inline-block rounded-full border-2 border-black/10 border-t-black/40 spin-anim flex-shrink-0" />
}

function PoPBadge({ record, podName }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-black/[0.07] rounded-[14px] overflow-hidden hover:border-black/[0.14] transition-all">
      <button
        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 cursor-pointer bg-transparent border-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-[10px] bg-[#F4FAF7] border border-green-dark/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="bi bi-patch-check-fill text-green-dark text-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-green-dark border border-green-dark/20 bg-green-dark/5 rounded-full px-2 py-0.5">
                Verified
              </span>
              <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-[#AAA]">{record.workType}</span>
            </div>
            <p className="font-sans text-[14px] font-medium text-ink tracking-[-0.01em] mb-0.5">{podName}</p>
            <p className="font-mono text-[10.5px] text-[#CCC]">
              {record.issuedAt
                ? new Date(record.issuedAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently issued'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {record.score != null && (
            <div className="text-right">
              <p className="font-mono text-[9px] tracking-[0.08em] uppercase text-[#CCC] mb-0.5">Score</p>
              <p className="font-serif text-[22px] font-light text-green-dark tracking-[-0.05em] leading-none">{record.score}</p>
            </div>
          )}
          <i className={`bi bi-chevron-down text-[12px] text-[#CCC] transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-black/[0.05] px-6 py-5 space-y-4" style={{ animation: 'up 0.2s both' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['Milestones', record.milestones],
              ['Delivery', record.delivery],
              ['Chain', record.chainAnchor ?? 'Base'],
              ['Token ID', record.tokenId ? `#${record.tokenId}` : 'Pending'],
              ['Contract', record.contractAddress ? `${record.contractAddress.slice(0, 6)}…${record.contractAddress.slice(-4)}` : '—'],
              ['IPFS', record.metadataUri ? 'Stored' : 'Pending'],
            ].map(([k, v]) => v != null && (
              <div key={k} className="bg-[#FAFAF8] rounded-[8px] px-3 py-2.5">
                <p className="font-mono text-[9px] text-[#CCC] tracking-[0.08em] uppercase mb-0.5">{k}</p>
                <p className="font-mono text-[12px] text-ink">{v}</p>
              </div>
            ))}
          </div>

          {record.attributes && (
            <div>
              <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[#CCC] mb-2">NFT Metadata</p>
              <pre className="bg-[#0D0D0D] text-[#2DFC44] font-mono text-[11px] leading-relaxed rounded-[10px] px-4 py-4 overflow-x-auto">
                {JSON.stringify({
                  name: `Work3 Labs PoP — ${record.workType}`,
                  description: 'Verified Proof-of-Performance badge',
                  attributes: record.attributes,
                }, null, 2)}
              </pre>
            </div>
          )}

          {record.contractAddress && record.tokenId && (
            <a
              href={`${BASE_EXPLORER}/${record.contractAddress}?a=${record.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA] hover:text-ink transition-colors"
            >
              <i className="bi bi-box-arrow-up-right text-[11px]" />View on Basescan
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function PoPRecordsClient() {
  const [pods, setPods] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    Promise.all([fetchProfile(), fetchMyPods()])
      .then(([profileRes, podsRes]) => {
        if (podsRes.data) setPods(podsRes.data.pods ?? podsRes.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleExportAll() {
    setExporting(true)
    setExportError('')
    const { data, error } = await exportUserPoPCV()
    setExporting(false)
    if (error) { setExportError(error); return }
    if (data?.url) window.open(data.url, '_blank')
  }

  const allRecords = pods
    .flatMap(pod => (pod.popRecords ?? []).map(rec => ({ ...rec, podName: pod.name, podId: pod.id })))
    .sort((a, b) => (b.issuedAt ?? 0) - (a.issuedAt ?? 0))

  const totalScore = allRecords.length
    ? Math.round(allRecords.reduce((a, r) => a + (r.score ?? 0), 0) / allRecords.length * 10) / 10
    : null

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[720px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors">
            <i className="bi bi-arrow-left text-[11px]" />Dashboard
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">PoP Records</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-14">

        <div className="mb-10" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] block mb-3">On-chain identity</span>
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="font-serif text-[28px] sm:text-[34px] font-light tracking-[-0.04em] text-ink">
              Proof-of-Performance
            </h1>
            {allRecords.length > 0 && (
              <button
                onClick={handleExportAll}
                disabled={exporting}
                className="flex-shrink-0 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ink border border-black/[0.12] rounded-full px-4 py-2 hover:bg-black/[0.04] transition-colors bg-transparent cursor-pointer disabled:opacity-50 mt-2"
              >
                {exporting ? <Spinner /> : <i className="bi bi-download text-[11px]" />}
                {exporting ? 'Exporting…' : 'Export CV'}
              </button>
            )}
          </div>
          <p className="text-[14px] font-light text-[#888] leading-relaxed max-w-[480px]">
            ERC-1155 badges minted on Base per completed job — one per member, one for the pod. Export as a shareable verifiable on-chain Doc.
          </p>
          {exportError && <p className="text-[12px] text-red-400 mt-2">{exportError}</p>}
        </div>

        {!loading && (
          <div className="grid grid-cols-3 gap-3 mb-8" style={{ animation: 'up 0.5s 0.06s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div className="bg-white border border-black/[0.07] rounded-[14px] px-5 py-5 text-center">
              <p className="font-serif text-[30px] font-light text-ink tracking-[-0.05em] leading-none mb-1">{allRecords.length}</p>
              <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#AAA]">Total badges</p>
            </div>
            <div className="bg-white border border-black/[0.07] rounded-[14px] px-5 py-5 text-center">
              <p className="font-serif text-[30px] font-light text-green-dark tracking-[-0.05em] leading-none mb-1">{totalScore ?? '—'}</p>
              <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#AAA]">Avg score</p>
            </div>
            <div className="bg-white border border-black/[0.07] rounded-[14px] px-5 py-5 text-center">
              <p className="font-serif text-[30px] font-light text-ink tracking-[-0.05em] leading-none mb-1">{pods.length}</p>
              <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#AAA]">Pods</p>
            </div>
          </div>
        )}

        <div className="space-y-3" style={{ animation: 'up 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}>
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-[88px]" />)
          ) : allRecords.length === 0 ? (
            <div className="bg-white border border-black/[0.07] rounded-[14px] px-8 py-14 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F4F4F2] flex items-center justify-center mx-auto mb-5">
                <i className="bi bi-patch-check text-[22px] text-[#CCC]" />
              </div>
              <h3 className="font-serif text-[20px] font-light text-ink tracking-[-0.03em] mb-2">No badges yet</h3>
              <p className="text-[13.5px] font-light text-[#888] leading-relaxed max-w-[300px] mx-auto">
                PoP badges are minted on Base when your pod completes and delivers verified work.
              </p>
            </div>
          ) : (
            allRecords.map((rec, i) => (
              <PoPBadge key={`${rec.podId}-${i}`} record={rec} podName={rec.podName} />
            ))
          )}
        </div>

      </div>
    </div>
  )
}
