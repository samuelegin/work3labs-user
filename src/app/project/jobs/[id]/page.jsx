'use client'
export const dynamic = 'force-dynamic'
import { use } from 'react'
import ProjectJobDetailClient from '@/components/project/ProjectJobDetailClient'
export default function ProjectJobPage({ params }) {
  const { id } = use(params)
  return <ProjectJobDetailClient jobId={id} />
}
