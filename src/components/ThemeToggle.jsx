'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('w3l_theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('w3l_theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
    >
      <i className={`bi ${dark ? 'bi-sun' : 'bi-moon'}`} />
    </button>
  )
}
