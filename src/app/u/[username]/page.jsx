'use client'
export const dynamic = 'force-dynamic'
import { use } from 'react'
import PublicProfileClient from '@/components/user/PublicProfileClient'
export default function PublicProfilePage({ params }) {
  const { username } = use(params)
  return <PublicProfileClient username={username} />
}
