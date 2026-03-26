'use client'

import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { userLogin, userLoginWithWallet, userLogout } from '@/services/api'

const TOKEN_KEY  = 'w3l_user_token'
const COOKIE_KEY = 'w3l_user_auth'

function readToken()  { try { return sessionStorage.getItem(TOKEN_KEY) ?? null } catch { return null } }
function saveToken(t) { try { sessionStorage.setItem(TOKEN_KEY, t.trim()) } catch {} }
function clearToken() { try { sessionStorage.removeItem(TOKEN_KEY) } catch {} }

function setCookie(val) {
  document.cookie = `${COOKIE_KEY}=${val}; path=/; SameSite=Lax; Max-Age=28800`
}
function clearCookie() {
  document.cookie = `${COOKIE_KEY}=; path=/; Max-Age=0`
}

const AuthContext = createContext(null)

export function UserAuthProvider({ children }) {
  const [token,   setToken]   = useState(null)
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = readToken()
    if (t) { setToken(t); setCookie(t) }
  }, [])

  const isAuthenticated = Boolean(token)

  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    const { data, error } = await userLogin({ email, password })
    if (error) { setLoading(false); return { error } }
    saveToken(data.token)
    setCookie(data.token)
    setToken(data.token)
    setUser(data.user ?? null)
    setLoading(false)
    return { error: null }
  }, [])

  const loginWithWallet = useCallback(async ({ walletAddress, signature, message }) => {
    setLoading(true)
    const { data, error } = await userLoginWithWallet({ walletAddress, signature, message })
    if (error) { setLoading(false); return { error } }
    saveToken(data.token)
    setCookie(data.token)
    setToken(data.token)
    setUser(data.user ?? null)
    setLoading(false)
    return { error: null }
  }, [])

  const logout = useCallback(async () => {
    await userLogout().catch(() => {})
    clearToken()
    clearCookie()
    setToken(null)
    setUser(null)
  }, [])

  const saveSession = useCallback((token, userData) => {
    saveToken(token)
    setCookie(token)
    setToken(token)
    setUser(userData ?? null)
  }, [])

  return (
    <AuthContext.Provider value={{
      token, user, isAuthenticated, loading,
      login, loginWithWallet, logout, saveSession,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useUserAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useUserAuth must be used inside <UserAuthProvider>')
  return ctx
}
