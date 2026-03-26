'use client'
import { use } from 'react'
import EditPodClient from '@/components/user/EditPodClient'

export default function EditPodPage({ params }) {
  const { id } = use(params)
  return <EditPodClient podId={id} />
}
