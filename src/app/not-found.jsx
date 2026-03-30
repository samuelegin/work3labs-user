import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 relative overflow-hidden mesh-green-tr mesh-blue-bl"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <div
        className="w-full max-w-[400px] text-center"
        style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <img src="/logo.png" alt="Work3 Labs" className="h-9 mx-auto mb-10" />

        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#CCC] mb-3">404</p>
        <h1 className="font-serif text-[32px] font-light tracking-[-0.04em] text-ink mb-3">
          Page not found
        </h1>
        <p className="text-[14px] font-light text-[#888] leading-relaxed mb-8">
          This page doesn't exist or you don't have access to it.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-ink text-paper font-sans text-[13.5px] font-medium px-5 py-3 rounded-[10px] hover:bg-[#1A1A1A] transition-colors"
          >
            <i className="bi bi-house text-[14px]" />Go to dashboard
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center gap-2 border border-black/[0.09] text-[#888] font-sans text-[13.5px] font-light px-5 py-3 rounded-[10px] hover:border-black/20 hover:text-ink transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>

      <p className="absolute bottom-6 font-mono text-[10px] tracking-[0.08em] text-[#CCC]">
        Work3 Labs · Contributor Portal
      </p>
    </div>
  )
}
