'use client'
import { Suspense } from 'react'
import UserForgotPasswordClient from '@/components/user/UserForgotPasswordClient'

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <UserForgotPasswordClient />
    </Suspense>
  )
}
