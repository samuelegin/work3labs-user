'use client'
import { Suspense } from 'react'
import UserResetPasswordClient from '@/components/user/UserResetPasswordClient'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <UserResetPasswordClient />
    </Suspense>
  )
}
