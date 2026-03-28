'use client'
export const dynamic = 'force-dynamic'
import { use } from 'react'
import JobDetailClient from '@/components/user/JobDetailClient'
export default function JobDetailPage({ params }) {
  const { id } = use(params)
  return <JobDetailClient jobId={id} />
}
