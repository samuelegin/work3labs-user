'use client'
import { Suspense } from 'react'
import UserSignupClient from '@/components/user/UserSignupClient'

export default function SignupPage() {
  return (
    <Suspense>
      <UserSignupClient />
    </Suspense>
  )
}
