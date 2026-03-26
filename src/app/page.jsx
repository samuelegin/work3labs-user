import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function RootPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('w3l_user_auth')?.value
  if (token) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }
}
