'use client'

// Uploads an avatar image file to the backend and returns the stored URL.
// Backend should accept multipart/form-data at POST /api/user/avatar
// and return { url: "https://..." }
export async function uploadAvatar(file) {
  try {
    const token = sessionStorage.getItem('w3l_user_token')
    const form = new FormData()
    form.append('avatar', file)

    const res = await fetch('/api/user/avatar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { url: null, error: err.message ?? `Upload failed (${res.status})` }
    }

    const data = await res.json()
    return { url: data.url ?? null, error: null }
  } catch (err) {
    return { url: null, error: err?.message ?? 'Upload failed' }
  }
}
