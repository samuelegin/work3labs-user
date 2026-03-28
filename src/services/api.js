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
export async function registerWithInvite({ token, displayName, username, password, baseWallet, solanaWallet }) {
  return request('POST', '/user/accept-invite', { token, displayName, username, password, baseWallet, solanaWallet })
}
export async function userLogin({ email, password }) {
  return request('POST', '/user/login', { email, password })
}
export async function userLoginWithWallet({ walletAddress, chain, signature, message }) {
  return request('POST', '/user/login/wallet', { walletAddress, chain, signature, message })
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

// Profile — private (own) and public (anyone)
export async function fetchProfile() {
  return request('GET', '/user/profile')
}
export async function fetchPublicProfile(username) {
  return request('GET', `/u/${username}`)
}
export async function updateProfile({ displayName, username, baseWallet, solanaWallet, bio, roleTags, skillTags, avatarUrl, socials }) {
  return request('PATCH', '/user/profile', { displayName, username, baseWallet, solanaWallet, bio, roleTags, skillTags, avatarUrl, socials })
}

// Dashboard summary
export async function fetchDashboardSummary() {
  return request('GET', '/user/dashboard')
}

// Notifications
export async function fetchNotifications({ page = 1, unreadOnly = false } = {}) {
  return request('GET', `/user/notifications?page=${page}&unreadOnly=${unreadOnly}`)
}
export async function markNotificationRead(id) {
  return request('PATCH', `/user/notifications/${id}/read`)
}
export async function markAllNotificationsRead() {
  return request('PATCH', '/user/notifications/read-all')
}

// Leaderboard — public
export async function fetchLeaderboard({ period = 'alltime', page = 1 } = {}) {
  return request('GET', `/leaderboard?period=${period}&page=${page}`)
}

// Pods
export async function fetchMyPods() {
  return request('GET', '/user/pods')
}
export async function createPod({ name, description, maxMembers, settlementChain, roles, splits }) {
  return request('POST', '/user/pods', { name, description, maxMembers, settlementChain, roles, splits })
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
  return request('DELETE', `/user/pods/${podId}`)
}

// Pod invite + application flow
export async function generatePodInviteLink(podId, { role }) {
  return request('POST', `/user/pods/${podId}/invite`, { role })
}
export async function fetchPodApplications(podId) {
  return request('GET', `/user/pods/${podId}/applications`)
}
export async function acceptPodApplication(podId, applicationId) {
  return request('POST', `/user/pods/${podId}/applications/${applicationId}/accept`)
}
export async function rejectPodApplication(podId, applicationId) {
  return request('POST', `/user/pods/${podId}/applications/${applicationId}/reject`)
}
export async function applyToPod({ inviteToken }) {
  return request('POST', '/user/pods/apply', { inviteToken })
}

// Pod chat
export async function fetchPodChat(podId) {
  return request('GET', `/user/pods/${podId}/chat`)
}
export async function sendPodMessage(podId, { text }) {
  return request('POST', `/user/pods/${podId}/chat`, { text })
}

// Work completion
export async function notifyWorkComplete(podId) {
  return request('POST', `/user/pods/${podId}/notify-complete`)
}
export async function claimSplit(podId) {
  return request('POST', `/user/pods/${podId}/claim`)
}

// Jobs — individual applications
export async function fetchActiveJobs({ category, page = 1 } = {}) {
  const q = new URLSearchParams({ page })
  if (category) q.set('category', category)
  return request('GET', `/jobs?${q}`)
}
export async function fetchMyJobs() {
  return request('GET', '/user/jobs')
}
export async function applyToJob(jobId, { coverNote } = {}) {
  return request('POST', `/jobs/${jobId}/apply`, { coverNote })
}

// Ratings — post-job feedback
export async function submitRating({ jobId, targetId, targetType, stars, feedback }) {
  return request('POST', '/user/ratings', { jobId, targetId, targetType, stars, feedback })
}
export async function fetchUserRatings(username) {
  return request('GET', `/u/${username}/ratings`)
}

// PoP exports
export async function exportPodPoPCV(podId) {
  return request('POST', `/user/pods/${podId}/pop/export`)
}
export async function exportUserPoPCV() {
  return request('POST', '/user/pop/export')
}

// Marketplace — public job listings (Manual Interview mode only)
export async function fetchMarketplaceJobs({ category, chain, type, page = 1, q } = {}) {
  const params = new URLSearchParams({ page })
  if (category) params.set('category', category)
  if (chain) params.set('chain', chain)
  if (type) params.set('type', type) // 'pod' | 'individual' | 'both'
  if (q) params.set('q', q)
  return request('GET', `/marketplace?${params}`)
}

export async function fetchMarketplaceJob(jobId) {
  return request('GET', `/marketplace/${jobId}`)
}

export async function applyToMarketplaceJob(jobId, { coverNote, applyAs }) {
  // applyAs: 'individual' | podId
  return request('POST', `/marketplace/${jobId}/apply`, { coverNote, applyAs })
}

export async function fetchMyApplications() {
  return request('GET', '/user/applications')
}

export async function fetchJobChat(jobId) {
  return request('GET', `/jobs/${jobId}/chat`)
}

export async function sendJobChatMessage(jobId, { text }) {
  return request('POST', `/jobs/${jobId}/chat`, { text })
}

export async function submitDeliverable(jobId, { description, links }) {
  return request('POST', `/jobs/${jobId}/submit`, { description, links })
}

export async function verifyAndRelease(jobId) {
  return request('POST', `/jobs/${jobId}/verify`)
}

export async function raiseDispute(jobId, { reason }) {
  return request('POST', `/jobs/${jobId}/dispute`, { reason })
}

// Project Owner side
export async function fetchProjectDashboard() {
  return request('GET', '/project/dashboard')
}

export async function createJob({ title, description, category, kpis, timeline, budgetUsd, paymentStructure, chain, matchType, requiredType, milestones }) {
  // matchType: 'system' | 'manual'
  // requiredType: 'pod' | 'individual' | 'both'
  // paymentStructure: 'milestone' | 'full'
  // chain: 'base' | 'solana'
  return request('POST', '/project/jobs', { title, description, category, kpis, timeline, budgetUsd, paymentStructure, chain, matchType, requiredType, milestones })
}

export async function fetchProjectJobs() {
  return request('GET', '/project/jobs')
}

export async function fetchProjectJob(jobId) {
  return request('GET', `/project/jobs/${jobId}`)
}

export async function fetchSystemMatches(jobId) {
  // Returns recommended pods/individuals for a system-match job
  return request('GET', `/project/jobs/${jobId}/matches`)
}

export async function acceptMatch(jobId, matchId) {
  return request('POST', `/project/jobs/${jobId}/matches/${matchId}/accept`)
}

export async function rejectMatch(jobId, matchId) {
  return request('POST', `/project/jobs/${jobId}/matches/${matchId}/reject`)
}

export async function fetchJobApplicants(jobId) {
  // For manual interview jobs — list of who applied
  return request('GET', `/project/jobs/${jobId}/applicants`)
}

export async function acceptApplicant(jobId, applicationId) {
  return request('POST', `/project/jobs/${jobId}/applicants/${applicationId}/accept`)
}

export async function fetchProjectJobChat(jobId) {
  return request('GET', `/project/jobs/${jobId}/chat`)
}

export async function sendProjectJobChatMessage(jobId, { text }) {
  return request('POST', `/project/jobs/${jobId}/chat`, { text })
}

export async function projectVerifyAndRelease(jobId) {
  return request('POST', `/project/jobs/${jobId}/verify`)
}

export async function projectRaiseDispute(jobId, { reason }) {
  return request('POST', `/project/jobs/${jobId}/dispute`, { reason })
}

export async function submitProjectRating({ jobId, targetId, targetType, stars, feedback }) {
  return request('POST', '/project/ratings', { jobId, targetId, targetType, stars, feedback })
}
