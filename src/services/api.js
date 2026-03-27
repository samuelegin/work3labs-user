'use client'

function getBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? '/api'
}

function getToken() {
  if (typeof window === 'undefined') return null
  try { return sessionStorage.getItem('w3l_user_token') } catch { return null }
}

async function request(method, path, body) {
  try {
    const token = getToken()
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${getBase()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { data: null, error: err.message ?? `HTTP ${res.status}` }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message ?? 'Network error' }
  }
}

// Auth
export async function validateInviteToken(token) {
  return request('GET', `/user/accept-invite?token=${encodeURIComponent(token)}`)
}

export async function registerWithInvite({ token, displayName, password, walletAddress }) {
  return request('POST', '/user/accept-invite', { token, displayName, password, walletAddress })
}

export async function userLogin({ email, password }) {
  return request('POST', '/user/login', { email, password })
}

export async function userLoginWithWallet({ walletAddress, signature, message }) {
  return request('POST', '/user/login/wallet', { walletAddress, signature, message })
}

export async function userForgotPassword({ email }) {
  return request('POST', '/user/forgot-password', { email })
}

export async function userResetPassword({ token, password }) {
  return request('POST', '/user/reset-password', { token, password })
}

export async function userLogout() {
  return request('POST', '/user/logout')
}

// Profile
export async function fetchProfile() {
  return request('GET', '/user/profile')
}

export async function updateProfile({ displayName, email, walletAddress, bio, skills, avatarUrl, socials }) {
  return request('PATCH', '/user/profile', { displayName, email, walletAddress, bio, skills, avatarUrl, socials })
}

// Pods
export async function fetchMyPods() {
  return request('GET', '/user/pods')
}

export async function createPod({ name, description, maxMembers, roles, splits }) {
  // splits: [{ role, percentage }]
  // Pod is only matchable to a job when splits sum to 100
  return request('POST', '/user/pods', { name, description, maxMembers, roles, splits })
}

export async function fetchPod(podId) {
  return request('GET', `/user/pods/${podId}`)
}

export async function updatePod(podId, { name, description, roles }) {
  return request('PATCH', `/user/pods/${podId}`, { name, description, roles })
}

export async function removeMember(podId, memberId) {
  return request('DELETE', `/user/pods/${podId}/members/${memberId}`)
}

export async function dissolvePod(podId) {
  // Admin only. Only before project assigned. PoP records preserved.
  return request('DELETE', `/user/pods/${podId}`)
}

// Split chat (pod communication — split is fixed at creation, chat is general)
export async function fetchSplitChat(podId) {
  return request('GET', `/user/pods/${podId}/chat`)
}

export async function sendSplitMessage(podId, { text }) {
  return request('POST', `/user/pods/${podId}/chat`, { text })
}

// Work completion
export async function notifyWorkComplete(podId) {
  return request('POST', `/user/pods/${podId}/notify-complete`)
}

// Claim — PoP mint fee deducted automatically by backend before sending split
export async function claimSplit(podId) {
  return request('POST', `/user/pods/${podId}/claim`)
}

// PoP — export all records as a shareable verifiable CV (on-chain aggregation)
export async function exportPoPCV(podId) {
  // Returns { url: "https://..." } — a shareable link to the on-chain CV
  return request('POST', `/user/pods/${podId}/pop/export`)
}

// Global PoP export across all pods for a user
export async function exportUserPoPCV() {
  return request('POST', '/user/pop/export')
}
