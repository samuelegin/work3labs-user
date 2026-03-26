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

// ── Auth
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

// ── Profile
export async function fetchProfile() {
  return request('GET', '/user/profile')
}

export async function updateProfile({ displayName, email, walletAddress, bio, skills, avatarUrl, socials }) {
  return request('PATCH', '/user/profile', { displayName, email, walletAddress, bio, skills, avatarUrl, socials })
}

// ── Pods
export async function fetchMyPods() {
  return request('GET', '/user/pods')
}

export async function createPod({ name, description, roles }) {
  return request('POST', '/user/pods', { name, description, roles })
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

export async function proposeSplit(podId, splits) {
  // splits: [{ memberId, percentage }]
  return request('POST', `/user/pods/${podId}/split`, { splits })
}

export async function fetchSplitChat(podId) {
  return request('GET', `/user/pods/${podId}/split-chat`)
}

export async function sendSplitMessage(podId, { text }) {
  return request('POST', `/user/pods/${podId}/split-chat`, { text })
}

export async function notifyWorkComplete(podId) {
  return request('POST', `/user/pods/${podId}/notify-complete`)
}

export async function claimSplit(podId) {
  return request('POST', `/user/pods/${podId}/claim`)
}
