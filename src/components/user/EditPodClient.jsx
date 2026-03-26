'use client'

/**
 * Work3 Labs — Edit Pod
 *
 * Route: /pod/[id]/edit
 *
 * Only accessible to Pod Admin.
 * Roles can be edited freely while the pod has no project assigned.
 * Once a project is assigned, only name and description can be updated.
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchPod, updatePod } from '@/services/api'

const SUGGESTED_ROLES = [
  'Community Lead', 'Content Strategist', 'Growth Analyst', 'Social Manager',
  'Lead Engineer', 'Smart Contract Dev', 'DevOps', 'QA',
  'Art Director', 'UI Designer', 'Motion Designer',
  'Strategist', 'BD Lead', 'Research Analyst', 'Writer',
  'Project Manager', 'Marketing Lead', 'Developer Relations',
]

const INPUT_BASE = [
  'w-full font-sans text-[14px] font-light bg-white text-ink',
  'border rounded-[10px] px-4 py-3 outline-none transition-all',
  'placeholder-[#D0D0D0] appearance-none',
].join(' ')

function inputCls(hasError) {
  return hasError
    ? `${INPUT_BASE} border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]`
    : `${INPUT_BASE} border-black/[0.09] focus:border-[#1DC433] focus:shadow-[0_0_0_3px_rgba(45,252,68,0.08)]`
}

function Spinner() {
  return <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-white/25 border-t-white spin-anim flex-shrink-0" />
}

function Skeleton({ className }) {
  return <div className={`bg-black/[0.05] rounded-[8px] animate-pulse ${className}`} />
}

export default function EditPodClient({ podId }) {
  const router  = useRouter()
  const roleRef = useRef(null)

  const [loading,       setLoading]       = useState(true)
  const [pod,           setPod]           = useState(null)
  const [name,          setName]          = useState('')
  const [description,   setDescription]   = useState('')
  const [roles,         setRoles]         = useState([])
  const [roleInput,     setRoleInput]     = useState('')
  const [errors,        setErrors]        = useState({})
  const [submitting,    setSubmitting]    = useState(false)
  const [saveOk,        setSaveOk]        = useState(false)

  useEffect(() => {
    fetchPod(podId).then(({ data, error }) => {
      if (error || !data) { setLoading(false); return }
      // Only admin can access this page
      if (data.myRole !== 'admin') { router.replace(`/pod/${podId}`); return }
      setPod(data)
      setName(data.name ?? '')
      setDescription(data.description ?? '')
      setRoles(data.roles ?? [])
      setLoading(false)
    })
  }, [podId])

  // Role management
  function addRole(label) {
    const clean = label.trim()
    if (!clean || roles.length >= 10) return
    if (roles.find(r => r.toLowerCase() === clean.toLowerCase())) return
    setRoles(r => [...r, clean])
    setRoleInput('')
    setErrors(e => ({ ...e, roles: null }))
    roleRef.current?.focus()
  }

  function removeRole(label) {
    setRoles(r => r.filter(x => x !== label))
  }

  function handleRoleKeyDown(e) {
    if (e.key === 'Enter')    { e.preventDefault(); addRole(roleInput) }
    if (e.key === 'Backspace' && !roleInput && roles.length) setRoles(r => r.slice(0, -1))
  }

  //Validate + save
  function validate() {
    const next = {}
    if (!name.trim())              next.name        = 'Pod name is required'
    else if (name.trim().length < 3) next.name      = 'Must be at least 3 characters'
    if (!description.trim())       next.description = 'Description is required'
    else if (description.trim().length < 20) next.description = 'Please add a bit more detail (min 20 chars)'
    if (roles.length === 0)        next.roles       = 'At least one role is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (submitting || !validate()) return
    setSubmitting(true)
    setErrors(prev => ({ ...prev, server: null }))
    setSaveOk(false)

    const { error } = await updatePod(podId, {
      name:        name.trim(),
      description: description.trim(),
      roles,
    })

    setSubmitting(false)
    if (error) { setErrors({ server: error }); return }
    setSaveOk(true)
    setTimeout(() => router.push(`/pod/${podId}`), 1000)
  }

  const projectAssigned = pod?.projectAssigned ?? false
  const available = SUGGESTED_ROLES.filter(r => !roles.find(x => x.toLowerCase() === r.toLowerCase()))

  //Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="max-w-[680px] mx-auto px-5 sm:px-8 py-14 space-y-4">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (!pod) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="text-center">
          <p className="font-serif text-[22px] font-light text-ink mb-3">Pod not found</p>
          <Link href="/dashboard" className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#AAA] hover:text-ink transition-colors">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[680px] mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-3">
          <Link
            href={`/pod/${podId}`}
            className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] hover:text-ink transition-colors"
          >
            <i className="bi bi-arrow-left text-[11px]" />Pod
          </Link>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB] truncate max-w-[160px]">{pod.name}</span>
          <span className="text-[#E0E0E0] text-[12px]">/</span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#BBB]">Edit</span>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-5 sm:px-8 py-10 sm:py-14">

        {/* Header */}
        <div className="mb-10" style={{ animation: 'up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#AAA] block mb-3">Pod Settings</span>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-light tracking-[-0.04em] text-ink mb-2">
            Edit pod
          </h1>
          <p className="text-[14px] font-light text-[#888] leading-relaxed">
            {projectAssigned
              ? 'A project is assigned — you can update the name and description, but roles are locked.'
              : 'Update the pod name, description, and roles before a project is assigned.'}
          </p>
        </div>

        {/* Form */}
        <div
          className="bg-white border border-black/[0.07] rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.04)] overflow-hidden"
          style={{ animation: 'up 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <div className="px-7 py-7 space-y-6">

            {errors.server && (
              <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3.5">
                <i className="bi bi-exclamation-circle text-red-500 text-[15px] flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-600 font-light leading-snug">{errors.server}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="pod-name" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Pod name</label>
                <span className="font-mono text-[10px] text-[#CCC]">{name.length}/60</span>
              </div>
              <input
                id="pod-name" type="text" value={name}
                onChange={e => { setName(e.target.value.slice(0, 60)); setErrors(err => ({ ...err, name: null })) }}
                maxLength={60} autoFocus
                className={inputCls(Boolean(errors.name))}
              />
              {errors.name && (
                <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
                  <i className="bi bi-exclamation-circle text-[11px]" />{errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="pod-desc" className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Description</label>
                <span className="font-mono text-[10px] text-[#CCC]">{description.length}/400</span>
              </div>
              <textarea
                id="pod-desc" value={description}
                onChange={e => { setDescription(e.target.value.slice(0, 400)); setErrors(err => ({ ...err, description: null })) }}
                maxLength={400} rows={4}
                className={`${inputCls(Boolean(errors.description))} resize-none leading-relaxed`}
              />
              {errors.description && (
                <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
                  <i className="bi bi-exclamation-circle text-[11px]" />{errors.description}
                </p>
              )}
            </div>

            {/* Roles */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#999]">Roles needed</label>
                <span className="font-mono text-[10px] text-[#CCC]">{roles.length}/10</span>
              </div>

              {projectAssigned ? (
                // Locked view
                <div className="flex flex-wrap gap-1.5 p-3 border border-black/[0.07] rounded-[10px] bg-[#F7F7F5]">
                  {roles.map(r => (
                    <span key={r} className="font-mono text-[10.5px] text-[#888] border border-black/[0.1] bg-white rounded-full px-2.5 py-[3px]">
                      {r}
                    </span>
                  ))}
                  <span className="flex items-center gap-1 font-mono text-[9px] text-[#CCC] ml-1">
                    <i className="bi bi-lock text-[10px]" />Locked
                  </span>
                </div>
              ) : (
                <>
                  <div
                    className={`min-h-[46px] flex flex-wrap gap-1.5 items-center border rounded-[10px] px-3 py-2 transition-all cursor-text ${
                      errors.roles
                        ? 'border-red-300 focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]'
                        : 'border-black/[0.09] focus-within:border-[#1DC433] focus-within:shadow-[0_0_0_3px_rgba(45,252,68,0.08)]'
                    }`}
                    onClick={() => roleRef.current?.focus()}
                  >
                    {roles.map(r => (
                      <span key={r} className="flex items-center gap-1 font-mono text-[10.5px] text-ink border border-black/[0.12] bg-[#F4F4F2] rounded-full px-2.5 py-[3px] flex-shrink-0">
                        {r}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeRole(r) }}
                          className="ml-0.5 text-[#AAA] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0 leading-none"
                        >
                          <i className="bi bi-x text-[11px]" />
                        </button>
                      </span>
                    ))}
                    {roles.length < 10 && (
                      <input
                        ref={roleRef}
                        type="text"
                        value={roleInput}
                        onChange={e => setRoleInput(e.target.value)}
                        onKeyDown={handleRoleKeyDown}
                        placeholder={roles.length === 0 ? 'Type a role…' : ''}
                        className="flex-1 min-w-[100px] font-sans text-[13.5px] font-light text-ink bg-transparent outline-none placeholder-[#D0D0D0]"
                      />
                    )}
                  </div>

                  {errors.roles && (
                    <p className="mt-1.5 text-[12px] text-red-500 font-light flex items-center gap-1.5">
                      <i className="bi bi-exclamation-circle text-[11px]" />{errors.roles}
                    </p>
                  )}

                  {available.length > 0 && roles.length < 10 && (
                    <div className="mt-3">
                      <p className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#CCC] mb-2">Quick add</p>
                      <div className="flex flex-wrap gap-1.5">
                        {available.slice(0, 12).map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => addRole(r)}
                            className="font-mono text-[10px] text-[#999] border border-black/[0.09] hover:border-black/[0.2] hover:text-ink hover:bg-black/[0.02] rounded-full px-2.5 py-[3px] cursor-pointer bg-transparent transition-all"
                          >
                            + {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-7 py-6 border-t border-black/[0.05] flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex items-center gap-2.5 bg-ink text-paper py-3.5 px-6 rounded-[10px] font-sans text-[14px] font-medium hover:bg-[#1A1A1A] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><Spinner />Saving…</>
                : <><i className="bi bi-check2 text-[15px]" />Save changes</>
              }
            </button>
            <Link
              href={`/pod/${podId}`}
              className="py-3.5 px-5 rounded-[10px] border border-black/[0.09] text-[#888] font-sans text-[13.5px] font-light hover:border-black/20 hover:text-ink transition-all flex items-center justify-center"
            >
              Cancel
            </Link>
            {saveOk && (
              <span className="flex items-center gap-1.5 text-[13px] font-light text-green-dark ml-1" style={{ animation: 'up 0.2s both' }}>
                <i className="bi bi-check-circle text-[13px]" />Saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}